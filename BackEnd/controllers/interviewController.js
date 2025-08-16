const Interview = require('../models/Interview');
const Question = require('../models/Question');
const User = require('../models/User');
const Session = require('../models/Session');
const Analytics = require('../models/Analytics');
const InterviewCategory = require('../models/InterviewCategory');
const aiServices = require('../services/aiServices');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Generate follow-up questions based on response
// Remove hardcoded follow-up generation - will use aiServices instead

// ==================== NEW AI-POWERED INTERVIEW ENDPOINTS ====================

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    console.log('📁 File upload attempt:', {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    
    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/ogg'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.fieldname === 'audio') {
      if (allowedAudioTypes.includes(file.mimetype)) {
        console.log('✅ Audio file accepted:', file.mimetype);
        cb(null, true);
      } else {
        console.log('❌ Audio file rejected:', file.mimetype);
        // For testing, accept any audio file
        console.log('🔄 Accepting audio file for testing');
        cb(null, true);
      }
    } else if (file.fieldname === 'image') {
      if (allowedImageTypes.includes(file.mimetype)) {
        console.log('✅ Image file accepted:', file.mimetype);
        cb(null, true);
      } else {
        console.log('❌ Image file rejected:', file.mimetype);
        cb(new Error('Invalid image file type'), false);
      }
    } else {
      console.log('❌ Unknown fieldname:', file.fieldname);
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Start AI-powered interview session
const startAIInterview = async (req, res) => {
  try {
    const { categoryId, questionCount = 5 } = req.body;
    console.log('🚀 Starting AI interview with:', { categoryId, questionCount });
    console.log('👤 User from request:', req.user);
    
    // Require authenticated user
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    console.log('👤 Using user ID:', userId);

    // Get category
    const category = await InterviewCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Interview category not found'
      });
    }

    console.log('📋 Category found:', {
      id: category._id,
      name: category.name,
      displayName: category.displayName,
      type: category.type
    });

    // Get questions for this category - handle both old (string) and new (ObjectId) formats
    const questions = await Question.find({
      $or: [
        { category: category.name }, // Old format: string category name
        { category: category._id }   // New format: ObjectId reference
      ],
      'status.isActive': true
    }).limit(questionCount);

    console.log('🔍 Looking for questions with category:', category.name);
    console.log('🔍 Found questions:', questions.length);

    if (questions.length === 0) {
      // Debug: Check what questions exist in the database
      const allQuestions = await Question.find({ 'status.isActive': true }).select('category type title');
      console.log('🔍 All active questions in database:', allQuestions.map(q => ({ category: q.category, type: q.type, title: q.title })));
      
      return res.status(404).json({
        success: false,
        message: 'No questions found for this category'
      });
    }

    // Create interview session
    const interview = new Interview({
      user: userId,
      category: categoryId,
      title: `${category.displayName} Interview`,
      type: category.type,
      questions: questions.map(q => ({
        questionId: q._id,
        question: q.content,
        type: q.type,
        response: {
          isAnswered: false
        },
        followUpQuestions: [],
        followUpResponses: [],
        aiAssessment: {
          scores: {},
          suggestions: [],
          analysis: '',
          feedback: '',
          confidence: 0
        }
      })),
      status: {
        current: 'in_progress',
        isActive: true,
        currentQuestionIndex: 0
      }
    });

    await interview.save();

    res.json({
      success: true,
      data: {
        interviewId: interview._id,
        questions: interview.questions.map(q => ({
          id: q._id,
          question: q.question,
          type: q.type,
          expectedDuration: 300
        })),
        currentQuestionIndex: 0,
        category: {
          id: category._id,
          name: category.displayName,
          type: category.type
        }
      }
    });

  } catch (error) {
    console.error('Start AI interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start AI interview',
      error: error.message
    });
  }
};

// Get interview details
const getInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    // Require authenticated user
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;

    const interview = await Interview.findById(interviewId)
      .populate('category', 'displayName type icon')
      .populate('user', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check if user has access to this interview
    if (interview.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        interviewId: interview._id,
        questions: interview.questions.map(q => ({
          id: q._id,
          question: q.question,
          type: q.type,
          expectedDuration: 300,
          response: q.response || null,
          aiAssessment: q.aiAssessment || null,
          followUpQuestions: q.followUpQuestions || null
        })),
        currentQuestionIndex: interview.status.currentQuestionIndex,
        category: {
          id: interview.category._id,
          name: interview.category.displayName,
          type: interview.category.type
        },
        status: interview.status.current,
        title: interview.title
      }
    });

  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit response with AI processing
