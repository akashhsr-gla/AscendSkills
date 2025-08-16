const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  // Basic Information
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true }, // The actual question text
  type: { 
    type: String, 
    enum: ['mcqs', 'fill_in_blanks', 'true_false', 'coding'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true
  },
  categoryType: {
    type: String,
    enum: ['company', 'subjective'],
    required: true
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  
  // Explanation for the correct answer
  explanation: { type: String, required: true },
  
  // Correct answer (format varies by type)
  correctAnswer: { type: String, required: true },
  
  // Type-specific fields
  mcqs: {
    options: [{ type: String }], // Array of multiple choice options
    correctOptionIndex: { type: Number } // Index of correct option (0-based)
  },
  
  fillInBlanks: {
    // For fill in the blanks, correctAnswer should be case-insensitive and space-insensitive
    // The system will normalize both user input and correct answer for comparison
    placeholder: { type: String }, // Text to show as placeholder
    caseSensitive: { type: Boolean, default: false },
    ignoreSpaces: { type: Boolean, default: true }
  },
  
  trueFalse: {
    // For true/false questions
    correctAnswer: { type: Boolean } // true or false
  },
  
  coding: {
    // Coding question specific fields (to be expanded later)
    problemId: { type: String }, // SPHERE ENGINE problem ID
    problemDescription: { type: String },
    inputFormat: { type: String },
    outputFormat: { type: String },
    constraints: [{ type: String }],
    examples: [{
      input: { type: String },
      output: { type: String },
      explanation: { type: String }
    }],
    starterCode: { type: String },
    testCases: [{
      input: { type: String },
      expectedOutput: { type: String },
      isHidden: { type: Boolean, default: false }
    }]
  },
  
  // Points/Score for this question
  points: { type: Number, default: 1 },
  
  // Time limit for this question (in seconds)
  timeLimit: { type: Number, default: 60 },
  
  // Tags for categorization (maximum 3 tags)
  tags: {
    type: [String],
    validate: {
      validator: function(tags) {
        return !tags || tags.length <= 3;
      },
      message: 'Tags cannot exceed 3 items'
    }
  },
  
  // Company Association (for company-specific questions)
  company: {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    isCompanySpecific: { type: Boolean, default: false }
  },
  
  // Status
  status: {
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true }
  },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usageCount: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 } // Percentage of correct answers
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
QuizQuestionSchema.index({ category: 1, difficulty: 1 });
QuizQuestionSchema.index({ type: 1 });
QuizQuestionSchema.index({ 'company.companyId': 1 });
QuizQuestionSchema.index({ 'status.isActive': 1 });
QuizQuestionSchema.index({ tags: 1 });

// Virtual for getting the correct answer based on type
QuizQuestionSchema.virtual('getCorrectAnswer').get(function() {
  switch(this.type) {
    case 'mcqs':
      return this.mcqs?.options?.[this.mcqs.correctOptionIndex] || this.correctAnswer;
    case 'true_false':
      return this.trueFalse?.correctAnswer;
    case 'fill_in_blanks':
      return this.correctAnswer;
    case 'coding':
      return this.correctAnswer;
    default:
      return this.correctAnswer;
  }
});

// Method to check if answer is correct (handles different types)
QuizQuestionSchema.methods.isCorrectAnswer = function(userAnswer) {
  switch(this.type) {
    case 'mcqs':
      return userAnswer === this.mcqs.correctOptionIndex;
    
    case 'fill_in_blanks':
      // Normalize both answers for case-insensitive and space-insensitive comparison
      const normalizeAnswer = (answer) => {
        if (!answer) return '';
        return answer.toString().toLowerCase().replace(/\s+/g, '');
      };
      return normalizeAnswer(userAnswer) === normalizeAnswer(this.correctAnswer);
    
    case 'true_false':
      return userAnswer === this.trueFalse.correctAnswer;
    
    case 'coding':
      // For coding questions, this will be handled by the coding evaluation system
      return userAnswer === this.correctAnswer;
    
    default:
      return userAnswer === this.correctAnswer;
  }
};

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema); 