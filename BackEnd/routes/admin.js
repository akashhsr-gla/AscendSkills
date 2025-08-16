const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { 
  userValidations, 
  questionValidations, 
  companyValidations, 
  queryValidations,
  handleValidationErrors, 
  sanitizeInput 
} = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { body, param, query } = require('express-validator');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));
router.use(sanitizeInput);

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filtering
router.get('/users',
  [
    ...queryValidations.pagination,
    ...queryValidations.search,
    ...queryValidations.filters,
    query('subscriptionType')
      .optional()
      .isIn(['free', 'basic', 'premium', 'enterprise'])
      .withMessage('Invalid subscription type'),
    query('isDefaulter')
      .optional()
      .isBoolean()
      .withMessage('isDefaulter must be a boolean')
  ],
  handleValidationErrors,
  catchAsync(adminController.getUsers)
);

// Get user by ID
router.get('/users/:id',
  userValidations.getUserById,
  handleValidationErrors,
  catchAsync(adminController.getUserById)
);

// Get user statistics
router.get('/users/statistics',
  catchAsync(adminController.getUserStatistics)
);

// Create new user
router.post('/users',
  userValidations.createUser,
  handleValidationErrors,
  catchAsync(adminController.createUser)
);

// Update user
router.patch('/users/:id',
  userValidations.updateUser,
  handleValidationErrors,
  catchAsync(adminController.updateUser)
);

// Delete/Deactivate user
router.delete('/users/:id',
  userValidations.deleteUser,
  handleValidationErrors,
  catchAsync(adminController.deleteUser)
);

// Manage defaulters
router.post('/users/defaulters',
  [
    body('action')
      .isIn(['mark_defaulter', 'remove_defaulter'])
      .withMessage('Invalid action'),
    body('userIds')
      .isArray()
      .withMessage('userIds must be an array')
      .custom((value) => {
        if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
          throw new Error('All userIds must be valid ObjectIds');
        }
        return true;
      }),
    body('reason')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Reason must be between 5 and 200 characters')
  ],
  handleValidationErrors,
  catchAsync(adminController.manageDefaulters)
);

// ==================== QUESTION MANAGEMENT ====================

// Get all questions with pagination and filtering
router.get('/questions',
  [
    ...queryValidations.pagination,
    ...queryValidations.search,
    ...queryValidations.filters,
    query('type')
      .optional()
      .isIn(['mcq', 'fill', 'coding', 'behavioral', 'system_design', 'open_ended'])
      .withMessage('Invalid question type'),
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
    query('companyId')
      .optional()
      .isMongoId()
      .withMessage('Invalid company ID')
  ],
  handleValidationErrors,
  catchAsync(adminController.getQuestions)
);

// Get question by ID
router.get('/questions/:id',
  questionValidations.getQuestionById,
  handleValidationErrors,
  catchAsync(adminController.getQuestionById)
);

// Create new question
router.post('/questions',
  questionValidations.createQuestion,
  handleValidationErrors,
  catchAsync(adminController.createQuestion)
);

// Update question
router.patch('/questions/:id',
  questionValidations.updateQuestion,
  handleValidationErrors,
  catchAsync(adminController.updateQuestion)
);

// Delete question
router.delete('/questions/:id',
  questionValidations.deleteQuestion,
  handleValidationErrors,
  catchAsync(adminController.deleteQuestion)
);

// Bulk question operations
router.post('/questions/bulk',
  [
    body('action')
      .isIn(['approve', 'reject', 'delete', 'activate', 'deactivate'])
      .withMessage('Invalid action'),
    body('questionIds')
      .isArray()
      .withMessage('questionIds must be an array')
      .custom((value) => {
        if (!value.every(id => mongoose.Types.ObjectId.isValid(id))) {
          throw new Error('All questionIds must be valid ObjectIds');
        }
        return true;
      }),
    body('data')
      .optional()
      .isObject()
      .withMessage('Data must be an object')
  ],
  handleValidationErrors,
  catchAsync(adminController.bulkQuestionOperations)
);

// ==================== COMPANY MANAGEMENT ====================

// Get all companies with pagination and filtering
router.get('/companies',
  [
    ...queryValidations.pagination,
    ...queryValidations.search,
    query('industry')
      .optional()
      .isString()
      .withMessage('Industry must be a string'),
    query('subscriptionPlan')
      .optional()
      .isIn(['trial', 'basic', 'premium', 'enterprise'])
      .withMessage('Invalid subscription plan')
  ],
  handleValidationErrors,
  catchAsync(adminController.getCompanies)
);