const submitAIResponse = async (req, res) => {
  try {
    console.log('📥 Submit AI response request received:', {
      interviewId: req.params.interviewId,
      questionIndex: req.params.questionIndex,
      params: req.params,
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'No files'
    });
    
    const interviewId = req.params.interviewId;
    const questionIndex = parseInt(req.params.questionIndex);
    const { textResponse } = req.body;
    
    console.log('🔍 Extracted params:', { interviewId, questionIndex, textResponse });
    console.log('🔍 Raw req.params:', req.params);
    
    console.log('🔍 Looking for interview with ID:', interviewId);
    console.log('🔍 ID type:', typeof interviewId);
    console.log('🔍 Is valid ObjectId:', mongoose.Types.ObjectId.isValid(interviewId));
    console.log('🔍 Database name:', mongoose.connection.db.databaseName);
    
    const interview = await Interview.findById(interviewId);
    console.log('🔍 Interview found:', interview ? 'Yes' : 'No');
    if (interview) {
      console.log('🔍 Interview details:', {
        id: interview._id,
        user: interview.user,
        title: interview.title,
        questionsCount: interview.questions.length
      });
    } else {
      // Try to find all interviews to see what's in the database
      const allInterviews = await Interview.find().limit(5);
      console.log('🔍 All interviews in DB:', allInterviews.map(i => ({ id: i._id, title: i.title })));
    }
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Require authenticated user
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;
    
    if (interview.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('🔍 Question index:', questionIndex, 'Type:', typeof questionIndex);
    console.log('🔍 Questions array length:', interview.questions.length);
    console.log('🔍 Questions array:', interview.questions.map((q, i) => ({ index: i, question: q.question.substring(0, 30) + '...' })));
    
    const question = interview.questions[questionIndex];
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }

    // Process uploaded files
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];
    
    // Debug file upload details
    if (audioFile) {
      console.log('📁 Audio file details:', {
        originalname: audioFile.originalname,
        filename: audioFile.filename,
        mimetype: audioFile.mimetype,
        size: audioFile.size,
        path: audioFile.path
      });
    } else {
      console.log('⚠️ No audio file received');
    }
    
    let transcriptionResult = null;
    let faceDetectionResult = null;
    let objectDetectionResult = null;
    let followUpQuestions = [];
    
    try {
      // Process audio transcription
      if (audioFile) {
        console.log('Processing audio transcription...');
        try {
          transcriptionResult = await aiServices.transcribeAudio(audioFile.path);
          
          // Generate follow-up questions based on response using OpenAI
          console.log('Generating follow-up questions with OpenAI...');
          try {
            const followUpResult = await aiServices.generateFollowUpQuestions(
              transcriptionResult.transcription,
              question.question,
              question.type
            );
            followUpQuestions = followUpResult.questions;
            console.log('✅ OpenAI follow-up questions generated:', followUpQuestions);
          } catch (followUpError) {
            console.error('❌ OpenAI follow-up generation failed:', followUpError.message);
            // Fallback to basic follow-up questions
            followUpQuestions = [
              "Can you provide more specific details about your role in this project?",
              "What specific steps did you take to overcome this challenge?"
            ];
          }
        } catch (transcriptionError) {
          console.error('Transcription failed, using fallback:', transcriptionError.message);
          // Use text response as fallback transcription
          transcriptionResult = {
            transcription: textResponse || 'Audio recording provided but transcription failed',
            confidence: 0.5,
            duration: 120
          };
          followUpQuestions = [];
        }
      }
      
      // Process face detection for security
      if (imageFile) {
        console.log('Processing face detection...');
        try {
          faceDetectionResult = await aiServices.detectFacesInImage(imageFile.path);
          objectDetectionResult = await aiServices.detectObjectsInImage(imageFile.path);
        } catch (detectionError) {
          console.error('Face detection failed, using fallback:', detectionError.message);
          faceDetectionResult = { faceCount: 1, violations: [] };
          objectDetectionResult = { violations: [] };
        }
      }
      
    } catch (aiError) {
      console.error('AI processing error:', aiError);
      // Don't throw error, use fallbacks instead
      transcriptionResult = {
        transcription: textResponse || 'Audio processing failed',
        confidence: 0.5,
        duration: 120
      };
      followUpQuestions = [];
      faceDetectionResult = { faceCount: 1, violations: [] };
      objectDetectionResult = { violations: [] };
    }

    // Update interview response
    question.response = {
      textAnswer: textResponse,
      audioUrl: audioFile ? `/uploads/${audioFile.filename}` : null,
      transcription: transcriptionResult?.transcription || textResponse,
      confidence: transcriptionResult?.confidence || 0.8,
      startTime: new Date(Date.now() - (transcriptionResult?.duration || 120) * 1000),
      endTime: new Date(),
      duration: transcriptionResult?.duration || 120,
      attemptCount: 1,
      isSkipped: false,
      isAnswered: true
    };

    // Generate AI analysis and follow-up questions based on the response using OpenAI
    const response_text = transcriptionResult?.transcription || textResponse;
    let aiAnalysis = null;
    
    if (response_text && response_text.length > 10) {
      try {
        // Generate comprehensive AI analysis
        aiAnalysis = await aiServices.analyzeResponse(
          response_text,
          question.question,
          question.type
        );
        console.log('✅ AI analysis generated:', aiAnalysis);
        
        // Only generate follow-up questions if they don't already exist for this question
        if (!question.aiAssessment?.followUpQuestions || question.aiAssessment.followUpQuestions.length === 0) {
          const followUpResult = await aiServices.generateFollowUpQuestions(
            response_text,
            question.question,
            question.type
          );
          followUpQuestions = followUpResult.questions;
          console.log('✅ OpenAI follow-up questions generated from response:', followUpQuestions);
        } else {
          // Use existing follow-up questions
          followUpQuestions = question.aiAssessment.followUpQuestions;
          console.log('✅ Using existing follow-up questions:', followUpQuestions);
        }
      } catch (aiError) {
        console.error('❌ AI analysis failed:', aiError.message);
        // Fallback to basic follow-up questions only if none exist
        if (!question.aiAssessment?.followUpQuestions || question.aiAssessment.followUpQuestions.length === 0) {
          followUpQuestions = [
            "Can you provide more specific details about your role in this project?",
            "What specific steps did you take to overcome this challenge?"
          ];
        } else {
          followUpQuestions = question.aiAssessment.followUpQuestions;
        }
      }
    }

    // Store follow-up questions in the correct location according to schema
    question.followUpQuestions = followUpQuestions;
    
    // Add AI assessment
    question.aiAssessment = {
      audioAnalysis: {
        transcription: transcriptionResult?.transcription || textResponse,
        confidence: transcriptionResult?.confidence || 0.8,
        sentiment: 'neutral',
        speechMetrics: {
          wordsPerMinute: transcriptionResult ? Math.round((transcriptionResult.transcription.split(' ').length / transcriptionResult.duration) * 60) : 0,
          fluencyScore: transcriptionResult?.confidence || 0.8,
          clarityScore: transcriptionResult?.confidence || 0.8
        }
      },
      securityAnalysis: {
        faceDetection: faceDetectionResult,
        objectDetection: objectDetectionResult,
        violations: [
          ...(faceDetectionResult?.violations || []),
          ...(objectDetectionResult?.violations || [])
        ]
      },
      // Store the AI analysis data
      scores: aiAnalysis?.scores || null,
      analysis: aiAnalysis?.analysis || null,
      suggestions: aiAnalysis?.suggestions || null,
      keywords: aiAnalysis?.keywords || null,
      confidence: aiAnalysis?.confidence || 0.8,
      responseMetrics: aiAnalysis?.responseMetrics || null
    };

    console.log('🔍 About to save interview with follow-up questions:', followUpQuestions);
    console.log('🔍 Question aiAssessment before save:', question.aiAssessment);
    await interview.save();
    console.log('🔍 Interview saved successfully');

    // Clean up uploaded files after processing
    const tempFiles = [];
    if (audioFile) tempFiles.push(audioFile.path);
    if (imageFile) tempFiles.push(imageFile.path);
    
    setTimeout(() => {
      aiServices.cleanupTempFiles(tempFiles);
    }, 5000); // Clean up after 5 seconds

    res.json({
      success: true,
      data: {
        transcription: transcriptionResult?.transcription,
        confidence: transcriptionResult?.confidence,
        followUpQuestions: followUpQuestions,
        aiAnalysis: aiAnalysis, // Include AI analysis in response
        securityStatus: {
          faceCount: faceDetectionResult?.faceCount || 1,
          violations: question.aiAssessment?.securityAnalysis?.violations || [],
          isSecure: !(question.aiAssessment?.securityAnalysis?.violations || []).some(v => v.severity === 'high')
        },
        nextQuestionIndex: questionIndex + 1 < interview.questions.length ? questionIndex + 1 : null
      }
    });

  } catch (error) {
    console.error('Submit AI response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process response',
      error: error.message
    });
  }
};

