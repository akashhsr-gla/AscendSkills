const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');
const Session = require('../models/Session');
const Analytics = require('../models/Analytics');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Create a new quiz
exports.createQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      difficulty,
      timeLimit,
      questionCount,
      questionTypes,
      companyId,
      randomOrder,
      negativeMarking,
      passingScore,
      showResults,
      allowRetakes,
      maxAttempts
    } = req.body;

    // Build question filter
    const questionFilter = {
      isDeleted: false,
      'status.isActive': true,
      'status.isApproved': true
    };

    if (category) questionFilter.category = category;
    if (difficulty) questionFilter.difficulty = difficulty;
    if (questionTypes && questionTypes.length > 0) {
      questionFilter.type = { $in: questionTypes };
    }
    if (companyId) questionFilter['company.companyId'] = companyId;

    // Get questions from database
    const availableQuestions = await Question.find(questionFilter);
    
    if (availableQuestions.length < questionCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions available. Found ${availableQuestions.length}, needed ${questionCount}`
      });
    }

    // Select questions
    let selectedQuestions = availableQuestions;
    if (randomOrder) {
      selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    }
    selectedQuestions = selectedQuestions.slice(0, questionCount);

    // Create quiz
    const quiz = new Quiz({
      title,
      description,
      category,
      difficulty,
      timeLimit,
      configuration: {
        randomOrder,
        negativeMarking,
        passingScore,
        showResults,
        allowRetakes,
        maxAttempts
      },
      questions: selectedQuestions.map(q => ({
        question: q._id,
        selectedOption: null,
        isCorrect: null,
        timeTaken: 0,
        points: q.metadata?.points || 1,
        negativePoints: negativeMarking ? (q.metadata?.negativePoints || 0.25) : 0
      })),
      user: req.user.id,
      company: companyId,
      createdBy: req.user.id
    });

    await quiz.save();

    // Create session
    const session = new Session({
      sessionId: `quiz_${quiz._id}_${Date.now()}`,
      user: req.user.id,
      sessionType: 'quiz',
      details: {
        assessmentId: quiz._id,
        assessmentType: 'Quiz',
        companyId,
        timeLimit
      },
      proctoring: {
        isEnabled: req.body.enableProctoring || false
      },
      createdBy: req.user.id
    });

    await session.save();

    // Log analytics
    await Analytics.create({
      user: req.user.id,
      type: 'quiz',
      details: {
        action: 'quiz_created',
        quizId: quiz._id,
        questionCount: selectedQuestions.length,
        category,
        difficulty
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: {
        quiz,
        sessionId: session.sessionId
      }
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeAnswers = false } = req.query;

    const quiz = await Quiz.findById(id)
      .populate({
        path: 'questions.question',
        select: includeAnswers ? '' : '-coding.solution -coding.testCases.expectedOutput'
      })
      .populate('user', 'name email')
      .populate('company', 'name displayName');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check access permissions
    if (quiz.user.toString() !== req.user.id && req.user.role !== 'admin') {
      // Check if user is from the same company
      if (!quiz.company || !req.user.company?.companyId || 
          quiz.company.toString() !== req.user.company.companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // If not including answers, sanitize questions
    if (!includeAnswers) {
      quiz.questions = quiz.questions.map(q => ({
        ...q.toObject(),
        question: q.question.sanitize()
      }));
    }

    res.json({
      success: true,
      data: quiz
    });

  } catch (error) {
    console.error('Get quiz by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Start quiz
exports.startQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user can start quiz
    if (quiz.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if quiz is already started
    if (quiz.status.current === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Quiz already started'
      });
    }

    // Check if quiz is already completed
    if (quiz.status.current === 'completed') {
      if (!quiz.configuration.allowRetakes) {
        return res.status(400).json({
          success: false,
          message: 'Quiz already completed and retakes not allowed'
        });
      }
      
      if (quiz.attempts >= quiz.configuration.maxAttempts) {
        return res.status(400).json({
          success: false,
          message: 'Maximum attempts reached'
        });
      }
    }

    // Start quiz
    quiz.status.current = 'in_progress';
    quiz.timeline.startedAt = new Date();
    quiz.attempts += 1;
    quiz.currentQuestionIndex = 0;
    
    // Reset answers for retakes
    if (quiz.attempts > 1) {
      quiz.questions.forEach(q => {
        q.selectedOption = null;
        q.isCorrect = null;
        q.timeTaken = 0;
      });
      quiz.score = 0;
    }

    await quiz.save();

    // Update session
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        { 
          'details.startTime': new Date(),
          'status.isActive': true
        }
      );
    }

    // Log analytics
    await Analytics.create({
      user: req.user.id,
      type: 'quiz',
      details: {
        action: 'quiz_started',
        quizId: id,
        attempt: quiz.attempts,
        sessionId
      }
    });

    res.json({
      success: true,
      message: 'Quiz started successfully',
      data: {
        quizId: id,
        currentQuestion: 0,
        totalQuestions: quiz.questions.length,
        timeLimit: quiz.timeLimit,
        startTime: quiz.timeline.startedAt
      }
    });

  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit answer
exports.submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex, answer, timeTaken, sessionId } = req.body;

    const quiz = await Quiz.findById(id)
      .populate('questions.question');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check access
    if (quiz.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if quiz is in progress
    if (quiz.status.current !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Quiz not in progress'
      });
    }

    // Check if question index is valid
    if (questionIndex < 0 || questionIndex >= quiz.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }

    const quizQuestion = quiz.questions[questionIndex];
    const question = quizQuestion.question;

    // Check if already answered
    if (quizQuestion.selectedOption !== null) {
      return res.status(400).json({
        success: false,
        message: 'Question already answered'
      });
    }

    // Evaluate answer
    let isCorrect = false;
    let score = 0;

    if (question.type === 'mcq') {
      // Find correct option
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption) {
        isCorrect = correctOption.text === answer || correctOption._id.toString() === answer;
      }
    } else if (question.type === 'fill') {
      // Simple text matching (can be enhanced)
      isCorrect = question.answer?.toLowerCase().trim() === answer.toLowerCase().trim();
    }

    // Calculate score
    if (isCorrect) {
      score = quizQuestion.points;
    } else if (quiz.configuration.negativeMarking) {
      score = -quizQuestion.negativePoints;
    }

    // Update question
    quizQuestion.selectedOption = answer;
    quizQuestion.isCorrect = isCorrect;
    quizQuestion.timeTaken = timeTaken;
    quizQuestion.answeredAt = new Date();

    // Update quiz score
    quiz.score += score;
    quiz.questionsAnswered += 1;

    // Update current question index
    quiz.currentQuestionIndex = questionIndex + 1;

    await quiz.save();

    // Update session activity
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            activities: {
              timestamp: new Date(),
              eventType: 'question_answer',
              questionId: question._id,
              data: {
                questionIndex,
                answer,
                isCorrect,
                timeTaken,
                score
              }
            }
          },
          $inc: {
            'performance.questionsAnswered': 1,
            'performance.totalScore': score
          }
        }
      );
    }

    // Update question statistics
    await question.incrementAttempt(isCorrect, timeTaken, score);

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect,
        score,
        totalScore: quiz.score,
        questionsAnswered: quiz.questionsAnswered,
        questionsRemaining: quiz.questions.length - quiz.questionsAnswered
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting answer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Complete quiz
exports.completeQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, reason = 'completed' } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check access
    if (quiz.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if quiz is in progress
    if (quiz.status.current !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Quiz not in progress'
      });
    }

    // Complete quiz
    quiz.status.current = 'completed';
    quiz.timeline.completedAt = new Date();
    quiz.completionReason = reason;

    // Calculate total time
    if (quiz.timeline.startedAt) {
      quiz.timeline.totalTime = Math.floor(
        (quiz.timeline.completedAt - quiz.timeline.startedAt) / 1000
      );
    }

    // Calculate percentage
    const totalPossibleScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    quiz.percentage = totalPossibleScore > 0 ? (quiz.score / totalPossibleScore) * 100 : 0;

    // Determine pass/fail
    quiz.isPassed = quiz.percentage >= quiz.configuration.passingScore;

    await quiz.save();

    // Update user analytics
    const user = await User.findById(req.user.id);
    if (user) {
      user.analytics.totalQuizzes += 1;
      
      // Update average score
      const totalScore = user.analytics.averageQuizScore * (user.analytics.totalQuizzes - 1) + quiz.percentage;
      user.analytics.averageQuizScore = totalScore / user.analytics.totalQuizzes;
      
      // Update overall rating (weighted average)
      const quizWeight = 0.4;
      const interviewWeight = 0.6;
      user.analytics.overallRating = 
        (user.analytics.averageQuizScore * quizWeight) + 
        (user.analytics.averageInterviewScore * interviewWeight);
      
      await user.save();
    }

    // End session
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        {
          'details.endTime': new Date(),
          'details.isCompleted': reason === 'completed',
          'details.wasTimedOut': reason === 'timeout',
          'details.wasForceSubmitted': reason === 'force_submit',
          'status.isActive': false,
          'performance.totalScore': quiz.score,
          'performance.questionsCompleted': quiz.questionsAnswered
        }
      );
    }

    // Log analytics
    await Analytics.create({
      user: req.user.id,
      type: 'quiz',
      details: {
        action: 'quiz_completed',
        quizId: id,
        score: quiz.score,
        percentage: quiz.percentage,
        isPassed: quiz.isPassed,
        totalTime: quiz.timeline.totalTime,
        reason,
        sessionId
      }
    });

    res.json({
      success: true,
      message: 'Quiz completed successfully',
      data: {
        score: quiz.score,
        percentage: quiz.percentage,
        isPassed: quiz.isPassed,
        totalTime: quiz.timeline.totalTime,
        questionsAnswered: quiz.questionsAnswered,
        totalQuestions: quiz.questions.length,
        results: quiz.configuration.showResults ? quiz.questions.map(q => ({
          question: q.question.content,
          selectedOption: q.selectedOption,
          isCorrect: q.isCorrect,
          timeTaken: q.timeTaken
        })) : null
      }
    });

  } catch (error) {
    console.error('Complete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get quiz results
exports.getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findById(id)
      .populate('questions.question')
      .populate('user', 'name email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check access
    if (quiz.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if quiz is completed
    if (quiz.status.current !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Quiz not completed yet'
      });
    }

    // Calculate detailed results
    const results = {
      overview: {
        score: quiz.score,
        percentage: quiz.percentage,
        isPassed: quiz.isPassed,
        totalTime: quiz.timeline.totalTime,
        questionsAnswered: quiz.questionsAnswered,
        totalQuestions: quiz.questions.length,
        attempts: quiz.attempts,
        completedAt: quiz.timeline.completedAt
      },
      questions: quiz.questions.map((q, index) => ({
        index: index + 1,
        question: q.question.content,
        type: q.question.type,
        selectedOption: q.selectedOption,
        correctAnswer: q.question.type === 'mcq' ? 
          q.question.options.find(opt => opt.isCorrect)?.text : 
          q.question.answer,
        isCorrect: q.isCorrect,
        timeTaken: q.timeTaken,
        points: q.points,
        scoreEarned: q.isCorrect ? q.points : (quiz.configuration.negativeMarking ? -q.negativePoints : 0),
        explanation: q.question.metadata?.explanation
      })),
      performance: {
        averageTimePerQuestion: quiz.timeline.totalTime / quiz.questions.length,
        accuracyRate: (quiz.questions.filter(q => q.isCorrect).length / quiz.questions.length) * 100,
        categoryPerformance: this.calculateCategoryPerformance(quiz.questions),
        difficultyPerformance: this.calculateDifficultyPerformance(quiz.questions)
      }
    };

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's quiz history
exports.getUserQuizHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.params.userId || req.user.id;

    // Check if user can access this data
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    const query = { user: userId };
    if (category) query.category = category;
    if (status) query['status.current'] = status;

    // Get quizzes
    const quizzes = await Quiz.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('title category difficulty score percentage isPassed timeline attempts status');

    const total = await Quiz.countDocuments(query);

    // Calculate user statistics
    const userStats = await Quiz.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averagePercentage: { $avg: '$percentage' },
          totalPassed: { $sum: { $cond: ['$isPassed', 1, 0] } },
          totalTime: { $sum: '$timeline.totalTime' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: quizzes.length,
          totalCount: total
        },
        userStats: userStats[0] || {
          totalQuizzes: 0,
          averageScore: 0,
          averagePercentage: 0,
          totalPassed: 0,
          totalTime: 0
        }
      }
    });

  } catch (error) {
    console.error('Get user quiz history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate category performance
const calculateCategoryPerformance = (questions) => {
  const categoryStats = {};
  
  questions.forEach(q => {
    const category = q.question.category;
    if (!categoryStats[category]) {
      categoryStats[category] = {
        total: 0,
        correct: 0,
        totalTime: 0
      };
    }
    
    categoryStats[category].total += 1;
    if (q.isCorrect) categoryStats[category].correct += 1;
    categoryStats[category].totalTime += q.timeTaken;
  });
  
  return Object.keys(categoryStats).map(category => ({
    category,
    accuracy: (categoryStats[category].correct / categoryStats[category].total) * 100,
    averageTime: categoryStats[category].totalTime / categoryStats[category].total,
    questionsCount: categoryStats[category].total
  }));
};

// Helper function to calculate difficulty performance
const calculateDifficultyPerformance = (questions) => {
  const difficultyStats = {};
  
  questions.forEach(q => {
    const difficulty = q.question.difficulty;
    if (!difficultyStats[difficulty]) {
      difficultyStats[difficulty] = {
        total: 0,
        correct: 0,
        totalTime: 0
      };
    }
    
    difficultyStats[difficulty].total += 1;
    if (q.isCorrect) difficultyStats[difficulty].correct += 1;
    difficultyStats[difficulty].totalTime += q.timeTaken;
  });
  
  return Object.keys(difficultyStats).map(difficulty => ({
    difficulty,
    accuracy: (difficultyStats[difficulty].correct / difficultyStats[difficulty].total) * 100,
    averageTime: difficultyStats[difficulty].totalTime / difficultyStats[difficulty].total,
    questionsCount: difficultyStats[difficulty].total
  }));
};

module.exports = {
  calculateCategoryPerformance,
  calculateDifficultyPerformance,
  ...exports
}; 