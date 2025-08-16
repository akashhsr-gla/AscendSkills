const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  logo: { type: String },
  website: { type: String },
  description: { type: String, maxlength: 1000 },
  industry: { type: String, required: true },
  companySize: { 
    type: String, 
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    required: true 
  },
  
  // Contact Information
  contact: {
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipCode: { type: String }
    },
    socialMedia: {
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String },
      instagram: { type: String }
    }
  },
  
  // Technical Information
  techStack: [{ type: String }],
  departments: [{ type: String }],
  jobRoles: [{
    title: { type: String, required: true },
    department: { type: String },
    level: { type: String, enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'principal'] },
    skills: [{ type: String }],
    isActive: { type: Boolean, default: true }
  }],
  
  // Assessment Configuration
  assessment: {
    enableCustomQuestions: { type: Boolean, default: true },
    enableCustomInterviews: { type: Boolean, default: true },
    enableCodingTests: { type: Boolean, default: true },
    enableBehavioralTests: { type: Boolean, default: true },
    enableSystemDesign: { type: Boolean, default: false },
    
    // Time limits
    defaultQuizTime: { type: Number, default: 3600 }, // seconds
    defaultCodingTime: { type: Number, default: 7200 }, // seconds
    defaultInterviewTime: { type: Number, default: 1800 }, // seconds
    
    // Scoring
    passingScore: { type: Number, default: 60 }, // percentage
    codingWeight: { type: Number, default: 40 }, // percentage
    behavioralWeight: { type: Number, default: 30 }, // percentage
    technicalWeight: { type: Number, default: 30 }, // percentage
    
    // Proctoring
    enableCameraMonitoring: { type: Boolean, default: true },
    enableScreenRecording: { type: Boolean, default: false },
    enableAudioRecording: { type: Boolean, default: true },
    enableTabSwitchDetection: { type: Boolean, default: true },
    maxViolations: { type: Number, default: 3 }
  },
  
  // Subscription & Billing
  subscription: {
    plan: { type: String, enum: ['trial', 'basic', 'premium', 'enterprise'], default: 'trial' },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    maxUsers: { type: Number, default: 10 },
    maxQuestions: { type: Number, default: 100 },
    maxAssessments: { type: Number, default: 50 },
    
    // Usage tracking
    currentUsers: { type: Number, default: 0 },
    currentQuestions: { type: Number, default: 0 },
    currentAssessments: { type: Number, default: 0 },
    
    // Billing
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentMethod: { type: String },
    lastPaymentDate: { type: Date },
    nextPaymentDate: { type: Date },
    paymentHistory: [{
      amount: { type: Number },
      date: { type: Date },
      transactionId: { type: String },
      status: { type: String, enum: ['pending', 'completed', 'failed'] }
    }]
  },
  
  // Analytics & Statistics
  analytics: {
    totalCandidates: { type: Number, default: 0 },
    totalAssessments: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    passingRate: { type: Number, default: 0 },
    averageAssessmentTime: { type: Number, default: 0 },
    
    // Monthly statistics
    monthlyStats: [{
      month: { type: String }, // YYYY-MM
      candidates: { type: Number, default: 0 },
      assessments: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      passingRate: { type: Number, default: 0 }
    }],
    
    // Popular questions
    popularQuestions: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      attempts: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 }
    }],
    
    // Department-wise performance
    departmentStats: [{
      department: { type: String },
      totalCandidates: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      passingRate: { type: Number, default: 0 }
    }]
  },
  
  // Team & Permissions
  team: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'hr', 'interviewer', 'viewer'], required: true },
    permissions: [{
      resource: { type: String, required: true },
      actions: [{ type: String }] // create, read, update, delete
    }],
    isActive: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  
  // Integration Settings
  integrations: {
    ats: {
      enabled: { type: Boolean, default: false },
      provider: { type: String }, // greenhouse, workday, etc.
      apiKey: { type: String },
      webhookUrl: { type: String }
    },
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String },
      channel: { type: String }
    },
    email: {
      enabled: { type: Boolean, default: true },
      provider: { type: String, default: 'sendgrid' },
      apiKey: { type: String },
      templates: {
        invitation: { type: String },
        results: { type: String },
        reminder: { type: String }
      }
    }
  },
  
  // Status & Control
  status: {
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationDate: { type: Date },
    verificationNotes: { type: String },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Audit Trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Deletion & Archival
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  archiveReason: { type: String }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ 'subscription.plan': 1 });
CompanySchema.index({ 'subscription.isActive': 1 });
CompanySchema.index({ 'status.isActive': 1 });
CompanySchema.index({ createdAt: -1 });

