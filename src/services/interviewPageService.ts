import { getAuthTokenString } from '@/utils/auth';

const DEFAULT_API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5000/api'
  : 'https://ascendskills.onrender.com/api';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '');

export interface InterviewCategory {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  type: 'main' | 'subjective' | 'individual' | 'company';
  statistics: {
    totalQuestions: number;
    easyQuestions: number;
    mediumQuestions: number;
    hardQuestions: number;
    averageDifficulty: number;
    totalAttempts: number;
    averageSuccessRate: number;
  };
  company?: {
    companyId?: string;
    isCompanySpecific: boolean;
    companyName?: string;
    companyLogo?: string;
    difficulty: string;
  };
  interviewConfig: {
    defaultDuration: number;
    questionCount: number;
    allowFollowUps: boolean;
    enableVoiceRecording: boolean;
    enableVideoRecording: boolean;
    scoringCriteria: Array<{
      criterion: string;
      weight: number;
      description: string;
    }>;
  };
  status: {
    isActive: boolean;
    isPublic: boolean;
    isFeatured: boolean;
    sortOrder: number;
  };
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  questions: number;
  difficulty: string;
  industry: string;
}

export interface UserStats {
  totalPractice: number;
  mockInterviews: number;
  averageScore: number;
  streak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  strongAreas: string[];
  improvementAreas: string[];
}

export interface RecentActivity {
  type: 'practice' | 'mock';
  title: string;
  score: number;
  time: string;
  date: string;
}

class InterviewPageService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token
    const token = getAuthTokenString();
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get all interview categories with proper response handling
  async getCategories(type?: string): Promise<InterviewCategory[]> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await this.makeRequest<{ success: boolean; data: InterviewCategory[] }>(`/interview/categories${params}`);
      
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Invalid categories response:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  // Get companies with question counts
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: Company[] }>('/interview/companies');
      
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Invalid companies response:', response);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      return [];
    }
  }

  // Get user statistics (this would need a backend endpoint)
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: UserStats }>('/interview/user/stats');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        // Return default stats if API fails
        return {
          totalPractice: 0,
          mockInterviews: 0,
          averageScore: 0,
          streak: 0,
          weeklyGoal: 5,
          weeklyProgress: 0,
          strongAreas: [],
          improvementAreas: []
        };
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Return default stats on error
      return {
        totalPractice: 0,
        mockInterviews: 0,
        averageScore: 0,
        streak: 0,
        weeklyGoal: 5,
        weeklyProgress: 0,
        strongAreas: [],
        improvementAreas: []
      };
    }
  }

  // Get recent activity (this would need a backend endpoint)
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await this.makeRequest<{ success: boolean; data: RecentActivity[] }>('/interview/user/recent-activity');
      
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } else {
        // Return empty array if API fails
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }
  }

  // Start interview session
  async startInterview(categoryId: string, questionCount = 5): Promise<{
    interviewId: string;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      expectedDuration: number;
    }>;
    currentQuestionIndex: number;
    category: {
      id: string;
      name: string;
      type: string;
    };
  }> {
    const token = getAuthTokenString();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await this.makeRequest<{
      success: boolean;
      data: {
        interviewId: string;
        questions: Array<{
          id: string;
          question: string;
          type: string;
          expectedDuration: number;
        }>;
        currentQuestionIndex: number;
        category: {
          id: string;
          name: string;
          type: string;
        };
      };
    }>('/interview/ai/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        categoryId,
        questionCount,
      }),
    });

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error('Failed to start interview');
    }
  }

  // Get questions by category
  async getQuestionsByCategory(
    categoryId: string, 
    difficulty?: string, 
    limit = 10, 
    page = 1
  ): Promise<{
    category: InterviewCategory;
    questions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
    });
    
    if (difficulty) {
      params.append('difficulty', difficulty);
    }

    const response = await this.makeRequest<{
      category: InterviewCategory;
      questions: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/interview/questions/${categoryId}?${params}`);
    return response;
  }
}

export const interviewPageService = new InterviewPageService(); 