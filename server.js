import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import { Shopify } from '@shopify/shopify-api';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { shopifyApp } from '@shopify/shopify-app-express';
import { LogSeverity } from '@shopify/shopify-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '8081', 10);
const DB_PATH = `${process.cwd()}/database.sqlite`;

// Initialize SQLite Session Storage
const sessionStorage = new SQLiteSessionStorage(DB_PATH);

// Initialize Express
const app = express();

// Set up Shopify authentication and webhook handling
const shopifyAppConfig = {
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: ['read_themes', 'write_themes', 'read_products', 'read_content'],
    hostName: process.env.HOST.replace(/https?:\/\//, ''),
    hostScheme: process.env.HOST.split('://')[0],
    apiVersion: '2024-01',
    isEmbeddedApp: true,
    logger: { level: LogSeverity.Info },
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage,
};

// Set up middleware
app.use(express.json());

// Health check endpoint (before Shopify middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize Shopify app middleware
const shopify = shopifyApp(shopifyAppConfig);

// Set up webhooks and auth routes first (these should be public)
app.get(shopifyAppConfig.auth.path, shopify.auth.begin());
app.get(
  shopifyAppConfig.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopifyAppConfig.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// All other routes should be authenticated
app.use('/api/*', shopify.validateAuthenticatedSession());

// API Routes that require authentication
app.get('/api/settings', async (req, res) => {
  try {
    const { shop } = res.locals.shopify.session;
    // Implement settings retrieval logic
    res.status(200).json({});
  } catch (error) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { shop } = res.locals.shopify.session;
    const settings = req.body;
    // Implement settings storage logic
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Theme app extension endpoints
app.get('/api/theme-settings', async (req, res) => {
  try {
    const { shop } = res.locals.shopify.session;
    // Implement theme settings retrieval logic
    res.status(200).json({});
  } catch (error) {
    console.error('Failed to get theme settings:', error);
    res.status(500).json({ error: 'Failed to get theme settings' });
  }
});

// Serve static assets
app.use(serveStatic(join(process.cwd(), 'public')));

// Handle client-side routes
app.use('/*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  // Serve the index.html for client-side routes
  res.sendFile(join(process.cwd(), 'public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 