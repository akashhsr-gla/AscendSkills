'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Clock, 
  Home,
  Building2,
  Building,
  ExternalLink,
  Code
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import jobService from '@/services/jobService';

interface Job {
  _id: string;
  title: string;
  company: {
    name: string;
    logo: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
    industry: string;
    size: string;
    website: string;
  };
  description: string;
  requirements: {
    experience: {
      min: number;
      max: number;
      unit: string;
    };
  skills: string[];
    education: {
      level: string;
      field: string;
    };
    certifications: string[];
  };
  details: {
    type: string;
    location: {
      type: string;
      address: string;
    };
  salary: {
    min: number;
    max: number;
    currency: string;
      period: string;
    };
    benefits: string[];
    workSchedule: string;
  };
  status: {
    isActive: boolean;
    isFeatured: boolean;
    isUrgent: boolean;
  };
  applications: {
    total: number;
    viewed: number;
    shortlisted: number;
    hired: number;
  };
  tags: string[];
  category: string;
  jobProviderLink?: string;
  createdAt: string;
  updatedAt: string;
}

const JobPortalPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    experience: '',
    type: '',
    location: '',
    salaryRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalCount: 0
  });

  // Skills management state
  const [skills, setSkills] = useState<string[]>([]);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{ index: number; value: string } | null>(null);
  const [newSkill, setNewSkill] = useState('');

  // Fetch jobs from backend
  useEffect(() => {
    fetchJobs();
  }, [pagination.current]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getJobs({
        page: pagination.current,
        limit: 12,
        search: searchTerm || undefined,
        category: selectedFilters.category || undefined,
        type: selectedFilters.type || undefined,
        location: selectedFilters.location || undefined
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
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchJobs();
  }, [searchTerm, selectedFilters.category, selectedFilters.type, selectedFilters.location]);

  const categories = ['All', 'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Design', 'Engineering', 'Other'];
  const experienceLevels = ['All', 'Entry Level', '1-2 years', '2-4 years', '3-5 years', '5+ years', 'Senior Level'];
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const salaryRanges = ['All', '50k-80k', '80k-120k', '120k-160k', '160k+'];


  // Filter and search logic
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Search across all job content
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        // Search in title
        if (job.title.toLowerCase().includes(searchLower)) return true;
        
        // Search in company name
        if (job.company.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in company industry
        if (job.company.industry.toLowerCase().includes(searchLower)) return true;
        
        // Search in description
        if (job.description.toLowerCase().includes(searchLower)) return true;
        
        // Search in skills
        if (job.requirements.skills.some(skill => 
          skill.toLowerCase().includes(searchLower)
        )) return true;
        
        // Search in job type
        if (job.details.type.toLowerCase().includes(searchLower)) return true;
        
        // Search in location
        if (job.company.location.city.toLowerCase().includes(searchLower)) return true;
        if (job.company.location.state.toLowerCase().includes(searchLower)) return true;
        if (job.company.location.country.toLowerCase().includes(searchLower)) return true;
        
        // Search in category
        if (job.category.toLowerCase().includes(searchLower)) return true;
        
        // Search in tags
        if (job.tags.some(tag => tag.toLowerCase().includes(searchLower))) return true;
        
        return false;
      });
    }

    // Experience filter
    if (selectedFilters.experience && selectedFilters.experience !== 'All') {
      filtered = filtered.filter(job => {
        const jobExp = `${job.requirements.experience.min}-${job.requirements.experience.max} years`;
        return jobExp === selectedFilters.experience;
      });
    }



    // Salary filter
    if (selectedFilters.salaryRange && selectedFilters.salaryRange !== 'All') {
      const [min, max] = selectedFilters.salaryRange.split('-').map(s => s.replace('k', '000').replace('+', ''));
      filtered = filtered.filter(job => {
        if (max === '') { // 160k+
          return job.details.salary.min >= parseInt(min);
        }
        return job.details.salary.max >= parseInt(min) && job.details.salary.min <= parseInt(max);
      });
    }

    // Sort logic
    switch (sortBy) {
      case 'salary-high':
        filtered.sort((a, b) => b.details.salary.max - a.details.salary.max);
        break;
      case 'salary-low':
        filtered.sort((a, b) => a.details.salary.max - b.details.salary.max);
        break;
      case 'applicants':
        filtered.sort((a, b) => a.applications.total - b.applications.total);
        break;
      default: // recent
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Featured jobs first
    filtered.sort((a, b) => (b.status.isFeatured ? 1 : 0) - (a.status.isFeatured ? 1 : 0));

    return filtered;
  }, [jobs, selectedFilters, sortBy]);

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      category: '',
      experience: '',
      type: '',
      location: '',
      salaryRange: ''
    });
    setSearchTerm('');
  };



  const handleApplyNow = (job: Job) => {
    if (job.jobProviderLink) {
      // Ensure the link has proper protocol
      let link = job.jobProviderLink;
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
      }
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to application form or show message
      alert('Job application link not available. Please contact the company directly.');
    }
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

  const openSkillsModal = () => {
    setShowSkillsModal(true);
  };

  const formatSalary = (job: Job) => {
    const { min, max } = job.details.salary;
    // Always display in rupees with "k" format for better visibility
    return `₹${(min / 1000).toFixed(0)}k - ₹${(max / 1000).toFixed(0)}k yearly`;
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'Remote': return <Home className="w-4 h-4" />;
      case 'Hybrid': return <Building2 className="w-4 h-4" />;
      case 'On-site': return <Building className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'Remote': return 'bg-green-100 text-green-700 border-green-200';
      case 'Hybrid': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'On-site': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLocationString = (job: Job) => {
    const { city, state, country } = job.company.location;
    if (city && state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (country) {
      return country;
    }
    return 'Location not specified';
  };

  const getExperienceString = (job: Job) => {
    const { min, max, unit } = job.requirements.experience;
    if (min === max) {
      return `${min} ${unit}`;
    }
    return `${min}-${max} ${unit}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Dream{' '}
              <span className="text-gradient-primary">Career</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover amazing opportunities from top companies. Search across job titles, companies, 
              skills, locations, and descriptions to find the perfect match for your career goals.
            </p>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, skills, locations, or any job details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={fetchJobs}
                  className="btn-primary px-8 py-4 text-lg rounded-xl"
                >
                  Search Jobs
                </button>
              </div>
            </div>


          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">Category</label>
                <select
                  value={selectedFilters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {categories.map(category => (
                    <option key={category} value={category === 'All' ? '' : category} className="text-gray-900">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">Experience Level</label>
                <select
                  value={selectedFilters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {experienceLevels.map(level => (
                    <option key={level} value={level === 'All' ? '' : level} className="text-gray-900">
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">Work Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {jobTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('type', type === 'All' ? '' : type)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        selectedFilters.type === (type === 'All' ? '' : type)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        {type !== 'All' && getJobTypeIcon(type)}
                        <span className={type !== 'All' ? 'ml-2' : ''}>{type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">Salary Range</label>
                <select
                  value={selectedFilters.salaryRange}
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  {salaryRanges.map(range => (
                    <option key={range} value={range === 'All' ? '' : range} className="text-gray-900">
                      {range === 'All' ? 'All Ranges' : `₹${range}`}
                    </option>
                  ))}
                </select>
              </div>


            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {loading ? 'Loading...' : `${filteredJobs.length} Jobs Found`}
                </h2>
                <p className="text-gray-600">
                  {searchTerm ? `Showing results for "${searchTerm}"` : 'Showing all active jobs'}
                </p>
              </div>

              <div className="flex items-center space-x-4 mt-4 md:mt-0">
               
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn-secondary px-4 py-2 flex items-center"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="salary-high">Salary: High to Low</option>
                  <option value="salary-low">Salary: Low to High</option>
                  <option value="applicants">Fewest Applicants</option>
                </select>

                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <div className="w-4 h-4 flex flex-col justify-center space-y-1">
                      <div className="bg-current h-0.5 rounded"></div>
                      <div className="bg-current h-0.5 rounded"></div>
                      <div className="bg-current h-0.5 rounded"></div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            )}

            {/* Job Cards */}
            {!loading && (
            <AnimatePresence>
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                {filteredJobs.map((job, index) => (
                  <motion.div
                       key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                       className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden card-hover h-full flex flex-col"
                  >
                    {/* Job Card Header */}
                       <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                           <div className="flex items-center space-x-4 flex-1 min-w-0">
                             <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                            <Building className="w-6 h-6 text-white" />
                          </div>
                             <div className="min-w-0 flex-1">
                               <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer truncate">
                              {job.title}
                            </h3>
                               <p className="text-gray-600 truncate">{job.company.name}</p>
                          </div>
                        </div>
                        
                           <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                             {job.status.isFeatured && (
                               <span className="bg-gradient-primary text-white px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                              Featured
                            </span>
                          )}
                             {job.status.isUrgent && (
                               <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse whitespace-nowrap">
                              Urgent
                            </span>
                          )}

                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                           <div className="flex items-center text-gray-600 min-w-0">
                             <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                             <span className="text-sm truncate" title={getLocationString(job)}>
                               {getLocationString(job)}
                             </span>
                        </div>
                           <div className="flex items-center text-gray-600 min-w-0">
                             <span className="text-sm font-medium truncate" title={formatSalary(job)}>
                               {formatSalary(job)}
                             </span>
                        </div>
                           <div className="flex items-center text-gray-600 min-w-0">
                             <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                             <span className="text-sm truncate" title={getExperienceString(job)}>
                               {getExperienceString(job)}
                             </span>
                        </div>
                        <div className="flex items-center">
                             <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobTypeColor(job.details.location.type)} whitespace-nowrap`}>
                               {getJobTypeIcon(job.details.location.type)}
                               <span className="ml-1">{job.details.location.type}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                             {job.requirements.skills.slice(0, 4).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                                 className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs whitespace-nowrap"
                                 title={skill}
                            >
                              {skill}
                            </span>
                          ))}
                             {job.requirements.skills.length > 4 && (
                               <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs whitespace-nowrap">
                                 +{job.requirements.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                         <div className="mb-4 flex-1">
                           <p className="text-gray-600 text-sm leading-relaxed">
                             {job.description.length > 120 ? (
                               <>
                                 {job.description.substring(0, 120)}...
                                 <button 
                                   className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                                   onClick={() => {
                                     // Toggle full description view
                                     const element = document.getElementById(`desc-${job._id}`);
                                     if (element) {
                                       element.classList.toggle('line-clamp-2');
                                     }
                                   }}
                                 >
                                   Show more
                                 </button>
                               </>
                             ) : (
                               job.description
                             )}
                           </p>
                           {job.description.length > 120 && (
                             <p 
                               id={`desc-${job._id}`}
                               className="text-gray-600 text-sm leading-relaxed line-clamp-2 hidden"
                             >
                        {job.description}
                               <button 
                                 className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                                 onClick={() => {
                                   const element = document.getElementById(`desc-${job._id}`);
                                   if (element) {
                                     element.classList.toggle('line-clamp-2');
                                   }
                                 }}
                               >
                                   Show less
                               </button>
                             </p>
                           )}
                         </div>

                      {/* Footer */}
                         <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                           <div className="flex items-center space-x-4 text-sm text-gray-500 min-w-0">
                             <div className="flex items-center min-w-0">
                               <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                               <span className="truncate">{new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>

                        </div>

                                                      <div className="flex items-center space-x-2 flex-shrink-0">
                             <button 
                               onClick={() => handleApplyNow(job)}
                               className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                             >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            )}

            {/* Load More */}
            {!loading && filteredJobs.length > 0 && pagination.current < pagination.total && (
              <div className="text-center mt-12">
                <button 
                  onClick={() => {
                    setPagination(prev => ({ ...prev, current: prev.current + 1 }));
                  }}
                  className="btn-secondary px-8 py-3"
                >
                  Load More Jobs
                </button>
              </div>
            )}

            {/* No Results */}
            {!loading && filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more opportunities.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="btn-primary px-6 py-3"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Skills Management Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Manage Skills</h3>
              <button
                onClick={() => setShowSkillsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-2">
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
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-2">
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
              <div className="text-center py-8 text-gray-500">
                No skills added yet. Add some skills to get started.
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default JobPortalPage;