// Generate comprehensive AI assessment
const generateAIAssessment = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Temporarily disable user check for testing
    // if (interview.user.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied'
    //   });
    // }

    // Prepare comprehensive data for AI assessment
    const interviewData = {
      type: interview.type,
      duration: Math.round((new Date() - interview.startTime) / 1000),
      questions: interview.questions.map(q => ({
        question: q.question,
        type: q.type,
        expectedDuration: q.expectedDuration,
        aiAssessment: q.aiAssessment || null // Include individual AI assessments
      })),
      responses: interview.questions.map(q => ({
        transcription: q.response?.transcription || q.response?.textAnswer || '',
        confidence: q.response?.confidence || 0.8,
        duration: q.response?.duration || 120,
        violations: q.aiAssessment?.securityAnalysis?.violations || [],
        individualScores: q.aiAssessment?.scores || null // Include individual scores
      }))
    };

    console.log('Generating comprehensive AI assessment...');
    const assessment = await aiServices.generateInterviewAssessment(interviewData);

    // Calculate metrics based on actual responses and AI assessments
    const responses = interview.questions.map(q => q.response?.transcription || q.response?.textAnswer || '');
    const avgWordCount = responses.reduce((sum, r) => sum + (r.split(' ').length), 0) / responses.length;
    const totalViolations = interviewData.responses.reduce((sum, r) => 
      sum + (r.violations.filter(v => v.severity === 'high').length), 0
    );
    
    const avgConfidence = interviewData.responses.reduce((sum, r) => sum + r.confidence, 0) / 
                          interviewData.responses.length;

    // Collect all scores from main questions and follow-up questions
    let allScores = [];
    
    // Add scores from main questions
    interview.questions.forEach(q => {
      if (q.aiAssessment?.scores) {
        allScores.push({
          communication: q.aiAssessment.scores.clarity || 0,
          technical: q.aiAssessment.scores.depth || 0,
          problemSolving: q.aiAssessment.scores.structure || 0,
          confidence: q.aiAssessment.scores.relevance || 0
        });
      }
      
      // Add scores from follow-up questions
      if (q.aiAssessment?.followUpAnalyses) {
        q.aiAssessment.followUpAnalyses.forEach(followUpAnalysis => {
          if (followUpAnalysis?.scores) {
            allScores.push({
              communication: followUpAnalysis.scores.clarity || 0,
              technical: followUpAnalysis.scores.depth || 0,
              problemSolving: followUpAnalysis.scores.structure || 0,
              confidence: followUpAnalysis.scores.relevance || 0
            });
          }
        });
      }
    });

    console.log('🔍 All collected scores:', allScores);

    let communicationScore, technicalScore, problemSolvingScore, confidenceScore;

    if (allScores.length > 0) {
      // Calculate average scores
      const avgScores = allScores.reduce((acc, scores) => {
        acc.communication += scores.communication || 0;
        acc.technical += scores.technical || 0;
        acc.problemSolving += scores.problemSolving || 0;
        acc.confidence += scores.confidence || 0;
        return acc;
      }, { communication: 0, technical: 0, problemSolving: 0, confidence: 0 });

      const count = allScores.length;
      communicationScore = Math.round(avgScores.communication / count);
      technicalScore = Math.round(avgScores.technical / count);
      problemSolvingScore = Math.round(avgScores.problemSolving / count);
      confidenceScore = Math.round(avgScores.confidence / count);
      
      console.log('🔍 Calculated average scores:', {
        communication: communicationScore,
        technical: technicalScore,
        problemSolving: problemSolvingScore,
        confidence: confidenceScore
      });
    } else {
      // Fallback to AI-generated scores from comprehensive assessment
      communicationScore = assessment.breakdown?.communication || 70;
      technicalScore = assessment.breakdown?.technical || 70;
      problemSolvingScore = assessment.breakdown?.problemSolving || 70;
      confidenceScore = assessment.breakdown?.confidence || 70;
      
      console.log('🔍 Using fallback scores:', {
        communication: communicationScore,
        technical: technicalScore,
        problemSolving: problemSolvingScore,
        confidence: confidenceScore
      });
    }

    // Apply penalties for violations
    if (totalViolations > 0) {
      const violationPenalty = Math.min(20, totalViolations * 5); // Max 20% penalty
      communicationScore = Math.max(0, communicationScore - violationPenalty);
      confidenceScore = Math.max(0, confidenceScore - violationPenalty);
    }

    // Calculate overall score with weighted components
    const overallScore = Math.round(
      (communicationScore * 0.3) + 
      (technicalScore * 0.3) + 
      (problemSolvingScore * 0.25) + 
      (confidenceScore * 0.15)
    );

    // Update assessment with calculated scores
    assessment.overallScore = overallScore;
    assessment.breakdown = {
      communication: communicationScore,
      technical: technicalScore,
      problemSolving: problemSolvingScore,
      confidence: confidenceScore
    };

    // Update interview with final assessment
    interview.finalAssessment = {
      overallScore: assessment.overallScore,
      breakdown: assessment.breakdown,
      strengths: assessment.strengths,
      improvements: assessment.improvements,
      recommendations: assessment.recommendations,
      feedback: assessment.feedback,
      metrics: {
        averageConfidence: Math.round(avgConfidence * 100),
        totalViolations: totalViolations,
        completionRate: Math.round((interview.questions.filter(q => q.response?.isAnswered).length / interview.questions.length) * 100),
        averageWordCount: Math.round(avgWordCount),
        questionsWithAI: allScores.length,
        totalQuestions: interview.questions.length,
        totalResponses: allScores.length // Include follow-up responses
      },
      generatedAt: new Date()
    };

    interview.status.current = 'completed';
    interview.endTime = new Date();
    
    await interview.save();

    res.json({
      success: true,
      data: {
        assessment: interview.finalAssessment,
        interviewStats: {
          duration: interview.finalAssessment.metrics,
          questionsAnswered: interview.questions.filter(q => q.response?.isAnswered).length,
          totalQuestions: interview.questions.length
        }
      }
    });

  } catch (error) {
    console.error('Generate AI assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate assessment',
      error: error.message
    });
  }
};

