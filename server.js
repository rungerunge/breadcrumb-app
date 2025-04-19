// @ts-check
import { join } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import serveStatic from 'serve-static';
import dotenv from 'dotenv';
import { ApiVersion } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

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

// Initialize database connection
let db;
(async () => {
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
})();

// Create the Shopify app configuration
const shopifyAppConfig = {
  api: {
    apiVersion: ApiVersion.October22,
    restResources: {},
    billing: undefined,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: new SQLiteSessionStorage('shopify.sqlite'),
};

const shopify = shopifyApp(shopifyAppConfig);

// Set up the health check endpoint before authentication
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
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
app.use('/api/*', shopify.validateAuthenticatedSession());

// Settings API routes
app.get('/api/settings', async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const result = await db.get('SELECT settings FROM settings WHERE shop = ?', [shop]);
    res.json({ settings: result ? JSON.parse(result.settings) : {} });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const settings = JSON.stringify(req.body);
    await db.run(
      'INSERT INTO settings (shop, settings) VALUES (?, ?) ON CONFLICT(shop) DO UPDATE SET settings = ?',
      [shop, settings, settings]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Serve static files from public directory
app.use(serveStatic(join(__dirname, 'public')));

// Catch-all route for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Initialize the application
(async () => {
  try {
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