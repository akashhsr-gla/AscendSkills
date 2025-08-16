const SphereAPISubmission = require('../models/SphereAPI');
const QuizQuestion = require('../models/QuizQuestion');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// SPHERE_API configuration
const SPHERE_API_CONFIG = {
  baseURL: process.env.SPHERE_API_URL || 'https://sphere-engine.com/api/v4',
  accessToken: process.env.SPHERE_API_TOKEN,
  timeout: 30000
};

// Language mapping for SPHERE API
const LANGUAGE_MAPPING = {
  'python': 116,     // Python 3
  'java': 11,        // Java
  'cpp': 41,         // C++14
  'c': 11,           // C
  'javascript': 112, // Node.js
  'go': 114,         // Go
  'rust': 142,       // Rust
  'swift': 83,       // Swift
  'kotlin': 43       // Kotlin
};

// Submit code to SPHERE API for execution
const submitCode = async (req, res) => {
  try {
    const { questionId, sourceCode, language } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!questionId || !sourceCode || !language) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: questionId, sourceCode, language'
      });
    }

    // Validate language
    if (!LANGUAGE_MAPPING[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    // Get question details
    const question = await QuizQuestion.findById(questionId);
    if (!question || question.type !== 'coding') {
      return res.status(404).json({
        success: false,
        message: 'Coding question not found'
      });
    }

    // Generate unique submission ID
    const submissionId = uuidv4();

    // Create submission record
    const submission = new SphereAPISubmission({
      submissionId,
      userId,
      questionId,
      sourceCode,
      language,
      status: 'pending',
      totalTestCases: question.coding?.testCases?.length || 0
    });

    await submission.save();

    // Submit to SPHERE API
    try {
      const sphereResponse = await submitToSphereAPI(sourceCode, language, question.coding?.testCases || []);
      
      // Update submission with SPHERE response
      submission.sphereResponse = sphereResponse;
      submission.status = 'running';
      await submission.save();

      // Start polling for results
      pollSphereResults(submissionId, sphereResponse.id);

      res.status(201).json({
        success: true,
        message: 'Code submitted successfully',
        data: {
          submissionId,
          status: 'running',
          sphereSubmissionId: sphereResponse.id
        }
      });

    } catch (sphereError) {
      console.error('SPHERE API Error:', sphereError);
      
      // Update submission with error
      submission.status = 'compilation_error';
      submission.compilationError = sphereError.message;
      submission.completedAt = new Date();
      await submission.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to submit to code execution service',
        error: sphereError.message
      });
    }

  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit code',
      error: error.message
    });
  }
};

// Get submission status and results
const getSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await SphereAPISubmission.findOne({
      submissionId,
      userId
    }).populate('questionId', 'title content');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.json({
      success: true,
      data: {
        submissionId: submission.submissionId,
        status: submission.status,
        score: submission.score,
        executionTime: submission.executionTime,
        memoryUsed: submission.memoryUsed,
        totalTestCases: submission.totalTestCases,
        passedTestCases: submission.passedTestCases,
        successRate: submission.successRate,
        performanceRating: submission.performanceRating,
        testCaseResults: submission.testCaseResults,
        compilationError: submission.compilationError,
        runtimeError: submission.runtimeError,
        submittedAt: submission.submittedAt,
        completedAt: submission.completedAt,
        question: submission.questionId
      }
    });

  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submission status',
      error: error.message
    });
  }
};

// Get user's submission history
const getSubmissionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId, page = 1, limit = 10 } = req.query;

    const filter = { userId };
    if (questionId) filter.questionId = questionId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await SphereAPISubmission.find(filter)
      .populate('questionId', 'title content category difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SphereAPISubmission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get submission history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submission history',
      error: error.message
    });
  }
};