// Submit follow-up question response
const submitFollowUpResponse = async (req, res) => {
  try {
    const { interviewId, questionIndex, followUpIndex } = req.params;
    const { textResponse } = req.body;
    const audioFile = req.files?.audio?.[0];
    const imageFile = req.files?.image?.[0];

    console.log('📥 Submit follow-up response request received:', {
      interviewId,
      questionIndex,
      followUpIndex,
      params: req.params,
      body: req.body,
      files: Object.keys(req.files || {})
    });

    // Extract and validate parameters
    const extractedParams = {
      interviewId: interviewId,
      questionIndex: parseInt(questionIndex),
      followUpIndex: parseInt(followUpIndex),
      textResponse: textResponse || ''
    };

    console.log('🔍 Extracted params:', extractedParams);
    console.log('🔍 Raw req.params:', req.params);

    // Validate interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    console.log('🔍 Interview found:', {
      id: interview._id,
      user: interview.user,
      title: interview.title,
      questionsCount: interview.questionsCount
    });

    // Validate question index
    if (extractedParams.questionIndex < 0 || extractedParams.questionIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question index'
      });
    }

    // Get the question
    const question = interview.questions[extractedParams.questionIndex];
    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    console.log('🔍 Question found:', {
      question: question.question,
      hasAiAssessment: !!question.aiAssessment,
      aiAssessment: question.aiAssessment
    });

    // Validate follow-up index
    if (!question.followUpQuestions || 
        extractedParams.followUpIndex < 0 || 
        extractedParams.followUpIndex >= question.followUpQuestions.length) {
      console.log('🔍 Follow-up validation failed:', {
        hasFollowUpQuestions: !!question.followUpQuestions,
        followUpQuestionsLength: question.followUpQuestions?.length || 0,
        requestedIndex: extractedParams.followUpIndex,
        questionIndex: extractedParams.questionIndex,
        question: question.question,
        followUpQuestions: question.followUpQuestions
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid follow-up question index'
      });
    }

    // Get the follow-up question
    const followUpQuestion = question.followUpQuestions[extractedParams.followUpIndex];
    console.log('🔍 Follow-up question found:', followUpQuestion);
    console.log('🔍 All follow-up questions for this question:', question.followUpQuestions);

    // Process audio transcription if provided
    let transcriptionResult = null;
    if (audioFile) {
      console.log('Processing audio transcription for follow-up...');
      try {
        transcriptionResult = await aiServices.transcribeAudio(audioFile.path);
      } catch (aiError) {
        console.error('Transcription error:', aiError);
        throw new Error(`Transcription failed: ${aiError.message}`);
      }
    }

    // Process face detection for security
    let faceDetectionResult = null;
    let objectDetectionResult = null;
    if (imageFile) {
      console.log('Processing face detection for follow-up...');
      faceDetectionResult = await aiServices.detectFacesInImage(imageFile.path);
      objectDetectionResult = await aiServices.detectObjectsInImage(imageFile.path);
    }

    // Store follow-up response
    if (!question.followUpResponses) {
      question.followUpResponses = [];
    }

    question.followUpResponses[extractedParams.followUpIndex] = {
      question: followUpQuestion,
      transcription: transcriptionResult?.transcription || textResponse,
      confidence: transcriptionResult?.confidence || 0.8,
      duration: transcriptionResult?.duration || 120,
      isAnswered: true
    };

    // Generate AI analysis for follow-up response
    let aiAnalysis = null;
    const response_text = transcriptionResult?.transcription || textResponse;
    
    if (response_text && response_text.length > 10) {
      try {
        aiAnalysis = await aiServices.analyzeResponse(
          response_text,
          followUpQuestion,
          question.type
        );
        console.log('✅ Follow-up AI analysis generated:', aiAnalysis);
      } catch (aiError) {
        console.error('❌ Follow-up AI analysis failed:', aiError.message);
      }
    }

    // Store follow-up AI analysis in the question's aiAssessment
    if (aiAnalysis) {
      if (!question.aiAssessment.followUpAnalyses) {
        question.aiAssessment.followUpAnalyses = [];
      }
      question.aiAssessment.followUpAnalyses[extractedParams.followUpIndex] = aiAnalysis;
    }

    // Update security analysis
    if (!question.aiAssessment.securityAnalysis) {
      question.aiAssessment.securityAnalysis = {};
    }

    question.aiAssessment.securityAnalysis.violations = [
      ...(faceDetectionResult?.violations || []),
      ...(objectDetectionResult?.violations || [])
    ];

    await interview.save();

    // Clean up uploaded files after processing
    const tempFiles = [];
    if (audioFile) tempFiles.push(audioFile.path);
    if (imageFile) tempFiles.push(imageFile.path);
    
    setTimeout(() => {
      aiServices.cleanupTempFiles(tempFiles);
    }, 5000);

    res.json({
      success: true,
      data: {
        transcription: transcriptionResult?.transcription,
        confidence: transcriptionResult?.confidence,
        aiAnalysis: aiAnalysis, // Include AI analysis in follow-up response
        securityStatus: {
          faceCount: faceDetectionResult?.faceCount || 1,
          violations: question.aiAssessment?.securityAnalysis?.violations || [],
          isSecure: !(question.aiAssessment?.securityAnalysis?.violations || []).some(v => v.severity === 'high')
        },
        nextQuestionIndex: extractedParams.followUpIndex + 1 >= question.followUpQuestions.length 
          ? (extractedParams.questionIndex + 1 < interview.questions.length ? extractedParams.questionIndex + 1 : null)
          : null
      }
    });

  } catch (error) {
    console.error('Submit follow-up response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process follow-up response',
      error: error.message
    });
  }
};

// Real-time face monitoring endpoint
const monitorFaceDetection = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview || interview.user.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found or access denied'
      });
    }

    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Process face detection
    const faceDetectionResult = await aiServices.detectFacesInImage(imageFile.path);
    const objectDetectionResult = await aiServices.detectObjectsInImage(imageFile.path);
    
    const allViolations = [
      ...(faceDetectionResult.violations || []),
      ...(objectDetectionResult.violations || [])
    ];
    
    const highSeverityViolations = allViolations.filter(v => v.severity === 'high');
    
    // Update violation count in interview
    if (highSeverityViolations.length > 0) {
      interview.violationCount = (interview.violationCount || 0) + highSeverityViolations.length;
      
      // Add violation record
      interview.violations = interview.violations || [];
      interview.violations.push({
        timestamp: new Date(),
        type: 'security_violation',
        details: highSeverityViolations,
        severity: 'high'
      });
      
      await interview.save();
    }

    // Clean up temp file
    setTimeout(() => {
      aiServices.cleanupTempFiles([imageFile.path]);
    }, 1000);

    res.json({
      success: true,
      data: {
        faceCount: faceDetectionResult.faceCount,
        violations: allViolations,
        isSecure: highSeverityViolations.length === 0,
        shouldPauseInterview: interview.violationCount >= interview.configuration.proctoring.maxViolations,
        violationCount: interview.violationCount || 0,
        maxViolations: interview.configuration.proctoring.maxViolations
      }
    });

  } catch (error) {
    console.error('Face monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Face detection failed',
      error: error.message
    });
  }
};

// Validate camera setup
const validateCameraSetup = async (req, res) => {
  try {
    const { videoDevices } = req.body;
    
    if (!videoDevices || !Array.isArray(videoDevices)) {
      return res.status(400).json({
        success: false,
        message: 'Video devices array is required'
      });
    }

    const validation = await aiServices.validateCameraSetup(videoDevices);
    
    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        violations: validation.violations,
        recommendedDevice: validation.recommendedDevice,
        message: validation.isValid ? 
          'Camera setup is valid' : 
          'Issues detected with camera setup'
      }
    });

  } catch (error) {
    console.error('Camera validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Camera validation failed',
      error: error.message
    });
  }
};

