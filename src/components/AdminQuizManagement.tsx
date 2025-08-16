'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  Check,
  AlertCircle,
  Code,
  FileText,
  Target,
  Clock,
  Star,
  Tag,
  Save
} from 'lucide-react';
import { quizService } from '@/services/quizService';

interface QuizQuestionForm {
  title: string;
  content: string;
  type: 'mcqs' | 'fill_in_blanks' | 'true_false' | 'coding';
  category: string;
  categoryType: 'company' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  tags: string[];
  explanation: string;
  correctAnswer?: string;
  mcqs?: {
    options: string[];
    correctOptionIndex: number;
  };
  fillInBlanks?: {
    correctAnswer: string;
  };
  trueFalse?: {
    correctAnswer: boolean;
  };
  coding?: {
    starterCode: string;
    testCases: Array<{
      input: string;
      output: string;
      description: string;
    }>;
    language: string;
  };
}

const AdminQuizManagement: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalCount: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    categoryType: '',
    type: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    categoryType: '',
    type: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [formData, setFormData] = useState<QuizQuestionForm>({
    title: '',
    content: '',
    type: 'mcqs',
    category: '',
    categoryType: 'subjective',
    difficulty: 'medium',
    timeLimit: 60,
    tags: [],
    explanation: '',
    mcqs: {
      options: ['', '', '', ''],
      correctOptionIndex: 0
    },
    fillInBlanks: {
      correctAnswer: ''
    },
    trueFalse: {
      correctAnswer: true
    },
    coding: {
      starterCode: '',
      testCases: [],
      language: 'javascript'
    }
  });

  const questionTypes = [
    { value: 'mcqs', label: 'Multiple Choice', icon: Target },
    { value: 'fill_in_blanks', label: 'Fill in Blanks', icon: FileText },
    { value: 'true_false', label: 'True/False', icon: Check },
    { value: 'coding', label: 'Coding', icon: Code }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'text-green-600 bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'hard', label: 'Hard', color: 'text-red-600 bg-red-50' }
  ];

  useEffect(() => {
    fetchQuestions();
  }, [pagination.current, appliedFilters]);

  // Group questions by category
  const groupedQuestions = questions.reduce((groups: any, question: any) => {
    const category = question.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(question);
    return groups;
  }, {});

  const handleSearch = () => {
    setAppliedFilters({
      ...filters,
      search: searchTerm
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await quizService.getAdminQuizQuestions({
        page: pagination.current,
        limit: 10,
        ...appliedFilters
      });

      if (response.success && response.data) {
        setQuestions(response.data.questions);
        setPagination(response.data.pagination);
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to fetch questions'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while fetching questions'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      // Debug: Log the form data before processing
      console.log('=== CREATING TRUE/FALSE QUESTION ===');
      console.log('Form data before processing:', formData);
      console.log('Category type:', formData.categoryType);
      console.log('Question type:', formData.type);
      console.log('True/False data:', formData.trueFalse);
      
      // Prepare the data with correctAnswer based on question type
      const questionData = { ...formData };
      
      // Set correctAnswer based on question type
      switch (formData.type) {
        case 'mcqs':
          // Make sure we have valid MCQ data
          if (formData.mcqs?.options && formData.mcqs.options.length > 0) {
            const correctIndex = formData.mcqs.correctOptionIndex || 0;
            questionData.correctAnswer = formData.mcqs.options[correctIndex] || formData.mcqs.options[0];
          } else {
            questionData.correctAnswer = '';
          }
          break;
        case 'fill_in_blanks':
          questionData.correctAnswer = formData.fillInBlanks?.correctAnswer || '';
          break;
        case 'true_false':
          questionData.correctAnswer = formData.trueFalse?.correctAnswer?.toString() || '';
          // Also ensure the trueFalse.correctAnswer is properly set as boolean
          if (formData.trueFalse?.correctAnswer !== undefined) {
            questionData.trueFalse = {
              correctAnswer: formData.trueFalse.correctAnswer
            };
          }
          break;
        case 'coding':
          questionData.correctAnswer = formData.coding?.starterCode || '';
          break;
        default:
          questionData.correctAnswer = '';
      }

      // Ensure all required fields are present
      if (!questionData.title || !questionData.content || !questionData.category) {
        setNotification({
          type: 'error',
          message: 'Please fill in all required fields (Title, Content, Category)'
        });
        return;
      }

      // Check specific validation requirements
      if (questionData.title.length < 5) {
        setNotification({
          type: 'error',
          message: 'Title must be at least 5 characters long'
        });
        return;
      }

      if (questionData.content.length < 10) {
        setNotification({
          type: 'error',
          message: 'Content must be at least 10 characters long'
        });
        return;
      }

      if (questionData.explanation && questionData.explanation.length < 5) {
        setNotification({
          type: 'error',
          message: 'Explanation must be at least 5 characters long (or leave it empty)'
        });
        return;
      }

      // For MCQ questions, ensure we have valid options
      if (questionData.type === 'mcqs') {
        if (!questionData.mcqs?.options || questionData.mcqs.options.length === 0) {
          setNotification({
            type: 'error',
            message: 'Please provide at least one MCQ option'
          });
          return;
        }
        
        // Check if any option is empty
        const emptyOptions = questionData.mcqs.options.filter(option => !option.trim());
        if (emptyOptions.length > 0) {
          setNotification({
            type: 'error',
            message: 'All MCQ options must be filled in'
          });
          return;
        }
      }

      // For True/False questions, ensure we have a valid correct answer
      if (questionData.type === 'true_false') {
        if (formData.trueFalse?.correctAnswer === undefined) {
          setNotification({
            type: 'error',
            message: 'Please select True or False as the correct answer'
          });
          return;
        }
      }

      const response = await quizService.createAdminQuizQuestion(questionData);
      
      // Debug: Log the API response
      console.log('=== API RESPONSE ===');
      console.log('Response:', response);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Question created successfully!'
        });
        setShowCreateModal(false);
        resetForm();
        fetchQuestions();
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to create question'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while creating question'
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;
    
    try {
      // Prepare the data with correctAnswer based on question type
      const questionData = { ...formData };
      
      // Set correctAnswer based on question type
      switch (formData.type) {
        case 'mcqs':
          questionData.correctAnswer = formData.mcqs?.options[formData.mcqs?.correctOptionIndex || 0] || '';
          break;
        case 'fill_in_blanks':
          questionData.correctAnswer = formData.fillInBlanks?.correctAnswer || '';
          break;
        case 'true_false':
          questionData.correctAnswer = formData.trueFalse?.correctAnswer?.toString() || '';
          // Also ensure the trueFalse.correctAnswer is properly set as boolean
          if (formData.trueFalse?.correctAnswer !== undefined) {
            questionData.trueFalse = {
              correctAnswer: formData.trueFalse.correctAnswer
            };
          }
          break;
        case 'coding':
          questionData.correctAnswer = formData.coding?.starterCode || '';
          break;
        default:
          questionData.correctAnswer = '';
      }

      const response = await quizService.updateAdminQuizQuestion(selectedQuestion._id, questionData);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Question updated successfully!'
        });
        setShowEditModal(false);
        setSelectedQuestion(null);
        resetForm();
        fetchQuestions();
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to update question'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while updating question'
      });
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    
    try {
      const response = await quizService.deleteAdminQuizQuestion(selectedQuestion._id);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Question deleted successfully!'
        });
        setShowDeleteModal(false);
        setSelectedQuestion(null);
        fetchQuestions();
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to delete question'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Network error while deleting question'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'mcqs',
      category: '',
      categoryType: 'subjective',
      difficulty: 'medium',
      timeLimit: 60,
      tags: [],
      explanation: '',
      mcqs: {
        options: ['', '', '', ''],
        correctOptionIndex: 0
      },
      fillInBlanks: {
        correctAnswer: ''
      },
      trueFalse: {
        correctAnswer: true
      },
      coding: {
        starterCode: '',
        testCases: [],
        language: 'javascript'
      }
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMCQOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      mcqs: {
        ...prev.mcqs!,
        options: prev.mcqs!.options.map((option, i) => i === index ? value : option)
      }
    }));
  };

  const handleTagChange = (tags: string) => {
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: tagArray }));
  };

  const getQuestionTypeIcon = (type: string) => {
    const questionType = questionTypes.find(qt => qt.value === type);
    return questionType ? questionType.icon : BookOpen;
  };

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulties.find(d => d.value === difficulty);
    return diff ? diff.color : 'text-gray-600 bg-gray-50';
  };

  const openEditModal = (question: any) => {
    setSelectedQuestion(question);
    setFormData({
      title: question.title,
      content: question.content,
      type: question.type,
      category: question.category,
      categoryType: question.categoryType,
      difficulty: question.difficulty,
      timeLimit: question.timeLimit,
      tags: question.tags,
      explanation: question.explanation,
      mcqs: question.mcqs,
      fillInBlanks: question.fillInBlanks,
      trueFalse: question.trueFalse,
      coding: question.coding
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (question: any) => {
    setSelectedQuestion(question);
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
          <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
          <p className="text-gray-600">Manage quiz questions, categories, and content</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Question
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
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
              placeholder="e.g., Data Structures, Algorithms, JavaScript"
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
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
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

      {/* Questions List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600">Create your first question to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedQuestions).length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600">Try adjusting your search or filters.</p>
              </div>
            ) : (
              Object.entries(groupedQuestions).map(([category, categoryQuestions]: [string, any]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                      {categoryQuestions.length} question{categoryQuestions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {categoryQuestions.map((question: any) => {
                      const TypeIcon = getQuestionTypeIcon(question.type);
                      return (
                        <div key={question._id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <TypeIcon className="w-5 h-5 text-blue-600" />
                                <h4 className="text-sm font-medium text-gray-900">{question.title}</h4>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {question.timeLimit}s
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{question.content}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="capitalize">{question.type.replace('_', ' ')}</span>
                                <span className="capitalize">{question.categoryType}</span>
                                {question.tags && question.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {question.tags.slice(0, 2).join(', ')}
                                    {question.tags.length > 2 && ` +${question.tags.length - 2}`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => openEditModal(question)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(question)}
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

        {/* Pagination */}
        {questions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.totalCount)} of {pagination.totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.current} of {pagination.total}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.total}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
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
                {showCreateModal ? 'Create Question' : 'Edit Question'}
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter question title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Question Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    {questionTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Question Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter the question content"
                />
              </div>

              {/* Category and Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., Data Structures, Algorithms, JavaScript"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Category Type</label>
                  <select
                    value={formData.categoryType}
                    onChange={(e) => handleFormChange('categoryType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="subjective">Subjective</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleFormChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    {difficulties.map(diff => (
                      <option key={diff.value} value={diff.value}>{diff.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Limit and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Time Limit (seconds)</label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleFormChange('timeLimit', parseInt(e.target.value))}
                    min="10"
                    max="600"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="e.g., arrays, algorithms, data-structures"
                  />
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Explanation</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => handleFormChange('explanation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Explain the correct answer"
                />
              </div>

              {/* Question Type Specific Fields */}
              {formData.type === 'mcqs' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Multiple Choice Options</h3>
                  {formData.mcqs?.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={formData.mcqs?.correctOptionIndex === index}
                        onChange={() => handleFormChange('mcqs', { ...formData.mcqs!, correctOptionIndex: index })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleMCQOptionChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {formData.type === 'fill_in_blanks' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Correct Answer</label>
                  <input
                    type="text"
                    value={formData.fillInBlanks?.correctAnswer || ''}
                    onChange={(e) => handleFormChange('fillInBlanks', { correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter the correct answer"
                  />
                </div>
              )}

              {formData.type === 'true_false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Correct Answer</label>
                  <select
                    value={formData.trueFalse?.correctAnswer.toString()}
                    onChange={(e) => handleFormChange('trueFalse', { correctAnswer: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {formData.type === 'coding' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Programming Language</label>
                    <select
                      value={formData.coding?.language}
                      onChange={(e) => handleFormChange('coding', { ...formData.coding!, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Starter Code</label>
                    <textarea
                      value={formData.coding?.starterCode}
                      onChange={(e) => handleFormChange('coding', { ...formData.coding!, starterCode: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-mono text-sm"
                      placeholder="Enter starter code for the question"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateQuestion : handleUpdateQuestion}
                  className="flex items-center px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {showCreateModal ? 'Create Question' : 'Update Question'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Question</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminQuizManagement; 