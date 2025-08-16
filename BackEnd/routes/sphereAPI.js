const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  submitCode,
  getSubmissionStatus,
  getSubmissionHistory,
  getCodingLeaderboard
} = require('../controllers/sphereAPIController');

// Submit code for execution
router.post('/submit', authenticate, submitCode);

// Get submission status and results
router.get('/submission/:submissionId', authenticate, getSubmissionStatus);

// Get user's submission history
router.get('/submissions', authenticate, getSubmissionHistory);

// Get coding question leaderboard
router.get('/leaderboard/:questionId', getCodingLeaderboard);

module.exports = router;