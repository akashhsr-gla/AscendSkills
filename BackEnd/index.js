const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
// Trust proxy so secure cookies work behind Render/Proxy
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ascend-skills.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight for all routes
app.options('*', cors({
  origin: [
    'http://localhost:3000',
    'https://ascend-skills.vercel.app'
  ],
  credentials: true
}));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ascend-skills', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "ascend_skills" 
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug middleware to log all requests (origin + cookie presence)
app.use((req, res, next) => {
  const origin = req.headers.origin || 'N/A';
  const hasTokenCookie = !!(req.cookies && req.cookies.token);
  console.log('🌐 Request:', req.method, req.originalUrl, '| Origin:', origin, '| Cookie token present:', hasTokenCookie);
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/quiz', require('./routes/quizQuestion'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/sphere', require('./routes/sphereAPI'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/subscriptions', require('./routes/subscription'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Default error response
  const errorResponse = {
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  };

  // Set status code based on error type
  let statusCode = 500;
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.message = 'Validation Error';
    errorResponse.errors = Object.values(err.errors).map(e => e.message);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse.message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorResponse.message = 'Duplicate entry';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse.message = 'Token expired';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  res.status(statusCode).json(errorResponse);
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
}); 