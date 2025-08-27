const { body, param, query, validationResult } = require('express-validator');
const { AppError, ERROR_TYPES } = require('./errorHandler');

// Common validation rules
const commonValidations = {
  id: param('id').isMongoId().withMessage('Invalid ID format'),
  email: body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .toLowerCase(),
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  name: body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .trim(),
  phone: body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
};

// Authentication validations
const authValidations = {
  register: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    body('role')
      .optional()
      .isIn(['student', 'admin', 'company'])
      .withMessage('Invalid role'),
    body('profile.college')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('College name must be between 2 and 100 characters')
      .trim(),
    body('profile.degree')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Degree must be between 2 and 50 characters')
      .trim(),
    body('profile.year')
      .optional()
      .isInt({ min: 1, max: 4 })
      .withMessage('Year must be between 1 and 4'),
    body('profile.branch')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Branch must be between 2 and 50 characters')
      .trim()
  ],
  
  login: [
    commonValidations.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('rememberMe')
      .optional()
      .isBoolean()
      .withMessage('Remember me must be a boolean')
  ],
  
  forgotPassword: [
    commonValidations.email
  ],
  
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    commonValidations.password
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password.custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
  ]
};

// User management validations
const userValidations = {
  createUser: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.password,
    body('role')
      .isIn(['student', 'admin', 'company'])
      .withMessage('Invalid role'),
    body('profile')
      .optional()
      .isObject()
      .withMessage('Profile must be an object')
  ],
  
  updateUser: [
    commonValidations.id,
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .toLowerCase(),
    body('role')
      .optional()
      .isIn(['student', 'admin', 'company'])
      .withMessage('Invalid role'),
    body('status.isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],

  updateProfile: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .trim(),
    body('profile.phone')
      .optional()
      .matches(/^[\+]?[\d\s\-\(\)]{10,}$/)
      .withMessage('Please provide a valid phone number'),
    body('profile.college')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('College name must be between 2 and 100 characters')
      .trim(),
    body('profile.degree')
      .optional()
      .isIn(['bachelor', 'master', 'phd', 'diploma', 'other'])
      .withMessage('Invalid degree type'),
    body('profile.branch')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Branch must be between 2 and 50 characters')
      .trim(),
    body('profile.year')
      .optional()
      .isInt({ min: 1900, max: 2030 })
      .withMessage('Year must be between 1900 and 2030'),
    body('profile.cgpa')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('CGPA must be between 0 and 10'),
    body('profile.location')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .trim(),
    body('profile.skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    body('profile.skills.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each skill must be between 1 and 50 characters')
      .trim(),
    body('profile.bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be maximum 500 characters')
      .trim()
  ],
  
  getUserById: [
    commonValidations.id
  ],
  
  deleteUser: [
    commonValidations.id,
    body('permanent')
      .optional()
      .isBoolean()
      .withMessage('Permanent must be a boolean'),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters')
      .trim()
  ]
};

// Question validations
const questionValidations = {
  createQuestion: [
    body('title')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters')
      .trim(),
    body('type')
      .isIn(['mcq', 'fill', 'coding', 'behavioral', 'system_design', 'open_ended'])
      .withMessage('Invalid question type'),
    body('category')
      .isIn([
        'javascript', 'python', 'java', 'cpp', 'data_structures', 'algorithms',
        'system_design', 'database', 'networking', 'os', 'behavioral',
        'leadership', 'problem_solving', 'communication', 'technical_aptitude',
        'logical_reasoning', 'quantitative_aptitude', 'verbal_ability'
      ])
      .withMessage('Invalid category'),
    body('difficulty')
      .isIn(['easy', 'medium', 'hard', 'expert'])
      .withMessage('Invalid difficulty level'),
    body('options')
      .optional()
      .isArray()
      .withMessage('Options must be an array'),
    body('options.*.text')
      .optional()
      .isLength({ min: 1, max: 500 })
      .withMessage('Option text must be between 1 and 500 characters')
      .trim(),
    body('options.*.isCorrect')
      .optional()
      .isBoolean()
      .withMessage('isCorrect must be a boolean')
  ],
  
  updateQuestion: [
    commonValidations.id,
    body('title')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .optional()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Content must be between 10 and 5000 characters')
      .trim(),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard', 'expert'])
      .withMessage('Invalid difficulty level')
  ],
  
  getQuestionById: [
    commonValidations.id
  ],
  
  deleteQuestion: [
    commonValidations.id,
    body('permanent')
      .optional()
      .isBoolean()
      .withMessage('Permanent must be a boolean'),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters')
      .trim()
  ]
};

// Quiz validations
const quizValidations = {
  createQuiz: [
    body('title')
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters')
      .trim(),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
      .trim(),
    body('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard', 'mixed'])
      .withMessage('Invalid difficulty level'),
    body('timeLimit')
      .isInt({ min: 60, max: 14400 })
      .withMessage('Time limit must be between 60 seconds and 4 hours'),
    body('questionCount')
      .isInt({ min: 1, max: 100 })
      .withMessage('Question count must be between 1 and 100'),
    body('questionTypes')
      .optional()
      .isArray()
      .withMessage('Question types must be an array'),
    body('passingScore')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Passing score must be between 0 and 100')
  ],
  
  submitAnswer: [
    commonValidations.id,
    body('questionIndex')
      .isInt({ min: 0 })
      .withMessage('Question index must be a non-negative integer'),
    body('answer')
      .notEmpty()
      .withMessage('Answer is required'),
    body('timeTaken')
      .isInt({ min: 0 })
      .withMessage('Time taken must be a non-negative integer'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string')
  ],
  
  completeQuiz: [
    commonValidations.id,
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string'),
    body('reason')
      .optional()
      .isIn(['completed', 'timeout', 'force_submit'])
      .withMessage('Invalid completion reason')
  ]
};

// Interview validations
const interviewValidations = {
  createInterview: [
    body('title')
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters')
      .trim(),
    body('type')
      .isIn(['behavioral', 'technical', 'system_design', 'mixed'])
      .withMessage('Invalid interview type'),
    body('timeLimit')
      .isInt({ min: 300, max: 7200 })
      .withMessage('Time limit must be between 5 minutes and 2 hours'),
    body('questionCount')
      .isInt({ min: 1, max: 20 })
      .withMessage('Question count must be between 1 and 20'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard', 'mixed'])
      .withMessage('Invalid difficulty level'),
    body('enableVideo')
      .optional()
      .isBoolean()
      .withMessage('enableVideo must be a boolean'),
    body('enableAudio')
      .optional()
      .isBoolean()
      .withMessage('enableAudio must be a boolean'),
    body('enableProctoring')
      .optional()
      .isBoolean()
      .withMessage('enableProctoring must be a boolean')
  ],
  
  submitAnswer: [
    commonValidations.id,
    body('textAnswer')
      .optional()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Text answer must be between 1 and 5000 characters')
      .trim(),
    body('codeAnswer')
      .optional()
      .isLength({ min: 1, max: 10000 })
      .withMessage('Code answer must be between 1 and 10000 characters'),
    body('language')
      .optional()
      .isIn(['javascript', 'python', 'java', 'cpp', 'c'])
      .withMessage('Invalid programming language'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string')
  ],
  
  recordViolation: [
    commonValidations.id,
    body('type')
      .isIn(['no_face', 'multiple_faces', 'looking_away', 'phone_detected', 'unauthorized_object', 'tab_switch', 'background_noise'])
      .withMessage('Invalid violation type'),
    body('category')
      .isIn(['camera', 'audio', 'screen', 'network'])
      .withMessage('Invalid violation category'),
    body('severity')
      .optional()
      .isIn(['warning', 'violation'])
      .withMessage('Invalid severity level'),
    body('details')
      .optional()
      .isObject()
      .withMessage('Details must be an object'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string')
  ]
};

// Coding validations
const codingValidations = {
  runCode: [
    body('code')
      .isLength({ min: 1, max: 10000 })
      .withMessage('Code must be between 1 and 10000 characters'),
    body('language')
      .isIn(['javascript', 'python', 'java', 'cpp', 'c'])
      .withMessage('Invalid programming language'),
    body('questionId')
      .isMongoId()
      .withMessage('Invalid question ID'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string')
  ],
  
  submitCode: [
    body('code')
      .isLength({ min: 1, max: 10000 })
      .withMessage('Code must be between 1 and 10000 characters'),
    body('language')
      .isIn(['javascript', 'python', 'java', 'cpp', 'c'])
      .withMessage('Invalid programming language'),
    body('questionId')
      .isMongoId()
      .withMessage('Invalid question ID'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('Session ID must be a string')
  ]
};

// Company validations
const companyValidations = {
  createCompany: [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters')
      .trim(),
    body('displayName')
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters')
      .trim(),
    body('industry')
      .isLength({ min: 2, max: 50 })
      .withMessage('Industry must be between 2 and 50 characters')
      .trim(),
    body('companySize')
      .isIn(['startup', 'small', 'medium', 'large', 'enterprise'])
      .withMessage('Invalid company size'),
    body('contact.email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .toLowerCase(),
    body('contact.phone')
      .optional()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number')
  ],
  
  updateCompany: [
    commonValidations.id,
    body('name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters')
      .trim(),
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be between 2 and 100 characters')
      .trim(),
    body('industry')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Industry must be between 2 and 50 characters')
      .trim()
  ]
};

// Query parameter validations
const queryValidations = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isString()
      .withMessage('Sort by must be a string'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  
  search: [
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim()
  ],
  
  filters: [
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid status filter'),
    query('role')
      .optional()
      .isIn(['student', 'admin', 'company'])
      .withMessage('Invalid role filter'),
    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard', 'expert'])
      .withMessage('Invalid difficulty filter')
  ]
};

// File upload validations
const fileValidations = {
  image: [
    // This would be used with multer middleware
    // The actual file validation is done in multer configuration
  ],
  
  audio: [
    // Audio file validation
  ],
  
  video: [
    // Video file validation
  ]
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potentially dangerous characters
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Rate limiting validation
const rateLimitValidation = (req, res, next) => {
  // Check if rate limit headers are present
  if (req.rateLimit) {
    res.set({
      'X-RateLimit-Limit': req.rateLimit.limit,
      'X-RateLimit-Remaining': req.rateLimit.remaining,
      'X-RateLimit-Reset': req.rateLimit.resetTime
    });
  }
  
  next();
};

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails
    });
  }
  
  next();
};

// Custom validation helpers
const customValidations = {
  isValidObjectId: (value) => {
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(value);
  },
  
  isValidDate: (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },
  
  isValidUrl: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidJSON: (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  
  isStrongPassword: (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },
  
  isValidProgrammingLanguage: (language) => {
    const validLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'];
    return validLanguages.includes(language.toLowerCase());
  }
};

// Security validations
const securityValidations = {
  preventXSS: (value) => {
    const xssRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    return !xssRegex.test(value);
  },
  
  preventSQLInjection: (value) => {
    const sqlRegex = /('|(;|^)[\s]*?(select|insert|update|delete|drop|create|alter|exec|union|script)[\s]+)/i;
    return !sqlRegex.test(value);
  },
  
  preventNoSQLInjection: (value) => {
    if (typeof value === 'object') {
      const jsonStr = JSON.stringify(value);
      const noSQLRegex = /(\$where|\$ne|\$in|\$nin|\$and|\$or|\$nor|\$not|\$exists|\$type|\$mod|\$regex|\$text|\$search)/i;
      return !noSQLRegex.test(jsonStr);
    }
    return true;
  }
};

// IP validation
const ipValidation = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  // Check for suspicious IP patterns
  const suspiciousPatterns = [
    /^10\./, // Private IP ranges (might be proxy)
    /^172\.1[6-9]\./, // Private IP ranges
    /^172\.2[0-9]\./, // Private IP ranges
    /^172\.3[0-1]\./, // Private IP ranges
    /^192\.168\./ // Private IP ranges
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(clientIp));
  
  if (isSuspicious) {
    req.isSuspiciousIP = true;
  }
  
  next();
};

module.exports = {
  authValidations,
  userValidations,
  questionValidations,
  quizValidations,
  interviewValidations,
  codingValidations,
  companyValidations,
  queryValidations,
  fileValidations,
  sanitizeInput,
  rateLimitValidation,
  handleValidationErrors,
  customValidations,
  securityValidations,
  ipValidation,
  commonValidations
}; 