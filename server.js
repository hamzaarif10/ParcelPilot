const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const { connectToDatabase } = require('./db');
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

// Middleware
app.use(cors({
  origin: isProd ? process.env.REACT_APP_FRONTEND_URL : 'http://localhost:3002',
  credentials: true
}));

app.use(express.json());

// Session middleware
app.use(session({
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

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${process.env.REACT_APP_BACKEND_URL} (${isProd ? 'production' : 'development'} mode)`);
});
