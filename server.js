// @ts-check
import { join } from 'path';
import express from 'express';
import serveStatic from 'serve-static';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { shopifyApp } from '@shopify/shopify-app-express';
import { restResources } from '@shopify/shopify-api/rest/admin/2023-10';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Load environment variables
dotenv.config();

// Define database path
const DB_PATH = 'database.sqlite';

// Set up Express app
const app = express();
const PORT = parseInt(process.env.PORT || '8081', 10);

// Enhanced logging middleware
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
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

// Create session storage
const sessionStorage = new SQLiteSessionStorage(DB_PATH);

// Create the Shopify app configuration
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY || '',
    apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
    scopes: (process.env.SCOPES || '').split(","),
    hostName: (process.env.HOST || '').replace(/https?:\/\//, ""),
    hostScheme: (process.env.HOST || '').startsWith("https") ? "https" : "http",
    restResources,
    isEmbeddedApp: true,
    logger: {
      level: 0, // Debug level
    },
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage,
});

// Initialize database
async function setupDatabase() {
  try {
    debug.log('Setting up database...');
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        shop TEXT PRIMARY KEY,
        settings TEXT NOT NULL
      );
    `);
    debug.log('Database setup complete');
    return db;
  } catch (error) {
    debug.error('Database setup error:', error);
    throw error;
  }
}

// Set up the health check endpoint before authentication
app.get('/api/health', (req, res) => {
  debug.request('Health check requested');
  res.status(200).send('OK');
});

// Set up Shopify authentication
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// All API routes should be authenticated
app.use('/api/*', async (req, res, next) => {
  // Skip already handled routes
  if (
    req.path === shopify.config.auth.path ||
    req.path === shopify.config.auth.callbackPath ||
    req.path === shopify.config.webhooks.path ||
    req.path === '/api/health'
  ) {
    return next();
  }

  try {
    // @ts-ignore Using private API for session validation
    const session = await shopify.api.session.getCurrentId({
      isOnline: true,
      rawRequest: req,
      rawResponse: res,
    });

    if (!session) {
      debug.auth('No session found for API request');
      return res.status(401).send('Unauthorized');
    }

    const sessionObj = await sessionStorage.loadSession(session);
    if (!sessionObj) {
      debug.auth('Invalid session for API request');
      return res.status(401).send('Unauthorized');
    }

    // Add session to request for future middleware
    req.shopifySession = sessionObj;
    next();
  } catch (error) {
    debug.error('Auth error:', error);
    res.status(401).send('Unauthorized');
  }
});

// Settings API routes
app.get('/api/settings', async (req, res) => {
  try {
    const shopSession = req.shopifySession;
    debug.request(`Get settings for shop: ${shopSession?.shop}`);
    
    if (!shopSession?.shop) {
      return res.status(400).send('Shop not found in session');
    }

    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    const result = await db.get(
      'SELECT settings FROM settings WHERE shop = ?',
      [shopSession.shop]
    );

    if (result) {
      debug.log(`Found settings for shop: ${shopSession.shop}`);
      res.json(JSON.parse(result.settings));
    } else {
      debug.log(`No settings found for shop: ${shopSession.shop}, returning defaults`);
      const defaultSettings = {
        fontSize: '14',
        fontSizeEnabled: false,
        useSlider: false,
        useSliderEnabled: false,
        marginTop: '0',
        marginTopEnabled: false,
        marginBottom: '0',
        marginBottomEnabled: false,
        separator: '>',
        separatorEnabled: false,
        desktopCSS: '',
        desktopCSSEnabled: false,
        mobileCSS: '',
        mobileCSSEnabled: false,
        allBreadcrumbsCSS: '',
        allBreadcrumbsCSSEnabled: false,
        lastBreadcrumbCSS: '',
        lastBreadcrumbCSSEnabled: false,
        hoverCSS: '',
        hoverCSSEnabled: false,
        menuHandles: '*',
        menuHandlesEnabled: false
      };
      res.json(defaultSettings);
    }
  } catch (error) {
    debug.error('Error retrieving settings:', error);
    res.status(500).send('Error retrieving settings');
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const shopSession = req.shopifySession;
    debug.request(`Save settings for shop: ${shopSession?.shop}`);
    
    if (!shopSession?.shop) {
      return res.status(400).send('Shop not found in session');
    }

    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.run(
      'INSERT OR REPLACE INTO settings (shop, settings) VALUES (?, ?)',
      [shopSession.shop, JSON.stringify(req.body)]
    );

    debug.log(`Settings saved for shop: ${shopSession.shop}`);
    res.status(200).send('Settings saved');
  } catch (error) {
    debug.error('Error saving settings:', error);
    res.status(500).send('Error saving settings');
  }
});

// Serve static files from public directory
app.use(serveStatic(join(process.cwd(), 'public')));

// Fallback route for client routing (SPA)
app.use('/*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  debug.request(`Serving frontend for path: ${req.path}`);
  res.sendFile(join(process.cwd(), 'public', 'index.html'));
});

// Initialize the application
(async () => {
  try {
    // Setup database
    await setupDatabase();
    
    // Start server
    app.listen(PORT, () => {
      debug.log(`Server running on port ${PORT}`);
      console.log(`==> Your service is live 🚀`);
    });
  } catch (error) {
    debug.error('Error starting server:', error);
    process.exit(1);
  }
})(); 