// Get interview questions for AI interview
const getAIInterviewQuestions = async (req, res) => {
  try {
    const { type = 'behavioral', difficulty = 'medium', count = 5 } = req.query;
    
    const query = {
      'interview.isVoiceBased': true
    };
    
    if (type !== 'mixed') {
      query.type = type;
    }
    
    if (difficulty !== 'mixed') {
      query.difficulty = difficulty;
    }

    const questions = await Question.find(query)
      .select('title content type category difficulty interview.expectedDuration interview.followUpQuestions')
      .limit(parseInt(count));

    res.json({
      success: true,
      data: {
        questions: questions.map(q => ({
          id: q._id,
          title: q.title,
          content: q.content,
          type: q.type,
          category: q.category,
          difficulty: q.difficulty,
          expectedDuration: q.interview?.expectedDuration || 300,
          followUpQuestions: q.interview?.followUpQuestions || []
        })),
        total: questions.length
      }
    });

  } catch (error) {
    console.error('Get AI interview questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

// Get detailed interview report with all questions, responses, and AI assessments
const getDetailedInterviewReport = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId)
      .populate('user', 'name email');
      
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Temporarily disable user check for testing
    // if (interview.user._id.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied'
    //   });
    // }

    const detailedReport = {
      interviewId: interview._id,
      candidate: {
        name: interview.user?.name || 'Test User',
        email: interview.user?.email || 'test@example.com'
      },
      interviewDetails: {
        title: interview.title,
        type: interview.type,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.endTime ? 
          Math.round((interview.endTime - interview.startTime) / 1000) : null,
        status: interview.status,
        category: interview.category
      },
      finalAssessment: interview.finalAssessment,
      questions: interview.questions.map((q, index) => ({
        questionIndex: index + 1,
        question: q.question,
        type: q.type,
        category: q.category,
        expectedDuration: q.expectedDuration,
        response: {
          transcription: q.response?.transcription || '',
          confidence: q.response?.confidence || 0,
          duration: q.response?.duration || 0,
          isAnswered: q.response?.isAnswered || false,
          startTime: q.response?.startTime,
          endTime: q.response?.endTime
        },
        aiAssessment: {
          scores: q.aiAssessment?.scores || null,
          analysis: q.aiAssessment?.analysis || '',
          suggestions: q.aiAssessment?.suggestions || [],
          keywords: q.aiAssessment?.keywords || [],
          confidence: q.aiAssessment?.confidence || 0,
          responseMetrics: q.aiAssessment?.responseMetrics || null,
          securityAnalysis: q.aiAssessment?.securityAnalysis || null
        },
        followUpQuestions: q.followUpQuestions || [],
        followUpResponses: q.followUpResponses?.map((followUp, followUpIndex) => ({
          followUpIndex: followUpIndex + 1,
          question: followUp.question,
          transcription: followUp.transcription || '',
          confidence: followUp.confidence || 0,
          duration: followUp.duration || 0,
          isAnswered: followUp.isAnswered || false
        })) || [],
        followUpAnalyses: q.aiAssessment?.followUpAnalyses?.map((analysis, analysisIndex) => ({
          followUpIndex: analysisIndex + 1,
          scores: analysis.scores || null,
          analysis: analysis.analysis || '',
          suggestions: analysis.suggestions || [],
          keywords: analysis.keywords || [],
          confidence: analysis.confidence || 0,
          responseMetrics: analysis.responseMetrics || null
        })) || []
      })),
      metrics: {
        totalQuestions: interview.questions.length,
        answeredQuestions: interview.questions.filter(q => q.response?.isAnswered).length,
        totalFollowUps: interview.questions.reduce((sum, q) => sum + (q.followUpQuestions?.length || 0), 0),
        answeredFollowUps: interview.questions.reduce((sum, q) => 
          sum + (q.followUpResponses?.filter(f => f.isAnswered).length || 0), 0
        ),
        averageConfidence: interview.questions.reduce((sum, q) => 
          sum + (q.response?.confidence || 0), 0
        ) / Math.max(interview.questions.length, 1),
        totalDuration: interview.questions.reduce((sum, q) => 
          sum + (q.response?.duration || 0), 0
        )
      }
    };

    res.json({
      success: true,
      data: detailedReport
    });

  } catch (error) {
    console.error('Get detailed interview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate detailed report',
      error: error.message
    });
  }
};