// Create new company
router.post('/companies',
  companyValidations.createCompany,
  handleValidationErrors,
  catchAsync(adminController.createCompany)
);

// Update company
router.patch('/companies/:id',
  companyValidations.updateCompany,
  handleValidationErrors,
  catchAsync(adminController.updateCompany)
);

// ==================== ANALYTICS ====================

// Get dashboard statistics
router.get('/analytics/dashboard',
  [
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid time range')
  ],
  handleValidationErrors,
  catchAsync(adminController.getDashboardStats)
);

// Get user analytics
router.get('/analytics/users',
  [
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Invalid time range'),
    query('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID')
  ],
  handleValidationErrors,
  catchAsync(adminController.getUserAnalytics)
);

// Get system health
router.get('/analytics/health',
  catchAsync(adminController.getSystemHealth)
);

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get subscription analytics
router.get('/subscriptions/analytics',
  [
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid time range')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    const User = require('../models/User');
    
    // Get subscription distribution
    const subscriptionStats = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$subscription.type',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$subscription.amount' },
          activeUsers: {
            $sum: {
              $cond: ['$subscription.isActive', 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get subscription trends
    const subscriptionTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$subscription.type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        subscriptionStats,
        subscriptionTrends
      }
    });
  })
);

// Update user subscription
router.patch('/subscriptions/:userId',
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('subscription.type')
      .isIn(['free', 'basic', 'premium', 'enterprise'])
      .withMessage('Invalid subscription type'),
    body('subscription.isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('subscription.endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { subscription } = req.body;
    
    const User = require('../models/User');
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { subscription } },
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
      message: 'Subscription updated successfully',
      data: user.subscription
    });
  })
);

// ==================== REPORTING ====================

// Generate system report
router.get('/reports/system',
  [
    query('format')
      .optional()
      .isIn(['json', 'csv', 'pdf'])
      .withMessage('Invalid format'),
    query('timeRange')
      .optional()
      .isIn(['7d', '30d', '90d', '1y'])
      .withMessage('Invalid time range')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { format = 'json', timeRange = '30d' } = req.query;
    
    // Generate comprehensive system report
    const report = {
      generatedAt: new Date(),
      timeRange,
      summary: {
        totalUsers: 0,
        activeUsers: 0,
        totalQuestions: 0,
        totalCompanies: 0
      },
      performance: {
        avgResponseTime: 0,
        errorRate: 0,
        uptime: 0
      },
      security: {
        violations: 0,
        blockedIPs: 0,
        suspiciousActivity: 0
      }
    };
    
    // In a real implementation, this would gather actual metrics
    // For now, return mock data
    report.summary = {
      totalUsers: 1500,
      activeUsers: 1200,
      totalQuestions: 2500,
      totalCompanies: 150
    };
    
    report.performance = {
      avgResponseTime: 250,
      errorRate: 0.02,
      uptime: 99.9
    };
    
    report.security = {
      violations: 45,
      blockedIPs: 12,
      suspiciousActivity: 8
    };
    
    if (format === 'json') {
      res.json({
        success: true,
        data: report
      });
    } else {
      // For CSV and PDF, you would implement appropriate formatting
      res.json({
        success: true,
        message: `${format.toUpperCase()} export not implemented yet`,
        data: report
      });
    }
  })
);

// ==================== QUIZ MANAGEMENT ====================

