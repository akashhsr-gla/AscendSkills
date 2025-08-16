const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const InterviewCategory = require('../models/InterviewCategory');
const Question = require('../models/Question');
const Company = require('../models/Company');
const { authenticate: auth } = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');
const aiServices = require('../services/aiServices');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/ogg', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get user's interview history
router.get('/user/history', auth, interviewController.getUserInterviews);

// Get all interview categories
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    
    const query = { 'status.isActive': true };
    if (type) {
      query.type = type;
    }
    
    const categories = await InterviewCategory.find(query)
      .sort({ 'status.sortOrder': 1, displayName: 1 })
      .populate('company.companyId', 'name displayName logo');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get questions by category
router.get('/questions/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { difficulty, limit = 10, page = 1 } = req.query;
    
    const category = await InterviewCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const query = {
      $and: [
        {
          $or: [
            { category: category.name }, // Old format: string category name
            { category: category._id }   // New format: ObjectId reference
          ]
        },
        { 'status.isActive': true },
        {
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        }
      ]
    };
    
    console.log('🔍 Query for questions:', JSON.stringify(query, null, 2));
    console.log('📂 Category name:', category.name);
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const skip = (page - 1) * limit;
    
    const questions = await Question.find(query)
      .sort({ 'statistics.totalAttempts': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title content difficulty type statistics metadata coding interview systemDesign');
    
    console.log('📝 Questions found:', questions.length);
    questions.forEach(q => console.log('  -', q.title));
    
    const total = await Question.countDocuments(query);
    console.log('📊 Total count:', total);
    
    res.json({
      success: true,
      data: {
        category,
        questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions'
    });
  }
});

// Get companies with question counts
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find({ 'subscription.isActive': true })
      .select('name displayName logo industry assessment');
    
    // Get question counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const questionCount = await Question.countDocuments({
          'company.companyId': company._id,
          'status.isActive': true,
          isDeleted: false
        });
        
        // Calculate average difficulty
        const difficultyStats = await Question.aggregate([
          {
            $match: {
              'company.companyId': company._id,
              'status.isActive': true,
              isDeleted: false
            }
          },
          {
            $group: {
              _id: null,
              avgDifficulty: { $avg: { $cond: [
                { $eq: ['$difficulty', 'easy'] }, 1,
                { $cond: [{ $eq: ['$difficulty', 'medium'] }, 2, 3] }
              ]}}
            }
          }
        ]);
        
        let avgDifficulty = 'Medium';
        if (difficultyStats.length > 0) {
          const avg = difficultyStats[0].avgDifficulty;
          if (avg < 1.5) avgDifficulty = 'Easy';
          else if (avg > 2.5) avgDifficulty = 'Hard';
        }
        
        return {
          id: company.name,
          name: company.displayName,
          logo: company.logo,
          questions: questionCount,
          difficulty: avgDifficulty,
          industry: company.industry
        };
      })
    );
    
    res.json({
      success: true,
      data: companiesWithStats
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
});

// Get practice questions for frontend
router.get('/practice', async (req, res) => {
  try {
    const { category, difficulty, company } = req.query;
    
    // Get categories with statistics
    const categories = await InterviewCategory.find({ 
      type: 'main',
      'status.isActive': true 
    }).sort({ 'status.sortOrder': 1 });
    
    // Get sample questions for each category
    const categoriesWithQuestions = await Promise.all(
      categories.map(async (category) => {
        // Map category names to database format
        const categoryMapping = {
          'technical': 'technical',
          'behavioral': 'behavioral',
          'system-design': 'system_design',
          'data-structures': 'data_structures',
          'algorithms': 'algorithms'
        };
        
        const dbCategoryName = categoryMapping[category.name] || category.name;
        
        const questions = await Question.find({
          category: dbCategoryName,
          isDeleted: false
        })
        .sort({ 'statistics.totalAttempts': -1 })
        .limit(3)
        .select('title content difficulty type statistics metadata');
        
        return {
          id: category.name,
          name: category.displayName,
          icon: category.icon,
          count: questions.length,
          questions: questions.map(q => ({
            id: q._id,
            title: q.title,
            difficulty: q.difficulty,
            time: Math.ceil(q.metadata.estimatedTime / 60),
            attempts: q.statistics.totalAttempts,
            successRate: q.statistics.averageScore,
            tags: q.coding?.tags || [],
            description: q.content,
            type: q.type
          }))
        };
      })
    );
    
    // Get companies
    const companies = await Company.find({ 'subscription.isActive': true })
      .select('name displayName logo industry');
    
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const questionCount = await Question.countDocuments({
          'company.companyId': company._id,
          'status.isActive': true,
          isDeleted: false
        });
        
        return {
          id: company.name,
          name: company.displayName,
          logo: company.logo,
          questions: questionCount,
          difficulty: 'Medium' // Default, can be enhanced
        };
      })
    );
    
  res.json({ 
      success: true,
      data: {
        categories: categoriesWithQuestions,
        companies: companiesWithStats
      }
    });
  } catch (error) {
    console.error('Error fetching practice data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch practice data'
    });
  }
});

// Get specific question details
router.get('/questions/detail/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await Question.findById(questionId)
      .select('-coding.solution -systemDesign.evaluationPoints');
    
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
    console.error('Error fetching question details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question details'
    });
  }
});