// Virtual for subscription status
CompanySchema.virtual('subscriptionStatus').get(function() {
  if (!this.subscription.isActive) return 'inactive';
  if (this.subscription.endDate && this.subscription.endDate < new Date()) return 'expired';
  return 'active';
});

// Virtual for usage percentage
CompanySchema.virtual('usagePercentage').get(function() {
  return {
    users: (this.subscription.currentUsers / this.subscription.maxUsers) * 100,
    questions: (this.subscription.currentQuestions / this.subscription.maxQuestions) * 100,
    assessments: (this.subscription.currentAssessments / this.subscription.maxAssessments) * 100
  };
});

// Methods
CompanySchema.methods.canAddUser = function() {
  return this.subscription.currentUsers < this.subscription.maxUsers;
};

CompanySchema.methods.canAddQuestion = function() {
  return this.subscription.currentQuestions < this.subscription.maxQuestions;
};

CompanySchema.methods.canCreateAssessment = function() {
  return this.subscription.currentAssessments < this.subscription.maxAssessments;
};

CompanySchema.methods.addTeamMember = function(userId, role, permissions = []) {
  const existingMember = this.team.find(t => t.userId.toString() === userId.toString());
  if (existingMember) {
    existingMember.role = role;
    existingMember.permissions = permissions;
    existingMember.isActive = true;
  } else {
    this.team.push({
      userId,
      role,
      permissions,
      isActive: true,
      joinedAt: new Date()
    });
  }
  return this.save();
};

CompanySchema.methods.removeTeamMember = function(userId) {
  const member = this.team.find(t => t.userId.toString() === userId.toString());
  if (member) {
    member.isActive = false;
  }
  return this.save();
};

CompanySchema.methods.hasPermission = function(userId, resource, action) {
  const member = this.team.find(t => 
    t.userId.toString() === userId.toString() && 
    t.isActive
  );
  
  if (!member) return false;
  if (member.role === 'admin') return true;
  
  const permission = member.permissions.find(p => p.resource === resource);
  return permission && permission.actions.includes(action);
};

CompanySchema.methods.updateUsageStats = function(type, increment = 1) {
  switch (type) {
    case 'users':
      this.subscription.currentUsers += increment;
      break;
    case 'questions':
      this.subscription.currentQuestions += increment;
      break;
    case 'assessments':
      this.subscription.currentAssessments += increment;
      break;
  }
  return this.save();
};

CompanySchema.methods.recordPayment = function(amount, transactionId, status = 'completed') {
  this.subscription.paymentHistory.push({
    amount,
    date: new Date(),
    transactionId,
    status
  });
  
  if (status === 'completed') {
    this.subscription.lastPaymentDate = new Date();
    
    // Calculate next payment date
    const nextDate = new Date();
    if (this.subscription.billingCycle === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    this.subscription.nextPaymentDate = nextDate;
  }
  
  return this.save();
};

CompanySchema.methods.suspend = function(reason, suspendedBy) {
  this.status.isActive = false;
  this.status.suspensionReason = reason;
  this.status.suspendedAt = new Date();
  this.status.suspendedBy = suspendedBy;
  return this.save();
};

CompanySchema.methods.reactivate = function() {
  this.status.isActive = true;
  this.status.suspensionReason = undefined;
  this.status.suspendedAt = undefined;
  this.status.suspendedBy = undefined;
  return this.save();
};

module.exports = mongoose.model('Company', CompanySchema); 