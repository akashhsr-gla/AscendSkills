const { validationResult } = require('express-validator');
const axios = require('axios');
const QuizQuestion = require('../models/QuizQuestion');
require('dotenv').config();

// SPHERE ENGINE API Configuration
const SPHERE_ENGINE_API = process.env.SPHERE_ENGINE_API || 'https://api.sphere-engine.com/api/v4';
const SPHERE_ENGINE_KEY = process.env.SPHERE_API_KEY || '';

// Language mapping for SPHERE ENGINE compiler IDs
const SPHERE_COMPILERS = {
  python: 116,      // Python 3.8
  javascript: 56,   // Node.js
  java: 60,         // Java 8
  cpp: 41,          // GNU G++ 5.1
  c: 11            // GNU GCC 5.1
};

// Simple SPHERE ENGINE API wrapper - no sandboxing needed!

// Simple SPHERE ENGINE API wrapper - no sandboxing needed!
const executeCodeWithSphere = async (language, code, problemId) => {
  try {
    // Validate SPHERE ENGINE configuration
    if (!SPHERE_ENGINE_KEY) {
      throw new Error('SPHERE ENGINE API key not configured');
    }

    const compilerId = SPHERE_COMPILERS[language];
    if (!compilerId) {
      throw new Error(`Unsupported language for SPHERE ENGINE: ${language}`);
    }

    console.log(`Executing code for problem ${problemId} with language ${language}`);

    // Submit code directly to SPHERE ENGINE
    const submissionResponse = await axios.post(
      `${SPHERE_ENGINE_API}/submissions?access_token=${SPHERE_ENGINE_KEY}`,
      {
        sourceCode: code,
        compilerId: compilerId,
        problemId: problemId
      },
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const submissionId = submissionResponse.data.id;
    console.log('SPHERE submission ID:', submissionId);

    // Poll for results
    let result;
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `${SPHERE_ENGINE_API}/submissions/${submissionId}?access_token=${SPHERE_ENGINE_KEY}`,
        { timeout: 10000 }
      );

      if (statusResponse.data.status?.name === 'ready') {
        result = statusResponse.data;
        break;
      } else if (statusResponse.data.status?.name === 'error') {
        throw new Error(`SPHERE execution error: ${statusResponse.data.stderr || 'Unknown error'}`);
      }
    }

    if (!result) {
      throw new Error('Timeout waiting for SPHERE ENGINE results');
    }

    // Return SPHERE ENGINE results directly
    return {
      submissionId: submissionId,
      status: result.status?.name || 'unknown',
      score: result.score || 0,
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
      testResults: result.result?.testcases || [],
      error: null
    };

  } catch (error) {
    console.error('SPHERE ENGINE error:', error.message);
    return {
      submissionId: null,
      status: 'error',
      score: 0,
      executionTime: 0,
      memoryUsed: 0,
      testResults: [],
      error: error.message
    };
  }
};

// Run code with SPHERE ENGINE API
exports.runCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language, problemId } = req.body;

    // Validate language
    if (!SPHERE_COMPILERS[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    // Validate problem ID
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required'
      });
    }

    // Get the question from database to get the actual SPHERE ENGINE problem ID
    const question = await QuizQuestion.findById(problemId);
    if (!question || question.type !== 'coding') {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const sphereProblemId = question.coding.problemId;
    if (!sphereProblemId) {
      return res.status(400).json({
        success: false,
        message: 'SPHERE ENGINE problem ID not configured for this question'
      });
    }

    console.log(`Running code for SPHERE problem ${sphereProblemId} with language ${language}`);

    // Execute code directly with SPHERE ENGINE
    const sphereResults = await executeCodeWithSphere(language, code, sphereProblemId);

    // Return SPHERE ENGINE results
    res.json({
      success: true,
      message: 'Code executed successfully',
      data: {
        submissionId: sphereResults.submissionId,
        status: sphereResults.status,
        score: sphereResults.score,
        executionTime: sphereResults.executionTime,
        memoryUsed: sphereResults.memoryUsed,
        testResults: sphereResults.testResults,
        error: sphereResults.error
      }
    });

  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: error.message
    });
  }
};