// Get user's interview history
const getUserInterviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      type = ''
    } = req.query;

    // Require authenticated user
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user.id;

    // Build query for fetching interviews (include all for display)
    const query = { user: userId };
    if (status) query['status.current'] = status;
    if (type) query.type = type;

    // Build query for counting total (only completed interviews)
    const countQuery = { user: userId };
    if (type) countQuery.type = type;
    // Always filter for completed interviews when counting
    countQuery['status.current'] = 'completed';

    // Get interviews
    const interviews = await Interview.find(query)
      .populate('category', 'displayName type icon')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('title type category startTime endTime status finalAssessment');

    const total = await Interview.countDocuments(countQuery);

    // Calculate user statistics
    const userStats = await Interview.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalInterviews: { $sum: 1 },
          completedInterviews: { $sum: { $cond: [{ $eq: ['$status.current', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$finalAssessment.overallScore' },
          totalTime: { $sum: { $subtract: ['$endTime', '$startTime'] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        interviews,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: interviews.length,
          totalCount: total
        },
        userStats: userStats[0] || {
          totalInterviews: 0,
          completedInterviews: 0,
          averageScore: 0,
          totalTime: 0
        }
      }
    });

  } catch (error) {
    console.error('Get user interviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get interview report with AI insights
const getAIInterviewReport = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId)
      .populate('user', 'name email')
      .populate('questions.questionId', 'title category type');
      
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const report = {
      interviewId: interview._id,
      candidate: {
        name: interview.user.name,
        email: interview.user.email
      },
      interviewDetails: {
        type: interview.type,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.endTime ? 
          Math.round((interview.endTime - interview.startTime) / 1000) : null,
        status: interview.status
      },
      assessment: interview.finalAssessment,
      questionAnalysis: interview.questions.map((q, index) => ({
        questionIndex: index + 1,
        question: q.question,
        type: q.type,
        category: q.category,
        response: {
          transcription: q.response?.transcription,
          confidence: q.response?.confidence,
          duration: q.response?.duration,
          isAnswered: q.response?.isAnswered
        },
        aiInsights: {
          followUpQuestions: q.aiAssessment?.followUpQuestions || [],
          speechMetrics: q.aiAssessment?.audioAnalysis?.speechMetrics,
          securityIssues: q.aiAssessment?.securityAnalysis?.violations || []
        }
      })),
      securitySummary: {
        totalViolations: interview.violationCount || 0,
        maxViolationsAllowed: interview.configuration?.proctoring?.maxViolations || 3,
        violationTypes: interview.violations?.map(v => v.type) || [],
        overallSecurityScore: Math.max(0, 100 - ((interview.violationCount || 0) * 20))
      }
    };

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get AI interview report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

// ==================== EXISTING CONTROLLERS (keeping original functionality) ====================

// AI Services (mock implementations - replace with actual AI services)
const aiServicesLegacy = {
  transcribeAudio: async (audioPath) => {
    // Mock implementation - replace with actual speech-to-text service
    return {
      transcription: "This is a mock transcription",
      confidence: 0.85,
      duration: 120
    };
  },
  
  analyzeEmotion: async (audioPath) => {
    // Mock implementation - replace with actual emotion analysis
    return {
      dominant: 'neutral',
      scores: {
        joy: 0.2,
        sadness: 0.1,
        anger: 0.05,
        fear: 0.1,
        surprise: 0.15,
        neutral: 0.4
      }
    };
  },
  
  analyzeSpeech: async (audioPath) => {
    // Mock implementation - replace with actual speech analysis
    return {
      wordsPerMinute: 150,
      pauseCount: 12,
      averagePauseDuration: 1.2,
      fluencyScore: 0.8,
      clarityScore: 0.85,
      fillerWords: {
        count: 3,
        types: ['um', 'uh'],
        frequency: 0.02
      }
    };
  },
  
  analyzeContent: async (transcription, questionType) => {
    // Mock implementation - replace with actual content analysis
    return {
      relevanceScore: 75,
      completenessScore: 80,
      technicalAccuracy: 70,
      clarity: 85,
      structure: 75,
      keyPoints: ['Key point 1', 'Key point 2'],
      missingPoints: ['Missing point 1'],
      strengths: ['Good communication', 'Clear structure'],
      weaknesses: ['Could be more detailed']
    };
  },
  
  analyzeBehavioral: async (transcription, audioPath) => {
    // Mock implementation - replace with actual behavioral analysis
    return {
      confidenceLevel: 75,
      communicationSkills: 80,
      problemSolvingApproach: 70,
      leadershipIndicators: 65,
      teamworkSkills: 75,
      adaptability: 70,
      personalityTraits: [
        { trait: 'Analytical', score: 80, evidence: ['Used structured approach'] },
        { trait: 'Collaborative', score: 75, evidence: ['Mentioned teamwork'] }
      ]
    };
  },
  
  analyzeTechnical: async (transcription, codeAnswer) => {
    // Mock implementation - replace with actual technical analysis
    return {
      conceptUnderstanding: 80,
      implementationQuality: 75,
      bestPractices: 70,
      scalability: 65,
      efficiency: 75,
      errorHandling: 60,
      codeQuality: 75,
      designPatterns: ['Observer', 'Factory'],
      technicalConcepts: ['Async/Await', 'Promises'],
      improvements: ['Add error handling', 'Optimize performance']
    };
  },
  
  analyzeSystemDesign: async (transcription, diagramUrl) => {
    // Mock implementation - replace with actual system design analysis
    return {
      architecturalThinking: 75,
      scalabilityConsiderations: 70,
      designPatterns: 65,
      tradeoffAnalysis: 80,
      implementationFeasibility: 75,
      systemComponents: ['Load Balancer', 'Database', 'Cache'],
      designPrinciples: ['Separation of Concerns', 'Single Responsibility'],
      improvements: ['Consider caching strategy', 'Add monitoring']
    };
  }
};

// Create new interview
exports.createInterview = async (req, res) => {
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
      type,
      jobRole,
      department,
      experienceLevel,
      timeLimit,
      questionCount,
      difficulty,
      enableVideo,
      enableAudio,
      enableProctoring,
      companyId,
      questionIds
    } = req.body;

    let questions = [];

    if (questionIds && questionIds.length > 0) {
      // Use specific questions
      questions = await Question.find({
        _id: { $in: questionIds },
        isDeleted: false,
        'status.isActive': true,
        'status.isApproved': true
      });
    } else {
      // Auto-select questions based on criteria
      const questionFilter = {
        isDeleted: false,
        'status.isActive': true,
        'status.isApproved': true
      };

      if (type === 'behavioral') {
        questionFilter.type = 'behavioral';
      } else if (type === 'technical') {
        questionFilter.type = { $in: ['coding', 'technical'] };
      } else if (type === 'system_design') {
        questionFilter.type = 'system_design';
      } else {
        questionFilter.type = { $in: ['behavioral', 'technical', 'system_design'] };
      }

      if (difficulty) questionFilter.difficulty = difficulty;
      if (companyId) questionFilter['company.companyId'] = companyId;

      const availableQuestions = await Question.find(questionFilter);
      questions = availableQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount);
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable questions found'
      });
    }

    // Create interview
    const interview = new Interview({
      title,
      type,
      user: req.user.id,
      company: companyId,
      configuration: {
        timeLimit,
        questionCount: questions.length,
        difficulty,
        enableVideo,
        enableAudio,
        enableCoding: type === 'technical',
        aiAssessment: true,
        proctoring: {
          enabled: enableProctoring,
          strictMode: false,
          allowPause: true,
          maxViolations: 3
        }
      },
      questions: questions.map(q => ({
        questionId: q._id,
        question: q.content,
        type: q.type,
        category: q.category,
        difficulty: q.difficulty,
        expectedDuration: q.interview?.expectedDuration || 300,
        response: {
          isAnswered: false,
          isSkipped: false
        }
      })),
      metadata: {
        jobRole,
        department,
        experienceLevel,
        interviewType: 'screening',
        language: 'en'
      },
      timeline: {
        actualQuestions: questions.length
      },
      createdBy: req.user.id
    });

    await interview.save();

    // Create session
    const session = new Session({
      sessionId: `interview_${interview._id}_${Date.now()}`,
      user: req.user.id,
      sessionType: 'interview',
      details: {
        assessmentId: interview._id,
        assessmentType: 'Interview',
        companyId,
        timeLimit
      },
      proctoring: {
        isEnabled: enableProctoring,
        camera: {
          isEnabled: enableVideo,
          hasPermission: false
        },
        audio: {
          isEnabled: enableAudio,
          hasPermission: false
        }
      },
      createdBy: req.user.id
    });

    await session.save();

    // Log analytics
    await Analytics.create({
      user: req.user.id,
      type: 'interview',
      details: {
        action: 'interview_created',
        interviewId: interview._id,
        type,
        questionCount: questions.length,
        jobRole,
        department
      }
    });

    res.status(201).json({
      success: true,
      message: 'Interview created successfully',
      data: {
        interview,
        sessionId: session.sessionId
      }
    });

  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Start interview
