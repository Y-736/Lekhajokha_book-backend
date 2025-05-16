const { verifyToken } = require('../config/jwt');

const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization header missing'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token not found in header'
      });
    }

    // 2. Verify token
    const decoded = verifyToken(token);
    
    // 3. Attach user to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    let message = 'Authentication failed';
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    res.status(401).json({
      success: false,
      message
    });
  }
};

module.exports = authenticate;