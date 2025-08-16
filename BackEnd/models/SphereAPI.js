const mongoose = require('mongoose');

const SphereAPISubmissionSchema = new mongoose.Schema({
  // Submission Details
  submissionId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion', required: true },
  
  // Code Details
  sourceCode: { type: String, required: true },
  language: { 
    type: String, 
    enum: ['python', 'java', 'cpp', 'c', 'javascript', 'go', 'rust', 'swift', 'kotlin'], 
    required: true 
  },
  
  // Execution Results
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
    default: 'pending'
  },
  
  // Performance Metrics
  executionTime: { type: Number }, // in milliseconds
  memoryUsed: { type: Number }, // in KB
  
  // Test Case Results
  testCaseResults: [{
    testCaseId: { type: String },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    status: { 
      type: String, 
      enum: ['passed', 'failed', 'error', 'timeout'] 
    },
    executionTime: { type: Number },
    memoryUsed: { type: Number }
  }],
  
  // Overall Results
  totalTestCases: { type: Number, default: 0 },
  passedTestCases: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // percentage
  
  // Error Details
  compilationError: { type: String },
  runtimeError: { type: String },
  
  // API Response Data
  sphereResponse: { type: mongoose.Schema.Types.Mixed },
  
  // Metadata
  submittedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  isPublic: { type: Boolean, default: false }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
SphereAPISubmissionSchema.index({ userId: 1, questionId: 1 });
SphereAPISubmissionSchema.index({ submissionId: 1 });
SphereAPISubmissionSchema.index({ status: 1 });
SphereAPISubmissionSchema.index({ createdAt: -1 });

// Virtual for success rate
SphereAPISubmissionSchema.virtual('successRate').get(function() {
  if (this.totalTestCases === 0) return 0;
  return Math.round((this.passedTestCases / this.totalTestCases) * 100);
});

// Virtual for performance rating
SphereAPISubmissionSchema.virtual('performanceRating').get(function() {
  if (this.status !== 'accepted') return 'N/A';
  
  // Simple performance rating based on execution time and memory
  const timeScore = this.executionTime < 100 ? 'Excellent' : 
                    this.executionTime < 500 ? 'Good' : 
                    this.executionTime < 1000 ? 'Average' : 'Slow';
  
  return timeScore;
});

// Method to check if submission is completed
SphereAPISubmissionSchema.methods.isCompleted = function() {
  return ['accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'].includes(this.status);
};

// Method to calculate final score
SphereAPISubmissionSchema.methods.calculateScore = function() {
  if (this.totalTestCases === 0) return 0;
  
  let score = (this.passedTestCases / this.totalTestCases) * 100;
  
  // Bonus for accepted solutions
  if (this.status === 'accepted') {
    score = Math.min(100, score + 10);
  }
  
  // Penalty for runtime/compilation errors
  if (this.status === 'runtime_error' || this.status === 'compilation_error') {
    score = Math.max(0, score - 20);
  }
  
  return Math.round(score);
};

module.exports = mongoose.model('SphereAPISubmission', SphereAPISubmissionSchema);