const mongoose = require('mongoose');

const InterviewCategorySchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  icon: { type: String, default: 'BookOpen' }, // Lucide icon name
  color: { type: String, default: 'blue' },
  
  // Category Type
  type: { 
    type: String, 
    enum: ['main', 'subjective', 'individual', 'company'],
    required: true 
  },
  
  // Parent category (for subcategories)
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InterviewCategory' 
  },
  
  // Question Statistics
  statistics: {
    totalQuestions: { type: Number, default: 0 },
    easyQuestions: { type: Number, default: 0 },
    mediumQuestions: { type: Number, default: 0 },
    hardQuestions: { type: Number, default: 0 },
    averageDifficulty: { type: Number, default: 0 }, // 1-5 scale
    totalAttempts: { type: Number, default: 0 },
    averageSuccessRate: { type: Number, default: 0 }
  },
  
  // Embedded Questions (for admin management)
  questions: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['behavioral', 'technical', 'coding', 'system_design', 'case_study', 'sql'],
      required: true 
    },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      default: 'medium' 
    },
    expectedDuration: { type: Number, default: 300 },
    metadata: {
      estimatedTime: { type: Number, default: 300 },
      points: { type: Number, default: 10 }
    },
    statistics: {
      totalAttempts: { type: Number, default: 0 },
      correctAttempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageTime: { type: Number, default: 0 }
    }
  }],
  
  // Company Association (for company-specific categories)
  company: {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    isCompanySpecific: { type: Boolean, default: false },
    companyName: { type: String },
    companyLogo: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
  },
  
  // Interview Configuration
  interviewConfig: {
    defaultDuration: { type: Number, default: 300 }, // seconds
    questionCount: { type: Number, default: 5 },
    allowFollowUps: { type: Boolean, default: true },
    enableVoiceRecording: { type: Boolean, default: true },
    enableVideoRecording: { type: Boolean, default: false },
    scoringCriteria: [{
      criterion: { type: String, required: true },
      weight: { type: Number, default: 1 },
      description: { type: String }
    }]
  },
  
  // Status & Permissions
  status: {
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  
  // Metadata
  tags: [{ type: String }],
  prerequisites: [{ type: String }],
  learningOutcomes: [{ type: String }],
  
  // Audit Trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Deletion
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
InterviewCategorySchema.index({ type: 1, 'status.isActive': 1 });
InterviewCategorySchema.index({ 'company.companyId': 1 });
InterviewCategorySchema.index({ 'status.sortOrder': 1 });
InterviewCategorySchema.index({ parentCategory: 1 });

// Virtual for question count
InterviewCategorySchema.virtual('questionCount').get(function() {
  return this.statistics.totalQuestions;
});

// Methods
InterviewCategorySchema.methods.updateStatistics = async function() {
  const Question = mongoose.model('Question');
  
  const stats = await Question.aggregate([
    { 
      $match: { 
        category: this.name,
        'status.isActive': true,
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalQuestions: { $sum: 1 },
        easyQuestions: { 
          $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] }
        },
        mediumQuestions: { 
          $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] }
        },
        hardQuestions: { 
          $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] }
        },
        totalAttempts: { $sum: '$statistics.totalAttempts' },
        avgSuccessRate: { $avg: '$statistics.averageScore' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const stat = stats[0];
    this.statistics.totalQuestions = stat.totalQuestions;
    this.statistics.easyQuestions = stat.easyQuestions;
    this.statistics.mediumQuestions = stat.mediumQuestions;
    this.statistics.hardQuestions = stat.hardQuestions;
    this.statistics.totalAttempts = stat.totalAttempts;
    this.statistics.averageSuccessRate = stat.avgSuccessRate || 0;
    
    // Calculate average difficulty
    const totalQuestions = stat.totalQuestions;
    if (totalQuestions > 0) {
      const difficultyScore = (stat.easyQuestions * 1 + stat.mediumQuestions * 3 + stat.hardQuestions * 5) / totalQuestions;
      this.statistics.averageDifficulty = Math.round(difficultyScore * 10) / 10;
    }
  }
  
  return this.save();
};

InterviewCategorySchema.methods.getQuestions = async function(limit = 10, difficulty = null) {
  const Question = mongoose.model('Question');
  
  const query = {
    category: this.name,
    'status.isActive': true,
    isDeleted: false
  };
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  return await Question.find(query)
    .sort({ 'statistics.totalAttempts': -1 })
    .limit(limit)
    .select('title content difficulty type statistics metadata');
};

module.exports = mongoose.model('InterviewCategory', InterviewCategorySchema); 