// Get all quiz questions with pagination and filtering
router.get('/quiz/questions',
  [
    ...queryValidations.pagination,
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters'),
    query('category')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters'),
    query('categoryType')
      .optional()
      .isIn(['company', 'subjective'])
      .withMessage('Invalid category type'),
    query('type')
      .optional()
      .isIn(['mcqs', 'fill_in_blanks', 'true_false', 'coding'])
      .withMessage('Invalid question type'),
    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Invalid difficulty level'),
    query('sortBy')
      .optional()
      .isIn(['title', 'category', 'type', 'difficulty', 'createdAt', 'updatedAt'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  handleValidationErrors,
  catchAsync(adminController.getQuizQuestions)
);

// Get quiz question by ID
router.get('/quiz/questions/:id',
  userValidations.getUserById,
  handleValidationErrors,
  catchAsync(adminController.getQuizQuestionById)
);

// Create new quiz question
router.post('/quiz/questions',
  [
    body('title')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Content must be between 10 and 2000 characters')
      .trim(),
    body('type')
      .isIn(['mcqs', 'fill_in_blanks', 'true_false', 'coding'])
      .withMessage('Invalid question type'),
    body('category')
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters')
      .trim(),
    body('categoryType')
      .isIn(['company', 'subjective'])
      .withMessage('Invalid category type'),
    body('difficulty')
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Invalid difficulty level'),
    body('timeLimit')
      .isInt({ min: 10, max: 600 })
      .withMessage('Time limit must be between 10 and 600 seconds'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 20 })
      .withMessage('Each tag must be between 1 and 20 characters'),
    body('explanation')
      .optional()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Explanation must be between 5 and 1000 characters')
      .trim()
  ],
  handleValidationErrors,
  catchAsync(adminController.createQuizQuestion)
);

// Update quiz question
router.patch('/quiz/questions/:id',
  [
    userValidations.getUserById,
    body('title')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters')
      .trim(),
    body('content')
      .optional()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Content must be between 10 and 2000 characters')
      .trim(),
    body('type')
      .optional()
      .isIn(['mcqs', 'fill_in_blanks', 'true_false', 'coding'])
      .withMessage('Invalid question type'),
    body('category')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Category must be between 1 and 50 characters')
      .trim(),
    body('categoryType')
      .optional()
      .isIn(['company', 'subjective'])
      .withMessage('Invalid category type'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Invalid difficulty level'),
    body('timeLimit')
      .optional()
      .isInt({ min: 10, max: 600 })
      .withMessage('Time limit must be between 10 and 600 seconds'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 20 })
      .withMessage('Each tag must be between 1 and 20 characters'),
    body('explanation')
      .optional()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Explanation must be between 5 and 1000 characters')
      .trim()
  ],
  handleValidationErrors,
  catchAsync(adminController.updateQuizQuestion)
);

// Delete quiz question
router.delete('/quiz/questions/:id',
  userValidations.getUserById,
  handleValidationErrors,
  catchAsync(adminController.deleteQuizQuestion)
);

// Get quiz statistics
router.get('/quiz/statistics',
  catchAsync(adminController.getQuizStatistics)
);

// ==================== INTERVIEW CATEGORY MANAGEMENT ====================

// Get all interview categories with pagination and filtering
router.get('/interviews',
  [
    ...queryValidations.pagination,
    ...queryValidations.search,
    ...queryValidations.filters,
    query('type')
      .optional()
      .isString()
      .withMessage('Type must be a string'),
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid status')
  ],
  handleValidationErrors,
  catchAsync(adminController.getAdminInterviews)
);

// Get interview category by ID
router.get('/interviews/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required')
  ],
  handleValidationErrors,
  catchAsync(adminController.getAdminInterviewById)
);

// Create new interview category
router.post('/interviews',
  [
    body('displayName')
      .isLength({ min: 3, max: 100 })
      .withMessage('Display name must be between 3 and 100 characters')
      .trim(),
    body('type')
      .isIn(['main', 'subjective', 'individual', 'company'])
      .withMessage('Type must be one of: main, subjective, individual, company'),
    body('description')
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters')
      .trim(),
    body('questions')
      .optional()
      .isArray()
      .withMessage('Questions must be an array'),
    body('questions.*.title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Question title must be between 3 and 200 characters'),
    body('questions.*.content')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Question content must be between 10 and 1000 characters'),
    body('questions.*.type')
      .optional()
      .isIn(['behavioral', 'technical', 'coding', 'system_design', 'case_study', 'sql'])
      .withMessage('Question type must be valid'),
    body('questions.*.expectedDuration')
      .optional()
      .isInt({ min: 30, max: 3600 })
      .withMessage('Expected duration must be between 30 and 3600 seconds'),
    body('interviewConfig')
      .optional()
      .isObject()
      .withMessage('Interview config must be an object'),
    body('status')
      .optional()
      .isObject()
      .withMessage('Status must be an object')
  ],
  handleValidationErrors,
  catchAsync(adminController.createAdminInterview)
);

