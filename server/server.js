const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
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
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: isProd ? process.env.REACT_APP_FRONTEND_URL : 'http://localhost:3002',
  credentials: true
}));

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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'} mode)`);
});





