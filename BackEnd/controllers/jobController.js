const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all jobs with filtering and pagination
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      jobProviderLink,
      location,
      type,
      experience,
      salary,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      'status.isActive': true,
      isDeleted: false
    };

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Job provider link filter
    if (jobProviderLink) {
      query.jobProviderLink = jobProviderLink;
    }

    // Location filter
    if (location) {
      query['company.location.city'] = { $regex: location, $options: 'i' };
    }

    // Job type filter
    if (type) {
      query['details.type'] = type;
    }

    // Experience filter
    if (experience) {
      query['requirements.experience.min'] = { $lte: parseInt(experience) };
    }

    // Salary filter
    if (salary) {
      query['details.salary.min'] = { $gte: parseInt(salary) };
    }

    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const jobs = await Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs'
    });
  }
};

// Get job by ID
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const job = await Job.findById(id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'applications',
        select: 'applicant status createdAt',
        populate: {
          path: 'applicant',
          select: 'name email profile'
        }
      });

    if (!job || job.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job'
    });
  }
};

// Create new job
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const jobData = {
      ...req.body,
      createdBy: req.user.id,
      jobProviderLink: req.body.jobProviderLink || ''
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job'
    });
  }
};

// Update job
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const job = await Job.findById(id);
    if (!job || job.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is authorized to update this job
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job'
    });
  }
};

// Delete job
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job || job.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is authorized to delete this job
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    // Soft delete
    job.isDeleted = true;
    await job.save();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job'
    });
  }
};

// Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, experience, education, jobProviderLink } = req.body;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.isDeleted || !job.status.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }

    // Check if user already applied
    const existingApplication = await JobApplication.findOne({
      job: jobId,
      applicant: req.user.id,
      isDeleted: false
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    const application = new JobApplication({
      job: jobId,
      applicant: req.user.id,
      coverLetter,
      experience,
      education,
      jobProviderLink: jobProviderLink || '',
      timeline: [{
        status: 'Applied',
        notes: 'Application submitted'
      }]
    });

    await application.save();

    // Update job application count
    job.applications.total += 1;
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
};

// Get job applications (for job poster/admin)
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const job = await Job.findById(jobId);
    if (!job || job.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user is authorized to view applications
    if (job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    const query = {
      job: jobId,
      isDeleted: false
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const applications = await JobApplication.find(query)
      .populate('applicant', 'name email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobApplication.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
};

// Update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findById(applicationId)
      .populate('job');

    if (!application || application.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is authorized to update this application
    if (application.job.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    application.status = status;
    application.timeline.push({
      status,
      notes: notes || `Status updated to ${status}`
    });

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status'
    });
  }
};

// Get jobs by provider link
const getJobsByProviderLink = async (req, res) => {
  try {
    const { jobProviderLink } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = {
      'status.isActive': true,
      isDeleted: false,
      jobProviderLink: jobProviderLink
    };

    const skip = (page - 1) * limit;

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching jobs by provider link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs by provider link'
    });
  }
};

// Get job statistics
const getJobStatistics = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ isDeleted: false });
    const activeJobs = await Job.countDocuments({ 'status.isActive': true, isDeleted: false });
    const featuredJobs = await Job.countDocuments({ 'status.isFeatured': true, isDeleted: false });
    const urgentJobs = await Job.countDocuments({ 'status.isUrgent': true, isDeleted: false });

    const totalApplications = await JobApplication.countDocuments({ isDeleted: false });
    const pendingApplications = await JobApplication.countDocuments({ status: 'Applied', isDeleted: false });
    const shortlistedApplications = await JobApplication.countDocuments({ status: 'Shortlisted', isDeleted: false });
    const hiredApplications = await JobApplication.countDocuments({ status: 'Hired', isDeleted: false });

    const jobsByCategory = await Job.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const applicationsByStatus = await JobApplication.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          featured: featuredJobs,
          urgent: urgentJobs,
          byCategory: jobsByCategory
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          shortlisted: shortlistedApplications,
          hired: hiredApplications,
          byStatus: applicationsByStatus
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job statistics'
    });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getJobStatistics,
  getJobsByProviderLink
}; 