// Submit code solution with SPHERE ENGINE API
exports.submitCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { code, language, problemId } = req.body;

    // Validate problem ID
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required'
      });
    }

    console.log(`Submitting code for SPHERE problem ${problemId} with language ${language}`);

    // Submit code directly with SPHERE ENGINE
    const sphereResults = await executeCodeWithSphere(language, code, problemId);

    // Analyze code quality
    const codeAnalysis = analyzeCode(code, language);

    // Calculate submission results
    const allTestsPassed = sphereResults.status === 'accepted';
    const score = sphereResults.score || 0;

    res.json({
      success: true,
      message: 'Code submitted successfully',
      data: {
        submissionId: sphereResults.submissionId,
        status: sphereResults.status,
        score: score,
        allTestsPassed: allTestsPassed,
        executionTime: sphereResults.executionTime,
        memoryUsed: sphereResults.memoryUsed,
        testResults: sphereResults.testResults,
        codeAnalysis: codeAnalysis,
        feedback: generateFeedback(sphereResults.testResults, codeAnalysis, score),
        error: sphereResults.error
      }
    });

  } catch (error) {
    console.error('Submit code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code submission failed',
      error: error.message
    });
  }
};

// Get coding problem from database and optionally SPHERE ENGINE API
exports.getCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;

    // First try to get from database
    const question = await QuizQuestion.findById(id);
    if (!question || question.type !== 'coding') {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // If SPHERE ENGINE is configured, try to get additional details
    if (SPHERE_ENGINE_KEY && question.coding.problemId) {
      try {
        console.log(`Fetching SPHERE problem with ID: ${question.coding.problemId}`);
        
        const response = await axios.get(
          `${SPHERE_ENGINE_API}/problems/${question.coding.problemId}?access_token=${SPHERE_ENGINE_KEY}`,
          { timeout: 10000 }
        );

        const sphereProblem = response.data;

        // Combine database and SPHERE ENGINE data
        const problem = {
          id: question._id,
          sphereProblemId: question.coding.problemId,
          title: question.title,
          description: question.content,
          difficulty: question.difficulty,
          category: question.category,
          tags: question.tags,
          testCases: question.coding.testCases || [],
          constraints: question.coding.constraints || [],
          starterCode: question.coding.starterCode || '',
          examples: question.coding.examples || [],
          sphereDetails: {
            name: sphereProblem.name,
            body: sphereProblem.body,
            testcases: sphereProblem.testcases,
            inputFormat: sphereProblem.inputFormat,
            outputFormat: sphereProblem.outputFormat,
            timeLimit: sphereProblem.timeLimit,
            memoryLimit: sphereProblem.memoryLimit
          }
        };

        return res.json({
          success: true,
          data: problem
        });

      } catch (sphereError) {
        console.log('SPHERE ENGINE fetch failed, using database data only:', sphereError.message);
      }
    }

    // Fallback to database data only
    const problem = {
      id: question._id,
      sphereProblemId: question.coding.problemId,
      title: question.title,
      description: question.content,
      difficulty: question.difficulty,
      category: question.category,
      tags: question.tags,
      testCases: question.coding.testCases || [],
      constraints: question.coding.constraints || [],
      starterCode: question.coding.starterCode || '',
      examples: question.coding.examples || []
    };

    res.json({
      success: true,
      data: problem
    });

  } catch (error) {
    console.error('Get coding problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's coding submissions from SPHERE ENGINE API
exports.getUserSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      language = '',
      status = '',
      problemId = ''
    } = req.query;

    // Validate SPHERE ENGINE configuration
    if (!SPHERE_ENGINE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'SPHERE ENGINE API key not configured'
      });
    }

    console.log(`Fetching user submissions from SPHERE ENGINE`);

    // For now, return empty results since SPHERE ENGINE doesn't provide user-specific submissions
    // In a real implementation, you would need to store submission IDs locally
    res.json({
      success: true,
      data: {
        submissions: [],
        pagination: {
          current: parseInt(page),
          total: 0,
          count: 0,
          totalCount: 0
        },
        userStats: {
          totalSubmissions: 0,
          averageScore: 0,
          successRate: 0,
          languageStats: {}
        }
      }
    });

  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Simple helper functions
