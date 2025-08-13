const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid token');
    req.user = user;
    next();
  });
};
const refreshTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  
  if (!token) {
    return next(); // No token, let other auth middleware handle it
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token expires in less than 1 hour (3600 seconds)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    if (timeUntilExpiry < 3600) { // Less than 1 hour left
      // Issue new token with fresh 3-hour expiry
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '3h' } // 3 hours
      );
      
      // Send new token in response header
      res.setHeader('X-New-Token', newToken);
      
      // Also update the cookie
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3 * 60 * 60 * 1000 // 3 hours in milliseconds
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    // Token invalid/expired, let auth middleware handle it
    next();
  }
};
module.exports = { 
  authenticateToken, 
  refreshTokenMiddleware 
};
