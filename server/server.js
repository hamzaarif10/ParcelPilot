const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const http = require('http');  // Added for WebSocket support
const WebSocket = require('ws'); // You'll need to install this: npm install ws
const jwt = require('jsonwebtoken'); // Make sure this is installed: npm install jsonwebtoken
const { connectToDatabase } = require('./db');
const { Redis } = require('@upstash/redis');
dotenv.config();

// Create Redis client using @upstash/redis
const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL || '').trim(),
  token: (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim(),
});

// Create a custom RedisStore class that works with upstash/redis
class UpstashRedisStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.prefix = options.prefix || 'sess:';
    this.ttl = options.ttl || 86400; // One day in seconds
    this.client = options.client || redis;
  }

  async get(sid, cb) {
    try {
      const key = this.prefix + sid;
      const data = await this.client.get(key);
      if (!data) return cb(null, null);
      
      let result;
      try {
        result = JSON.parse(data);
      } catch (err) {
        return cb(err);
      }
      return cb(null, result);
    } catch (err) {
      return cb(err);
    }
  }

  async set(sid, session, cb) {
    try {
      const key = this.prefix + sid;
      const ttl = session.cookie && session.cookie.maxAge 
        ? Math.floor(session.cookie.maxAge / 1000) 
        : this.ttl;
        
      const dataStr = JSON.stringify(session);
      
      await this.client.set(key, dataStr, { ex: ttl });
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  async destroy(sid, cb) {
    try {
      const key = this.prefix + sid;
      await this.client.del(key);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }
}

const app = express();

// Create HTTP server by attaching the Express app
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server, 
  path: '/ws/shipping-labels' 
});

// Track active WebSocket connections by user ID
const activeConnections = new Map();

// Set up WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  // Initialize connection properties
  ws.isAuthenticated = false;
  ws.userId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle authentication
      if (data.type === 'auth' && data.token) {
        try {
          // Verify JWT token
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          ws.isAuthenticated = true;
          ws.userId = decoded.userId || decoded.id; // Adjust based on your token structure
          
          console.log(`WebSocket client authenticated: User ${ws.userId}`);
          
          // Store connection for this user
          if (!activeConnections.has(ws.userId)) {
            activeConnections.set(ws.userId, new Set());
          }
          activeConnections.get(ws.userId).add(ws);
          
          // Send confirmation to client
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: 'Authentication failed'
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    
    if (ws.userId && activeConnections.has(ws.userId)) {
      // Remove this connection from the user's set
      activeConnections.get(ws.userId).delete(ws);
      
      // If no more connections for this user, remove the user entry
      if (activeConnections.get(ws.userId).size === 0) {
        activeConnections.delete(ws.userId);
      }
    }
  });
});

// Create global function to send updates to specific users
global.sendLabelUpdate = function(userId, data) {
  if (activeConnections.has(userId)) {
    const connections = activeConnections.get(userId);
    const message = JSON.stringify(data);
    
    connections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message);
      }
    });
  }
};

const PORT = process.env.PORT || 3002;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.REACT_APP_FRONTEND_URL,
  credentials: true
}));

const webHooksRoute = require('./routes/webhooks');
// ✨ Add raw body parser BEFORE webhooks
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use("/webhooks", webHooksRoute);

// ✅ Now apply express.json() for all other routes
app.use(express.json());

// Session middleware with custom Upstash Redis store
app.use(session({
  store: new UpstashRedisStore({
    client: redis,
    prefix: "session:",
    ttl: 86400 // Session expiration time (1 day)
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 3 * 60 * 60 * 1000 // 3 hours
  }
}));

// Connect to the database
connectToDatabase();
// Routes
const authRoute = require('./routes/auth');
const userRoutes = require('./routes/user');
const rateRoutes = require('./routes/rates');
const fileUploadRoute = require('./routes/fileUpload');
const pickUpRoute = require('./routes/pickups');
const billingRoute = require('./routes/payment');
const shopifyIntegrationRoute = require('./routes/shopifyIntegration');
const fetchShopifyOrdersRoute = require('./routes/fetchShopifyOrders');
const supportRoute = require('./routes/support');

app.use('/user', userRoutes);
app.use('/api', rateRoutes);
app.use('/auth', authRoute);
app.use('/fileUpload', fileUploadRoute);
app.use('/pickups', pickUpRoute);
app.use('/payment', billingRoute);
app.use('/auth', shopifyIntegrationRoute);
app.use('/fetchShopifyOrders', fetchShopifyOrdersRoute);
app.use('/support', supportRoute);
//for shopify
const cookieParser = require('cookie-parser');
app.use(cookieParser());

//SHOPIFY OAUTH HANDLING
const { getPool } = require('./db');
const sql = require('mssql');
const crypto = require('crypto');

function verifyHmac(queryParams) {
  const { hmac, ...params } = queryParams;
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');
  return hmac === calculatedHmac;
}

app.get('/', async (req, res) => {
  const { shop, host } = req.query;

  // If opened from Shopify admin
  if (shop && host) {
    // Always redirect to OAuth, no HMAC or token check here
    return res.redirect(`/auth?shop=${shop}&host=${host}`);
  }

  // Opened directly (public visitor) → show homepage
  return res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/`);
});


// Serve static files in production (React build)
if (isProd) {
  const buildPath = path.join(__dirname, 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Improved global error handler to prevent multiple headers
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server using the HTTP server that wraps Express
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'} mode)`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws/shipping-labels`);
});