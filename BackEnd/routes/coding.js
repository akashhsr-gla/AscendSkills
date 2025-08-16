const express = require('express');
const router = express.Router();
const codingController = require('../controllers/codingController');

const { authenticate, adminAuth } = require('../middleware/auth');
const { errorHandler } = require('../middleware/errorHandler');

// Core coding routes (temporarily removed auth for testing)
router.post('/submit', codingController.submitCode);
router.post('/execute', codingController.executeCode);
router.post('/run', codingController.runCode);
router.get('/problem/:id', codingController.getCodingProblem);
router.get('/submission/:id', codingController.getSubmission);
router.get('/user/:userId/history', authenticate, codingController.getUserSubmissions);
router.post('/validate', authenticate, codingController.validateCode);
router.post('/suggestions', authenticate, codingController.getCodeSuggestions);
router.post('/analyze', authenticate, codingController.analyzeCodeComplexity);
router.post('/generate-tests', authenticate, codingController.generateTestCases);
router.post('/run-tests', authenticate, codingController.runTestCases);
router.post('/quality-check', authenticate, codingController.checkCodeQuality);
router.get('/metrics/:submissionId', authenticate, codingController.getCodeMetrics);
router.post('/format', authenticate, codingController.formatCode);
router.post('/optimize', authenticate, codingController.optimizeCode);
router.post('/plagiarism-check', authenticate, codingController.detectPlagiarism);
router.get('/review/:submissionId', authenticate, codingController.getCodeReview);

// Progress tracking
router.post('/progress', authenticate, codingController.saveCodeProgress);
router.get('/progress/:userId', authenticate, codingController.getCodeProgress);

// Error handling middleware
router.use(errorHandler);

module.exports = router; 