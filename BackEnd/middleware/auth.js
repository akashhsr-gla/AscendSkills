const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const rateLimit = require('express-rate-limit');
const { promisify } = require('util');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Rate limiting for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Main authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      console.log('🔒 No token found on request. Headers Authorization present:', !!req.headers.authorization, '| Cookie present:', !!(req.cookies && req.cookies.token));
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
    console.log('🔑 Token decoded for userId:', decoded.userId);
    
    // Check if user still exists (with better error handling)
    let user;
    try {
      user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }
    } catch (dbError) {
      console.error('🔐 Database error during user lookup:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error during authentication'
      });
    }
    
    // Check if user is active (with defensive programming)
    if (!user.status || !user.status.isActive) {
      console.log('🔐 User status check failed:', { 
        hasStatus: !!user.status, 
        isActive: user.status?.isActive,
        userId: user._id 
      });
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated or status missing'
      });
    }
    
    // Check if account is locked (with defensive programming)
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked'
      });
    }
    
    // Check if password changed after token was issued (with defensive programming)
    if (user.passwordChangedAfter && typeof user.passwordChangedAfter === 'function' && user.passwordChangedAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password changed recently, please login again'
      });
    }
    
    // Set user in request
    req.user = user;
    req.token = token;
    
    // Track session if sessionId is provided
    if (req.headers['x-session-id']) {
      req.sessionId = req.headers['x-session-id'];
      
      // Update session activity
      await Session.findOneAndUpdate(
        { sessionId: req.sessionId },
        { 
          'performance.lastActivity': new Date(),
          $push: {
            activities: {
              timestamp: new Date(),
              eventType: 'api_request',
              data: {
                method: req.method,
                url: req.originalUrl,
                userAgent: req.get('User-Agent'),
                ip: req.ip
              }
            }
          }
        }
      );
    }
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      console.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }
  }
};

// Optional authentication (for public routes that can have auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (token) {
      const decoded = await promisify(jwt.verify)(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status.isActive && !user.isLocked) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
    
  } catch (error) {
    // Don't fail for optional auth, just continue without user
    next();
  }
};

// Authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Company access middleware
const requireCompanyAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (req.user.role === 'admin') {
      return next(); // Admins have access to all companies
    }
    
    if (!req.user.company || !req.user.company.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Company association required'
      });
    }
    
    // Check if company is active
    const Company = require('../models/Company');
    const company = await Company.findById(req.user.company.companyId);
    
    if (!company || !company.status.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Company access denied'
      });
    }
    
    req.company = company;
    next();
    
  } catch (error) {
    console.error('Company access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking company access'
    });
  }
};

// Check feature access based on subscription
const requireFeatureAccess = (featureName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (req.user.role === 'admin') {
        return next(); // Admins have access to all features
      }
      
      // Check user's feature access
      if (!req.user.canAccessFeature(featureName)) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' not available in your subscription`
        });
      }
      
      // Check if subscription is active
      if (!req.user.hasActiveSubscription) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required'
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Feature access error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking feature access'
      });
    }
  };
};

// Check if user is defaulter
const checkDefaulterStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.status.isDefaulter) {
    return res.status(403).json({
      success: false,
      message: 'Account access restricted due to payment issues'
    });
  }
  
  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    if (!session.status.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Session is not active'
      });
    }
    
    // Check session ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Session access denied'
      });
    }
    
    req.session = session;
    next();
    
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating session'
    });
  }
};

// API key authentication for external services
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }
    
    // For now, use a simple API key check
    // In production, this should be stored in database with proper encryption
    const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Mark as API request
    req.isApiRequest = true;
    next();
    
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during API key authentication'
    });
  }
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  next();
};

// IP whitelist middleware
const ipWhitelist = (allowedIps = []) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
      return res.status(403).json({
        success: false,
        message: 'IP address not allowed'
      });
    }
    
    next();
  };
};

// Device fingerprint validation
const validateDeviceFingerprint = async (req, res, next) => {
  try {
    const fingerprint = req.headers['x-device-fingerprint'];
    
    if (!fingerprint) {
      return res.status(400).json({
        success: false,
        message: 'Device fingerprint required'
      });
    }
    
    // Check if device is trusted
    const user = req.user;
    const trustedDevice = user.security.trustedDevices.find(device => 
      device.deviceId === fingerprint && device.isActive
    );
    
    if (!trustedDevice) {
      // Mark as untrusted device
      req.isUntrustedDevice = true;
      
      // Add device to user's device list
      user.security.trustedDevices.push({
        deviceId: fingerprint,
        deviceName: req.get('User-Agent') || 'Unknown Device',
        lastUsed: new Date(),
        isActive: true
      });
      
      await user.save();
    } else {
      // Update last used time
      trustedDevice.lastUsed = new Date();
      await user.save();
    }
    
    next();
    
  } catch (error) {
    console.error('Device fingerprint validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating device'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireCompanyAccess,
  requireFeatureAccess,
  checkDefaulterStatus,
  validateSession,
  authenticateApiKey,
  securityHeaders,
  ipWhitelist,
  validateDeviceFingerprint,
  authLimiter
}; 