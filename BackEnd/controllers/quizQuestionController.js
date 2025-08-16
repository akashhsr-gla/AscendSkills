const mongoose = require('mongoose');
const QuizQuestion = require('../models/QuizQuestion');
const QuizResult = require('../models/QuizResult');
const SphereAPISubmission = require('../models/SphereAPI');
const auth = require('../middleware/auth');

// Create a new quiz question
const createQuizQuestion = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      category,
      categoryType,
      difficulty,
      explanation,
      correctAnswer,
      mcqs,
      fillInBlanks,
      trueFalse,
      coding,
      points,
      timeLimit,
      tags,
      company
    } = req.body;

    // Validate required fields based on type
    if (!title || !content || !type || !category || !categoryType || !explanation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Type-specific validation
    switch (type) {
      case 'mcqs':
        if (!mcqs?.options || !Array.isArray(mcqs.options) || mcqs.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: 'MCQs must have at least 2 options'
          });
        }
        if (mcqs.correctOptionIndex === undefined || mcqs.correctOptionIndex < 0 || mcqs.correctOptionIndex >= mcqs.options.length) {
          return res.status(400).json({
            success: false,
            message: 'Invalid correct option index for MCQs'
          });
        }
        break;

      case 'fill_in_blanks':
        if (!correctAnswer) {
          return res.status(400).json({
            success: false,
            message: 'Fill in blanks must have a correct answer'
          });
        }
        break;

      case 'true_false':
        if (trueFalse?.correctAnswer === undefined) {
          return res.status(400).json({
            success: false,
            message: 'True/False must have a correct answer (true or false)'
          });
        }
        break;

      case 'coding':
        if (!coding?.problemDescription) {
          return res.status(400).json({
            success: false,
            message: 'Coding questions must have a problem description'
          });
        }
        break;
    }

    const quizQuestion = new QuizQuestion({
      title,
      content,
      type,
      category,
      categoryType,
      difficulty: difficulty || 'medium',
      explanation,
      correctAnswer,
      mcqs: type === 'mcqs' ? mcqs : undefined,
      fillInBlanks: type === 'fill_in_blanks' ? fillInBlanks : undefined,
      trueFalse: type === 'true_false' ? trueFalse : undefined,
      coding: type === 'coding' ? coding : undefined,
      points: points || 1,
      timeLimit: timeLimit || 60,
      tags: tags || [],
      company: company || {},
      createdBy: req.user.id
    });

    await quizQuestion.save();

    res.status(201).json({
      success: true,
      message: 'Quiz question created successfully',
      data: quizQuestion
    });

  } catch (error) {
    console.error('Create quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz question',
      error: error.message
    });
  }
};

// Get all quiz questions with filtering
const getQuizQuestions = async (req, res) => {
  try {
    const {
      type,
      category,
      categoryType,
      difficulty,
      company,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { 'status.isActive': true };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (categoryType) filter.categoryType = categoryType;
    if (difficulty) filter.difficulty = difficulty;
    if (company) filter['company.companyId'] = company;
    if (tags) {
      if (Array.isArray(tags)) {
        filter.tags = { $in: tags };
      } else {
        filter.tags = tags;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const quizQuestions = await QuizQuestion.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('company.companyId', 'name logo');

    const total = await QuizQuestion.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions: quizQuestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get quiz questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz questions',
      error: error.message
    });
  }
};

// Get a single quiz question by ID
const getQuizQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const quizQuestion = await QuizQuestion.findById(id)
      .populate('createdBy', 'name email')
      .populate('company.companyId', 'name logo');

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    res.json({
      success: true,
      data: quizQuestion
    });

  } catch (error) {
    console.error('Get quiz question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz question',
      error: error.message
    });
  }
};

// Update a quiz question
const updateQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const quizQuestion = await QuizQuestion.findById(id);

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    // Check if user is the creator or admin
    if (quizQuestion.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the creator can update this question'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.usageCount;
    delete updateData.successRate;

    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Quiz question updated successfully',
      data: updatedQuestion
    });

  } catch (error) {
    console.error('Update quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quiz question',
      error: error.message
    });
  }
};

