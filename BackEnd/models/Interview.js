const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  // Basic Information
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewCategory', required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  
  // Questions and Responses
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    question: { type: String, required: true },
    type: { type: String, required: true },
    
    // Response
    response: {
      transcription: { type: String },
      confidence: { type: Number, default: 0.8 },
      duration: { type: Number },
      isAnswered: { type: Boolean, default: false }
    },
    
    // Follow-up questions and responses
    followUpQuestions: [{ type: String }],
    followUpResponses: [{
      question: { type: String },
      transcription: { type: String },
      confidence: { type: Number, default: 0.8 },
      duration: { type: Number },
      isAnswered: { type: Boolean, default: false }
    }],
    
    // AI Assessment - Simplified
    aiAssessment: {
      scores: {
        clarity: { type: Number, default: 0 }, // 0-100
        relevance: { type: Number, default: 0 }, // 0-100
        depth: { type: Number, default: 0 }, // 0-100
        structure: { type: Number, default: 0 }, // 0-100
        communication: { type: Number, default: 0 }, // 0-100
        technical: { type: Number, default: 0 }, // 0-100
        problemSolving: { type: Number, default: 0 }, // 0-100
        confidence: { type: Number, default: 0 }, // 0-100
        overall: { type: Number, default: 0 } // 0-100
      },
      suggestions: [{ type: String }], // AI suggestions for improvement
      analysis: { type: String }, // AI detailed analysis
      feedback: { type: String }, // AI feedback
      confidence: { type: Number, default: 0.8 } // AI confidence in assessment
    }
  }],
  
  // Final Assessment - Simplified
  finalAssessment: {
    overallScore: { type: Number, default: 0 }, // 0-100
    breakdown: {
      communication: { type: Number, default: 0 },
      technical: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 }
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    recommendations: [{ type: String }],
    feedback: { type: String },
    generatedAt: { type: Date },
    metrics: {
      averageConfidence: { type: Number, default: 0 },
      totalViolations: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      averageWordCount: { type: Number, default: 0 },
      questionsWithAI: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 }
    }
  },
  
  // Basic tracking
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: {
    current: { 
      type: String, 
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    },
    isActive: { type: Boolean, default: true },
    currentQuestionIndex: { type: Number, default: 0 }
  },

  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
InterviewSchema.index({ user: 1 });
InterviewSchema.index({ category: 1 });
InterviewSchema.index({ 'status.current': 1 });
InterviewSchema.index({ startTime: -1 });

// Simple methods
InterviewSchema.methods.completeInterview = function() {
  this.status.current = 'completed';
  this.endTime = new Date();
  this.status.isActive = false;
  return this.save();
};

module.exports = mongoose.model('Interview', InterviewSchema); 