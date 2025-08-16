const Analytics = require('../models/Analytics');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Error types
const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  CAST_ERROR: 'CAST_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorType = ERROR_TYPES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Log error to file
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      errorType: error.errorType
    },
    request: req ? {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      sessionId: req.sessionId
    } : null
  };
  
  const logFile = path.join(logsDir, `error-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
};

// Log error to database
const logErrorToDatabase = async (error, req = null) => {
  try {
    await Analytics.create({
      user: req?.user?.id,
      type: 'error',
      details: {
        message: error.message,
        statusCode: error.statusCode,
        errorType: error.errorType,
        stack: error.stack,
        url: req?.originalUrl,
        method: req?.method,
        ip: req?.ip,
        userAgent: req?.get('User-Agent'),
        timestamp: new Date()
      }
    });
  } catch (dbError) {
    console.error('Error logging to database:', dbError);
  }
};

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, ERROR_TYPES.CAST_ERROR);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, ERROR_TYPES.DUPLICATE_ERROR);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, ERROR_TYPES.VALIDATION_ERROR);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, ERROR_TYPES.AUTHENTICATION_ERROR);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, ERROR_TYPES.AUTHENTICATION_ERROR);

const handleMulterError = (err) => {
  let message = 'File upload error';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large';
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    message = 'Too many files';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected file field';
  }
  
  return new AppError(message, 400, ERROR_TYPES.FILE_ERROR);
};

const handleRateLimitError = () =>
  new AppError('Too many requests from this IP, please try again later.', 429, ERROR_TYPES.RATE_LIMIT_ERROR);

// Send error response for development
const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
      errorType: err.errorType
    });
  }
  
  // Rendered website error
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Send error response for production
const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errorType: err.errorType
      });
    }
    
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      errorType: ERROR_TYPES.INTERNAL_ERROR
    });
  }
  
  // Rendered website error
  if (err.isOperational) {
    console.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  
  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Handle different error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);
    if (error.message && error.message.includes('rate limit')) error = handleRateLimitError();
    
    sendErrorProd(error, req, res);
  }
  
  // Log error
  logError(err, req);
  logErrorToDatabase(err, req);
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
const handleUnhandledRoutes = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, ERROR_TYPES.NOT_FOUND_ERROR);
  next(err);
};

// Global error handlers for uncaught exceptions and unhandled rejections
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    logError(err);
    process.exit(1);
  });
};

const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    logError(err);
    server.close(() => {
      process.exit(1);
    });
  });
};

// Validation error handler
const handleValidationError = (errors) => {
  const errorMessages = errors.array().map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
  
  return new AppError(
    `Validation failed: ${errorMessages.map(e => e.message).join(', ')}`,
    400,
    ERROR_TYPES.VALIDATION_ERROR
  );
};

// Database connection error handler
const handleDatabaseError = (err) => {
  console.error('Database connection error:', err);
  return new AppError(
    'Database connection failed. Please try again later.',
    500,
    ERROR_TYPES.DATABASE_ERROR
  );
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  const error = new AppError(
    'Too many requests from this IP, please try again later.',
    429,
    ERROR_TYPES.RATE_LIMIT_ERROR
  );
  
  logError(error, req);
  
  res.status(429).json({
    success: false,
    message: error.message,
    errorType: error.errorType,
    retryAfter: req.rateLimit.resetTime
  });
};

// Health check error handler
const healthCheckError = (service, error) => {
  console.error(`Health check failed for ${service}:`, error);
  return new AppError(
    `Service ${service} is not available`,
    503,
    ERROR_TYPES.INTERNAL_ERROR
  );
};

// Security error handler
const securityErrorHandler = (type, details) => {
  const error = new AppError(
    `Security violation: ${type}`,
    403,
    ERROR_TYPES.AUTHORIZATION_ERROR
  );
  
  // Log security incident
  console.warn('Security violation detected:', {
    type,
    details,
    timestamp: new Date().toISOString()
  });
  
  return error;
};

// File operation error handler
const fileErrorHandler = (operation, error) => {
  console.error(`File operation failed (${operation}):`, error);
  return new AppError(
    `File operation failed: ${operation}`,
    500,
    ERROR_TYPES.FILE_ERROR
  );
};

// External API error handler
const externalApiErrorHandler = (service, error) => {
  console.error(`External API error (${service}):`, error);
  return new AppError(
    `External service ${service} is temporarily unavailable`,
    503,
    ERROR_TYPES.INTERNAL_ERROR
  );
};

// Error recovery middleware
const errorRecovery = (err, req, res, next) => {
  // Attempt to recover from certain errors
  if (err.errorType === ERROR_TYPES.DATABASE_ERROR) {
    // Retry database operation
    console.log('Attempting database recovery...');
    // Implementation would depend on specific database error
  }
  
  next(err);
};

// Error notification system
const notifyError = async (error, req) => {
  // Send error notifications to monitoring services
  if (error.statusCode >= 500) {
    // Critical error - notify immediately
    console.error('Critical error occurred:', {
      message: error.message,
      stack: error.stack,
      url: req?.originalUrl,
      user: req?.user?.id,
      timestamp: new Date().toISOString()
    });
    
    // In production, integrate with services like Sentry, DataDog, etc.
    // await notificationService.sendCriticalAlert(error);
  }
};

module.exports = {
  AppError,
  ERROR_TYPES,
  errorHandler,
  catchAsync,
  handleUnhandledRoutes,
  handleUncaughtException,
  handleUnhandledRejection,
  handleValidationError,
  handleDatabaseError,
  rateLimitHandler,
  healthCheckError,
  securityErrorHandler,
  fileErrorHandler,
  externalApiErrorHandler,
  errorRecovery,
  notifyError,
  logError
}; 