const analyzeCode = (code, language) => ({
  linesOfCode: code.split('\n').length,
  complexity: 'medium',
  readability: 'good',
  issues: [],
  suggestions: []
});

const generateFeedback = (results, codeAnalysis, score) => ({
  overall: score >= 90 ? 'Excellent work!' : score >= 70 ? 'Good solution!' : 'Needs improvement.',
  strengths: [],
  improvements: [],
  suggestions: []
});

// Execute code directly with SPHERE ENGINE API
exports.executeCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sourceCode, language, problemId } = req.body;

    // Validate language
    if (!SPHERE_COMPILERS[language]) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`
      });
    }

    // Validate problem ID
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID is required'
      });
    }

    console.log(`Executing code for SPHERE problem ${problemId} with language ${language}`);

    // Execute code directly with SPHERE ENGINE
    const sphereResults = await executeCodeWithSphere(language, sourceCode, problemId);

    // Return SPHERE ENGINE results directly
    res.json({
      success: true,
      data: {
        submissionId: sphereResults.submissionId,
        status: sphereResults.status,
        score: sphereResults.score,
        executionTime: sphereResults.executionTime,
        memoryUsed: sphereResults.memoryUsed,
        testResults: sphereResults.testResults,
        error: sphereResults.error
      }
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during code execution',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get submission
exports.getSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return a mock submission
    // In a real implementation, you would fetch from database
    res.json({
      success: true,
      data: {
        id,
        status: 'completed',
        score: 100,
        executionTime: 50,
        memoryUsed: 1024,
        testResults: []
      }
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submission',
      error: error.message
    });
  }
};

// Get submission history
exports.getSubmissionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // For now, return mock data
    // In a real implementation, you would fetch from database
    res.json({
      success: true,
      data: {
        submissions: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
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

// Validate code
exports.validateCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Basic validation
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check for basic syntax issues
  if (language === 'javascript') {
    if (code.includes('var ')) {
        validation.warnings.push('Consider using let/const instead of var');
    }
    if (code.includes('==')) {
        validation.warnings.push('Consider using === instead of ==');
      }
    }

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Validate code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code validation failed',
      error: error.message
    });
  }
};

// Get code suggestions
exports.getCodeSuggestions = async (req, res) => {
  try {
    const { code, language, context } = req.body;
    
    // Mock suggestions
    const suggestions = [
      'Consider adding error handling',
      'Add input validation',
      'Optimize the algorithm for better performance'
    ];

    res.json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Get code suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
};

// Analyze code complexity
exports.analyzeCodeComplexity = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    const analysis = analyzeCode(code, language);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze code complexity error:', error);
    res.status(500).json({
      success: false,
      message: 'Code analysis failed',
      error: error.message
    });
  }
};

// Generate test cases
exports.generateTestCases = async (req, res) => {
  try {
    const { problemDescription, language } = req.body;
    
    // Mock test case generation
    const testCases = [
      {
        input: '[2,7,11,15]',
        expectedOutput: '[0,1]',
        description: 'Basic test case'
      },
      {
        input: '[3,2,4]',
        expectedOutput: '[1,2]',
        description: 'Edge case'
      }
    ];

    res.json({
      success: true,
      data: {
        testCases
      }
    });
  } catch (error) {
    console.error('Generate test cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test cases',
      error: error.message
    });
  }
};

// Run test cases
exports.runTestCases = async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    const results = await executeCode(language, code, testCases);

    res.json({
      success: true,
      data: {
        results
      }
    });
  } catch (error) {
    console.error('Run test cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run test cases',
      error: error.message
    });
  }
};

// Check code quality
exports.checkCodeQuality = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    const quality = {
      score: 85,
      issues: [],
      suggestions: [],
      metrics: {
        linesOfCode: code.split('\n').length,
        complexity: 'medium',
        maintainability: 'good'
      }
    };

    res.json({
      success: true,
      data: quality
    });
  } catch (error) {
    console.error('Check code quality error:', error);
    res.status(500).json({
      success: false,
      message: 'Code quality check failed',
      error: error.message
    });
  }
};

// Get code metrics
exports.getCodeMetrics = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Mock metrics
    const metrics = {
      executionTime: 50,
      memoryUsed: 1024,
      cpuUsage: 15,
      score: 100
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get code metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
};

// Format code
exports.formatCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Basic formatting (in a real implementation, use proper formatters)
    const formattedCode = code
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    res.json({
      success: true,
      data: {
        formattedCode
      }
    });
  } catch (error) {
    console.error('Format code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code formatting failed',
      error: error.message
    });
  }
};

// Optimize code
exports.optimizeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Mock optimization suggestions
    const optimization = {
      suggestions: [
        'Use more efficient data structures',
        'Reduce time complexity',
        'Optimize memory usage'
      ],
      optimizedCode: code // In real implementation, return optimized version
    };

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Optimize code error:', error);
    res.status(500).json({
      success: false,
      message: 'Code optimization failed',
      error: error.message
    });
  }
};

// Detect plagiarism
exports.detectPlagiarism = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Mock plagiarism detection
    const plagiarism = {
      score: 0,
      matches: [],
      isPlagiarized: false
    };

    res.json({
      success: true,
      data: plagiarism
    });
  } catch (error) {
    console.error('Detect plagiarism error:', error);
    res.status(500).json({
      success: false,
      message: 'Plagiarism detection failed',
      error: error.message
    });
  }
};

// Get code review
exports.getCodeReview = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Mock code review
    const review = {
      score: 85,
      feedback: [
        'Good algorithm choice',
        'Consider adding comments',
        'Handle edge cases better'
      ],
      suggestions: [
        'Add input validation',
        'Improve error handling'
      ]
    };

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get code review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get code review',
      error: error.message
    });
  }
};

// Save code progress
exports.saveCodeProgress = async (req, res) => {
  try {
    const { questionId, code, language, sessionId } = req.body;
    
    // In a real implementation, save to database
    res.json({
      success: true,
      message: 'Progress saved successfully'
    });
  } catch (error) {
    console.error('Save code progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save progress',
      error: error.message
    });
  }
};

// Get code progress
exports.getCodeProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock progress data
    const progress = {
      savedCode: '',
      lastSaved: new Date(),
      sessionData: {}
    };

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get code progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress',
      error: error.message
    });
  }
};

// Export only the essential functions
module.exports = {
  SPHERE_ENGINE_API,
  SPHERE_ENGINE_KEY,
  SPHERE_COMPILERS,
  executeCodeWithSphere,
  analyzeCode,
  generateFeedback,
  runCode: exports.runCode,
  submitCode: exports.submitCode,
  executeCode: exports.executeCode,
  getCodingProblem: exports.getCodingProblem,
  getUserSubmissions: exports.getUserSubmissions,
  getSubmission: exports.getSubmission,
  getSubmissionHistory: exports.getSubmissionHistory,
  validateCode: exports.validateCode,
  getCodeSuggestions: exports.getCodeSuggestions,
  analyzeCodeComplexity: exports.analyzeCodeComplexity,
  generateTestCases: exports.generateTestCases,
  runTestCases: exports.runTestCases,
  checkCodeQuality: exports.checkCodeQuality,
  getCodeMetrics: exports.getCodeMetrics,
  formatCode: exports.formatCode,
  optimizeCode: exports.optimizeCode,
  detectPlagiarism: exports.detectPlagiarism,
  getCodeReview: exports.getCodeReview,
  saveCodeProgress: exports.saveCodeProgress,
  getCodeProgress: exports.getCodeProgress
}; 