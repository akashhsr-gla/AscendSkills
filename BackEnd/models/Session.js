const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  // Basic Information
  sessionId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionType: { 
    type: String, 
    enum: ['quiz', 'interview', 'coding', 'general'], 
    required: true 
  },
  
  // Session Details
  details: {
    assessmentId: { type: mongoose.Schema.Types.ObjectId, refPath: 'details.assessmentType' },
    assessmentType: { type: String, enum: ['Quiz', 'Interview', 'CodingTest'] },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number }, // in seconds
    timeLimit: { type: Number }, // in seconds
    isCompleted: { type: Boolean, default: false },
    wasTimedOut: { type: Boolean, default: false },
    wasForceSubmitted: { type: Boolean, default: false }
  },
  
  // Device & Browser Information
  device: {
    userAgent: { type: String },
    platform: { type: String },
    browser: { type: String },
    browserVersion: { type: String },
    os: { type: String },
    osVersion: { type: String },
    screenResolution: { type: String },
    timezone: { type: String },
    language: { type: String },
    deviceType: { type: String, enum: ['desktop', 'tablet', 'mobile'] },
    isMobile: { type: Boolean, default: false },
    fingerprint: { type: String } // Device fingerprint for security
  },
  
  // Network Information
  network: {
    ipAddress: { type: String, required: true },
    location: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      timezone: { type: String }
    },
    isp: { type: String },
    vpnDetected: { type: Boolean, default: false },
    proxyDetected: { type: Boolean, default: false }
  },
  
  // Proctoring & Security
  proctoring: {
    isEnabled: { type: Boolean, default: false },
    
    // Camera monitoring
    camera: {
      isEnabled: { type: Boolean, default: false },
      hasPermission: { type: Boolean, default: false },
      isWorking: { type: Boolean, default: false },
      violations: [{
        type: { type: String, enum: ['no_face', 'multiple_faces', 'looking_away', 'phone_detected', 'unauthorized_object'] },
        timestamp: { type: Date, default: Date.now },
        confidence: { type: Number }, // 0-1
        imageUrl: { type: String }, // Screenshot for evidence
        description: { type: String }
      }],
      snapshots: [{
        timestamp: { type: Date, default: Date.now },
        imageUrl: { type: String },
        faceCount: { type: Number, default: 0 },
        faceConfidence: { type: Number, default: 0 }
      }]
    },
    
    // Audio monitoring
    audio: {
      isEnabled: { type: Boolean, default: false },
      hasPermission: { type: Boolean, default: false },
      isRecording: { type: Boolean, default: false },
      violations: [{
        type: { type: String, enum: ['background_noise', 'voice_detected', 'unauthorized_sound'] },
        timestamp: { type: Date, default: Date.now },
        confidence: { type: Number },
        audioUrl: { type: String },
        description: { type: String }
      }],
      recordings: [{
        timestamp: { type: Date, default: Date.now },
        audioUrl: { type: String },
        duration: { type: Number }
      }]
    },
    
    // Screen monitoring
    screen: {
      isRecording: { type: Boolean, default: false },
      hasPermission: { type: Boolean, default: false },
      tabSwitches: [{
        timestamp: { type: Date, default: Date.now },
        fromTab: { type: String },
        toTab: { type: String },
        duration: { type: Number } // how long they were away
      }],
      windowChanges: [{
        timestamp: { type: Date, default: Date.now },
        eventType: { type: String, enum: ['focus', 'blur', 'resize', 'minimize'] },
        windowTitle: { type: String }
      }],
      copypaste: [{
        timestamp: { type: Date, default: Date.now },
        action: { type: String, enum: ['copy', 'paste', 'cut'] },
        content: { type: String }, // First 100 chars for security
        source: { type: String }
      }],
      keystrokes: [{
        timestamp: { type: Date, default: Date.now },
        keyCount: { type: Number },
        suspiciousKeys: [{ type: String }] // F12, Ctrl+Shift+I, etc.
      }]
    },
    
    // Violation Summary
    violations: {
      total: { type: Number, default: 0 },
      camera: { type: Number, default: 0 },
      audio: { type: Number, default: 0 },
      screen: { type: Number, default: 0 },
      network: { type: Number, default: 0 },
      severe: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 }
    },
    
    // AI Analysis
    aiAnalysis: {
      suspiciousActivity: { type: Boolean, default: false },
      confidenceScore: { type: Number, default: 0 }, // 0-1
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
      flaggedReasons: [{ type: String }],
      recommendations: [{ type: String }]
    }
  },
  
  // Session Events & Activities
  activities: [{
    timestamp: { type: Date, default: Date.now },
    eventType: { 
      type: String, 
      enum: [
        'session_start', 'session_end', 'question_view', 'question_answer',
        'question_skip', 'question_flag', 'time_warning', 'auto_save',
        'manual_save', 'submit_attempt', 'violation_detected', 'warning_issued'
      ]
    },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    data: { type: mongoose.Schema.Types.Mixed },
    userAction: { type: String },
    systemAction: { type: String }
  }],
  
  // Performance Metrics
  performance: {
    questionsAttempted: { type: Number, default: 0 },
    questionsCompleted: { type: Number, default: 0 },
    questionsSkipped: { type: Number, default: 0 },
    questionsFlagged: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // in seconds
    averageTimePerQuestion: { type: Number, default: 0 },
    submissionAttempts: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Technical Issues
  technicalIssues: [{
    timestamp: { type: Date, default: Date.now },
    issueType: { 
      type: String, 
      enum: ['connection_lost', 'browser_crash', 'camera_error', 'audio_error', 'permission_denied', 'timeout']
    },
    description: { type: String },
    resolution: { type: String },
    impact: { type: String, enum: ['none', 'minor', 'major', 'critical'] },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date }
  }],
  
  // Status & Control
  status: {
    isActive: { type: Boolean, default: true },
    isValid: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false },
    pausedAt: { type: Date },
    pauseReason: { type: String },
    resumedAt: { type: Date },
    terminatedAt: { type: Date },
    terminationReason: { type: String }
  },
  
  // Audit Trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