exports.startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check access
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already started
    if (interview.status.current === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Interview already started'
      });
    }

    // Start interview
    await interview.startInterview();

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
      type: 'interview',
      details: {
        action: 'interview_started',
        interviewId: id,
        sessionId
      }
    });

    res.json({
      success: true,
      message: 'Interview started successfully',
      data: {
        interviewId: id,
        currentQuestion: interview.status.currentQuestionIndex,
        totalQuestions: interview.questions.length,
        timeLimit: interview.configuration.timeLimit,
        startTime: interview.timeline.startedAt
      }
    });

  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while starting interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current question
exports.getCurrentQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check access
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if interview is in progress
    if (interview.status.current !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Interview not in progress'
      });
    }

    const currentQuestionIndex = interview.status.currentQuestionIndex;
    if (currentQuestionIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: 'No more questions'
      });
    }

    const currentQuestion = interview.questions[currentQuestionIndex];

    res.json({
      success: true,
      data: {
        questionIndex: currentQuestionIndex,
        question: currentQuestion.question,
        type: currentQuestion.type,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        expectedDuration: currentQuestion.expectedDuration,
        totalQuestions: interview.questions.length,
        questionsRemaining: interview.questions.length - currentQuestionIndex - 1
      }
    });

  } catch (error) {
    console.error('Get current question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit answer with file upload
exports.submitAnswer = [
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'whiteboard', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { textAnswer, codeAnswer, language, sessionId } = req.body;

      const interview = await Interview.findById(id);
      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'Interview not found'
        });
      }

      // Check access
      if (interview.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if interview is in progress
      if (interview.status.current !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Interview not in progress'
        });
      }

      const currentQuestionIndex = interview.status.currentQuestionIndex;
      if (currentQuestionIndex >= interview.questions.length) {
        return res.status(400).json({
          success: false,
          message: 'No more questions'
        });
      }

      const currentQuestion = interview.questions[currentQuestionIndex];

      // Check if already answered
      if (currentQuestion.response.isAnswered) {
        return res.status(400).json({
          success: false,
          message: 'Question already answered'
        });
      }

      // Process uploaded files
      const files = req.files;
      const audioUrl = files.audio ? files.audio[0].path : null;
      const videoUrl = files.video ? files.video[0].path : null;
      const whiteboardUrl = files.whiteboard ? files.whiteboard[0].path : null;

      // Update response
      const response = {
        textAnswer,
        codeAnswer,
        language,
        audioUrl,
        videoUrl,
        whiteboardUrl,
        startTime: currentQuestion.response.startTime || new Date(),
        endTime: new Date(),
        isAnswered: true
      };

      response.duration = Math.floor((response.endTime - response.startTime) / 1000);

      // Submit answer
      await interview.answerQuestion(response);

      // Start AI assessment if enabled
      if (interview.configuration.aiAssessment) {
        // Process in background
        processAIAssessment(interview._id, currentQuestionIndex, response);
      }

      // Update session activity
      if (sessionId) {
        await Session.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              activities: {
                timestamp: new Date(),
                eventType: 'question_answer',
                questionId: currentQuestion.questionId,
                data: {
                  questionIndex: currentQuestionIndex,
                  hasAudio: !!audioUrl,
                  hasVideo: !!videoUrl,
                  hasCode: !!codeAnswer,
                  duration: response.duration
                }
              }
            },
            $inc: {
              'performance.questionsAnswered': 1
            }
          }
        );
      }

      res.json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          questionIndex: currentQuestionIndex,
          nextQuestionIndex: currentQuestionIndex + 1,
          questionsRemaining: interview.questions.length - currentQuestionIndex - 2,
          isLastQuestion: currentQuestionIndex === interview.questions.length - 1
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
  }
];

// Skip question
exports.skipQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check access
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Skip question
    await interview.skipQuestion();

    // Update session activity
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            activities: {
              timestamp: new Date(),
              eventType: 'question_skip',
              data: {
                questionIndex: interview.status.currentQuestionIndex - 1
              }
            }
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Question skipped successfully',
      data: {
        currentQuestionIndex: interview.status.currentQuestionIndex,
        questionsRemaining: interview.questions.length - interview.status.currentQuestionIndex
      }
    });

  } catch (error) {
    console.error('Skip question error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while skipping question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Complete interview
exports.completeInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check access
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Complete interview
    await interview.completeInterview();

    // Calculate overall score
    await interview.calculateOverallScore();

    // Update user analytics
    const user = await User.findById(req.user.id);
    if (user) {
      user.analytics.totalInterviews += 1;
      
      // Update average score
      const totalScore = user.analytics.averageInterviewScore * (user.analytics.totalInterviews - 1) + 
                        interview.overallAssessment.scores.overall;
      user.analytics.averageInterviewScore = totalScore / user.analytics.totalInterviews;
      
      // Update overall rating
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
          'details.isCompleted': true,
          'status.isActive': false,
          'performance.questionsCompleted': interview.timeline.questionsCompleted
        }
      );
    }

    // Log analytics
    await Analytics.create({
      user: req.user.id,
      type: 'interview',
      details: {
        action: 'interview_completed',
        interviewId: id,
        score: interview.overallAssessment.scores.overall,
        questionsAnswered: interview.timeline.questionsCompleted,
        duration: interview.timeline.totalDuration,
        sessionId
      }
    });

    res.json({
      success: true,
      message: 'Interview completed successfully',
      data: {
        overallScore: interview.overallAssessment.scores.overall,
        recommendation: interview.overallAssessment.recommendation,
        questionsCompleted: interview.timeline.questionsCompleted,
        totalDuration: interview.timeline.totalDuration,
        report: interview.generateReport()
      }
    });

  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get interview results
