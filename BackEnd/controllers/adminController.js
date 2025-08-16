const User = require('../models/User');
const Question = require('../models/Question');
const Company = require('../models/Company');
const QuizQuestion = require('../models/QuizQuestion');
const QuizResult = require('../models/QuizResult');
const Interview = require('../models/Interview');
const Session = require('../models/Session');
const Analytics = require('../models/Analytics');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filtering
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      subscriptionType = '',
      isDefaulter = ''
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.college': { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status) query['status.isActive'] = status === 'active';
    if (subscriptionType) query['subscription.type'] = subscriptionType;
    if (isDefaulter) query['status.isDefaulter'] = isDefaulter === 'true';

    // Get users with pagination
    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('company.companyId', 'name displayName')
      .select('-password -security.twoFactorSecret -status.emailVerificationToken -status.passwordResetToken');

    // Calculate real-time analytics for each user
    const usersWithAnalytics = await Promise.all(users.map(async (user) => {
      const userId = user._id;
      const userEmail = user.email;
      
      // Check if this user is the test user (who has quiz results with "test-user-id")
      const isTestUser = userEmail === 'test@example.com';
      
      // Get quiz results count - only count for test user or users with their own results
      let totalQuizzes = 0;
      if (isTestUser) {
        // For test user, count results with "test-user-id"
        totalQuizzes = await QuizResult.countDocuments({ userId: 'test-user-id' });
      } else {
        // For other users, only count results with their actual user ID
        totalQuizzes = await QuizResult.countDocuments({ userId: userId.toString() });
      }
      
      // Get interview count - only count completed interviews
      const totalInterviews = await Interview.countDocuments({ 
        user: userId,
        'status.current': 'completed'
      });
      
      // Get coding submissions count (from Sphere Engine or local submissions)
      const totalCodingProblems = await Session.countDocuments({ 
        user: userId, 
        sessionType: 'coding' 
      });

      // Create user object with real analytics
      const userObj = user.toObject();
      userObj.analytics = {
        ...userObj.analytics,
        totalQuizzes,
        totalInterviews,
        totalCodingProblems
      };

      return userObj;
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users: usersWithAnalytics,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: usersWithAnalytics.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('company.companyId', 'name displayName')
      .select('-password -security.twoFactorSecret -status.emailVerificationToken -status.passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate real-time analytics
    const isTestUser = user?.email === 'test@example.com';
    
    let totalQuizzes = 0;
    if (isTestUser) {
      // For test user, count results with "test-user-id"
      totalQuizzes = await QuizResult.countDocuments({ userId: 'test-user-id' });
    } else {
      // For other users, only count results with their actual user ID
      totalQuizzes = await QuizResult.countDocuments({ userId: id });
    }
    
    const totalInterviews = await Interview.countDocuments({ 
      user: id,
      'status.current': 'completed'
    });
    const totalCodingProblems = await Session.countDocuments({ 
      user: id, 
      sessionType: 'coding' 
    });

    // Create user object with real analytics
    const userObj = user.toObject();
    userObj.analytics = {
      ...userObj.analytics,
      totalQuizzes,
      totalInterviews,
      totalCodingProblems
    };

    // Get user's recent activity
    const recentSessions = await Session.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('sessionType createdAt details.duration status.current');

    let recentQuizzes = [];
    if (isTestUser) {
      // For test user, get results with "test-user-id"
      recentQuizzes = await QuizResult.find({ userId: 'test-user-id' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('quizTitle score totalQuestions completedAt');
    } else {
      // For other users, get results with their actual user ID
      recentQuizzes = await QuizResult.find({ userId: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('quizTitle score totalQuestions completedAt');
    }

    const recentInterviews = await Interview.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title finalAssessment.overallScore status.current createdAt');

    res.json({
      success: true,
      data: {
        user: userObj,
        recentActivity: {
          sessions: recentSessions,
          quizzes: recentQuizzes,
          interviews: recentInterviews
        }
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userData = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
      status: {
        isEmailVerified: true, // Admin created users are auto-verified
        isActive: true
      }
    });

    await user.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'create_user',
        targetUserId: user._id,
        targetUserEmail: user.email
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.sanitize()
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.password;
    delete updateData.security;
    delete updateData.status.emailVerificationToken;
    delete updateData.status.passwordResetToken;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'update_user',
        targetUserId: id,
        changes: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user.sanitize()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete/Deactivate user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false, reason = '' } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (permanent) {
      // Permanent deletion - mark as deleted
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user.id;
      user.archiveReason = reason;
    } else {
      // Soft deletion - deactivate
      user.status.isActive = false;
    }

    await user.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: permanent ? 'delete_user' : 'deactivate_user',
        targetUserId: id,
        reason
      }
    });

    res.json({
      success: true,
      message: permanent ? 'User deleted successfully' : 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Manage defaulters
exports.manageDefaulters = async (req, res) => {
  try {
    const { action, userIds, reason } = req.body;

    if (!['mark_defaulter', 'remove_defaulter'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    const isDefaulter = action === 'mark_defaulter';
    
    await User.updateMany(
      { _id: { $in: userIds } },
      { 
        $set: { 
          'status.isDefaulter': isDefaulter,
          'status.defaulterReason': isDefaulter ? reason : undefined,
          'status.defaulterMarkedAt': isDefaulter ? new Date() : undefined,
          'status.defaulterMarkedBy': isDefaulter ? req.user.id : undefined
        }
      }
    );

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action,
        targetUserIds: userIds,
        reason
      }
    });

    res.json({
      success: true,
      message: `Users ${action === 'mark_defaulter' ? 'marked as' : 'removed from'} defaulters successfully`
    });

  } catch (error) {
    console.error('Manage defaulters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while managing defaulters',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== QUESTION MANAGEMENT ====================

// Get all questions
exports.getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      category = '',
      difficulty = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      companyId = ''
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { 'coding.tags': { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (status) query['status.isActive'] = status === 'active';
    if (companyId) query['company.companyId'] = companyId;

    // Get questions with pagination
    const questions = await Question.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('company.companyId', 'name displayName');

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: questions.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id)
      .populate('createdBy', 'name email')
      .populate('company.companyId', 'name displayName');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new question
exports.createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user.id,
      status: {
        isActive: true,
        isApproved: req.user.role === 'admin', // Auto-approve admin questions
        reviewStatus: req.user.role === 'admin' ? 'approved' : 'pending'
      }
    };

    const question = new Question(questionData);
    await question.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'create_question',
        questionId: question._id,
        type: question.type,
        category: question.category
      }
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Update question with version control
    await question.updateVersion(req.user.id, 'Question updated by admin');
    
    Object.assign(question, updateData);
    question.lastModifiedBy = req.user.id;
    
    await question.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'update_question',
        questionId: id,
        changes: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false, reason = '' } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (permanent) {
      question.isDeleted = true;
      question.deletedAt = new Date();
      question.deletedBy = req.user.id;
      question.archiveReason = reason;
    } else {
      question.status.isActive = false;
    }

    await question.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: permanent ? 'delete_question' : 'deactivate_question',
        questionId: id,
        reason
      }
    });

    res.json({
      success: true,
      message: permanent ? 'Question deleted successfully' : 'Question deactivated successfully'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bulk question operations
exports.bulkQuestionOperations = async (req, res) => {
  try {
    const { action, questionIds, data = {} } = req.body;

    if (!['approve', 'reject', 'delete', 'activate', 'deactivate'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    let updateQuery = {};
    let actionMessage = '';

    switch (action) {
      case 'approve':
        updateQuery = {
          'status.isApproved': true,
          'status.reviewStatus': 'approved',
          'status.approvedBy': req.user.id,
          'status.approvedAt': new Date()
        };
        actionMessage = 'approved';
        break;
      case 'reject':
        updateQuery = {
          'status.isApproved': false,
          'status.reviewStatus': 'rejected',
          'status.reviewComments': data.comments || []
        };
        actionMessage = 'rejected';
        break;
      case 'delete':
        updateQuery = {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.id,
          archiveReason: data.reason || ''
        };
        actionMessage = 'deleted';
        break;
      case 'activate':
        updateQuery = { 'status.isActive': true };
        actionMessage = 'activated';
        break;
      case 'deactivate':
        updateQuery = { 'status.isActive': false };
        actionMessage = 'deactivated';
        break;
    }

    await Question.updateMany(
      { _id: { $in: questionIds } },
      { $set: updateQuery }
    );

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: `bulk_${action}_questions`,
        questionIds,
        count: questionIds.length
      }
    });

    res.json({
      success: true,
      message: `Questions ${actionMessage} successfully`
    });

  } catch (error) {
    console.error('Bulk question operations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk operations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Note: Individual question management is now handled through the main category endpoints
// Questions are managed as part of the category create/update operations

// ==================== COMPANY MANAGEMENT ====================

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      industry = '',
      status = '',
      subscriptionPlan = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (industry) query.industry = industry;
    if (status) query['status.isActive'] = status === 'active';
    if (subscriptionPlan) query['subscription.plan'] = subscriptionPlan;

    // Get companies with pagination
    const companies = await Company.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: companies.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching companies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new company
exports.createCompany = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const companyData = {
      ...req.body,
      createdBy: req.user.id,
      status: {
        isActive: true,
        isVerified: req.user.role === 'admin' // Auto-verify admin created companies
      }
    };

    const company = new Company(companyData);
    await company.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'create_company',
        companyId: company._id,
        companyName: company.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'update_company',
        companyId: id,
        changes: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating company',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== ANALYTICS ====================

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
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

    // Get basic counts
    const [
      totalUsers,
      totalQuestions,
      totalCompanies,
      activeUsers,
      totalQuizzes,
      totalInterviews,
      newUsers,
      newQuestions
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Question.countDocuments({ isDeleted: false }),
      Company.countDocuments({ isDeleted: false }),
      User.countDocuments({ 'status.isActive': true, isDeleted: false }),
      QuizQuestion.countDocuments(),
      Interview.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate }, isDeleted: false }),
      Question.countDocuments({ createdAt: { $gte: startDate }, isDeleted: false })
    ]);

    // Get user growth data
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get question distribution
    const questionDistribution = await Question.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get user role distribution
    const userRoleDistribution = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get subscription distribution
    const subscriptionDistribution = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$subscription.type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activities
    const recentActivities = await Analytics.find({
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name email');

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalCompanies,
          activeUsers,
          totalQuizzes,
          totalInterviews,
          newUsers,
          newQuestions
        },
        charts: {
          userGrowth,
          questionDistribution,
          userRoleDistribution,
          subscriptionDistribution
        },
        recentActivities
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d', userId = '' } = req.query;
    
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
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build match query
    const matchQuery = { createdAt: { $gte: startDate } };
    if (userId) matchQuery.user = mongoose.Types.ObjectId(userId);

    // Get quiz performance
    const quizPerformance = await QuizQuestion.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          averageScore: { $avg: '$score' },
          totalQuizzes: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get interview performance
    const interviewPerformance = await Interview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          averageScore: { $avg: '$overallAssessment.scores.overall' },
          totalInterviews: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top performers
    const topPerformers = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $project: {
          name: 1,
          email: 1,
          'analytics.overallRating': 1,
          'analytics.totalQuizzes': 1,
          'analytics.totalInterviews': 1,
          'analytics.averageQuizScore': 1,
          'analytics.averageInterviewScore': 1
        }
      },
      { $sort: { 'analytics.overallRating': -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        quizPerformance,
        interviewPerformance,
        topPerformers
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    // Get database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get recent errors
    const recentErrors = await Analytics.find({
      type: 'error',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get active sessions
    const activeSessions = await Session.countDocuments({
      'status.isActive': true
    });

    // Get violation statistics
    const violationStats = await Session.aggregate([
      { $match: { 'proctoring.violations.total': { $gt: 0 } } },
      {
        $group: {
          _id: '$proctoring.aiAnalysis.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          connectionName: mongoose.connection.name
        },
        activeSessions,
        recentErrors,
        violationStats,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system health',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== QUIZ MANAGEMENT ====================

// Get all quiz questions with pagination and filtering
exports.getQuizQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      categoryType = '',
      type = '',
      difficulty = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) filter.category = category;
    if (categoryType) filter.categoryType = categoryType;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    // Get questions
    const questions = await QuizQuestion.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await QuizQuestion.countDocuments(filter);

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'view_quiz_questions',
        filters: { search, category, categoryType, type, difficulty }
      }
    });

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalCount / parseInt(limit)),
          count: questions.length,
          totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get quiz questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz question by ID
exports.getQuizQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await QuizQuestion.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Get quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new quiz question
exports.createQuizQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const questionData = req.body;
    
    // Create question
    const question = new QuizQuestion({
      ...questionData,
      createdBy: req.user.id,
      
      status: {
        isActive: true,
        isPublic: true
      }
    });

    await question.save();

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'create_quiz_question',
        questionId: question._id,
        questionType: question.type,
        category: question.category
      }
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });

  } catch (error) {
    console.error('Create quiz question error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      questionData: req.body,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Server error while creating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update quiz question
exports.updateQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await QuizQuestion.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'update_quiz_question',
        questionId: id,
        changes: Object.keys(updateData)
      }
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });

  } catch (error) {
    console.error('Update quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete quiz question
exports.deleteQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await QuizQuestion.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'delete_quiz_question',
        questionId: id,
        questionType: question.type,
        category: question.category
      }
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz statistics
exports.getQuizStatistics = async (req, res) => {
  try {
    // Get total questions by category
    const questionsByCategory = await QuizQuestion.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total questions by type
    const questionsByType = await QuizQuestion.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total questions by difficulty
    const questionsByDifficulty = await QuizQuestion.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent questions
    const recentQuestions = await QuizQuestion.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type category difficulty createdAt');

    res.json({
      success: true,
      data: {
        totalQuestions: await QuizQuestion.countDocuments(),
        questionsByCategory,
        questionsByType,
        questionsByDifficulty,
        recentQuestions
      }
    });

  } catch (error) {
    console.error('Get quiz statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== INTERVIEW MANAGEMENT ====================

// Get all interview categories with pagination and filtering
exports.getAdminInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      type = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'questions.title': { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (status) query['status.isActive'] = status === 'active';

    // Import InterviewCategory model
    const InterviewCategory = require('../models/InterviewCategory');

    // Get categories with pagination
    const categories = await InterviewCategory.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await InterviewCategory.countDocuments(query);

    res.json({
      success: true,
      data: {
        interviews: categories, // Keep the same response structure for compatibility
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: categories.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    console.error('Get admin interview categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get interview category by ID
exports.getAdminInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    // Import InterviewCategory model
    const InterviewCategory = require('../models/InterviewCategory');

    const category = await InterviewCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Interview category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Get admin interview category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new interview category
exports.createAdminInterview = async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      type,
      icon,
      color,
      questions,
      interviewConfig,
      status
    } = req.body;

    console.log('Creating interview category with data:', {
      displayName,
      type,
      description,
      questionsCount: questions?.length || 0,
      fullData: req.body
    });

    // Validate required fields
    if (!displayName || !type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Display name, type, and description are required'
      });
    }

    // Import InterviewCategory model
    const InterviewCategory = require('../models/InterviewCategory');

    // Process questions if provided
    let processedQuestions = [];
    if (questions && Array.isArray(questions)) {
      processedQuestions = questions.map(q => ({
        _id: new mongoose.Types.ObjectId(), // Assign new ObjectId
        title: q.title || 'Untitled',
        content: q.content || q.question || '',
        type: q.type || 'behavioral',
        difficulty: q.difficulty || 'medium',
        expectedDuration: q.expectedDuration || 300,
        metadata: {
          estimatedTime: q.expectedDuration || q.metadata?.estimatedTime || 300,
          points: q.metadata?.points || 10
        },
        statistics: {
          totalAttempts: 0,
          correctAttempts: 0,
          averageScore: 0,
          averageTime: 0
        }
      }));
    }

    // Calculate statistics from questions
    const totalQuestions = processedQuestions.length;
    const easyQuestions = processedQuestions.filter(q => q.difficulty === 'easy').length;
    const mediumQuestions = processedQuestions.filter(q => q.difficulty === 'medium').length;
    const hardQuestions = processedQuestions.filter(q => q.difficulty === 'hard').length;

    // Create interview category with rich structure matching existing categories
    const categoryData = {
      name: name || displayName.toLowerCase().replace(/\s+/g, '_'),
      displayName,
      description,
      type,
      icon: icon || 'book-open',
      color: color || '#3B82F6',
      questions: [], // Empty array like existing categories - questions are stored separately
      tags: [],
      prerequisites: [],
      learningOutcomes: [],
      company: {
        isCompanySpecific: false,
        difficulty: 'Medium'
      },
      interviewConfig: {
        defaultDuration: interviewConfig?.defaultDuration || 1800,
        questionCount: totalQuestions,
        allowFollowUps: interviewConfig?.allowFollowUps !== false,
        enableVoiceRecording: interviewConfig?.enableVoiceRecording !== false,
        enableVideoRecording: interviewConfig?.enableVideoRecording || false,
        scoringCriteria: [
          {
            criterion: 'Technical Knowledge',
            weight: 3,
            description: 'Understanding of technical concepts'
          },
          {
            criterion: 'Problem Solving',
            weight: 3,
            description: 'Ability to solve complex problems'
          },
          {
            criterion: 'Communication',
            weight: 2,
            description: 'Clarity and effectiveness of communication'
          },
          {
            criterion: 'Experience',
            weight: 2,
            description: 'Relevant experience and examples'
          }
        ]
      },
      status: {
        isActive: status?.isActive !== false,
        isPublic: status?.isPublic !== false,
        isFeatured: status?.isFeatured || false,
        sortOrder: status?.sortOrder || 0
      },
      statistics: {
        totalQuestions,
        easyQuestions,
        mediumQuestions,
        hardQuestions,
        averageDifficulty: totalQuestions > 0 ? 
          Math.round(((easyQuestions * 1 + mediumQuestions * 3 + hardQuestions * 5) / totalQuestions) * 10) / 10 : 0,
        totalAttempts: 0,
        averageSuccessRate: 0
      },
      createdBy: req.user.id
    };

    console.log('Saving category with data:', {
      categoryData: categoryData,
      questionCount: categoryData.questions.length,
      questions: categoryData.questions.map(q => ({ title: q.title, type: q.type, difficulty: q.difficulty }))
    });

    const category = new InterviewCategory(categoryData);
    await category.save();

    // Save questions separately and link them to the category
    if (processedQuestions.length > 0) {
      const Question = require('../models/Question');
      const questionsToSave = processedQuestions.map(q => ({
        title: q.title,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        expectedDuration: q.expectedDuration,
        category: category._id,
        metadata: q.metadata,
        statistics: q.statistics,
        createdBy: req.user.id
      }));

      await Question.insertMany(questionsToSave);
      console.log(`Saved ${questionsToSave.length} questions for category ${category._id}`);
    }

    console.log('Category saved successfully:', {
      categoryId: category._id,
      displayName: category.displayName,
      questionCount: processedQuestions.length
    });

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'create_interview_category',
        categoryId: category._id,
        displayName,
        type,
        questionCount: totalQuestions
      }
    });

    res.status(201).json({
      success: true,
      message: 'Interview category created successfully',
      data: category
    });

  } catch (error) {
    console.error('Create admin interview category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating interview category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update interview category
exports.updateAdminInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('Updating interview category with data:', {
      categoryId: id,
      displayName: updateData.displayName,
      type: updateData.type,
      questionsCount: updateData.questions?.length || 0,
      fullUpdateData: updateData
    });

    // Import InterviewCategory model
    const InterviewCategory = require('../models/InterviewCategory');

    // First, get the existing category to compare questions
    const existingCategory = await InterviewCategory.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Interview category not found'
      });
    }

    console.log('Found existing category:', {
      categoryId: existingCategory._id,
      displayName: existingCategory.displayName,
      existingQuestionCount: existingCategory.questions?.length || 0
    });

    // Process questions if provided - handle individual question operations
    let processedQuestions = [];
    if (updateData.questions && Array.isArray(updateData.questions)) {
      processedQuestions = updateData.questions.map(q => {
        // If question has an _id that exists in the current category, it's an update
        // If it has an _id but doesn't exist, it's a new question (shouldn't happen)
        // If it doesn't have an _id, it's a new question
        const isNewQuestion = !q._id || !existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id);
        
        return {
          _id: isNewQuestion ? new mongoose.Types.ObjectId() : q._id, // Keep existing ID or create new
          title: q.title || 'Untitled',
          content: q.content || q.question || '',
          type: q.type || 'behavioral',
          difficulty: q.difficulty || 'medium',
          expectedDuration: q.expectedDuration || 300,
          metadata: {
            estimatedTime: q.expectedDuration || q.metadata?.estimatedTime || 300,
            points: q.metadata?.points || 10
          },
          statistics: {
            totalAttempts: 0,
            correctAttempts: 0,
            averageScore: 0,
            averageTime: 0
          }
        };
      });

      console.log('Question operations summary:', {
        totalQuestionsInUpdate: processedQuestions.length,
        existingQuestionsCount: existingCategory.questions.length,
        newQuestions: processedQuestions.filter(q => !existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length,
        updatedQuestions: processedQuestions.filter(q => existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length,
        deletedQuestions: existingCategory.questions.length - processedQuestions.filter(q => existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length
      });
    }

    // Calculate statistics from questions if provided
    let statistics = {};
    if (processedQuestions.length > 0) {
      const totalQuestions = processedQuestions.length;
      const easyQuestions = processedQuestions.filter(q => q.difficulty === 'easy').length;
      const mediumQuestions = processedQuestions.filter(q => q.difficulty === 'medium').length;
      const hardQuestions = processedQuestions.filter(q => q.difficulty === 'hard').length;

      statistics = {
        totalQuestions,
        easyQuestions,
        mediumQuestions,
        hardQuestions,
        averageDifficulty: totalQuestions > 0 ? 
          Math.round(((easyQuestions * 1 + mediumQuestions * 3 + hardQuestions * 5) / totalQuestions) * 10) / 10 : 0,
        totalAttempts: 0,
        averageSuccessRate: 0
      };
    }

    // Prepare update data
    const updateFields = {
      lastModifiedBy: req.user.id
    };

    // Add basic fields if provided
    if (updateData.displayName) updateFields.displayName = updateData.displayName;
    if (updateData.description) updateFields.description = updateData.description;
    if (updateData.type) updateFields.type = updateData.type;
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.icon) updateFields.icon = updateData.icon;
    if (updateData.color) updateFields.color = updateData.color;

    // Handle questions separately (don't embed them in category)
    if (processedQuestions.length > 0) {
      const Question = require('../models/Question');
      
      // Delete existing questions for this category
      await Question.deleteMany({ category: id });
      
      // Save new questions
      const questionsToSave = processedQuestions.map(q => ({
        title: q.title,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty,
        expectedDuration: q.expectedDuration,
        category: id,
        metadata: q.metadata,
        statistics: q.statistics,
        createdBy: req.user.id
      }));

      await Question.insertMany(questionsToSave);
      console.log(`Updated ${questionsToSave.length} questions for category ${id}`);
      
      // Keep questions array empty in category (like existing categories)
      updateFields.questions = [];
    }

    // Add statistics if questions were provided
    if (Object.keys(statistics).length > 0) {
      updateFields.statistics = statistics;
    }

    // Add interviewConfig if provided
    if (updateData.interviewConfig) {
      updateFields.interviewConfig = {
        defaultDuration: updateData.interviewConfig.defaultDuration || 300,
        questionCount: processedQuestions.length || updateData.interviewConfig.questionCount || 0,
        allowFollowUps: updateData.interviewConfig.allowFollowUps !== false,
        enableVoiceRecording: updateData.interviewConfig.enableVoiceRecording !== false,
        enableVideoRecording: updateData.interviewConfig.enableVideoRecording || false,
        scoringCriteria: updateData.interviewConfig.scoringCriteria || []
      };
    }

    // Add status if provided
    if (updateData.status) {
      updateFields.status = {
        isActive: updateData.status.isActive !== false,
        isPublic: updateData.status.isPublic !== false,
        isFeatured: updateData.status.isFeatured || false,
        sortOrder: updateData.status.sortOrder || 0
      };
    }

    console.log('Updating category with fields:', {
      categoryId: id,
      updateFields: Object.keys(updateFields),
      questionCount: processedQuestions.length,
      questions: processedQuestions.map(q => ({ title: q.title, type: q.type, difficulty: q.difficulty }))
    });

    const category = await InterviewCategory.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Interview category not found'
      });
    }

    console.log('Category updated successfully:', {
      categoryId: category._id,
      displayName: category.displayName,
      questionCount: category.questions?.length || 0
    });

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'update_interview_category',
        categoryId: category._id,
        displayName: category.displayName,
        type: category.type,
        questionCount: category.questions?.length || 0,
        questionOperations: {
          total: processedQuestions.length,
          new: processedQuestions.filter(q => !existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length,
          updated: processedQuestions.filter(q => existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length,
          deleted: existingCategory.questions.length - processedQuestions.filter(q => existingCategory.questions.find(existingQ => existingQ._id.toString() === q._id)).length
        }
      }
    });

    res.json({
      success: true,
      message: 'Interview category updated successfully',
      data: category
    });

  } catch (error) {
    console.error('Update admin interview category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating interview category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete interview category
exports.deleteAdminInterview = async (req, res) => {
  try {
    const { id } = req.params;

    // Import InterviewCategory model
    const InterviewCategory = require('../models/InterviewCategory');

    const category = await InterviewCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Interview category not found'
      });
    }

    // Delete associated questions first
    const Question = require('../models/Question');
    await Question.deleteMany({ category: id });
    console.log(`Deleted questions for category ${id}`);

    // Delete the category
    await InterviewCategory.findByIdAndDelete(id);

    // Log admin action
    await Analytics.create({
      user: req.user.id,
      type: 'admin',
      details: {
        action: 'delete_interview_category',
        categoryId: id,
        displayName: category.displayName,
        type: category.type
      }
    });

    res.json({
      success: true,
      message: 'Interview category deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin interview category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting interview category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get interview statistics
exports.getInterviewStatistics = async (req, res) => {
  try {
    // Get total interviews by category
    const interviewsByCategory = await Interview.aggregate([
      {
        $lookup: {
          from: 'interviewcategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total interviews by type
    const interviewsByType = await Interview.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total interviews by status
    const interviewsByStatus = await Interview.aggregate([
      {
        $group: {
          _id: '$status.current',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent interviews
    const recentInterviews = await Interview.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name displayName')
      .select('title type status createdAt');

    res.json({
      success: true,
      data: {
        totalInterviews: await Interview.countDocuments(),
        interviewsByCategory,
        interviewsByType,
        interviewsByStatus,
        recentInterviews
      }
    });

  } catch (error) {
    console.error('Get interview statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsers = await User.countDocuments({ 'status.isActive': true, isDeleted: false });
    const verifiedUsers = await User.countDocuments({ 'status.isEmailVerified': true, isDeleted: false });
    const defaulters = await User.countDocuments({ 'status.isDefaulter': true, isDeleted: false });

    const usersByRole = await User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const usersBySubscription = await User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$subscription.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      isDeleted: false
    });

    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      isDeleted: false
    });

    const growth = lastMonthUsers > 0 ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 : 0;

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        defaulters,
        newThisMonth: newUsersThisMonth,
        growth: Math.round(growth * 100) / 100,
        byRole: usersByRole,
        bySubscription: usersBySubscription
      }
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports; 