// Delete a quiz question
const deleteQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const quizQuestion = await QuizQuestion.findById(id);

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    // Check if user is the creator or admin
    if (quizQuestion.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the creator can delete this question'
      });
    }

    await QuizQuestion.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Quiz question deleted successfully'
    });

  } catch (error) {
    console.error('Delete quiz question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz question',
      error: error.message
    });
  }
};

// Validate an answer for a quiz question
const validateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (answer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required'
      });
    }

    const quizQuestion = await QuizQuestion.findById(id);

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    const isCorrect = quizQuestion.isCorrectAnswer(answer);

    // Update usage statistics
    quizQuestion.usageCount += 1;
    if (isCorrect) {
      const currentSuccessRate = quizQuestion.successRate;
      const totalAttempts = quizQuestion.usageCount;
      quizQuestion.successRate = ((currentSuccessRate * (totalAttempts - 1)) + 100) / totalAttempts;
    } else {
      const currentSuccessRate = quizQuestion.successRate;
      const totalAttempts = quizQuestion.usageCount;
      quizQuestion.successRate = (currentSuccessRate * (totalAttempts - 1)) / totalAttempts;
    }
    await quizQuestion.save();

    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: quizQuestion.getCorrectAnswer,
        explanation: quizQuestion.explanation,
        points: isCorrect ? quizQuestion.points : 0
      }
    });

  } catch (error) {
    console.error('Validate answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate answer',
      error: error.message
    });
  }
};

// Get quiz questions by category
const getQuizQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, type, categoryType, limit = 10 } = req.query;

    const filter = { 
      category,
      'status.isActive': true,
      // Exclude coding questions for quiz interface
      type: { $in: ['mcqs', 'fill_in_blanks', 'true_false'] }
    };

    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (categoryType) filter.categoryType = categoryType;

    const quizQuestions = await QuizQuestion.find(filter)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: quizQuestions
    });

  } catch (error) {
    console.error('Get quiz questions by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz questions by category',
      error: error.message
    });
  }
};

// Get quiz statistics
const getQuizStatistics = async (req, res) => {
  try {
    const { category, categoryType, type, difficulty } = req.query;

    const filter = { 'status.isActive': true };
    if (category) filter.category = category;
    if (categoryType) filter.categoryType = categoryType;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const stats = await QuizQuestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          averageSuccessRate: { $avg: '$successRate' },
          totalUsage: { $sum: '$usageCount' },
          byType: {
            $push: {
              type: '$type',
              difficulty: '$difficulty'
            }
          }
        }
      }
    ]);

    const typeStats = await QuizQuestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgSuccessRate: { $avg: '$successRate' }
        }
      }
    ]);

    const difficultyStats = await QuizQuestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgSuccessRate: { $avg: '$successRate' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalQuestions: 0,
          averageSuccessRate: 0,
          totalUsage: 0
        },
        byType: typeStats,
        byDifficulty: difficultyStats
      }
    });

  } catch (error) {
    console.error('Get quiz statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: error.message
    });
  }
};

// Get category timer information
const getCategoryTimer = async (req, res) => {
  try {
    const { category, categoryType } = req.params;

    const filter = { 
      'status.isActive': true,
      type: { $in: ['mcqs', 'fill_in_blanks', 'true_false'] }
    };

    if (category) filter.category = category;
    if (categoryType) filter.categoryType = categoryType;

    const timerInfo = await QuizQuestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalTimeLimit: { $sum: '$timeLimit' },
          averageTimePerQuestion: { $avg: '$timeLimit' },
          questions: {
            $push: {
              _id: '$_id',
              title: '$title',
              timeLimit: '$timeLimit',
              type: '$type',
              difficulty: '$difficulty'
            }
          }
        }
      }
    ]);

    if (timerInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for this category'
      });
    }

    const result = timerInfo[0];
    result.totalTimeMinutes = Math.round(result.totalTimeLimit / 60);
    result.averageTimeMinutes = Math.round(result.averageTimePerQuestion / 60);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get category timer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category timer information',
      error: error.message
    });
  }
};

