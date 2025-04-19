// @ts-check
import { join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import serveStatic from 'serve-static';
import dotenv from 'dotenv';
import { ApiVersion, shopifyApi } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { restResources } from '@shopify/shopify-api/rest/admin/2022-10';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// For Render.com compatibility - use the PORT that Render sets
const PORT = parseInt(process.env.PORT || '10000', 10);
const isDev = process.env.NODE_ENV !== 'production';

// Better handling for Render.com services
const HOST = process.env.HOST || '';
const API_KEY = process.env.SHOPIFY_API_KEY || '';
const API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SCOPES = process.env.SCOPES?.split(',') || [];

// Enhanced logging middleware
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: '*', // This allows any domain to access your API (for development)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug logger
const debug = {
  log: (...args) => console.log("[DEBUG]", ...args),
  error: (...args) => console.error("[ERROR]", ...args),
  auth: (...args) => console.log("[AUTH]", ...args),
  request: (...args) => console.log("[REQUEST]", ...args)
};

// Verify environment variables
const requiredEnvVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET', 
  'SCOPES',
  'HOST'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  debug.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  debug.error(`Make sure these are set in your Render.com environment variables.`);
  // On Render.com, we don't want to exit immediately
  if (isDev) {
    process.exit(1);
  }
}

debug.log('Environment loaded successfully');
debug.log(`Server running in ${isDev ? 'development' : 'production'} mode`);
debug.log(`HOST: ${HOST}`);

// IMPORTANT: We're hardcoding the database path to /tmp for Render.com
// This is ignoring the DB_PATH environment variable completely
const DB_PATH = isDev ? './shopify.sqlite' : '/tmp/shopify.sqlite';
debug.log(`Using database at ${DB_PATH}`);

// Database initialization with better error handling
let db;

const initDatabase = async () => {
  try {
    debug.log('Initializing database connection...');
    
    // Open the database directly
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Create settings table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        shop TEXT PRIMARY KEY,
        settings TEXT
      )
    `);
    debug.log('Database initialized successfully');
    return true;
  } catch (error) {
    debug.error('Database initialization failed:', error);
    return false;
  }
};

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: API_KEY,
  apiSecretKey: API_SECRET,
  scopes: SCOPES,
  hostName: HOST.replace(/https?:\/\//, ''),
  hostScheme: HOST.startsWith('https') ? 'https' : 'http',
  apiVersion: ApiVersion.October22,
  isEmbeddedApp: true,
  logger: {
    level: isDev ? 0 : 2,
    httpRequests: true,
    timestamps: true,
  },
  restResources,
  customShopDomains: isDev ? [] : undefined,
  billing: undefined,
  userAgentPrefix: 'smart-breadcrumbs',
});

// Create the Shopify app configuration
const shopifyAppConfig = {
  api: shopify,
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: new SQLiteSessionStorage(DB_PATH),
};

// Initialize Shopify app middleware
const shopifyMiddleware = shopifyApp(shopifyAppConfig);

// Set up the health check endpoint before authentication - this will help debug Render.com issues
app.get('/health', (_req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    port: PORT,
    host: HOST,
    databaseConnected: db ? true : false,
    databasePath: DB_PATH,
    version: '2.0.0'
  };
  res.status(200).json(healthStatus);
});

// Set up static file serving
app.use(express.static(join(__dirname, 'public')));

// Set up Shopify authentication
app.get(shopifyMiddleware.config.auth.path, shopifyMiddleware.auth.begin());
app.get(
  shopifyMiddleware.config.auth.callbackPath,
  shopifyMiddleware.auth.callback(),
  shopifyMiddleware.redirectToShopifyOrAppRoot()
);
app.post(
  shopifyMiddleware.config.webhooks.path,
  shopifyMiddleware.processWebhooks({ webhookHandlers: {} })
);

// All subsequent routes need authentication
app.use('/api/*', shopifyMiddleware.validateAuthenticatedSession());

// Settings API routes with improved error handling
app.get('/api/settings', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const shop = res.locals.shopify.session.shop;
    debug.log(`Fetching settings for shop: ${shop}`);
    
    const result = await db.get('SELECT settings FROM settings WHERE shop = ?', [shop]);
    debug.log(`Settings query result:`, result);
    
    if (result && result.settings) {
      const parsedSettings = JSON.parse(result.settings);
      res.json({ settings: parsedSettings });
    } else {
      // Return default settings if none found
      const defaultSettings = {
        fontSize: 14,
        marginTop: 20,
        marginBottom: 20,
        separator: '›',
        mobileSlider: true,
        menuHandles: 'main-menu',
        customCssDesktop: '',
        customCssMobile: '',
        customCssAll: '',
        customCssLast: '',
        customCssHover: '',
        globalOverride: false
      };
      debug.log(`No settings found for shop ${shop}, returning defaults`);
      res.json({ settings: defaultSettings });
    }
  } catch (error) {
    debug.error('Error fetching settings:', error);
    res.status(500).json({ error: `Failed to fetch settings: ${error.message}` });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const shop = res.locals.shopify.session.shop;
    const settings = JSON.stringify(req.body);
    
    debug.log(`Saving settings for shop: ${shop}`);
    
    await db.run(
      'INSERT INTO settings (shop, settings) VALUES (?, ?) ON CONFLICT(shop) DO UPDATE SET settings = ?',
      [shop, settings, settings]
    );
    
    debug.log(`Settings saved successfully for shop: ${shop}`);
    res.json({ success: true });
  } catch (error) {
    debug.error('Error saving settings:', error);
    res.status(500).json({ error: `Failed to save settings: ${error.message}` });
  }
});

// Serve index.html with injected API key
app.get('/', (req, res) => {
  try {
    const htmlPath = join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      debug.error(`File not found: ${htmlPath}`);
      return res.status(404).send('index.html not found');
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const injectedHtml = htmlContent.replace('__SHOPIFY_API_KEY__', API_KEY);
    res.send(injectedHtml);
  } catch (error) {
    debug.error('Error serving index.html:', error);
    res.status(500).send(`Error serving index.html: ${error.message}`);
  }
});

// Special route for Render.com to verify app is running
app.get('/render-health', (req, res) => {
  res.status(200).send('App is running on Render.com');
});

// Return the React app for all other routes
app.get('*', (req, res) => {
  try {
    const htmlPath = join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      debug.error(`File not found: ${htmlPath}`);
      return res.status(404).send('index.html not found');
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const injectedHtml = htmlContent.replace('__SHOPIFY_API_KEY__', API_KEY);
    res.send(injectedHtml);
  } catch (error) {
    debug.error('Error serving index.html:', error);
    res.status(500).send(`Error serving index.html: ${error.message}`);
  }
});

// Initialize the application
(async () => {
  try {
    // Initialize database first
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      debug.error('Failed to initialize database. Application will continue but may not function correctly.');
    }
    
    // Start server
    app.listen(PORT, () => {
      debug.log(`Server running on port ${PORT}`);
      console.log(`==> Your service is live 🚀`);
      console.log(`==> Health check available at http://localhost:${PORT}/health`);
      console.log(`==> App is running at ${HOST}`);
      console.log(`==> Database path: ${DB_PATH}`);
    });
  } catch (error) {
    debug.error('Error starting server:', error);
    // Don't exit in production (Render.com) to allow for retries
    if (isDev) {
      process.exit(1);
    }
  }
})(); 