// Update interview category
router.patch('/interviews/:id',
  [
    body('displayName')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Display name must be between 3 and 100 characters')
      .trim(),
    body('type')
      .optional()
      .isIn(['main', 'subjective', 'individual', 'company'])
      .withMessage('Type must be one of: main, subjective, individual, company'),
    body('description')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Description must be between 10 and 500 characters')
      .trim(),
    body('questions')
      .optional()
      .isArray()
      .withMessage('Questions must be an array'),
    body('questions.*.title')
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage('Question title must be between 3 and 200 characters'),
    body('questions.*.content')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Question content must be between 10 and 1000 characters'),
    body('questions.*.type')
      .optional()
      .isIn(['behavioral', 'technical', 'coding', 'system_design', 'case_study', 'sql'])
      .withMessage('Question type must be valid'),
    body('questions.*.expectedDuration')
      .optional()
      .isInt({ min: 30, max: 3600 })
      .withMessage('Expected duration must be between 30 and 3600 seconds'),
    body('interviewConfig')
      .optional()
      .isObject()
      .withMessage('Interview config must be an object'),
    body('status')
      .optional()
      .isObject()
      .withMessage('Status must be an object')
  ],
  handleValidationErrors,
  catchAsync(adminController.updateAdminInterview)
);

// Delete interview category
router.delete('/interviews/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Valid category ID is required')
  ],
  handleValidationErrors,
  catchAsync(adminController.deleteAdminInterview)
);

// Get interview category statistics
router.get('/interviews/statistics',
  catchAsync(adminController.getInterviewStatistics)
);

// Get all interview categories (for frontend compatibility)
router.get('/categories',
  catchAsync(async (req, res) => {
    const InterviewCategory = require('../models/InterviewCategory');
    const categories = await InterviewCategory.find({ isDeleted: false })
      .sort({ 'status.sortOrder': 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  })
);

// Get questions by category (for frontend compatibility)
router.get('/questions/:categoryId',
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    const { difficulty, limit = 10, page = 1 } = req.query;
    
    const InterviewCategory = require('../models/InterviewCategory');
    const category = await InterviewCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    let questions = category.questions || [];
    
    // Filter by difficulty if provided
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedQuestions = questions.slice(skip, skip + parseInt(limit));
    
    res.json({
      success: true,
      data: {
        category,
        questions: paginatedQuestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: questions.length,
          pages: Math.ceil(questions.length / parseInt(limit))
        }
      }
    });
  })
);

// Add the missing routes that frontend is calling
router.get('/interview/categories',
  catchAsync(async (req, res) => {
    const InterviewCategory = require('../models/InterviewCategory');
    const { type } = req.query;
    
    let query = { isDeleted: false };
    if (type) {
      query.type = type;
    }
    
    const categories = await InterviewCategory.find(query)
      .sort({ 'status.sortOrder': 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  })
);

router.get('/interview/questions/:categoryId',
  [
    param('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    const { difficulty, limit = 10, page = 1 } = req.query;
    
    const InterviewCategory = require('../models/InterviewCategory');
    const Question = require('../models/Question');
    
    const category = await InterviewCategory.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Fetch questions from Question model instead of embedded array
    // Handle both ObjectId references and string category names
    let query = {
      $or: [
        { category: categoryId }, // New format: ObjectId reference
        { category: category.name } // Old format: string category name
      ]
    };
    
    // Filter by difficulty if provided
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const totalQuestions = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        category,
        questions: questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalQuestions,
          pages: Math.ceil(totalQuestions / parseInt(limit))
        }
      }
    });
  })
);

// Note: Individual question management is now handled through the main category endpoints
// Questions are managed as part of the category create/update operations

// ==================== SETTINGS ====================

// Get system settings
router.get('/settings',
  catchAsync(async (req, res) => {
    // In a real implementation, this would fetch from a settings collection
    const settings = {
      general: {
        siteName: 'Ascend Skills',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true
      },
      security: {
        twoFactorEnabled: true,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        maxLoginAttempts: 5,
        lockoutDuration: 2 * 60 * 60 * 1000 // 2 hours
      },
      features: {
        codingTests: true,
        interviews: true,
        proctoring: true,
        aiAssessment: true
      }
    };
    
    res.json({
      success: true,
      data: settings
    });
  })
);

// Update system settings
router.patch('/settings',
  [
    body('general')
      .optional()
      .isObject()
      .withMessage('General settings must be an object'),
    body('security')
      .optional()
      .isObject()
      .withMessage('Security settings must be an object'),
    body('features')
      .optional()
      .isObject()
      .withMessage('Feature settings must be an object')
  ],
  handleValidationErrors,
  catchAsync(async (req, res) => {
    const { general, security, features } = req.body;
    
    // In a real implementation, this would update a settings collection
    const updatedSettings = {
      general,
      security,
      features,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  })
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin service is healthy',
    timestamp: new Date().toISOString(),
    user: req.user.id
  });
});

module.exports = router; 