// Submit code to SPHERE API
const submitToSphereAPI = async (sourceCode, language, testCases) => {
  const languageId = LANGUAGE_MAPPING[language];
  
  // Prepare test data
  const input = testCases.map(tc => tc.input).join('\n');
  
  const requestData = {
    source: sourceCode,
    language: languageId,
    input: input,
    wait: false // Async submission
  };

  const response = await axios.post(
    `${SPHERE_API_CONFIG.baseURL}/submissions`,
    requestData,
    {
      headers: {
        'Authorization': `Bearer ${SPHERE_API_CONFIG.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: SPHERE_API_CONFIG.timeout
    }
  );

  return response.data;
};

// Poll SPHERE API for results
const pollSphereResults = async (submissionId, sphereSubmissionId) => {
  const maxAttempts = 30; // 30 attempts = 5 minutes max
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;
      
      const response = await axios.get(
        `${SPHERE_API_CONFIG.baseURL}/submissions/${sphereSubmissionId}`,
        {
          headers: {
            'Authorization': `Bearer ${SPHERE_API_CONFIG.accessToken}`
          },
          timeout: SPHERE_API_CONFIG.timeout
        }
      );

      const result = response.data;
      
      // Check if execution is complete
      if (result.status === 'finished') {
        await updateSubmissionResults(submissionId, result);
        return;
      }

      // Continue polling if not finished and within max attempts
      if (attempts < maxAttempts && ['pending', 'running'].includes(result.status)) {
        setTimeout(poll, 10000); // Poll every 10 seconds
      } else {
        // Timeout or max attempts reached
        await markSubmissionTimeout(submissionId);
      }

    } catch (error) {
      console.error('Polling error:', error);
      await markSubmissionError(submissionId, error.message);
    }
  };

  // Start polling after 5 seconds
  setTimeout(poll, 5000);
};

// Update submission with results from SPHERE API
const updateSubmissionResults = async (submissionId, sphereResult) => {
  try {
    const submission = await SphereAPISubmission.findOne({ submissionId });
    if (!submission) return;

    const question = await QuizQuestion.findById(submission.questionId);
    if (!question) return;

    // Parse results
    const isAccepted = sphereResult.result?.status === 'accepted';
    const executionTime = sphereResult.result?.time || 0;
    const memoryUsed = sphereResult.result?.memory || 0;
    
    // Process test case results
    const testCaseResults = [];
    const testCases = question.coding?.testCases || [];
    let passedTestCases = 0;

    // Parse output and compare with expected results
    const actualOutputs = sphereResult.output ? sphereResult.output.split('\n') : [];
    
    testCases.forEach((testCase, index) => {
      const actualOutput = actualOutputs[index] || '';
      const expectedOutput = testCase.expectedOutput || '';
      const passed = actualOutput.trim() === expectedOutput.trim();
      
      if (passed) passedTestCases++;
      
      testCaseResults.push({
        testCaseId: testCase._id || index.toString(),
        input: testCase.input,
        expectedOutput,
        actualOutput,
        status: passed ? 'passed' : 'failed',
        executionTime: executionTime / testCases.length, // Approximate per test case
        memoryUsed: memoryUsed
      });
    });

    // Determine final status
    let finalStatus = 'wrong_answer';
    if (sphereResult.result?.status === 'accepted' && passedTestCases === testCases.length) {
      finalStatus = 'accepted';
    } else if (sphereResult.result?.status === 'time_limit_exceeded') {
      finalStatus = 'time_limit_exceeded';
    } else if (sphereResult.result?.status === 'memory_limit_exceeded') {
      finalStatus = 'memory_limit_exceeded';
    } else if (sphereResult.result?.status === 'runtime_error') {
      finalStatus = 'runtime_error';
    } else if (sphereResult.result?.status === 'compilation_error') {
      finalStatus = 'compilation_error';
    }

    // Update submission
    submission.status = finalStatus;
    submission.executionTime = executionTime;
    submission.memoryUsed = memoryUsed;
    submission.passedTestCases = passedTestCases;
    submission.testCaseResults = testCaseResults;
    submission.score = submission.calculateScore();
    submission.completedAt = new Date();
    submission.sphereResponse = sphereResult;
    
    if (sphereResult.result?.compile_error) {
      submission.compilationError = sphereResult.result.compile_error;
    }
    
    if (sphereResult.result?.runtime_error) {
      submission.runtimeError = sphereResult.result.runtime_error;
    }

    await submission.save();

  } catch (error) {
    console.error('Update submission results error:', error);
  }
};

// Mark submission as timeout
const markSubmissionTimeout = async (submissionId) => {
  try {
    await SphereAPISubmission.findOneAndUpdate(
      { submissionId },
      {
        status: 'time_limit_exceeded',
        completedAt: new Date(),
        runtimeError: 'Execution timeout - please check your code for infinite loops'
      }
    );
  } catch (error) {
    console.error('Mark submission timeout error:', error);
  }
};

// Mark submission as error
const markSubmissionError = async (submissionId, errorMessage) => {
  try {
    await SphereAPISubmission.findOneAndUpdate(
      { submissionId },
      {
        status: 'runtime_error',
        completedAt: new Date(),
        runtimeError: errorMessage
      }
    );
  } catch (error) {
    console.error('Mark submission error:', error);
  }
};

// Get coding question leaderboard
const getCodingLeaderboard = async (req, res) => {
  try {
    const { questionId } = req.params;

    const leaderboard = await SphereAPISubmission.aggregate([
      {
        $match: {
          questionId: mongoose.Types.ObjectId(questionId),
          status: 'accepted'
        }
      },
      {
        $sort: {
          score: -1,
          executionTime: 1,
          memoryUsed: 1,
          submittedAt: 1
        }
      },
      {
        $group: {
          _id: '$userId',
          bestSubmission: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$bestSubmission' }
      },
      {
        $limit: 50
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: 1,
          userName: '$user.name',
          score: 1,
          executionTime: 1,
          memoryUsed: 1,
          submittedAt: 1,
          performanceRating: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Get coding leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
};

module.exports = {
  submitCode,
  getSubmissionStatus,
  getSubmissionHistory,
  getCodingLeaderboard
};