// Update question time limit
const updateQuestionTimeLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeLimit } = req.body;

    if (!timeLimit || timeLimit < 10) {
      return res.status(400).json({
        success: false,
        message: 'Time limit must be at least 10 seconds'
      });
    }

    const quizQuestion = await QuizQuestion.findById(id);

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    // Check if user is the creator or admin
    if (quizQuestion.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the creator can update this question'
      });
    }

    quizQuestion.timeLimit = timeLimit;
    await quizQuestion.save();

    res.json({
      success: true,
      message: 'Question time limit updated successfully',
      data: {
        _id: quizQuestion._id,
        title: quizQuestion.title,
        timeLimit: quizQuestion.timeLimit
      }
    });

  } catch (error) {
    console.error('Update question time limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question time limit',
      error: error.message
    });
  }
};

// Update category time limits (bulk update)
const updateCategoryTimeLimits = async (req, res) => {
  try {
    const { category, categoryType } = req.params;
    const { timeLimits } = req.body; // Array of { questionId, timeLimit }

    if (!timeLimits || !Array.isArray(timeLimits)) {
      return res.status(400).json({
        success: false,
        message: 'Time limits array is required'
      });
    }

    const filter = { 
      'status.isActive': true,
      type: { $in: ['mcqs', 'fill_in_blanks', 'true_false'] }
    };

    if (category) filter.category = category;
    if (categoryType) filter.categoryType = categoryType;

    // Get questions in this category
    const questions = await QuizQuestion.find(filter);
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for this category'
      });
    }

    // Update time limits
    const updatePromises = timeLimits.map(async ({ questionId, timeLimit }) => {
      if (timeLimit < 10) {
        throw new Error(`Time limit must be at least 10 seconds for question ${questionId}`);
      }

      const question = questions.find(q => q._id.toString() === questionId);
      if (!question) {
        throw new Error(`Question ${questionId} not found in category`);
      }

      // Check if user is the creator
      if (question.createdBy.toString() !== req.user.id) {
        throw new Error(`Access denied for question ${questionId}`);
      }

      question.timeLimit = timeLimit;
      return question.save();
    });

    await Promise.all(updatePromises);

    // Get updated timer information
    const updatedTimerInfo = await QuizQuestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          totalTimeLimit: { $sum: '$timeLimit' },
          averageTimePerQuestion: { $avg: '$timeLimit' }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Category time limits updated successfully',
      data: {
        totalQuestions: updatedTimerInfo[0]?.totalQuestions || 0,
        totalTimeLimit: updatedTimerInfo[0]?.totalTimeLimit || 0,
        totalTimeMinutes: Math.round((updatedTimerInfo[0]?.totalTimeLimit || 0) / 60),
        averageTimePerQuestion: updatedTimerInfo[0]?.averageTimePerQuestion || 0,
        averageTimeMinutes: Math.round((updatedTimerInfo[0]?.averageTimePerQuestion || 0) / 60)
      }
    });

  } catch (error) {
    console.error('Update category time limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category time limits',
      error: error.message
    });
  }
};

// Get quiz questions by category type
const getQuizQuestionsByCategoryType = async (req, res) => {
  try {
    const { categoryType } = req.params;
    const { difficulty, type, limit = 1000000000000 } = req.query;

    const filter = { 
      categoryType,
      'status.isActive': true,
      // Exclude coding questions for quiz interface
      type: { $in: ['mcqs', 'fill_in_blanks', 'true_false'] }
    };

    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    const quizQuestions = await QuizQuestion.find(filter)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('company.companyId', 'name logo');

    res.json({
      success: true,
      data: quizQuestions
    });

  } catch (error) {
    console.error('Get quiz questions by category type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz questions by category type',
      error: error.message
    });
  }
};

// Submit coding answer for quiz question
const submitCodingAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceCode, language } = req.body;
    const userId = req.user.id;

    if (!sourceCode || !language) {
      return res.status(400).json({
        success: false,
        message: 'Source code and language are required'
      });
    }

    const quizQuestion = await QuizQuestion.findById(id);

    if (!quizQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Quiz question not found'
      });
    }

    if (quizQuestion.type !== 'coding') {
      return res.status(400).json({
        success: false,
        message: 'This is not a coding question'
      });
    }

    // Create a simplified submission for quiz context
    const submission = {
      questionId: id,
      sourceCode,
      language,
      submittedAt: new Date(),
      // For quiz context, we'll do a simple evaluation
      status: 'submitted',
      score: 100 // Default score for quiz submission
    };

    res.json({
      success: true,
      data: {
        submission,
        points: quizQuestion.points,
        message: 'Code submitted successfully for quiz'
      }
    });

  } catch (error) {
    console.error('Submit coding answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit coding answer',
      error: error.message
    });
  }
};