exports.getInterviewResults = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id)
      .populate('user', 'name email')
      .populate('company', 'name displayName');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Check access
    if (interview.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if interview is completed
    if (interview.status.current !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Interview not completed yet'
      });
    }

    const report = interview.generateReport();

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Get interview results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interview results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Record violation
exports.recordViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, severity, details, sessionId } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Record violation
    await interview.recordViolation(type, severity);

    // Record in session
    if (sessionId) {
      await Session.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            activities: {
              timestamp: new Date(),
              eventType: 'violation_detected',
              data: {
                type,
                category,
                severity,
                details
              }
            }
          }
        }
      );
    }

    res.json({
      success: true,
      message: 'Violation recorded successfully',
      data: {
        violationCount: interview.status.violationCount,
        warningCount: interview.status.warningCount,
        maxViolations: interview.configuration.proctoring.maxViolations
      }
    });

  } catch (error) {
    console.error('Record violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording violation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process camera snapshot
exports.processCameraSnapshot = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { sessionId } = req.body;
      const imagePath = req.file.path;

      // Process image with AI
      const detection = await aiServices.detectObjects(imagePath);

      // Update session
      if (sessionId) {
        const session = await Session.findOne({ sessionId });
        if (session) {
          await session.takeSnapshot(imagePath, detection.faceCount, detection.faceConfidence);

          // Record violations if any
          if (detection.violations.length > 0) {
            for (const violation of detection.violations) {
              await session.recordViolation(violation.type, 'camera', {
                confidence: violation.confidence,
                imageUrl: imagePath,
                description: violation.description
              });
            }
          }
        }
      }

      res.json({
        success: true,
        message: 'Camera snapshot processed successfully',
        data: {
          faceCount: detection.faceCount,
          faceConfidence: detection.faceConfidence,
          violations: detection.violations
        }
      });

    } catch (error) {
      console.error('Process camera snapshot error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing camera snapshot',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Background AI assessment processing
const processAIAssessment = async (interviewId, questionIndex, response) => {
  try {
    const interview = await Interview.findById(interviewId);
    if (!interview) return;

    const question = interview.questions[questionIndex];
    const aiAssessment = {};

    // Audio analysis
    if (response.audioUrl) {
      const transcription = await aiServices.transcribeAudio(response.audioUrl);
      const emotionAnalysis = await aiServices.analyzeEmotion(response.audioUrl);
      const speechMetrics = await aiServices.analyzeSpeech(response.audioUrl);

      aiAssessment.audioAnalysis = {
        transcription: transcription.transcription,
        confidence: transcription.confidence,
        sentiment: 'neutral', // Can be enhanced
        emotionAnalysis,
        speechMetrics
      };
    }

    // Content analysis
    if (response.textAnswer || aiAssessment.audioAnalysis?.transcription) {
      const content = response.textAnswer || aiAssessment.audioAnalysis.transcription;
      const contentAnalysis = await aiServices.analyzeContent(content, question.type);
      aiAssessment.contentAnalysis = contentAnalysis;
    }

    // Behavioral analysis
    if (question.type === 'behavioral') {
      const behavioralAnalysis = await aiServices.analyzeBehavioral(
        aiAssessment.audioAnalysis?.transcription || response.textAnswer,
        response.audioUrl
      );
      aiAssessment.behavioralAnalysis = behavioralAnalysis;
    }

    // Technical analysis
    if (question.type === 'technical' || question.type === 'coding') {
      const technicalAnalysis = await aiServices.analyzeTechnical(
        aiAssessment.audioAnalysis?.transcription || response.textAnswer,
        response.codeAnswer
      );
      aiAssessment.technicalAnalysis = technicalAnalysis;
    }

    // Calculate overall scores
    aiAssessment.scores = {
      overall: calculateOverallScore(aiAssessment, question.type),
      technical: aiAssessment.technicalAnalysis?.conceptUnderstanding || 0,
      communication: aiAssessment.behavioralAnalysis?.communicationSkills || 0,
      behavioral: aiAssessment.behavioralAnalysis?.confidenceLevel || 0,
      problemSolving: aiAssessment.behavioralAnalysis?.problemSolvingApproach || 0,
      cultural: aiAssessment.behavioralAnalysis?.teamworkSkills || 0
    };

    // Generate feedback
    aiAssessment.feedback = generateFeedback(aiAssessment, question.type);

    // AI metadata
    aiAssessment.aiMetadata = {
      model: 'gpt-4',
      version: '1.0',
      processedAt: new Date(),
      processingTime: 1500,
      confidence: 0.85,
      flags: []
    };

    // Update interview
    interview.questions[questionIndex].aiAssessment = aiAssessment;
    await interview.save();

  } catch (error) {
    console.error('AI assessment processing error:', error);
  }
};

// Helper function to calculate overall score
const calculateOverallScore = (aiAssessment, questionType) => {
  let score = 0;
  let components = 0;

  if (aiAssessment.contentAnalysis) {
    score += aiAssessment.contentAnalysis.relevanceScore;
    score += aiAssessment.contentAnalysis.completenessScore;
    score += aiAssessment.contentAnalysis.clarity;
    components += 3;
  }

  if (aiAssessment.behavioralAnalysis) {
    score += aiAssessment.behavioralAnalysis.confidenceLevel;
    score += aiAssessment.behavioralAnalysis.communicationSkills;
    components += 2;
  }

  if (aiAssessment.technicalAnalysis) {
    score += aiAssessment.technicalAnalysis.conceptUnderstanding;
    score += aiAssessment.technicalAnalysis.implementationQuality;
    components += 2;
  }

  return components > 0 ? Math.round(score / components) : 0;
};

// Helper function to generate feedback
const generateFeedback = (aiAssessment, questionType) => {
  const feedback = {
    strengths: [],
    improvements: [],
    detailedFeedback: '',
    nextSteps: [],
    recommendedResources: []
  };

  if (aiAssessment.contentAnalysis) {
    if (aiAssessment.contentAnalysis.relevanceScore > 80) {
      feedback.strengths.push('Highly relevant response');
    }
    if (aiAssessment.contentAnalysis.clarity > 80) {
      feedback.strengths.push('Clear and well-structured answer');
    }
    if (aiAssessment.contentAnalysis.completenessScore < 60) {
      feedback.improvements.push('Provide more comprehensive answers');
    }
  }

  if (aiAssessment.behavioralAnalysis) {
    if (aiAssessment.behavioralAnalysis.confidenceLevel > 80) {
      feedback.strengths.push('Demonstrates strong confidence');
    }
    if (aiAssessment.behavioralAnalysis.communicationSkills < 60) {
      feedback.improvements.push('Work on communication skills');
    }
  }

  if (aiAssessment.technicalAnalysis) {
    if (aiAssessment.technicalAnalysis.conceptUnderstanding > 80) {
      feedback.strengths.push('Strong technical understanding');
    }
    if (aiAssessment.technicalAnalysis.bestPractices < 60) {
      feedback.improvements.push('Focus on best practices');
    }
  }

  return feedback;
};

const generateTextToSpeech = async (req, res) => {
  try {
    const { text, voice = 'nova' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    console.log('🔊 Generating TTS for:', text.substring(0, 50) + '...');
    
    // Generate speech using AI service
    const speechResult = await aiServices.generateSpeech(text, voice);
    
    // Set appropriate headers
    res.set({
      'Content-Type': speechResult.contentType,
      'Content-Length': speechResult.size,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });
    
    // Send audio buffer
    res.send(speechResult.audioBuffer);
    
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate speech',
      error: error.message
    });
  }
};

module.exports = {
  // AI Interview Functions
  startAIInterview,
  getInterview,
  submitAIResponse,
  submitFollowUpResponse,
  generateAIAssessment,
  monitorFaceDetection,
  validateCameraSetup,
  getAIInterviewQuestions,
  getAIInterviewReport,
  getDetailedInterviewReport,
  getUserInterviews,
  
  // Core functions that actually exist
  processAIAssessment,
  calculateOverallScore,
  generateFeedback,
  generateTextToSpeech
}; 