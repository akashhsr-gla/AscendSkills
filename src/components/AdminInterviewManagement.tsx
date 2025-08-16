'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Code,
  Target,
  BookOpen,
  FileText,
  Star,
  Tag,
  Save,
  Users,
  Volume2,
  Video,
  Calendar,
  User,
  BarChart3,
  Clock
} from 'lucide-react';
import { interviewService } from '@/services/interviewService';
import { authService } from '@/services/authService';

interface InterviewForm {
  displayName: string;
  type: 'main' | 'subjective' | 'individual' | 'company';
  description: string;
  questions: Array<{
    title?: string;
    question?: string;
    content?: string;
    type: string;
    expectedDuration: number;
    difficulty?: string;
  }>;
}

const AdminInterviewManagement: React.FC = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    type: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  // Remove viewMode - only show categories

  const [formData, setFormData] = useState<InterviewForm>({
    displayName: '',
    type: 'main',
    description: '',
    questions: []
  });

  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral', icon: Users },
    { value: 'technical', label: 'Technical', icon: Code },
    { value: 'system_design', label: 'System Design', icon: Target },
    { value: 'coding', label: 'Coding', icon: FileText },
    { value: 'case_study', label: 'Case Study', icon: BookOpen }
  ];

  const statusOptions = [
    { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'completed', label: 'Completed', color: 'text-green-600 bg-green-50' }
  ];

  useEffect(() => {
    fetchInterviews();
  }, [appliedFilters]);



  // Group all interviews by type
  const groupedData = interviews.reduce((groups: any, item: any) => {
    const type = item.type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(item);
    return groups;
  }, {});

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchTerm
    };
    setAppliedFilters(newFilters);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
  };



  const fetchInterviews = async () => {
    try {
      setLoading(true);
      console.log('Admin Panel - About to fetch categories...');
      
      // Fetch interview categories
      const categories = await interviewService.getCategories();

      
      // Fetch questions for each category
      const categoriesWithQuestions = await Promise.all(
        categories.map(async (category) => {
          try {
            const questionsData = await interviewService.getQuestionsByCategory(category._id);
            return {
              ...category,
              questions: questionsData.questions || []
            };
          } catch (error) {
            console.warn(`Failed to fetch questions for category ${category._id}:`, error);
            return {
              ...category,
              questions: []
            };
          }
        })
      );
      
      setInterviews(categoriesWithQuestions);

    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while fetching interview categories'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInterview = async () => {
    try {
      if (!formData.displayName || !formData.type || !formData.description) {
        setNotification({
          type: 'error',
          message: 'Please fill in all required fields (Name, Type, Description)'
        });
        return;
      }

      

      // Convert form data to backend format for creating a category
      const backendData = {
        name: formData.displayName.toLowerCase().replace(/\s+/g, '_'),
        displayName: formData.displayName,
        description: formData.description,
        type: formData.type,
        icon: 'book-open',
        color: '#3B82F6',
        questions: formData.questions.map(q => ({
          title: q.title || 'Untitled',
          content: q.content || q.question || '',
          type: q.type,
          difficulty: q.difficulty || 'medium',
          expectedDuration: q.expectedDuration,
          metadata: {
            estimatedTime: q.expectedDuration,
            points: 10
          }
        })),
        interviewConfig: {
          defaultDuration: 300,
          questionCount: formData.questions.length,
          allowFollowUps: true,
          enableVoiceRecording: true,
          enableVideoRecording: false,
          scoringCriteria: []
        },
        status: {
          isActive: true,
          isPublic: true,
          isFeatured: false,
          sortOrder: 0
        }
      };


      const response = await interviewService.createAdminInterview(backendData);

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Interview category created successfully'
        });
        setShowCreateModal(false);
        resetForm();
        fetchInterviews();
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to create interview category'
        });
      }
    } catch (error) {
      console.error('❌ Error creating category:', error);
      setNotification({
        type: 'error',
        message: `Network error while creating interview category: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const handleUpdateInterview = async () => {
    try {
      if (!selectedInterview) return;

      console.log('🔄 Updating category with form data:', formData);
      console.log('🔄 Selected interview:', selectedInterview);

      const updateData = {
        displayName: formData.displayName,
        description: formData.description,
        type: formData.type,
        questions: formData.questions.map(q => ({
          title: q.title || 'Untitled',
          content: q.content || q.question || '',
          type: q.type,
          difficulty: q.difficulty || 'medium',
          expectedDuration: q.expectedDuration,
          metadata: {
            estimatedTime: q.expectedDuration,
            points: 10
          }
        })),
        interviewConfig: {
          defaultDuration: 300,
          questionCount: formData.questions.length,
          allowFollowUps: true,
          enableVoiceRecording: true,
          enableVideoRecording: false,
          scoringCriteria: []
        },
        status: {
          isActive: true,
          isPublic: true,
          isFeatured: false,
          sortOrder: 0
        }
      };

      const response = await interviewService.updateAdminInterview(selectedInterview._id, updateData);

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Interview category updated successfully'
        });
        setShowEditModal(false);
        setSelectedInterview(null);
        resetForm();
        fetchInterviews();
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to update interview category'
        });
      }
    } catch (error) {
      console.error('❌ Error updating category:', error);
      setNotification({
        type: 'error',
        message: `Network error while updating interview category: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  const handleDeleteInterview = async () => {
    try {
      if (!selectedInterview) {
        console.error('No interview selected for deletion');
        return;
      }

      // Validate interview ID - ensure it's a real MongoDB ObjectId
      if (!selectedInterview._id || 
          selectedInterview._id.startsWith('sample-') || 
          selectedInterview._id.length !== 24 || 
          !/^[0-9a-fA-F]{24}$/.test(selectedInterview._id)) {
        console.warn('Cannot delete invalid interview ID:', selectedInterview._id);
        setNotification({
          type: 'error',
          message: 'Cannot delete invalid interviews. Please select a real interview from the list.'
        });
        return;
      }

      console.log('Attempting to delete interview category:', {
        id: selectedInterview._id,
        title: selectedInterview.displayName,
        type: selectedInterview.type,
        fullObject: selectedInterview
      });
      
      const response = await interviewService.deleteAdminInterview(selectedInterview._id);
      console.log('Delete response:', response);

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Interview category deleted successfully'
        });
        setShowDeleteModal(false);
        setSelectedInterview(null);
        
        // Refresh the categories
        await fetchInterviews();
        
        console.log('Interview category deleted successfully, refreshed data');
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to delete interview category'
        });
        console.error('Delete failed:', response.message);
      }
    } catch (error) {
      console.error('Error deleting interview category:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Network error while deleting interview category';
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          errorMessage = 'Interview category not found. It may have been deleted already.';
        } else if (error.message.includes('Authentication failed')) {
          errorMessage = 'Authentication failed. Please login as admin.';
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'Access denied. Admin privileges required.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setNotification({
        type: 'error',
        message: errorMessage
      });
    }
  };

  // Question management functions - REMOVED - now handled in main modal
  const openAddQuestionModal = (category: any) => {
    // This function is no longer needed - questions are managed in the main modal
    setNotification({
      type: 'error',
      message: 'Please use the main category modal to manage questions.'
    });
  };

  const openEditQuestionModal = (category: any, question: any) => {
    // This function is no longer needed - questions are managed in the main modal
    setNotification({
      type: 'error',
      message: 'Please use the main category modal to manage questions.'
    });
  };

  const handleSaveQuestion = async () => {
    // This function is no longer needed - questions are managed in the main modal
    setNotification({
      type: 'error',
      message: 'Questions are managed through the category modal. Please use the main form.'
    });
  };

  const handleDeleteQuestion = async (category: any, question: any) => {
    // This function is no longer needed - individual question deletion is handled in the main modal
    // When editing a category, users can remove questions from the form and save the entire category
    setNotification({
      type: 'error',
      message: 'Please use the main category modal to manage questions. Remove questions from the form and save the category.'
    });
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      type: 'main',
      description: '',
      questions: []
    });
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        title: '',
        content: '',
        type: 'behavioral',
        expectedDuration: 300,
        difficulty: 'medium'
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      questions: updatedQuestions
    }));
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const editQuestion = (index: number) => {
    const questionToEdit = formData.questions[index];
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? questionToEdit : q))
    }));
  };


  const getInterviewTypeIcon = (type: string) => {
    const interviewType = interviewTypes.find(t => t.value === type);
    return interviewType ? interviewType.icon : BookOpen;
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'text-gray-600 bg-gray-50';
  };

  const openEditModal = (interview: any) => {
    setSelectedInterview(interview);
    setFormData({
      displayName: interview.displayName || '',
      type: interview.type || 'main',
      description: interview.description || '',
      questions: interview.questions?.map((q: any) => ({
        title: q.title || '',
        content: q.content || q.question || '',
        type: q.type || 'behavioral',
        expectedDuration: q.expectedDuration || q.metadata?.estimatedTime || 300,
        difficulty: q.difficulty || 'medium'
      })) || []
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (interview: any) => {
    console.log('Opening delete modal for interview:', interview);
    setSelectedInterview(interview);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification.type && (
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
          <button onClick={() => setNotification({ type: null, message: '' })}>
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
          <p className="text-gray-600">Manage interview categories and sessions</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Category
          </button>
        </div>
      </div>

              {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          {/* Filter Summary */}
          {Object.values(appliedFilters).some(value => value !== '' && value !== 'createdAt' && value !== 'desc') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                  {appliedFilters.search && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: {appliedFilters.search}
                    </span>
                  )}
                  {appliedFilters.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Category: {appliedFilters.category}
                    </span>
                  )}
                  {appliedFilters.type && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Type: {appliedFilters.type}
                    </span>
                  )}
                  {appliedFilters.status && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Status: {appliedFilters.status}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                                      setAppliedFilters({
                    search: '',
                    category: '',
                    type: '',
                    status: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                  setSearchTerm('');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="e.g., Frontend, Backend, System Design"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Types</option>
              {interviewTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      

        {/* Interviews List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading interview categories...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No interview categories found</h3>
            <p className="text-gray-600">Create your first interview category to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedData).length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No interview categories found</h3>
                <p className="text-gray-600">Try adjusting your search or filters.</p>
              </div>
            ) : (
              Object.entries(groupedData).map(([groupKey, groupItems]: [string, any]) => (
                <div key={groupKey} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {groupKey} Categories ({groupItems.length} items)
                    </h3>
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                      {groupItems.length} categor{groupItems.length !== 1 ? 'ies' : 'y'}
                    </span>
                  </div>
                  {/* Debug: Show item IDs being rendered */}
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Rendering items: {groupItems.map((item: any) => item._id?.slice(-6) || 'no-id').join(', ')}
                  </div>
                  
                  <div className="space-y-3">
                    {groupItems.map((item: any) => {
                      const TypeIcon = getInterviewTypeIcon(item.type);
                      return (
                        <div key={item._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <TypeIcon className="w-5 h-5 text-blue-600" />
                                <h4 className="text-sm font-medium text-gray-900">
                                  {item.displayName}
                                </h4>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${item.status?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {item.status?.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {item.type}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                <span className="capitalize">{item.type.replace('_', ' ')}</span>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.interviewConfig?.defaultDuration || 300}s
                                </div>
                                <div className="flex items-center">
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  {item.statistics?.totalQuestions || 0} questions
                                </div>
                              </div>
                              
                              {/* Description and Statistics */}
                              <p className="text-xs text-gray-600 mt-2">{item.description}</p>
                              
                              {/* Statistics */}
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-xs font-medium text-gray-700">Statistics</h5>
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    Edit Category
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div>Easy: {item.statistics?.easyQuestions || 0}</div>
                                  <div>Medium: {item.statistics?.mediumQuestions || 0}</div>
                                  <div>Hard: {item.statistics?.hardQuestions || 0}</div>
                                  <div>Total: {item.statistics?.totalQuestions || 0}</div>
                                </div>
                              </div>
                              
                              {/* Questions Preview */}
                              {item.questions && item.questions.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-gray-700">Questions ({item.questions.length})</h5>
                                    <button
                                      onClick={() => setSelectedInterview(item)}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      View All Questions
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {item.questions.slice(0, 3).map((q: any, index: number) => (
                                      <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                                        <div className="flex items-start justify-between">
                                          <span className="font-medium text-gray-700">Q{index + 1}: {q.title || 'Untitled'}</span>
                                          <span className="text-xs text-gray-500 capitalize">{q.type}</span>
                                        </div>
                                        <p className="mt-1 text-gray-600 line-clamp-2">{q.content || q.question}</p>
                                      </div>
                                    ))}
                                    {item.questions.length > 3 && (
                                      <div className="text-xs text-gray-500 text-center py-1">
                                        +{item.questions.length - 3} more questions
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                                {item.interviewConfig?.enableVoiceRecording && (
                                  <div className="flex items-center">
                                    <Volume2 className="w-3 h-3 mr-1" />
                                    Voice
                                  </div>
                                )}
                                {item.interviewConfig?.enableVideoRecording && (
                                  <div className="flex items-center">
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedInterview(item)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}


      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {showCreateModal ? 'Create Interview Category' : 'Edit Interview Category'}
              </h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-900 mb-2">Category Name *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleFormChange('displayName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Interview category name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="main">Main</option>
                    <option value="subjective">Subjective</option>
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Interview category description"
                  />
                </div>
              </div>



              {/* Questions Management */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Question {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editQuestion(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={(question as any).title || ''}
                            onChange={(e) => updateQuestion(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter the question title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Question Type</label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="behavioral">Behavioral</option>
                            <option value="technical">Technical</option>
                            <option value="coding">Coding</option>
                            <option value="system_design">System Design</option>
                            <option value="case_study">Case Study</option>
                            <option value="sql">SQL</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duration (seconds)</label>
                          <input
                            type="number"
                            value={question.expectedDuration}
                            onChange={(e) => updateQuestion(index, 'expectedDuration', parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                          <select
                            value={(question as any).difficulty || 'medium'}
                            onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Question Text</label>
                        <textarea
                          value={(question as any).content || ''}
                          onChange={(e) => updateQuestion(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter the question text..."
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formData.questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No questions added yet. Click "Add Question" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                  <button
                    onClick={showCreateModal ? handleCreateInterview : handleUpdateInterview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {showCreateModal ? 'Create Category' : 'Update Category'}
                  </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Questions Modal */}
      {selectedInterview && !showDeleteModal && !showCreateModal && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Category Questions</h3>
                <p className="text-gray-600">{selectedInterview.displayName || selectedInterview.title}</p>
              </div>
              <button 
                onClick={() => setSelectedInterview(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedInterview.questions && selectedInterview.questions.length > 0 ? (
                selectedInterview.questions.map((question: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Q{index + 1}
                        </span>
                        <span className="text-xs text-gray-500 capitalize bg-gray-200 px-2 py-1 rounded">
                          {question.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.expectedDuration || 60}s
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{question.title || 'Untitled'}</h4>
                    <p className="text-gray-900 whitespace-pre-line">{question.content || question.question}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No questions found for this interview.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Delete Interview</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>"{selectedInterview?.displayName || 'Unknown Category'}"</strong>?
              <br />
              <span className="text-sm text-gray-500">
                ID: {selectedInterview?._id || 'No ID'} | Type: {selectedInterview?.type || 'Unknown'}
              </span>
              <br />
              This will also delete all questions in this category. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInterview}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Question Management Modal */}
      {/* Removed Question Management Modal */}
    </div>
  );
};

export default AdminInterviewManagement; 