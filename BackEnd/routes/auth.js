const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authLimiter } = require('../middleware/auth');
const { authValidations, handleValidationErrors, sanitizeInput } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { body, param } = require('express-validator');

// Apply rate limiting to all auth routes (temporarily disabled for testing)
// router.use(authLimiter);

// Apply input sanitization
router.use(sanitizeInput);

// Temporary debug login endpoint without middleware
router.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = require('../models/User');
    const jwt = require('jsonwebtoken');
    const crypto = require('crypto');
    
    console.log('🔍 Debug login attempt:', { email });
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', {
      email: user.email,
      isActive: user.status.isActive,
      isEmailVerified: user.status.isEmailVerified,
      isLocked: user.isLocked,
      loginAttempts: user.status.loginAttempts
    });

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log('✅ Password validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password is invalid');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful, token generated');

    // Also set HttpOnly cookie here for debug flow to behave like real login
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    res.cookie('token', token, cookieOptions);
    console.log('🍪 [debug-login] Set-Cookie token, options:', {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Public routes
router.post('/register', 
  authValidations.register,
  handleValidationErrors,
  catchAsync(authController.register)
);

router.post('/login',
  authValidations.login,
  handleValidationErrors,
  catchAsync(authController.login)
);

router.post('/forgot-password',
  authValidations.forgotPassword,
  handleValidationErrors,
  catchAsync(authController.forgotPassword)
);

router.post('/reset-password',
  authValidations.resetPassword,
  handleValidationErrors,
  catchAsync(authController.resetPassword)
);

router.get('/verify-email/:token',
  catchAsync(authController.verifyEmail)
);

router.post('/resend-verification',
  authValidations.forgotPassword, // Reuse email validation
  handleValidationErrors,
  catchAsync(authController.resendVerification)
);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout',
  catchAsync(authController.logout)
);

router.get('/profile',
  catchAsync(authController.getProfile)
);

router.patch('/profile',
  // Add specific profile update validations if needed
  handleValidationErrors,
  catchAsync(authController.updateProfile)
);

router.post('/change-password',
  authValidations.changePassword,
  handleValidationErrors,
  catchAsync(authController.changePassword)
);

router.post('/toggle-2fa',
  [
    body('enable').isBoolean().withMessage('Enable must be a boolean'),
    body('token').optional().isString().withMessage('Token must be a string')
  ],
  handleValidationErrors,
  catchAsync(authController.toggle2FA)
);

router.get('/sessions',
  catchAsync(authController.getSessions)
);

router.delete('/sessions/:sessionId',
  [
    param('sessionId').isString().withMessage('Session ID must be a string')
  ],
  handleValidationErrors,
  catchAsync(authController.terminateSession)
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify current token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

module.exports = router; 