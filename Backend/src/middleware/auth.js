const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Authorization middleware - check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Authorization middleware - check if user has access to specific MID/DBA
const checkDataAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin has access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Get MID/DBA from query params or request body
    const { mid, dba } = { ...req.query, ...req.body };

    // If no specific MID/DBA is requested, allow (will be filtered in controller)
    if (!mid && !dba) {
      return next();
    }

    // Check if user has access to the requested MID or DBA
    const hasAccess = await User.hasAccessTo(req.user.id, mid, dba);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions for this data'
      });
    }

    next();
  } catch (error) {
    console.error('Data access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking data access permissions'
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  checkDataAccess,
  generateToken,
  optionalAuth
}; 