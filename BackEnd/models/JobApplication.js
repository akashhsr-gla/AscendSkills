const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Rejected', 'Hired'],
    default: 'Applied'
  },
  resume: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  coverLetter: {
    type: String,
    default: ''
  },
  experience: {
    years: Number,
    relevantSkills: [String],
    previousCompanies: [String]
  },
  education: {
    degree: String,
    institution: String,
    graduationYear: Number,
    gpa: Number
  },
  assessment: {
    quizScore: Number,
    interviewScore: Number,
    overallScore: Number,
    feedback: String
  },
  timeline: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  jobProviderLink: {
    type: String,
    default: '',
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
jobApplicationSchema.index({ applicant: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ jobProviderLink: 1 });
jobApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema); 