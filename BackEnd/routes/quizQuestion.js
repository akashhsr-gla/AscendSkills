const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
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
} = require('../controllers/quizQuestionController');

// Create a new quiz question (requires authentication)
router.post('/', authenticate, createQuizQuestion);

// Get all quiz questions with filtering and pagination
router.get('/', getQuizQuestions);

// Get quiz statistics
router.get('/statistics', getQuizStatistics);

// Get quiz questions by category
router.get('/category/:category', getQuizQuestionsByCategory);

// Get quiz questions by category type
router.get('/category-type/:categoryType', getQuizQuestionsByCategoryType);

// Get a single quiz question by ID
router.get('/:id', getQuizQuestionById);

// Update a quiz question (requires authentication)
router.put('/:id', authenticate, updateQuizQuestion);

// Delete a quiz question (requires authentication)
router.delete('/:id', authenticate, deleteQuizQuestion);

// Validate an answer for a quiz question
router.post('/:id/validate', validateAnswer);

// Submit coding answer for quiz question
router.post('/:id/submit-code', authenticate, submitCodingAnswer);

// Get coding submission status
router.get('/submission/:questionId/:userId', getCodingSubmissionStatus);

// Quiz Result Routes
// Save quiz result
router.post('/result', authenticate, saveQuizResult);

// Get user's quiz history
router.get('/history/me', authenticate, getUserQuizHistory);
router.get('/history/:userId', authenticate, getUserQuizHistory);

// Get specific quiz result by ID
router.get('/result/:id', authenticate, getQuizResultById);

// Timer Management Routes
// Get category timer information
router.get('/timer/category/:category', getCategoryTimer);
router.get('/timer/category-type/:categoryType', getCategoryTimer);

// Update individual question time limit
router.put('/:id/time-limit', authenticate, updateQuestionTimeLimit);

// Update category time limits (bulk update)
router.put('/timer/category/:category', authenticate, updateCategoryTimeLimits);
router.put('/timer/category-type/:categoryType', authenticate, updateCategoryTimeLimits);

module.exports = router; 