const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    location: {
      city: String,
      state: String,
      country: String
    },
    industry: String,
    size: String, // Small, Medium, Large
    website: String
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    experience: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['years', 'months'],
        default: 'years'
      }
    },
    skills: [String],
    education: {
      level: {
        type: String,
        enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Any'],
        default: 'Bachelor'
      },
      field: String
    },
    certifications: [String]
  },
  details: {
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
      default: 'Full-time'
    },
    location: {
      type: {
        type: String,
        enum: ['On-site', 'Remote', 'Hybrid'],
        default: 'On-site'
      },
      address: String
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly'
      }
    },
    benefits: [String],
    workSchedule: String
  },
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isUrgent: {
      type: Boolean,
      default: false
    }
  },
  applications: {
    total: {
      type: Number,
      default: 0
    },
    viewed: {
      type: Number,
      default: 0
    },
    shortlisted: {
      type: Number,
      default: 0
    },
    hired: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Design', 'Engineering', 'Other']
  },
  jobProviderLink: {
    type: String,
    default: '',
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ 'company.name': 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ jobProviderLink: 1 });
jobSchema.index({ 'status.isActive': 1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema); 