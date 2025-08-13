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
    
    // Check if token expires in less than 2 minutes (120 seconds) - CHANGE #1
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    if (timeUntilExpiry < 120) { // CHANGE #1: Less than 2 minutes left (was 3600/1 hour)
      // Issue new token with fresh 5-minute expiry - CHANGE #2
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '5m' } // CHANGE #2: Was '3h'
      );
      
      // Send new token in response header
      res.setHeader('X-New-Token', newToken);
      
      // Also update the cookie - CHANGE #3
      res.cookie('authToken', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000 // CHANGE #3: Was 3 * 60 * 60 * 1000
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
