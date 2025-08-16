const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['student', 'admin', 'company'], default: 'student' },
  
  // Profile Information
  profile: {
    phone: { type: String, trim: true },
    college: { type: String, trim: true },
    degree: { type: String, trim: true },
    year: { type: Number, min: 1, max: 4 },
    branch: { type: String, trim: true },
    cgpa: { type: Number, min: 0, max: 10 },
    skills: [{ type: String, trim: true }],
    resumeUrl: { type: String },
    profilePicture: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    bio: { type: String, maxlength: 500 },
    location: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] }
  },
  
  // Subscription & Access
  subscription: {
    type: { type: String, enum: ['free', 'basic', 'premium', 'enterprise', 'monthly', 'quarterly', 'half_yearly'], default: 'free' },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
    transactionId: { type: String },
    amount: { type: Number, default: 0 },
    features: [{
      name: { type: String },
      enabled: { type: Boolean, default: true }
    }]
  },
  
  // Account Status
  status: {
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isDefaulter: { type: Boolean, default: false },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  
  // Analytics & Statistics
  analytics: {
    totalQuizzes: { type: Number, default: 0 },
    totalInterviews: { type: Number, default: 0 },
    totalCodingProblems: { type: Number, default: 0 },
    averageQuizScore: { type: Number, default: 0 },
    averageInterviewScore: { type: Number, default: 0 },
    averageCodingScore: { type: Number, default: 0 },
    overallRating: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    streakCount: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  
  // Company Association (for company users)
  company: {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    designation: { type: String },
    department: { type: String },
    permissions: [{ type: String }],
    isCompanyAdmin: { type: Boolean, default: false }
  },
  
  // Security & Monitoring
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    trustedDevices: [{
      deviceId: { type: String },
      deviceName: { type: String },
      lastUsed: { type: Date },
      isActive: { type: Boolean, default: true }
    }],
    sessionHistory: [{
      sessionId: { type: String },
      ipAddress: { type: String },
      userAgent: { type: String },
      loginTime: { type: Date },
      logoutTime: { type: Date },
      location: { type: String }
    }]
  },
  
  // Settings & Preferences
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      scoresVisible: { type: Boolean, default: true },
      activityVisible: { type: Boolean, default: true }
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' }
    }
  },
  
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
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.type': 1 });
UserSchema.index({ 'status.isActive': 1 });
UserSchema.index({ 'status.isDefaulter': 1 });
UserSchema.index({ 'company.companyId': 1 });
UserSchema.index({ 'analytics.overallRating': -1 });
UserSchema.index({ createdAt: -1 });

// Virtual for account locked status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.status.lockUntil && this.status.lockUntil > Date.now());
});

// Virtual for subscription active status
UserSchema.virtual('hasActiveSubscription').get(function() {
  return this.subscription.isActive && 
         this.subscription.endDate && 
         this.subscription.endDate > new Date();
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock and it's expired, restart at 1
  if (this.status.lockUntil && this.status.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { 'status.loginAttempts': 1 },
      $unset: { 'status.lockUntil': 1 }
    });
  }
  
  const updates = { $inc: { 'status.loginAttempts': 1 } };
  
  // If we have reached max attempts and haven't locked the account yet
  if (this.status.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'status.lockUntil': Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'status.loginAttempts': 1, 'status.lockUntil': 1 }
  });
};

UserSchema.methods.updateLastActivity = function() {
  this.analytics.lastActivityDate = new Date();
  this.status.lastLogin = new Date();
  return this.save();
};

UserSchema.methods.canAccessFeature = function(featureName) {
  if (this.role === 'admin') return true;
  
  const feature = this.subscription.features.find(f => f.name === featureName);
  return feature ? feature.enabled : false;
};

UserSchema.methods.sanitize = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.security.twoFactorSecret;
  delete userObj.status.emailVerificationToken;
  delete userObj.status.passwordResetToken;
  return userObj;
};

module.exports = mongoose.model('User', UserSchema); 