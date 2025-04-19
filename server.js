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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const PORT = parseInt(process.env.PORT || '8081', 10);
const isDev = process.env.NODE_ENV === 'development';

// Enhanced logging middleware
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

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
  process.exit(1);
}

debug.log('Environment loaded successfully');

// Database initialization with better error handling
let db;

const initDatabase = async () => {
  try {
    debug.log('Initializing database connection...');
    db = await open({
      filename: 'shopify.sqlite',
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
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: (process.env.SCOPES || '').split(','),
  hostName: process.env.HOST ? process.env.HOST.replace(/https?:\/\//, '') : '',
  hostScheme: process.env.HOST?.startsWith('https') ? 'https' : 'http',
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
  sessionStorage: new SQLiteSessionStorage('shopify.sqlite'),
};

// Initialize Shopify app middleware
const shopifyMiddleware = shopifyApp(shopifyAppConfig);

// Set up the health check endpoint before authentication
app.get('/health', (_req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    databaseConnected: db ? true : false,
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
app.get('/', (_req, res) => {
  try {
    const htmlPath = join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(htmlPath)) {
      debug.error(`File not found: ${htmlPath}`);
      return res.status(404).send('index.html not found');
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const injectedHtml = htmlContent.replace('__SHOPIFY_API_KEY__', process.env.SHOPIFY_API_KEY || '');
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
    });
  } catch (error) {
    debug.error('Error starting server:', error);
    process.exit(1);
  }
})(); 