SessionSchema.index({ sessionId: 1 });
SessionSchema.index({ user: 1 });
SessionSchema.index({ sessionType: 1 });
SessionSchema.index({ 'details.companyId': 1 });
SessionSchema.index({ 'details.startTime': -1 });
SessionSchema.index({ 'proctoring.violations.total': -1 });
SessionSchema.index({ 'status.isActive': 1 });
SessionSchema.index({ createdAt: -1 });

// Virtual for session duration
SessionSchema.virtual('sessionDuration').get(function() {
  if (!this.details.endTime) return null;
  return Math.floor((this.details.endTime - this.details.startTime) / 1000);
});

// Virtual for violation severity
SessionSchema.virtual('violationSeverity').get(function() {
  const total = this.proctoring.violations.total;
  if (total === 0) return 'none';
  if (total <= 2) return 'low';
  if (total <= 5) return 'medium';
  if (total <= 10) return 'high';
  return 'critical';
});

// Virtual for completion percentage
SessionSchema.virtual('completionPercentage').get(function() {
  const attempted = this.performance.questionsAttempted;
  const completed = this.performance.questionsCompleted;
  if (attempted === 0) return 0;
  return Math.round((completed / attempted) * 100);
});

// Methods
SessionSchema.methods.recordActivity = function(eventType, data = {}) {
  this.activities.push({
    timestamp: new Date(),
    eventType,
    data,
    userAction: data.userAction,
    systemAction: data.systemAction,
    questionId: data.questionId
  });
  
  this.performance.lastActivity = new Date();
  return this.save();
};

SessionSchema.methods.recordViolation = function(type, category, details = {}) {
  const violation = {
    type,
    timestamp: new Date(),
    ...details
  };
  
  // Add to specific category
  if (category === 'camera') {
    this.proctoring.camera.violations.push(violation);
    this.proctoring.violations.camera += 1;
  } else if (category === 'audio') {
    this.proctoring.audio.violations.push(violation);
    this.proctoring.violations.audio += 1;
  } else if (category === 'screen') {
    this.proctoring.screen.violations.push(violation);
    this.proctoring.violations.screen += 1;
  }
  
  this.proctoring.violations.total += 1;
  
  // Determine severity
  if (['multiple_faces', 'phone_detected', 'unauthorized_object'].includes(type)) {
    this.proctoring.violations.severe += 1;
  } else {
    this.proctoring.violations.warnings += 1;
  }
  
  // Record activity
  this.recordActivity('violation_detected', {
    violationType: type,
    category,
    severity: this.proctoring.violations.severe > 0 ? 'severe' : 'warning'
  });
  
  return this.save();
};

