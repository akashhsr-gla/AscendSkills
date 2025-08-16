"use client";
import React, { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Home,
  Plus,
  Search,
  Filter,
  Video,
  BookOpen,
  Briefcase
} from "lucide-react";
import AdminUserTable from "@/components/AdminUserTable";
import AdminQuestionManager from "@/components/AdminQuestionManager";
import Header from "@/components/Header";
import Image from 'next/image';
import AdminUserManagement from "@/components/AdminUserManagement";
import AdminQuizManagement from "@/components/AdminQuizManagement";
import AdminInterviewManagement from "@/components/AdminInterviewManagement";
import AdminJobManagement from "@/components/AdminJobManagement";
import AdminDashboardComponent from "@/components/AdminDashboard";
import AdminSubscriptionManagement from "@/components/AdminSubscriptionManagement";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [tab, setTab] = useState<'dashboard'|'users'|'interviews'|'quizzes'|'jobs'|'subscriptions'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'interviews', label: 'Interview Management', icon: Video },
    { id: 'quizzes', label: 'Quiz Management', icon: BookOpen },
    { id: 'jobs', label: 'Job Management', icon: Briefcase },
    { id: 'subscriptions', label: 'Subscription Management', icon: Settings },
  ];

  // Check authentication and admin role
  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
  }, [user, router]);

  // Show loading while checking authentication
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
     
      
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
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
                    <p className="text-sm text-gray-600">Admin Dashboard</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = tab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id as any)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'} ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    {sidebarOpen && (
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <AdminDashboardComponent />
              </div>
            )}
            
            {tab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <AdminUserManagement />
                </div>
              </div>
            )}
            
            {tab === 'interviews' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <AdminInterviewManagement />
                </div>
              </div>
            )}
            
            {tab === 'quizzes' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <AdminQuizManagement />
                </div>
              </div>
            )}
            
            {tab === 'jobs' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <AdminJobManagement />
                </div>
              </div>
            )}

            {tab === 'subscriptions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="p-6">
                    <AdminSubscriptionManagement />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 