'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Building,
  MapPin,
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import jobService, { Job, JobApplication } from '../services/jobService';

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

const AdminJobManagement: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    type: '',
    jobProviderLink: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalCount: 0
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Skills management state
  const [skills, setSkills] = useState<string[]>([]);
  const [editingSkill, setEditingSkill] = useState<{ index: number; value: string } | null>(null);
  const [newSkill, setNewSkill] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    company: {
      name: '',
      logo: '',
      location: {
        city: '',
        state: '',
        country: ''
      },
      industry: '',
      size: '',
      website: ''
    },
    description: '',
    requirements: {
      experience: {
        min: 0,
        max: 0,
        unit: 'years'
      },
      skills: [''],
      education: {
        level: 'Bachelor',
        field: ''
      },
      certifications: ['']
    },
    details: {
      type: 'Full-time',
      location: {
        type: 'On-site',
        address: ''
      },
      salary: {
        min: 0,
        max: 0,
        currency: 'USD',
        period: 'yearly'
      },
      benefits: [''],
      workSchedule: ''
    },
    status: {
      isActive: true,
      isFeatured: false,
      isUrgent: false
    },
    tags: [''],
    category: 'Technology',
    jobProviderLink: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobs({
        page: pagination.current,
        limit: 10,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        type: filters.type || undefined,
        jobProviderLink: filters.jobProviderLink || undefined
      });

      if (response.success) {
        setJobs(response.data.jobs);
        setPagination({
          current: response.data.pagination.page,
          total: response.data.pagination.pages,
          count: response.data.jobs.length,
          totalCount: response.data.pagination.total
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to fetch jobs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    try {
      const jobData = {
        ...formData,
        requirements: {
          ...formData.requirements,
          skills: skills
        }
      };
      const response = await jobService.createJob(jobData);
      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Job created successfully'
        });
        setShowCreateModal(false);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to create job'
      });
    }
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;
    
    try {
      const jobData = {
        ...formData,
        requirements: {
          ...formData.requirements,
          skills: skills
        }
      };
      const response = await jobService.updateJob(selectedJob._id, jobData);
      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Job updated successfully'
        });
        setShowEditModal(false);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to update job'
      });
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    
    try {
      const response = await jobService.deleteJob(selectedJob._id);
      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Job deleted successfully'
        });
        setShowDeleteModal(false);
        fetchJobs();
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to delete job'
      });
    }
  };



  const resetForm = () => {
    setSkills([]);
    setFormData({
      title: '',
      company: {
        name: '',
        logo: '',
        location: { city: '', state: '', country: '' },
        industry: '',
        size: '',
        website: ''
      },
      description: '',
      requirements: {
        experience: { min: 0, max: 0, unit: 'years' },
        skills: [''],
        education: { level: 'Bachelor', field: '' },
        certifications: ['']
      },
      details: {
        type: 'Full-time',
        location: { type: 'On-site', address: '' },
        salary: { min: 0, max: 0, currency: 'USD', period: 'yearly' },
        benefits: [''],
        workSchedule: ''
      },
      status: { isActive: true, isFeatured: false, isUrgent: false },
      tags: [''],
      category: 'Technology',
      jobProviderLink: ''
    });
  };

  const openEditModal = (job: Job) => {
    setSelectedJob(job);
    setSkills(job.requirements.skills || []);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      details: job.details,
      status: job.status,
      tags: job.tags,
      category: job.category,
      jobProviderLink: job.jobProviderLink || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (job: Job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };



  // Skills management functions
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const editSkill = (index: number) => {
    setEditingSkill({ index, value: skills[index] });
  };

  const saveSkillEdit = () => {
    if (editingSkill && editingSkill.value.trim()) {
      const updatedSkills = [...skills];
      updatedSkills[editingSkill.index] = editingSkill.value.trim();
      setSkills(updatedSkills);
      setEditingSkill(null);
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const formatSalary = (min: number, max: number, currency: string, period: string) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    // Always display in rupees with yearly format
    return `₹${formatNumber(min)} - ₹${formatNumber(max)} yearly`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Viewed': return 'bg-yellow-100 text-yellow-800';
      case 'Shortlisted': return 'bg-green-100 text-green-800';
      case 'Interview': return 'bg-purple-100 text-purple-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center justify-between ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
          <p className="text-gray-600">Manage job postings and applications</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Job
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Design">Design</option>
            <option value="Engineering">Engineering</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="featured">Featured</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="text"
            placeholder="Job Provider Link..."
            value={filters.jobProviderLink}
            onChange={(e) => setFilters({ ...filters, jobProviderLink: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchJobs}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter size={20} />
          </motion.button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new job posting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Provider Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{job.company.name}</div>
                      <div className="text-sm text-gray-500">{job.company.industry}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.company.location.city}, {job.company.location.state}
                      </div>
                      <div className="text-sm text-gray-500">{job.details.location.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSalary(job.details.salary.min, job.details.salary.max, job.details.salary.currency, job.details.salary.period)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.jobProviderLink ? (
                          <a 
                            href={job.jobProviderLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            View Job
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">No link</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {job.status.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {job.status.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        {job.status.isUrgent && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">

                        <button
                          onClick={() => openEditModal(job)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(job)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.totalCount)} of {pagination.totalCount} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setPagination({ ...pagination, current: pagination.current - 1 });
                fetchJobs();
              }}
              disabled={pagination.current === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => {
                setPagination({ ...pagination, current: pagination.current + 1 });
                fetchJobs();
              }}
              disabled={pagination.current === pagination.total}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-black">
              {showCreateModal ? 'Create New Job' : 'Edit Job'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Design">Design</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Provider Link</label>
                <input
                  type="url"
                  value={formData.jobProviderLink}
                  onChange={(e) => setFormData({ ...formData, jobProviderLink: e.target.value })}
                  placeholder="https://careers.company.com/jobs/12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Direct link to the job posting on the company's website</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.company.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    company: { ...formData.company, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company City *</label>
                <input
                  type="text"
                  value={formData.company.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    company: { ...formData.company, location: { ...formData.company.location, city: e.target.value } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company State *</label>
                <input
                  type="text"
                  value={formData.company.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    company: { ...formData.company, location: { ...formData.company.location, state: e.target.value } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., California"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Country *</label>
                <input
                  type="text"
                  value={formData.company.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    company: { ...formData.company, location: { ...formData.company.location, country: e.target.value } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., United States"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Industry</label>
                <input
                  type="text"
                  value={formData.company.industry}
                  onChange={(e) => setFormData({
                    ...formData,
                    company: { ...formData.company, industry: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min (₹k)</label>
                <input
                  type="text"
                  value={Math.floor(formData.details.salary.min / 1000)}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: { ...formData.details, salary: { ...formData.details.salary, min: (parseInt(e.target.value) || 0) * 1000 } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max (₹k)</label>
                <input
                  type="text"
                  value={Math.floor(formData.details.salary.max / 1000)}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: { ...formData.details, salary: { ...formData.details.salary, max: (parseInt(e.target.value) || 0) * 1000 } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Min (years)</label>
                <input
                  type="text"
                  value={formData.requirements.experience.min}
                  onChange={(e) => setFormData({
                    ...formData,
                    requirements: { ...formData.requirements, experience: { ...formData.requirements.experience, min: parseInt(e.target.value) || 0 } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Max (years)</label>
                <input
                  type="text"
                  value={formData.requirements.experience.max}
                  onChange={(e) => setFormData({
                    ...formData,
                    requirements: { ...formData.requirements, experience: { ...formData.requirements.experience, max: parseInt(e.target.value) || 0 } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                <select
                  value={formData.details.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: { ...formData.details, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Location Type *</label>
                <select
                  value={formData.details.location.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    details: { ...formData.details, location: { ...formData.details.location, type: e.target.value } }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Skills Management */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Enter skill name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Skill
                  </button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      {editingSkill?.index === index ? (
                        <div className="flex gap-2 flex-1">
                          <input
                            type="text"
                            value={editingSkill.value}
                            onChange={(e) => setEditingSkill({ ...editingSkill, value: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && saveSkillEdit()}
                          />
                          <button
                            onClick={saveSkillEdit}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSkill(null)}
                            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-gray-900">{skill}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => editSkill(index)}
                              className="px-3 py-1 text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeSkill(index)}
                              className="px-3 py-1 text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {skills.length === 0 && (
                  <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
                    No skills added yet. Add some skills to get started.
                  </div>
                )}
              </div>

              {/* Status Management */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">Job Status</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.status.isActive}
                      onChange={(e) => setFormData({
                        ...formData,
                        status: { ...formData.status, isActive: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Active
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.status.isFeatured}
                      onChange={(e) => setFormData({
                        ...formData,
                        status: { ...formData.status, isFeatured: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="flex items-center text-sm text-gray-700">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Featured
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={formData.status.isUrgent}
                      onChange={(e) => setFormData({
                        ...formData,
                        status: { ...formData.status, isUrgent: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isUrgent" className="flex items-center text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                      Urgent
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreateJob : handleUpdateJob}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showCreateModal ? 'Create Job' : 'Update Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Delete Job</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedJob.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminJobManagement; 