// Start interview session
router.post('/start', auth, async (req, res) => {
  try {
    const { category, difficulty, questionCount = 5 } = req.body;
    
    // Find questions based on criteria
    const query = {
      'status.isActive': true,
      isDeleted: false
    };
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const questions = await Question.find(query)
      .sort({ 'statistics.totalAttempts': -1 })
      .limit(parseInt(questionCount))
      .select('title content difficulty type interview metadata');
    
    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for the specified criteria'
      });
    }
    
    // Create interview session
    const interviewId = new mongoose.Types.ObjectId();
    
    res.json({
      success: true,
      data: {
        interviewId: interviewId.toString(),
        questions: questions.map(q => ({
          id: q._id.toString(),
          question: q.content,
          type: q.type,
          expectedDuration: q.interview?.expectedDuration || 300
        })),
        currentQuestionIndex: 0
      }
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview'
    });
  }
});

// ==================== AI INTERVIEW ENDPOINTS ====================

// Start AI interview session
router.post('/ai/start', auth, interviewController.startAIInterview);

// Get interview details
router.get('/:interviewId', auth, interviewController.getInterview);

// Submit AI interview response with audio/video upload
router.post('/ai/:interviewId/submit/:questionIndex', 
  auth, 
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  interviewController.submitAIResponse
);

// Submit follow-up question response
router.post('/ai/:interviewId/submit-followup/:questionIndex/:followUpIndex',
  auth,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]),
  interviewController.submitFollowUpResponse
);

// Generate comprehensive AI assessment
router.post('/ai/:interviewId/assessment', auth, interviewController.generateAIAssessment);

// Real-time face monitoring
router.post('/ai/:interviewId/monitor',
  auth,
  upload.single('image'),
  interviewController.monitorFaceDetection
);

// Validate camera setup
router.post('/ai/validate-camera', auth, interviewController.validateCameraSetup);

// Get AI interview questions
router.get('/ai/questions', interviewController.getAIInterviewQuestions);

// Get AI interview report
router.get('/ai/:interviewId/report', auth, interviewController.getAIInterviewReport);

// Get detailed interview report with all questions and responses
router.get('/ai/:interviewId/detailed-report', auth, interviewController.getDetailedInterviewReport);

// AI response analysis endpoint
router.post('/ai/analyze-response', auth, async (req, res) => {
  try {
    const { transcription, question, questionType } = req.body;
    
    if (!transcription) {
      return res.status(400).json({
        success: false,
        message: 'Transcription is required'
      });
    }
    
    // Use AI service for proper analysis
    const analysisResult = await aiServices.analyzeResponse(transcription, question, questionType);
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze response'
    });
  }
});

// Helper functions for analysis
function extractKeywords(text) {
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
  const words = text.toLowerCase().split(/\W+/).filter(word => 
    word.length > 3 && !commonWords.includes(word)
  );
  
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function generateSuggestions(text, questionType) {
  const suggestions = [];
  const wordCount = text.split(' ').length;
  
  if (wordCount < 20) {
    suggestions.push('Provide more detailed responses with specific examples');
  }
  
  if (!text.toLowerCase().includes('example') && questionType === 'behavioral') {
    suggestions.push('Include specific examples from your experience');
  }
  
  if (!text.toLowerCase().includes('result') && questionType === 'behavioral') {
    suggestions.push('Mention the outcomes and results of your actions');
  }
  
  if (text.split(/[.!?]+/).length < 3) {
    suggestions.push('Structure your response with clear beginning, middle, and end');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Great response! Consider adding quantifiable metrics where possible');
  }
  
  return suggestions.slice(0, 3);
}

// Text-to-speech endpoint
router.post('/ai/text-to-speech', auth, interviewController.generateTextToSpeech);

// Get user statistics
router.get('/user/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's interview history
    const interviews = await mongoose.model('Interview').find({ 
      userId: userId,
      isDeleted: false 
    }).select('score status completedAt');
    
    // Calculate statistics
    const totalPractice = interviews.length;
    const mockInterviews = interviews.filter(i => i.status === 'completed').length;
    const averageScore = totalPractice > 0 
      ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / totalPractice)
      : 0;
    
    // Calculate streak (consecutive days with practice)
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentInterviews = interviews.filter(i => 
      i.completedAt && new Date(i.completedAt) >= lastWeek
    );
    const streak = recentInterviews.length;
    
    // Default values
    const weeklyGoal = 5;
    const weeklyProgress = Math.min(streak, weeklyGoal);
    
    // Analyze strong areas and improvement areas based on scores
    const scoredInterviews = interviews.filter(i => i.score !== undefined && i.score !== null);
    const strongAreas = scoredInterviews.length > 0 ? ['Communication', 'Problem Solving'] : [];
    const improvementAreas = scoredInterviews.length > 0 ? ['Technical Depth', 'Time Management'] : [];
    
    res.json({
      success: true,
      data: {
        totalPractice,
        mockInterviews,
        averageScore,
        streak,
        weeklyGoal,
        weeklyProgress,
        strongAreas,
        improvementAreas
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// Get user's recent activity
router.get('/user/recent-activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get recent interviews
    const recentInterviews = await mongoose.model('Interview').find({ 
      userId: userId,
      isDeleted: false,
      status: 'completed'
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .select('score completedAt category');
    
    // Transform to activity format
    const activities = recentInterviews.map(interview => ({
      type: 'mock',
      title: `${interview.category || 'Interview'} Practice`,
      score: interview.score || 0,
      time: '2-5 min',
      date: interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'Unknown'
    }));
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

module.exports = router; 