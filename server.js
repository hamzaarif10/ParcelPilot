const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();
const path = require('path');

// Redis and session store
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

// Database connection function
const { connectToDatabase } = require('./db');

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

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Create Redis client (Make sure to set REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD in your .env)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Middleware
app.use(cors({
  origin: isProd ? process.env.REACT_APP_FRONTEND_URL : 'http://localhost:3002',
  credentials: true
}));

app.use(express.json());

// Session middleware using Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: isProd, // only send over HTTPS in production
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 3 * 60 * 60 * 1000 // 3 hours
  }
}));

// Connect to the database
connectToDatabase();

// Routes
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
  const buildPath = path.join(__dirname, 'build'); // Ensure this is correct

  // Serve the React app from the build folder
  app.use(express.static(buildPath));

  // Handle all other routes and send back the React index.html (for single-page app routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.REACT_APP_BACKEND_URL} (${isProd ? 'production' : 'development'} mode)`);
});

