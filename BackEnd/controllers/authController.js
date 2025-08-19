const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
// Optional dependencies - commented out for minimal setup
// const speakeasy = require('speakeasy');
// const geoip = require('geoip-lite');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'; // 7 days instead of 24h

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { 
      userId, 
      role,
      iat: Date.now(),
      jti: crypto.randomUUID() // JWT ID for token tracking
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

// Helper function to generate device fingerprint
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  const ip = req.ip || req.connection.remoteAddress;
  
  return crypto.createHash('sha256')
    .update(userAgent + acceptLanguage + acceptEncoding + ip)
    .digest('hex');
};

// Helper function to get location from IP
const getLocationFromIP = (ip) => {
      // const geo = geoip.lookup(ip);
    const geo = null; // Simplified for minimal setup
  return geo ? {
    country: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: geo.timezone
  } : null;
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to log authentication event
const logAuthEvent = async (userId, event, details = {}) => {
  try {
    await Analytics.create({
      user: userId,
      type: 'login',
      details: {
        event,
        timestamp: new Date(),
        ...details
      }
    });
  } catch (error) {
    console.error('Analytics logging error:', error);
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role = 'student', profile = {} } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      profile,
      status: {
        emailVerificationToken,
        isEmailVerified: false
      }
    });

    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    const emailHtml = `
      <h2>Welcome to Ascend Skills!</h2>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you didn't create this account, please ignore this email.</p>
    `;

    await sendEmail(email, 'Verify Your Email - Ascend Skills', emailHtml);

    // Log registration event
    await logAuthEvent(user._id, 'register', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      location: getLocationFromIP(req.ip)
    });

    // Generate token for immediate login (development mode)
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        emailVerificationSent: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe = false } = req.body;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed attempts'
      });
    }

    // Check if account is active
    if (!user.status.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if email is verified
    if (!user.status.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(req);
    const location = getLocationFromIP(req.ip);

    // Check for suspicious login
    let suspiciousLogin = false;
    if (user.security.sessionHistory.length > 0) {
      const lastSession = user.security.sessionHistory[user.security.sessionHistory.length - 1];
      if (lastSession.location?.country !== location?.country) {
        suspiciousLogin = true;
      }
    }

    // Update session history
    const sessionId = crypto.randomUUID();
    user.security.sessionHistory.push({
      sessionId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      loginTime: new Date(),
      location: location?.country || 'Unknown'
    });

    // Update last activity
    await user.updateLastActivity();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Create session record
    const session = new Session({
      sessionId,
      user: user._id,
      sessionType: 'general',
      device: {
        userAgent: req.get('User-Agent'),
        fingerprint: deviceFingerprint,
        deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
      },
      network: {
        ipAddress: req.ip,
        location
      },
      createdBy: user._id
    });

    await session.save();

    // Log login event
    await logAuthEvent(user._id, 'login', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      location,
      sessionId,
      suspiciousLogin
    });

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 24 hours
    };

    res.cookie('token', token, cookieOptions);

    // Send response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.sanitize(),
        sessionId,
        suspiciousLogin,
        twoFactorRequired: user.security.twoFactorEnabled && !req.body.twoFactorCode
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.sessionId;

    // Update session in database
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        { 
          'details.endTime': new Date(),
          'status.isActive': false
        }
      );
    }

    // Update user's session history
    await User.findByIdAndUpdate(userId, {
      $set: {
        'security.sessionHistory.$[elem].logoutTime': new Date()
      }
    }, {
      arrayFilters: [{ 'elem.sessionId': sessionId }]
    });

    // Log logout event
    await logAuthEvent(userId, 'logout', {
      sessionId,
      ip: req.ip
    });

    // Clear cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user with this token
    const user = await User.findOne({
      'status.emailVerificationToken': token,
      'status.isEmailVerified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    user.status.isEmailVerified = true;
    user.status.emailVerificationToken = undefined;
    await user.save();

    // Log verification event
    await logAuthEvent(user._id, 'email_verified', {
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      'status.isEmailVerified': false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found or already verified'
      });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.status.emailVerificationToken = emailVerificationToken;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    const emailHtml = `
      <h2>Email Verification</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
    `;

    await sendEmail(email, 'Verify Your Email - Ascend Skills', emailHtml);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If the email exists, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.status.passwordResetToken = resetToken;
    user.status.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail(email, 'Password Reset - Ascend Skills', emailHtml);

    // Log password reset request
    await logAuthEvent(user._id, 'password_reset_request', {
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'If the email exists, you will receive a password reset link'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      'status.passwordResetToken': token,
      'status.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.status.passwordResetToken = undefined;
    user.status.passwordResetExpires = undefined;
    await user.save();

    // Log password reset
    await logAuthEvent(user._id, 'password_reset', {
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.sanitize()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.subscription;
    delete updateData.status;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.sanitize()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await logAuthEvent(userId, 'password_change', {
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enable/Disable 2FA
exports.toggle2FA = async (req, res) => {
  try {
    const { enable, token } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (enable) {
      // 2FA temporarily disabled for minimal setup
      return res.status(501).json({
        success: false,
        message: '2FA not available in minimal configuration'
      });
      
      // // Generate 2FA secret
      // const secret = speakeasy.generateSecret({
      //   name: `Ascend Skills (${user.email})`,
      //   issuer: 'Ascend Skills'
      // });

      // // Verify the token before enabling
      // const verified = speakeasy.totp.verify({
      //   secret: secret.base32,
      //   encoding: 'base32',
      //   token,
      //   window: 1
      // });

      // if (!verified) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Invalid 2FA token'
      //   });
      // }

      // user.security.twoFactorEnabled = true;
      // user.security.twoFactorSecret = secret.base32;
      // await user.save();

      // res.json({
      //   success: true,
      //   message: '2FA enabled successfully',
      //   data: {
      //     qrCode: secret.otpauth_url,
      //     secret: secret.base32
      //   }
      // });

    } else {
      // Disable 2FA
      user.security.twoFactorEnabled = false;
      user.security.twoFactorSecret = undefined;
      await user.save();

      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    }

  } catch (error) {
    console.error('Toggle 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during 2FA toggle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user sessions
exports.getSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: sessions.map(session => ({
        sessionId: session.sessionId,
        deviceType: session.device.deviceType,
        browser: session.device.browser,
        location: session.network.location,
        ipAddress: session.network.ipAddress,
        isActive: session.status.isActive,
        createdAt: session.createdAt,
        lastActivity: session.performance.lastActivity
      }))
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Terminate session
exports.terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findOne({ sessionId, user: userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status.isActive = false;
    session.status.terminatedAt = new Date();
    session.status.terminationReason = 'user_terminated';
    await session.save();

    res.json({
      success: true,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during session termination',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  authLimiter,
  ...exports
}; 