SessionSchema.methods.recordTabSwitch = function(fromTab, toTab, duration) {
  this.proctoring.screen.tabSwitches.push({
    timestamp: new Date(),
    fromTab,
    toTab,
    duration
  });
  
  this.recordViolation('tab_switch', 'screen', { fromTab, toTab, duration });
  return this.save();
};

SessionSchema.methods.takeSnapshot = function(imageUrl, faceCount = 0, faceConfidence = 0) {
  this.proctoring.camera.snapshots.push({
    timestamp: new Date(),
    imageUrl,
    faceCount,
    faceConfidence
  });
  
  return this.save();
};

SessionSchema.methods.recordTechnicalIssue = function(issueType, description, impact = 'minor') {
  this.technicalIssues.push({
    timestamp: new Date(),
    issueType,
    description,
    impact,
    resolved: false
  });
  
  this.recordActivity('technical_issue', { issueType, description, impact });
  return this.save();
};

SessionSchema.methods.pauseSession = function(reason) {
  this.status.isPaused = true;
  this.status.pausedAt = new Date();
  this.status.pauseReason = reason;
  
  this.recordActivity('session_pause', { reason });
  return this.save();
};

SessionSchema.methods.resumeSession = function() {
  this.status.isPaused = false;
  this.status.resumedAt = new Date();
  this.status.pauseReason = undefined;
  
  this.recordActivity('session_resume');
  return this.save();
};

SessionSchema.methods.endSession = function(reason = 'completed') {
  this.details.endTime = new Date();
  this.details.duration = Math.floor((this.details.endTime - this.details.startTime) / 1000);
  this.details.isCompleted = reason === 'completed';
  this.details.wasTimedOut = reason === 'timeout';
  this.details.wasForceSubmitted = reason === 'force_submit';
  this.status.isActive = false;
  
  this.recordActivity('session_end', { reason });
  return this.save();
};

SessionSchema.methods.calculateRiskScore = function() {
  let riskScore = 0;
  
  // Violation-based scoring
  riskScore += this.proctoring.violations.severe * 10;
  riskScore += this.proctoring.violations.warnings * 3;
  
  // Tab switching penalty
  riskScore += this.proctoring.screen.tabSwitches.length * 2;
  
  // Camera violations
  riskScore += this.proctoring.camera.violations.length * 5;
  
  // Audio violations
  riskScore += this.proctoring.audio.violations.length * 4;
  
  // Network anomalies
  if (this.network.vpnDetected) riskScore += 5;
  if (this.network.proxyDetected) riskScore += 5;
  
  // Technical issues
  riskScore += this.technicalIssues.length * 1;
  
  // Normalize to 0-100 scale
  riskScore = Math.min(riskScore, 100);
  
  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 80) riskLevel = 'critical';
  else if (riskScore >= 60) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';
  
  this.proctoring.aiAnalysis.confidenceScore = riskScore / 100;
  this.proctoring.aiAnalysis.riskLevel = riskLevel;
  this.proctoring.aiAnalysis.suspiciousActivity = riskScore > 30;
  
  return this.save();
};

SessionSchema.methods.generateReport = function() {
  return {
    sessionId: this.sessionId,
    user: this.user,
    sessionType: this.sessionType,
    duration: this.sessionDuration,
    completionPercentage: this.completionPercentage,
    violationSeverity: this.violationSeverity,
    violations: this.proctoring.violations,
    riskLevel: this.proctoring.aiAnalysis.riskLevel,
    performance: this.performance,
    technicalIssues: this.technicalIssues.length,
    createdAt: this.createdAt,
    endedAt: this.details.endTime
  };
};

module.exports = mongoose.model('Session', SessionSchema); 