'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, BookOpen, Video, User, Bell, Calendar, Star, CheckCircle, Flame, Award, ArrowRight, ArrowLeft, CreditCard, Check, X, Menu, Edit, Save } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { activityService, ActivityItem } from '@/services/activityService';
import { profileService, UserProfile } from '@/services/profileService';
import { subscriptionService, UserSubscription, SubscriptionPlan } from '@/services/subscriptionService';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import PaymentModal from '@/components/PaymentModal';
import RazorpayModal from '@/components/RazorpayModal';

const DashboardPage = () => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    interviews: 0,
    quizzes: 0
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [saving, setSaving] = useState(false);
  const [allInterviews, setAllInterviews] = useState<ActivityItem[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<ActivityItem[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const { user } = useAuth();

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    degree: '',
    fieldOfStudy: '',
    yearOfCompletion: '',
    cgpa: '',
    location: '',
    skills: '',
    bio: ''
  });

  // Original profile data for reset functionality
  const [originalProfileData, setOriginalProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    degree: '',
    fieldOfStudy: '',
    yearOfCompletion: '',
    cgpa: '',
    location: '',
    skills: '',
    bio: ''
  });

  const userProfile = {
    name: user?.name || 'Guest User',
    level: 'Intermediate',
    points: 2850,
    streak: 15,
    completedQuizzes: 45,
    achievements: 12,
    ranking: 8
  };

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication before loading data
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch recent activity - get 5 recent interviews and 5 recent quizzes
        try {
          console.log('Fetching recent activity...');
          const [interviewsResponse, quizzesResponse] = await Promise.all([
            activityService.getAllInterviews(),
            activityService.getAllQuizzes()
          ]);
          
          const recentActivities: ActivityItem[] = [];
          
          // Add 5 most recent interviews
          if (interviewsResponse.success && interviewsResponse.data.length > 0) {
            const recentInterviews = interviewsResponse.data.slice(0, 5);
            recentActivities.push(...recentInterviews);
          }
          
          // Add 5 most recent quizzes
          if (quizzesResponse.success && quizzesResponse.data.length > 0) {
            const recentQuizzes = quizzesResponse.data.slice(0, 5);
            recentActivities.push(...recentQuizzes);
          }
          
          // Sort by time (most recent first)
          recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          
          console.log('Recent activities:', recentActivities);
          setRecentActivity(recentActivities);
        } catch (error) {
          console.error('Error fetching recent activity:', error);
          setRecentActivity([]);
        }

        // Fetch user statistics (total counts)
        const statsResponse = await activityService.getUserStats();
        console.log('Stats response:', statsResponse);
        if (statsResponse.success && statsResponse.data) {
          setStats({
            interviews: statsResponse.data.totalInterviews || 0,
            quizzes: statsResponse.data.totalQuizzes || 0
          });
        } else {
          // Fallback: try to get counts from individual API calls
          try {
            const [interviewsResponse, quizzesResponse] = await Promise.all([
              activityService.getAllInterviews(),
              activityService.getAllQuizzes()
            ]);
            
            setStats({
              interviews: interviewsResponse.success ? interviewsResponse.data.length : 0,
              quizzes: quizzesResponse.success ? quizzesResponse.data.length : 0
            });
          } catch (fallbackError) {
            console.warn('Failed to get fallback stats:', fallbackError);
          }
        }

        // Fetch all interviews for history section
        const allInterviewsResponse = await activityService.getAllInterviews();
        if (allInterviewsResponse.success) {
          setAllInterviews(allInterviewsResponse.data);
        }

        // Fetch all quizzes for history section
        const allQuizzesResponse = await activityService.getAllQuizzes();
        if (allQuizzesResponse.success) {
          setAllQuizzes(allQuizzesResponse.data);
        }

        // Fetch user profile
        const profileResponse = await profileService.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const userData = profileResponse.data;
          const profileFormData = {
            fullName: userData.name || '',
            email: userData.email || '',
            phone: userData.profile?.phone || '',
            college: userData.profile?.college || '',
            degree: userData.profile?.degree || '',
            fieldOfStudy: userData.profile?.branch || '',
            yearOfCompletion: userData.profile?.year?.toString() || '',
            cgpa: userData.profile?.cgpa?.toString() || '',
            location: userData.profile?.location || '',
            skills: Array.isArray(userData.profile?.skills) ? userData.profile.skills.join(', ') : '',
            bio: userData.profile?.bio || ''
          };
          
          setProfileData(profileFormData);
          setOriginalProfileData(profileFormData);
          
          // Set user subscription from profile data
          if (userData.subscription) {
            const subscription: UserSubscription = {
              type: userData.subscription.type as UserSubscription['type'],
              startDate: userData.subscription.startDate ? (typeof userData.subscription.startDate === 'string' ? userData.subscription.startDate : userData.subscription.startDate.toISOString()) : null,
              endDate: userData.subscription.endDate ? (typeof userData.subscription.endDate === 'string' ? userData.subscription.endDate : userData.subscription.endDate.toISOString()) : null,
              isActive: userData.subscription.isActive,
              paymentStatus: userData.subscription.paymentStatus as UserSubscription['paymentStatus'],
              transactionId: userData.subscription.transactionId || null,
              amount: userData.subscription.amount,
              features: userData.subscription.features || []
            };
            setUserSubscription(subscription);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle profile form changes
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    // Validation
    const errors: string[] = [];
    
    if (!profileData.fullName.trim()) {
      errors.push('Full Name is required');
    }
    
    if (!profileData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (profileData.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(profileData.phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    if (profileData.cgpa && (parseFloat(profileData.cgpa) < 0 || parseFloat(profileData.cgpa) > 10)) {
      errors.push('CGPA must be between 0 and 10');
    }
    
    if (profileData.yearOfCompletion && (parseInt(profileData.yearOfCompletion) < 1900 || parseInt(profileData.yearOfCompletion) > 2030)) {
      errors.push('Please enter a valid year of completion');
    }

    if (errors.length > 0) {
      setNotification({
        type: 'error',
        message: errors.join('. ')
      });
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        name: profileData.fullName.trim(),
        profile: {
          phone: profileData.phone.trim(),
          college: profileData.college.trim(),
          degree: profileData.degree,
          branch: profileData.fieldOfStudy.trim(),
          year: profileData.yearOfCompletion ? parseInt(profileData.yearOfCompletion) : undefined,
          cgpa: profileData.cgpa ? parseFloat(profileData.cgpa) : undefined,
          location: profileData.location.trim(),
          skills: profileData.skills ? profileData.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [],
          bio: profileData.bio.trim()
        }
      };

      const response = await profileService.updateProfile(updateData);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Profile updated successfully!'
        });
        // Update original data with new values
        setOriginalProfileData({ ...profileData });
        // Return to read-only mode after successful save
        setIsEditingProfile(false);
      } else {
        setNotification({
          type: 'error',
          message: response.message || 'Failed to update profile. Please try again.'
        });
      }
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setNotification({
        type: 'error',
        message: 'Network error while updating profile. Please try again.'
      });
      
      // Clear error notification after 5 seconds
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Change password function
  const handleChangePassword = () => {
    setNotification({
      type: 'success',
      message: 'Password change request sent! Check your email for instructions.'
    });
    
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 3000);
  };

  // Delete account function
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setNotification({
        type: 'error',
        message: 'Account deletion request sent. You will receive a confirmation email.'
      });
      
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
    }
  };

  // Fetch available subscription plans
  const fetchAvailablePlans = async () => {
    setSubscriptionLoading(true);
    try {
      const response = await subscriptionService.getAvailablePlans();
      if (response.success && response.data) {
        setAvailablePlans(response.data);
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Load subscription data when subscription section is active
  useEffect(() => {
    if (activeSection === 'subscription' && availablePlans.length === 0) {
      fetchAvailablePlans();
    }
  }, [activeSection]);

  // Handle plan selection
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    // Check if user already has an active subscription
    if (userSubscription && userSubscription.isActive && userSubscription.type !== 'free') {
      setNotification({
        type: 'error',
        message: 'You already have an active subscription. Please check your current plan details.'
      });
      return;
    }
    
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // Handle payment modal close
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  // Handle Razorpay modal close
  const handleRazorpayModalClose = () => {
    setShowRazorpayModal(false);
    setSelectedPlan(null);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-500' },
    { id: 'quiz', label: 'Quiz', icon: BookOpen, color: 'text-green-500', count: stats.quizzes },
    { id: 'interview', label: 'Interview', icon: Video, color: 'text-red-500', count: stats.interviews },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, color: 'text-orange-500' },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-indigo-500' }
  ];

  const quickStats = [
    { title: 'Interviews Given', value: stats.interviews.toString(), icon: Video, color: 'bg-red-500' },
    { title: 'Quizzes Completed', value: stats.quizzes.toString(), icon: CheckCircle, color: 'bg-green-500' }
  ];

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Notification */}
      {notification.type && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
          <button
            onClick={() => setNotification({ type: null, message: '' })}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
      
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Mobile Menu Toggle */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 transition-colors"
          >
            <Menu className="w-6 h-6" />
            <span className="font-medium">Menu</span>
          </button>
        </div>

        {/* Sidebar */}
        <div className={`${
          sidebarCollapsed 
            ? 'w-16' 
            : 'w-full lg:w-80'
          } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col ${
            sidebarCollapsed ? 'hidden lg:flex' : 'flex'
          }`}>
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <Image
                    src="/aslogo.svg"
                    alt="Ascend Skills"
                    width={40}
                    height={40}
                    className="h-10 w-auto"
                  />
                  <div className="ml-3">
                    <h2 className="text-lg font-bold text-gray-900">Ascend Skills</h2>
                    <p className="text-sm text-gray-600 hidden sm:block">Student Dashboard</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
              >
                {sidebarCollapsed ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      // Close mobile sidebar after selection
                      if (window.innerWidth < 1024) {
                        setSidebarCollapsed(true);
                      }
                    }}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : item.color}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.count && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 text-sm lg:text-base">Hello {userProfile.name}!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Content based on active section */}
            {activeSection === 'dashboard' && (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Recent Activity</h3>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity && recentActivity.length > 0 ? (
                      recentActivity.map((activity) => {
                        const IconComponent = getIconComponent(activity.icon);
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start space-x-3 lg:space-x-4 p-3 lg:p-4 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${activity.color} flex-shrink-0`}>
                              <IconComponent className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{activity.title}</h4>
                                {activity.score && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                    activity.score >= 80 ? 'bg-green-100 text-green-700' :
                                    activity.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {activity.score}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                                <span className="text-xs text-gray-500">{activity.time}</span>
                                {activity.status && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                    activity.status === 'completed' || activity.status === 'Passed' ? 'bg-green-100 text-green-700' :
                                    activity.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {activity.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 lg:py-8">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
                        </div>
                        <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-2">Not attempted</h4>
                        <p className="text-gray-500 mb-4 lg:mb-6 text-sm lg:text-base">Start your learning journey by attempting your first quiz or coding problem!</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button 
                            onClick={() => window.location.href = '/quiz'}
                            className="px-4 lg:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm lg:text-base"
                          >
                            Attempt Quiz
                          </button>
                          <button 
                            onClick={() => window.location.href = '/interview'}
                            className="px-4 lg:px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium text-sm lg:text-base"
                          >
                            Attempt Interview
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'interview' && (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Interview History</h3>
                <div className="space-y-4 lg:space-y-6">
                  {allInterviews.map((interview) => {
                    const isExpanded = expandedItems.has(interview.id);
                    const details = interview.details?.interview;
                    
                    return (
                      <div key={interview.id} className="border border-gray-200 rounded-lg p-3 lg:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{interview.title}</h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${
                              interview.status === 'completed' ? 'bg-green-100 text-green-700' :
                              interview.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {interview.status}
                            </span>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedItems);
                                if (isExpanded) {
                                  newExpanded.delete(interview.id);
                                } else {
                                  newExpanded.add(interview.id);
                                }
                                setExpandedItems(newExpanded);
                              }}
                              className="px-2 lg:px-3 py-1 lg:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-xs lg:text-sm"
                            >
                              {isExpanded ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2 text-sm lg:text-base">{interview.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs lg:text-sm text-gray-500 mb-3">
                          <span>{interview.time}</span>
                          {interview.score && (
                            <span className="font-medium">Score: {interview.score}%</span>
                          )}
                        </div>
                        
                        {isExpanded && details && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Assessment Breakdown */}
                            {details.finalAssessment && (
                              <div className="mb-4">
                                <h5 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">Assessment Breakdown</h5>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                                  <div className="text-center p-2 bg-blue-50 rounded">
                                    <div className="text-xs lg:text-sm text-gray-700 font-medium">Communication</div>
                                    <div className="font-semibold text-gray-900 text-sm lg:text-base">{details.finalAssessment.breakdown.communication}%</div>
                                  </div>
                                  <div className="text-center p-2 bg-green-50 rounded">
                                    <div className="text-xs lg:text-sm text-gray-700 font-medium">Technical</div>
                                    <div className="font-semibold text-gray-900 text-sm lg:text-base">{details.finalAssessment.breakdown.technical}%</div>
                                  </div>
                                  <div className="text-center p-2 bg-yellow-50 rounded">
                                    <div className="text-xs lg:text-sm text-gray-700 font-medium">Problem Solving</div>
                                    <div className="font-semibold text-gray-900 text-sm lg:text-base">{details.finalAssessment.breakdown.problemSolving}%</div>
                                  </div>
                                  <div className="text-center p-2 bg-purple-50 rounded">
                                    <div className="text-xs lg:text-sm text-gray-700 font-medium">Confidence</div>
                                    <div className="font-semibold text-gray-900 text-sm lg:text-base">{details.finalAssessment.breakdown.confidence}%</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Strengths & Improvements */}
                            {details.finalAssessment && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                {details.finalAssessment.strengths && details.finalAssessment.strengths.length > 0 && (
                                  <div>
                                    <h6 className="font-semibold text-green-700 mb-2 text-sm lg:text-base">Strengths</h6>
                                    <ul className="text-xs lg:text-sm space-y-1">
                                      {details.finalAssessment.strengths.map((strength, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <span className="text-green-500 mr-2">•</span>
                                          <span className="text-gray-900">{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {details.finalAssessment.improvements && details.finalAssessment.improvements.length > 0 && (
                                  <div>
                                    <h6 className="font-semibold text-orange-700 mb-2 text-sm lg:text-base">Areas for Improvement</h6>
                                    <ul className="text-xs lg:text-sm space-y-1">
                                      {details.finalAssessment.improvements.map((improvement, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <span className="text-orange-500 mr-2">•</span>
                                          <span className="text-gray-900">{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Questions & Responses */}
                            {details.questions && details.questions.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">Questions & Responses</h5>
                                <div className="space-y-3 lg:space-y-4">
                                  {details.questions.map((q, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-2 lg:p-3">
                                      <div className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Q{idx + 1}: {q.question}</div>
                                      <div className="text-xs lg:text-sm text-gray-700 mb-2">
                                        <span className="font-medium text-gray-900">Your Answer:</span> {q.userAnswer || 'No answer provided'}
                                      </div>
                                      {q.aiFeedback && (
                                        <div className="text-xs lg:text-sm text-gray-700 mb-2">
                                          <span className="font-medium text-gray-900">AI Feedback:</span> {q.aiFeedback}
                                        </div>
                                      )}
                                      {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                                        <div className="text-xs lg:text-sm text-blue-700">
                                          <span className="font-medium text-gray-900">Follow-up Questions:</span>
                                          <ul className="mt-1 ml-4">
                                            {q.followUpQuestions.map((fq, fqIdx) => (
                                              <li key={fqIdx}>• {fq}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allInterviews.length === 0 && (
                    <div className="text-center py-6 lg:py-8">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
                      </div>
                      <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No interviews yet</h4>
                      <p className="text-gray-500 mb-4 text-sm lg:text-base">Start your first interview to see your history here!</p>
                      <button 
                        onClick={() => window.location.href = '/interview'}
                        className="px-4 lg:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm lg:text-base"
                      >
                        Start Interview
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'quiz' && (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Quiz History</h3>
                <div className="space-y-4 lg:space-y-6">
                  {allQuizzes.map((quiz) => {
                    const isExpanded = expandedItems.has(quiz.id);
                    const details = quiz.details?.quiz;
                    
                    return (
                      <div key={quiz.id} className="border border-gray-200 rounded-lg p-3 lg:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm lg:text-base">{quiz.title}</h4>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${
                              (quiz.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                              (quiz.score || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {quiz.score || 0}%
                            </span>
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedItems);
                                if (isExpanded) {
                                  newExpanded.delete(quiz.id);
                                } else {
                                  newExpanded.add(quiz.id);
                                }
                                setExpandedItems(newExpanded);
                              }}
                              className="px-2 lg:px-3 py-1 lg:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-xs lg:text-sm"
                            >
                              {isExpanded ? 'Hide Details' : 'Show Details'}
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2 text-sm lg:text-base">{quiz.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs lg:text-sm text-gray-500 mb-3">
                          <span>{quiz.time}</span>
                          <span className="font-medium">Grade: {quiz.status}</span>
                        </div>
                        
                        {isExpanded && details && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {/* Performance Summary */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4">
                              <div className="text-center p-2 bg-blue-50 rounded">
                                <div className="text-xs lg:text-sm text-gray-600">Total Questions</div>
                                <div className="font-semibold text-sm lg:text-base">{details.totalQuestions}</div>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="text-xs lg:text-sm text-gray-600">Correct</div>
                                <div className="font-semibold text-green-600 text-sm lg:text-base">{details.correctAnswers}</div>
                              </div>
                              <div className="text-center p-2 bg-red-50 rounded">
                                <div className="text-xs lg:text-sm text-gray-600">Incorrect</div>
                                <div className="font-semibold text-red-600 text-sm lg:text-base">{details.incorrectAnswers}</div>
                              </div>
                              <div className="text-center p-2 bg-yellow-50 rounded">
                                <div className="text-xs lg:text-sm text-gray-600">Unanswered</div>
                                <div className="font-semibold text-yellow-600 text-sm lg:text-base">{details.unansweredQuestions}</div>
                              </div>
                            </div>
                            
                            {/* Performance by Type */}
                            {details.performanceByType && (
                              <div className="mb-4">
                                <h5 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">Performance by Question Type</h5>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
                                  {Object.entries(details.performanceByType).map(([type, data]: [string, any]) => (
                                    <div key={type} className="p-2 lg:p-3 border border-gray-200 rounded">
                                      <div className="font-medium text-gray-900 capitalize text-sm lg:text-base">{type}</div>
                                      <div className="text-xs lg:text-sm text-gray-700">
                                        {data.correct}/{data.total} correct ({data.percentage}%)
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Question Analysis */}
                            {details.questionAnalysis && details.questionAnalysis.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">Question Analysis</h5>
                                <div className="space-y-3 lg:space-y-4">
                                  {details.questionAnalysis.map((q, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-2 lg:p-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                        <span className="font-medium text-gray-900 text-sm lg:text-base">Q{idx + 1}</span>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                            {q.isCorrect ? 'Correct' : 'Incorrect'}
                                          </span>
                                          <span className="text-xs text-gray-500 capitalize">{q.type}</span>
                                          <span className="text-xs text-gray-500 capitalize">{q.difficulty}</span>
                                        </div>
                                      </div>
                                      
                                      {q.questionText && (
                                        <div className="text-xs lg:text-sm text-gray-700 mb-2">
                                          <span className="font-medium">Question:</span> {q.questionText}
                                        </div>
                                      )}
                                      
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3 text-xs lg:text-sm">
                                        <div>
                                          <span className="font-medium text-gray-900">Your Answer:</span>
                                          <div className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                                            {q.userAnswer || 'No answer provided'}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="font-medium text-green-700">Correct Answer:</span>
                                          <div className="mt-1 p-2 bg-green-50 rounded text-gray-900">
                                            {q.correctAnswer}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {q.explanation && (
                                        <div className="mt-2 text-xs lg:text-sm text-gray-800">
                                          <span className="font-medium text-gray-900">Explanation:</span> {q.explanation}
                                        </div>
                                      )}
                                      
                                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
                                        <span>Time spent: {q.timeSpent}s</span>
                                        <span>Points: {q.points}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allQuizzes.length === 0 && (
                    <div className="text-center py-6 lg:py-8">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
                      </div>
                      <h4 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No quizzes yet</h4>
                      <p className="text-gray-500 mb-4 text-sm lg:text-base">Start your first quiz to see your history here!</p>
                      <button 
                        onClick={() => window.location.href = '/quiz'}
                        className="px-4 lg:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm lg:text-base"
                      >
                        Start Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'subscription' && (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">Subscription Management</h3>
                
                {/* Current Subscription */}
                <div className="mb-6 lg:mb-8">
                  <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Current Subscription</h4>
                  {userSubscription ? (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <h5 className="text-lg lg:text-xl font-bold text-gray-900 capitalize">
                            {userSubscription.type === 'free' ? 'Free Plan' : userSubscription.type} Plan
                          </h5>
                          <p className="text-gray-600 text-sm lg:text-base">
                            {userSubscription.isActive ? 'Active' : 'Inactive'} • {userSubscription.paymentStatus}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl lg:text-2xl font-bold text-gray-900">
                            ₹{userSubscription.amount}
                          </div>
                          <div className="text-sm text-gray-600">
                            {userSubscription.type === 'free' ? 'Free' : 'Paid'}
                          </div>
                        </div>
                      </div>
                      
                      {userSubscription.startDate && userSubscription.endDate && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4">
                          <div>
                            <div className="text-xs lg:text-sm text-gray-600">Start Date</div>
                            <div className="font-medium text-gray-900 text-sm lg:text-base">
                              {new Date(userSubscription.startDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs lg:text-sm text-gray-600">End Date</div>
                            <div className="font-medium text-gray-900 text-sm lg:text-base">
                              {new Date(userSubscription.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 lg:p-6 text-center">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                      </div>
                      <h5 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No Subscription Found</h5>
                      <p className="text-gray-600 text-sm lg:text-base">You are currently on the free plan.</p>
                    </div>
                  )}
                </div>

                {/* Available Plans - Only show to users without active subscription */}
                {(!userSubscription || !userSubscription.isActive || userSubscription.type === 'free') && (
                  <div>
                    <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Available Plans</h4>
                    {subscriptionLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border border-gray-200 rounded-xl p-4 lg:p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        {availablePlans.map((plan) => (
                          <div key={plan._id} className="border border-gray-200 rounded-xl p-4 lg:p-6 hover:shadow-lg transition-shadow">
                            <div className="text-center mb-4">
                              <h5 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{plan.name}</h5>
                              <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
                                ₹{plan.priceInr}
                              </div>
                              <div className="text-xs lg:text-sm text-gray-600">
                                {plan.durationDays} days
                              </div>
                            </div>
                            
                            {plan.description && (
                              <p className="text-gray-600 text-xs lg:text-sm mb-4 text-center">
                                {plan.description}
                              </p>
                            )}
                            
                            <button
                              onClick={() => handlePlanSelect(plan)}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm lg:text-base"
                            >
                              Subscribe Now
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!subscriptionLoading && availablePlans.length === 0 && (
                      <div className="text-center py-6 lg:py-8">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
                        </div>
                        <h5 className="text-base lg:text-lg font-medium text-gray-900 mb-2">No Plans Available</h5>
                        <p className="text-gray-600 text-sm lg:text-base">Subscription plans are currently not available.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Profile Information</h3>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          // Reset to original data
                          setProfileData({ ...originalProfileData });
                        }}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full">
                  {/* Personal Information */}
                  <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-8">
                    <div>
                      <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          {isEditingProfile ? (
                          <input
                            type="text"
                            value={profileData.fullName}
                            onChange={(e) => handleProfileChange('fullName', e.target.value)}
                            placeholder="Enter your full name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.fullName || 'Not provided'}
                        </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          {isEditingProfile ? (
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => handleProfileChange('email', e.target.value)}
                              placeholder="Enter your email address"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.email || 'Not provided'}
                        </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          {isEditingProfile ? (
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => handleProfileChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.phone || 'Not provided'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                      <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Academic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            College/University Name *
                          </label>
                          {isEditingProfile ? (
                          <input
                            type="text"
                            value={profileData.college}
                            onChange={(e) => handleProfileChange('college', e.target.value)}
                              placeholder="Enter your college/university name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.college || 'Not provided'}
                        </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Degree *
                          </label>
                          {isEditingProfile ? (
                          <select 
                            value={profileData.degree}
                            onChange={(e) => handleProfileChange('degree', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                              <option value="">Select Degree</option>
                            <option value="bachelor">Bachelor's Degree</option>
                            <option value="master">Master's Degree</option>
                            <option value="phd">PhD</option>
                            <option value="diploma">Diploma</option>
                            <option value="other">Other</option>
                          </select>
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.degree === 'bachelor' ? "Bachelor's Degree" : 
                               profileData.degree === 'master' ? "Master's Degree" : 
                               profileData.degree === 'phd' ? 'PhD' : 
                               profileData.degree === 'diploma' ? 'Diploma' : 
                               profileData.degree === 'other' ? 'Other' : 'Not provided'}
                        </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Field of Study
                          </label>
                          {isEditingProfile ? (
                          <input
                            type="text"
                            value={profileData.fieldOfStudy}
                            onChange={(e) => handleProfileChange('fieldOfStudy', e.target.value)}
                            placeholder="Enter your field of study"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.fieldOfStudy || 'Not provided'}
                        </div>
                          )}
                    </div>

                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Year of Completion *
                          </label>
                          {isEditingProfile ? (
                            <select
                              value={profileData.yearOfCompletion}
                              onChange={(e) => handleProfileChange('yearOfCompletion', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select Year</option>
                              {Array.from({length: 25}, (_, i) => 2024 - i).map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.yearOfCompletion || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CGPA/GPA
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="10"
                              value={profileData.cgpa}
                              onChange={(e) => handleProfileChange('cgpa', e.target.value)}
                              placeholder="e.g., 8.5"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.cgpa || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileData.location}
                              onChange={(e) => handleProfileChange('location', e.target.value)}
                              placeholder="Enter your location"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.location || 'Not provided'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                      <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Professional Information</h4>
                      <div className="grid grid-cols-1 gap-4 lg:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Skills
                          </label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={profileData.skills}
                              onChange={(e) => handleProfileChange('skills', e.target.value)}
                              placeholder="e.g., JavaScript, React, Python, Node.js (comma separated)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                              {profileData.skills || 'Not provided'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </label>
                          {isEditingProfile ? (
                            <textarea
                              value={profileData.bio}
                              onChange={(e) => handleProfileChange('bio', e.target.value)}
                              placeholder="Tell us about yourself, your interests, and career goals"
                              maxLength={500}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            />
                          ) : (
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[100px]">
                              {profileData.bio || 'Not provided'}
                            </div>
                          )}
                          {isEditingProfile && (
                            <p className="text-xs text-gray-500 mt-1">
                              {profileData.bio.length}/500 characters
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'dashboard' && activeSection !== 'interview' && activeSection !== 'quiz' && activeSection !== 'profile' && activeSection !== 'subscription' && (
              <div className="text-center py-12 lg:py-16">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const item = sidebarItems.find(item => item.id === activeSection);
                    if (item) {
                      const Icon = item.icon;
                      return <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-gray-500" />;
                    }
                    return null;
                  })()}
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                  {sidebarItems.find(item => item.id === activeSection)?.label}
                </h3>
                <p className="text-gray-600 text-sm lg:text-base">
                  This section is under development. Coming soon!
                </p>
              </div>
            )}

            {/* Payment Modals */}
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={handlePaymentModalClose}
              plan={selectedPlan}
            />
            
            <RazorpayModal
              isOpen={showRazorpayModal}
              onClose={handleRazorpayModalClose}
              plan={selectedPlan}
            />
          </div>
        </div>
      </div>
    </div>
  );

};

// Helper function to get icon component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'BookOpen': return BookOpen;
    case 'Video': return Video;
    case 'CheckCircle': return CheckCircle;
    case 'Star': return Star;
    case 'Flame': return Flame;
    case 'Award': return Award;
    default: return BookOpen;
  }
};

export default DashboardPage; 