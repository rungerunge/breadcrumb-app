import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import shopify from '@shopify/shopify-api';
import { SQLiteSessionStorage } from '@shopify/shopify-app-session-storage-sqlite';
import { shopifyApp } from '@shopify/shopify-app-express';
import { LogSeverity } from '@shopify/shopify-api';

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
    apiVersion: '2023-10',
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

// Create Shopify app middleware
const shopifyAppMiddleware = shopifyApp(shopifyAppConfig);

// Set up middleware
app.use(express.json());
app.use(shopifyAppMiddleware);

// API Routes
app.use('/api/*', shopifyAppMiddleware.validateAuthenticatedSession());

// Settings endpoints
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
app.use(serveStatic(join(process.cwd(), 'dist/client')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 