// Get coding submission status for quiz
const getCodingSubmissionStatus = async (req, res) => {
  try {
    const { questionId, userId } = req.params;

    const submission = await SphereAPISubmission.findOne({
      questionId,
      userId
    }).sort({ createdAt: -1 });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'No submission found'
      });
    }

    res.json({
      success: true,
      data: {
        status: submission.status,
        score: submission.score,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        passedTestCases: submission.passedTestCases,
        totalTestCases: submission.totalTestCases,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt
      }
    });

  } catch (error) {
    console.error('Get coding submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submission status',
      error: error.message
    });
  }
};

// Save quiz result
const saveQuizResult = async (req, res) => {
  try {
    const {
      quizTitle,
      quizCategory,
      quizCategoryType,
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      score,
      percentage,
      grade,
      gradeColor,
      timeTaken,
      averageTimePerQuestion,
      performanceByType,
      performanceByDifficulty,
      questionAnalysis,
      userAnswers,
      recommendations,
      strengths,
      weaknesses,
      startedAt,
      completedAt,
      status = 'completed'
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!quizTitle || !quizCategory || !quizCategoryType || totalQuestions === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for quiz result'
      });
    }

    const quizResult = new QuizResult({
      userId,
      quizTitle,
      quizCategory,
      quizCategoryType,
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      score,
      percentage,
      grade,
      gradeColor,
      timeTaken,
      averageTimePerQuestion,
      performanceByType,
      performanceByDifficulty,
      questionAnalysis,
      userAnswers,
      recommendations,
      strengths,
      weaknesses,
      startedAt: startedAt || new Date(),
      completedAt: completedAt || new Date(),
      status
    });

    await quizResult.save();

    res.status(201).json({
      success: true,
      message: 'Quiz result saved successfully',
      data: quizResult
    });

  } catch (error) {
    console.error('Save quiz result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save quiz result',
      error: error.message
    });
  }
};

// Get user's quiz history
const getUserQuizHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, categoryType, quizCategory } = req.query;

    // Use authenticated user's ID if no userId provided or if userId is 'me'
    const actualUserId = (userId === 'me' || !userId) ? req.user?.id : userId;

    // Ensure user can only access their own results
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.id !== actualUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own quiz history'
      });
    }

    // Check if this user is the test user (who has quiz results with "test-user-id")
    const isTestUser = req.user?.email === 'test@example.com';
    
    // Build filter based on user type
    let filter;
    if (isTestUser) {
      // For test user, use "test-user-id" string
      filter = { userId: 'test-user-id' };
    } else {
      // For other users, use their actual user ID
      filter = { userId: new mongoose.Types.ObjectId(actualUserId) };
    }
    
    if (categoryType) filter.quizCategoryType = categoryType;
    if (quizCategory) filter.quizCategory = quizCategory;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quizResults = await QuizResult.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('questionAnalysis.questionId', 'title content type');

    const total = await QuizResult.countDocuments(filter);

    res.json({
      success: true,
      data: {
        results: quizResults,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user quiz history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history',
      error: error.message
    });
  }
};

// Get quiz result by ID
const getQuizResultById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quizResult = await QuizResult.findById(id)
      .populate('questionAnalysis.questionId', 'title content type explanation')
      .populate('userId', 'name email');

    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }

    // Ensure user can only access their own results
    if (quizResult.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own quiz results'
      });
    }

    res.json({
      success: true,
      data: quizResult
    });

  } catch (error) {
    console.error('Get quiz result by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: error.message
    });
  }
};

module.exports = {
  createQuizQuestion,
  getQuizQuestions,
  getQuizQuestionById,
  updateQuizQuestion,
  deleteQuizQuestion,
  validateAnswer,
  getQuizQuestionsByCategory,
  getQuizQuestionsByCategoryType,
  getQuizStatistics,
  submitCodingAnswer,
  getCodingSubmissionStatus,
  saveQuizResult,
  getUserQuizHistory,
  getQuizResultById,
  getCategoryTimer,
  updateQuestionTimeLimit,
  updateCategoryTimeLimits
}; 