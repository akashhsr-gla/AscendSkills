const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// Public routes
router.get('/', jobController.getJobs);
router.get('/statistics', jobController.getJobStatistics);
router.get('/provider-link/:jobProviderLink', jobController.getJobsByProviderLink);
router.get('/:id', jobController.getJobById);

// Protected routes
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('Job title is required'),
  body('company.name').notEmpty().withMessage('Company name is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('category').isIn(['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Design', 'Engineering', 'Other']).withMessage('Invalid category'),
  body('requirements.skills').isArray().withMessage('Skills must be an array'),
  body('details.type').isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']).withMessage('Invalid job type'),
  body('details.location.type').isIn(['On-site', 'Remote', 'Hybrid']).withMessage('Invalid location type')
], jobController.createJob);

router.put('/:id', authenticate, [
  body('title').optional().notEmpty().withMessage('Job title cannot be empty'),
  body('company.name').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Job description cannot be empty'),
  body('category').optional().isIn(['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Design', 'Engineering', 'Other']).withMessage('Invalid category'),
  body('requirements.skills').optional().isArray().withMessage('Skills must be an array'),
  body('details.type').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']).withMessage('Invalid job type'),
  body('details.location.type').optional().isIn(['On-site', 'Remote', 'Hybrid']).withMessage('Invalid location type')
], jobController.updateJob);

router.delete('/:id', authenticate, jobController.deleteJob);

// Job application routes
router.post('/:jobId/apply', authenticate, [
  body('coverLetter').optional().isString().withMessage('Cover letter must be a string'),
  body('experience.years').optional().isNumeric().withMessage('Experience years must be a number'),
  body('experience.relevantSkills').optional().isArray().withMessage('Relevant skills must be an array'),
  body('education.degree').optional().isString().withMessage('Degree must be a string'),
  body('education.institution').optional().isString().withMessage('Institution must be a string'),
  body('education.graduationYear').optional().isNumeric().withMessage('Graduation year must be a number')
], jobController.applyForJob);

router.get('/:jobId/applications', authenticate, jobController.getJobApplications);
router.put('/applications/:applicationId/status', authenticate, [
  body('status').isIn(['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Rejected', 'Hired']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], jobController.updateApplicationStatus);

module.exports = router; 