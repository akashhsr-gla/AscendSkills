'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Code,
  BookOpen,
  Video,
  User,
  Bell,
  Calendar,
  Star,
  CheckCircle,
  Flame,
  TrendingUp,
  Target,
  Award,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Edit,
  LogOut,
  Search,
  MoreHorizontal,
  CreditCard,
  Clock
} from 'lucide-react';
import Header from './Header';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { activityService, ActivityItem } from '@/services/activityService';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const userProfile = {
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@example.com',
    level: 'Intermediate',
    points: 2850,
    streak: 15,
    joinedDate: 'January 2024',
    completedQuizzes: 45,
    totalStudyTime: 127,
    achievements: 12,
    ranking: 8
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        const response = await activityService.getRecentActivity(5);
        if (response.success) {
          setRecentActivity(response.data);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'text-blue-500',
      count: null
    },
    {
      id: 'coding',
      label: 'Coding',
      icon: Code,
      color: 'text-purple-500',
      count: 28
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: BookOpen,
      color: 'text-green-500',
      count: 45
    },
    {
      id: 'interview',
      label: 'Interview',
      icon: Video,
      color: 'text-red-500',
      count: 12
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
      color: 'text-orange-500',
      count: null
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      color: 'text-indigo-500',
      count: null
    }
  ];

  const quickStats = [
    {
      title: 'Interviews Given',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Video,
      color: 'bg-red-500'
    },
    {
      title: 'Quizzes Completed',
      value: userProfile.completedQuizzes.toString(),
      change: '+5',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Coding Questions',
      value: '28',
      change: '+3',
      changeType: 'positive',
      icon: Code,
      color: 'bg-purple-500'
    }
  ];



  const upcomingTasks = [
    {
      id: 1,
      title: 'Complete React Quiz',
      dueDate: 'Today, 6:00 PM',
      priority: 'high',
      type: 'quiz'
    },
    {
      id: 2,
      title: 'Practice Dynamic Programming',
      dueDate: 'Tomorrow, 2:00 PM',
      priority: 'medium',
      type: 'coding'
    },
    {
      id: 3,
      title: 'Mock Interview with Sarah',
      dueDate: 'Friday, 10:00 AM',
      priority: 'high',
      type: 'interview'
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Quiz Master',
      description: 'Complete 50 quizzes',
      progress: 90,
      total: 50,
      current: 45,
      icon: BookOpen,
      color: 'bg-green-500',
      unlocked: false
    },
    {
      id: 2,
      title: 'Code Warrior',
      description: 'Solve 100 coding problems',
      progress: 65,
      total: 100,
      current: 65,
      icon: Code,
      color: 'bg-purple-500',
      unlocked: false
    },
    {
      id: 3,
      title: 'Interview Pro',
      description: 'Complete 20 mock interviews',
      progress: 100,
      total: 20,
      current: 20,
      icon: Video,
      color: 'bg-blue-500',
      unlocked: true
    }
  ];

  const studyPlan = {
    currentWeek: 3,
    totalWeeks: 12,
    weeklyGoals: [
      { day: 'Mon', completed: true, type: 'quiz' },
      { day: 'Tue', completed: true, type: 'coding' },
      { day: 'Wed', completed: false, type: 'interview', current: true },
      { day: 'Thu', completed: false, type: 'quiz' },
      { day: 'Fri', completed: false, type: 'coding' },
      { day: 'Sat', completed: false, type: 'review' },
      { day: 'Sun', completed: false, type: 'rest' }
    ]
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onNavigate) {
      onNavigate(sectionId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'Code': return Code;
      case 'Video': return Video;
      case 'CheckCircle': return CheckCircle;
      case 'Star': return Star;
      case 'Flame': return Flame;
      case 'Award': return Award;
      default: return BookOpen;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-screen">
      {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
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
                    <p className="text-sm text-gray-600">Student Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                {sidebarCollapsed ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        {!sidebarCollapsed && (
            <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showProfileMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                      <hr className="my-2 border-gray-200" />
                      <button 
                        onClick={() => logout('/')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
                      >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats in Sidebar */}
              
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
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
        {/* Top Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'dashboard' ? 'Dashboard' : 
                 sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
                <p className="text-gray-600">
                Hello, {userProfile.name}! Ready to learn with Ascend Skills?
              </p>
              </div>
              

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                        <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Study Plan Progress */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Weekly Study Plan</h3>
                      <span className="text-sm text-gray-600">Week {studyPlan.currentWeek} of {studyPlan.totalWeeks}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round((studyPlan.currentWeek / studyPlan.totalWeeks) * 100)}%</span>
                    </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(studyPlan.currentWeek / studyPlan.totalWeeks) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mt-6">
                    {studyPlan.weeklyGoals.map((goal, index) => (
                      <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-2">{goal.day}</div>
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                            goal.completed 
                              ? 'bg-green-500 text-white' 
                              : goal.current
                              ? 'bg-primary-500 text-white animate-pulse'
                                : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {goal.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : goal.current ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <div className="w-2 h-2 bg-current rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Tasks */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Upcoming Tasks</h3>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <p className="text-xs text-gray-600">{task.dueDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                    <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                    
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
                        {recentActivity.length > 0 ? (
                          recentActivity.map((activity) => {
                            const IconComponent = getIconComponent(activity.icon);
                      return (
                        <div key={activity.id} className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                                  <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                  <p className="text-sm text-gray-600">{activity.description} - {activity.time}</p>
                          </div>
                        </div>
                      );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Not attempted</h4>
                            <p className="text-gray-500 mb-6">Start your learning journey by attempting your first quiz or coding problem!</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <button 
                                onClick={() => window.location.href = '/quiz'}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                              >
                                Attempt Quiz
                              </button>
                              <button 
                                onClick={() => window.location.href = '/coding'}
                                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                              >
                                Attempt Coding
                              </button>
                            </div>
                          </div>
                        )}
                  </div>
                    )}
                </div>

                {/* Achievements Progress */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Achievement Progress</h3>
                  
                  <div className="space-y-6">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div key={achievement.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${achievement.color} ${achievement.unlocked ? '' : 'opacity-50'}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                  <h4 className={`font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {achievement.title}
                                </h4>
                                  <p className="text-xs text-gray-600">{achievement.description}</p>
                              </div>
                            </div>
                            {achievement.unlocked && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{achievement.current}/{achievement.total}</span>
                            <span className="font-medium">{achievement.progress}%</span>
                          </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-400'}`}
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other sections would be rendered here based on activeSection */}
          {activeSection !== 'dashboard' && (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const item = sidebarItems.find(item => item.id === activeSection);
                    if (item) {
                      const Icon = item.icon;
                      return <Icon className="w-8 h-8 text-gray-500" />;
                    }
                    return null;
                  })()}
              </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                {sidebarItems.find(item => item.id === activeSection)?.label}
              </h3>
                <p className="text-gray-600">
                This section is under development. Coming soon!
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 