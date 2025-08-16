const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  // Basic Information
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true }, // The actual question text
  type: { 
    type: String, 
    enum: ['behavioral', 'technical', 'coding', 'system_design', 'case_study', 'sql'], 
    required: true 
  },
  category: { 
    type: String, 
    required: true
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  
  // Interview Configuration
  expectedDuration: { type: Number, default: 300 }, // in seconds
  
  // Company Association (for company-specific questions)
  company: {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    isCompanySpecific: { type: Boolean, default: false }
  },
  
  // Status
  status: {
    isActive: { type: Boolean, default: true }
  },
  
  // Simple metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
QuestionSchema.index({ category: 1, difficulty: 1 });
QuestionSchema.index({ type: 1 });
QuestionSchema.index({ 'company.companyId': 1 });
QuestionSchema.index({ 'status.isActive': 1 });

module.exports = mongoose.model('Question', QuestionSchema);