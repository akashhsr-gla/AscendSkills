'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen,
  Users,
  Target,
  TrendingUp,
  Brain,
  MessageSquare,
  Code,
  FileText,
  BarChart3,
  Zap,
  ArrowRight,
  AlertCircle,
  Building2,
  Video,
  Camera,
  Volume2,
  Flame,
  Check
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { interviewPageService, type InterviewCategory, type Company, type UserStats, type RecentActivity } from '@/services/interviewPageService';
import { isAuthenticated } from '@/utils/auth';
import { subscriptionService, type UserSubscription, type SubscriptionPlan } from '@/services/subscriptionService';
import SubscriptionModal from '@/components/SubscriptionModal';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

const InterviewPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'practice' | 'company'>('practice');
  const [showMockInterview, setShowMockInterview] = useState(false);

  // Backend data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Backend categories state
  const [categories, setCategories] = useState<InterviewCategory[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPractice: 0,
    mockInterviews: 0,
    averageScore: 0,
    streak: 0,
    weeklyGoal: 5,
    weeklyProgress: 0,
    strongAreas: [],
    improvementAreas: []
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Subscription state
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  
  // Authentication check
  useEffect(() => {
    // Don't redirect automatically - let users see the page
    // Authentication will be checked when they try to interact
  }, [router]);
  
  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      // Allow data loading even for unauthenticated users to show available content
      try {
        setLoading(true);
        
        // Load categories
        const categoriesData = await interviewPageService.getCategories();
        if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
        } else {
          console.warn('Categories data is not an array:', categoriesData);
          setCategories([]);
        }

        // Load user stats and subscription (only for authenticated users)
        if (isAuthenticated()) {
          try {
            const statsData = await interviewPageService.getUserStats();
            setUserStats(statsData);

            // Load recent activity
            const activityData = await interviewPageService.getRecentActivity();
            setRecentActivity(activityData);

            // Load subscription data
            const subscriptionResponse = await subscriptionService.getUserSubscription();
            if (subscriptionResponse.success && subscriptionResponse.data) {
              setUserSubscription(subscriptionResponse.data);
            }

            // Load subscription plans
            const plansResponse = await subscriptionService.getAvailablePlans();
            if (plansResponse.success && plansResponse.data) {
              setSubscriptionPlans(plansResponse.data);
            }
          } catch (err) {
            console.warn('Failed to load user-specific data:', err);
          }
        }

      } catch (err) {
        console.error('Failed to load data:', err);
        setCategories([]);
        // Don't show error for data loading - it might be due to authentication
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Filter categories by type - ensure categories is an array
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const mainCategories = categoriesArray.filter(cat => cat.type === 'main');
  const companyCategories = categoriesArray.filter(cat => cat.type === 'company');
  const subjectiveCategories = categoriesArray.filter(cat => cat.type === 'subjective');
  const individualCategories = categoriesArray.filter(cat => cat.type === 'individual');

  // Handle category click to start interview
  const handleCategoryClick = async (category: InterviewCategory) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      setError('Please log in to start an interview. Click the login button below to continue.');
      return;
    }

    // Check if user has active subscription (free plan is not allowed for interviews)
    if (!userSubscription?.isActive || userSubscription?.type === 'free') {
      // Show subscription modal
      setShowSubscriptionModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const interviewData = await interviewPageService.startInterview(category._id, 5);
      // Navigate to interview start page with the interview data
      router.push(`/interview/start?interviewId=${interviewData.interviewId}`);
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription modal close
  const handleSubscriptionModalClose = () => {
    setShowSubscriptionModal(false);
  };

  // Icon mapping for backend data
  const iconMap: Record<string, React.ComponentType<any>> = {
    'BookOpen': BookOpen,
    'Code': Code,
    'Users': Users,
    'Brain': Brain,
    'Target': Target,
    'Zap': Zap,
    'BarChart3': BarChart3,
    'Building2': Building2
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Your
              <span className="text-gradient-primary"> Interview Skills</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Practice with AI-powered mock interviews, get real-time feedback, and land your dream job at top tech companies with salaries up to ₹50k+ per month.
            </p>
            
            {/* Subscription Status for logged-in users */}
            {isAuthenticated() && userSubscription && (
              <div className="mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  userSubscription.isActive && userSubscription.type !== 'free'
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {userSubscription.isActive && userSubscription.type !== 'free' ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Active Subscription - {userSubscription.type.charAt(0).toUpperCase() + userSubscription.type.slice(1)} Plan
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {userSubscription.type === 'free' ? 'Free Plan - Upgrade Required for Interviews' : 'Subscription Required - Choose a plan to start practicing'}
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated()) {
                    setError('Please log in to start an interview. Click the login button below to continue.');
                    return;
                  }
                  
                  // Check if user has active subscription (free plan is not allowed for interviews)
                  if (!userSubscription?.isActive || userSubscription?.type === 'free') {
                    // Show subscription modal
                    setShowSubscriptionModal(true);
                    return;
                  }
                  
                  if (mainCategories.length > 0) {
                    handleCategoryClick(mainCategories[0]);
                  } else {
                    router.push('/interview/start');
                  }
                }}
                className="px-8 py-4 bg-gradient-primary text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
              >
                Start AI Interview
              </button>
            </div>
          </motion.div>
          </div>
        </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interview data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-700 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/login')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login to Continue
              </button>
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!loading && !error && (
        <>
        </>
      )}

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
                          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <a href="/interview" className="text-blue-600 font-medium">Interview Preparation</a>
          {activeTab !== 'practice' && (
            <>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                {activeTab === 'company' ? 'Company Prep' : 'Practice Questions'}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="grid grid-cols-2 border-b">
            {[
              { id: 'practice', label: 'Practice Questions', icon: BookOpen },
            { id: 'company', label: 'Company Prep', icon: Building2 }
            ].map((tab) => {
              const Icon = typeof tab.icon === 'string' ? (iconMap[tab.icon] || BookOpen) : tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center px-6 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Practice Questions Tab */}
            {activeTab === 'practice' && (
              <div>

                {/* Main Categories Grid */}
                {mainCategories.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Main Interview Types</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mainCategories.map((category) => {
                        const Icon = iconMap[category.icon] || BookOpen;
                        return (
                          <motion.div
                            key={category._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleCategoryClick(category)}
                            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all border border-purple-100"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-8 h-8 text-purple-600" />
                              <span className="text-2xl font-bold text-gray-900">{category.statistics.totalQuestions}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{category.displayName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Main Type</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                Start Interview
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Subjective Categories Grid */}
                {subjectiveCategories.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Subject Areas</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {subjectiveCategories.map((category) => {
                        const Icon = iconMap[category.icon] || BookOpen;
                        return (
                          <motion.div
                            key={category._id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleCategoryClick(category)}
                            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all border border-blue-100"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-8 h-8 text-blue-600" />
                              <span className="text-2xl font-bold text-gray-900">{category.statistics.totalQuestions}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{category.displayName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Subject Area</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Start Practice
                                  </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

                {/* Individual Categories Grid */}
                {individualCategories.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Individual Topics</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {individualCategories.map((category) => {
                        const Icon = iconMap[category.icon] || BookOpen;
                    return (
                      <motion.div
                            key={category._id}
                        whileHover={{ scale: 1.02 }}
                            onClick={() => handleCategoryClick(category)}
                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 cursor-pointer hover:shadow-md transition-all border border-green-100"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Icon className="w-8 h-8 text-green-600" />
                              <span className="text-2xl font-bold text-gray-900">{category.statistics.totalQuestions}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{category.displayName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Individual Topic</span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                Start Practice
                              </span>
                        </div>
                          </motion.div>
                        );
                  })}
                </div>
              </div>
            )}

                {/* No Categories Message */}
                {subjectiveCategories.length === 0 && individualCategories.length === 0 && !loading && !error && (
                  <div className="text-center py-8 text-gray-600">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No practice categories available. Please try again later.</p>
                  </div>
                )}

                
              </div>
            )}



            {/* Company Prep Tab */}
            {activeTab === 'company' && (
              <div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading company categories...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-600">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                    <p>{error}</p>
                  </div>
                ) : companyCategories.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Company-Specific Interviews</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {companyCategories.map((category) => {
                        const Icon = iconMap[category.icon] || Building2;
                        return (
                    <motion.div
                            key={category._id}
                      whileHover={{ scale: 1.02 }}
                            onClick={() => handleCategoryClick(category)}
                            className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all border border-purple-100 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-2xl font-bold text-gray-900">{category.statistics.totalQuestions}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{category.displayName}</h3>
                            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                            {category.company && (
                              <div className="mb-3 p-2 bg-purple-100 rounded-lg">
                                <p className="text-xs text-purple-700 font-medium">{category.company.companyName}</p>
                                <p className="text-xs text-purple-600">Difficulty: {category.company.difficulty}</p>
                        </div>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Company Specific</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded group-hover:bg-purple-200 transition-colors">
                                Start Prep
                        </span>
                      </div>
                          </motion.div>
                        );
                      })}
                        </div>
                      </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Preparation</h3>
                    <p>No company-specific categories available yet.</p>
                    <p className="text-sm mt-2">Check back soon for company-specific interview preparation.</p>
                </div>
                )}
              </div>
            )}




          </div>
        </div>
      </div>

      {/* Mock Interview Modal */}
      {showMockInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mock Interview Setup</h2>
              <button 
                onClick={() => setShowMockInterview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Interview Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option>Technical Interview</option>
                      <option>Behavioral Interview</option>
                      <option>System Design</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option>Google</option>
                      <option>Microsoft</option>
                      <option>Amazon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg">
                      <option>30 minutes</option>
                      <option>45 minutes</option>
                      <option>60 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Camera & Audio Check</h3>
                <div className="bg-gray-900 rounded-lg aspect-video mb-4 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p>Camera Preview</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button className="flex-1 flex items-center justify-center py-2 bg-green-100 text-green-700 rounded-lg">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Mic Test
                  </button>
                  <button className="flex-1 flex items-center justify-center py-2 bg-blue-100 text-blue-700 rounded-lg">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera Test
              </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowMockInterview(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-6 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all">
                Start Interview
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interview flow is now handled by the separate /interview/start page */}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={handleSubscriptionModalClose}
        subscriptionPlans={subscriptionPlans}
      />

      <Footer />
    </div>
  );
};

export default InterviewPage; 