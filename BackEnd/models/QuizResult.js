const mongoose = require('mongoose');

const QuizResultSchema = new mongoose.Schema({
  // User who took the quiz
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Quiz information
  quizTitle: { type: String, required: true },
  quizCategory: { type: String, required: true },
  quizCategoryType: { type: String, enum: ['company', 'subjective'], required: true },
  
  // Quiz session details
  totalQuestions: { type: Number, required: true },
  answeredQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  unansweredQuestions: { type: Number, required: true },
  
  // Scoring
  score: { type: Number, required: true }, // Percentage score
  percentage: { type: Number, required: true },
  grade: { type: String, required: true },
  gradeColor: { type: String, required: true },
  
  // Time tracking
  timeTaken: { type: Number, required: true }, // in seconds
  averageTimePerQuestion: { type: Number, required: true },
  
  // Performance breakdown
  performanceByType: {
    mcq: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    fill: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    coding: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  
  performanceByDifficulty: {
    easy: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    medium: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    hard: { 
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },
  
  // Detailed question analysis
  questionAnalysis: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' },
    type: { type: String, required: true },
    difficulty: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpent: { type: Number, required: true },
    points: { type: Number, required: true },
    userAnswer: { type: mongoose.Schema.Types.Mixed },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String }
  }],
  
  // User answers (for review)
  userAnswers: { type: mongoose.Schema.Types.Mixed, required: true },
  
  // Analysis and recommendations
  recommendations: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  
  // Session metadata
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['completed', 'abandoned', 'timeout'], 
    default: 'completed' 
  }
  
}, { 
  timestamps: true 
});

// Indexes for better performance
QuizResultSchema.index({ userId: 1, createdAt: -1 });
QuizResultSchema.index({ quizCategoryType: 1, createdAt: -1 });
QuizResultSchema.index({ score: -1 });
QuizResultSchema.index({ 'performanceByType.mcq.percentage': -1 });
QuizResultSchema.index({ 'performanceByType.fill.percentage': -1 });

module.exports = mongoose.model('QuizResult', QuizResultSchema); 