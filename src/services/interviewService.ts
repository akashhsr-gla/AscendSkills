import { getAuthTokenString } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    companyId: string;
    isCompanySpecific: boolean;
    companyName: string;
    companyLogo: string;
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

export interface Question {
  _id: string;
  title: string;
  content: string;
  type: string;
  difficulty: string;
  category: string;
  statistics: {
    totalAttempts: number;
    correctAttempts: number;
    averageScore: number;
    averageTime: number;
  };
  metadata: {
    estimatedTime: number;
    points: number;
  };
  coding?: {
    problemDescription: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string[];
    examples: Array<{
      input: string;
      output: string;
      explanation: string;
    }>;
    tags: string[];
    starterCode: Array<{
      language: string;
      code: string;
    }>;
  };
  interview?: {
    expectedDuration: number;
    followUpQuestions: string[];
    evaluationCriteria: Array<{
      criterion: string;
      weight: number;
      description: string;
    }>;
  };
  systemDesign?: {
    requirements: string[];
    constraints: string[];
    estimations: string[];
    components: string[];
    technologies: string[];
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

export interface PracticeData {
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    count: number;
    questions: Array<{
      id: string;
      title: string;
      difficulty: string;
      time: number;
      attempts: number;
      successRate: number;
      tags: string[];
      description: string;
      type: string;
    }>;
  }>;
  companies: Company[];
}

export interface DetailedInterviewReport {
  interviewId: string;
  candidate: {
    name: string;
    email: string;
  };
  interviewDetails: {
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: {
      current: string;
      isActive: boolean;
      currentQuestionIndex: number;
    };
    category: string;
  };
  finalAssessment: {
    overallScore: number;
    breakdown: {
      communication: number;
      technical: number;
      problemSolving: number;
      confidence: number;
    };
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    feedback: string;
    metrics: {
      averageConfidence: number;
      totalViolations: number;
      completionRate: number;
      averageWordCount: number;
      questionsWithAI: number;
      totalQuestions: number;
      totalResponses: number;
    };
    generatedAt: string;
  };
  questions: Array<{
    questionIndex: number;
    question: string;
    type: string;
    category: string;
    expectedDuration: number;
    response: {
      transcription: string;
      confidence: number;
      duration: number;
      isAnswered: boolean;
      startTime?: string;
      endTime?: string;
    };
    aiAssessment: {
      scores: {
        clarity?: number;
        relevance?: number;
        depth?: number;
        structure?: number;
        communication?: number;
        technical?: number;
        problemSolving?: number;
        confidence?: number;
        overall?: number;
      } | null;
      analysis: string;
      suggestions: string[];
      keywords: string[];
      confidence: number;
      responseMetrics: {
        wordCount: number;
        sentenceCount: number;
        avgWordsPerSentence: number;
        hasNumbers: boolean;
        hasTechnicalTerms: boolean;
        hasBehavioralTerms: boolean;
        complexity: number;
        relevance: number;
      } | null;
      securityAnalysis: {
        faceDetection?: any;
        objectDetection?: any;
        violations: any[];
      } | null;
    };
    followUpQuestions: string[];
    followUpResponses: Array<{
      followUpIndex: number;
      question: string;
      transcription: string;
      duration: number;
      isAnswered: boolean;
    }>;
    followUpAnalyses: Array<{
      followUpIndex: number;
      scores: {
        clarity?: number;
        relevance?: number;
        depth?: number;
        structure?: number;
      } | null;
      analysis: string;
      suggestions: string[];
      keywords: string[];
      responseMetrics: {
        wordCount: number;
        sentenceCount: number;
        avgWordsPerSentence: number;
        hasNumbers: boolean;
        hasTechnicalTerms: boolean;
        hasBehavioralTerms: boolean;
        complexity: number;
        relevance: number;
      } | null;
    }>;
  }>;
  metrics: {
    totalQuestions: number;
    answeredQuestions: number;
    totalFollowUps: number;
    answeredFollowUps: number;
    averageConfidence: number;
    totalDuration: number;
  };
}

class InterviewService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token
    const token = getAuthTokenString();
    
    console.log(`🌐 Making request to: ${url}`);
    console.log(`🔑 Auth token present: ${!!token}`);
    if (token) {
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`);
    }
    
    try {
      // Extract options without headers to avoid conflicts
      const { headers: optionsHeaders, ...otherOptions } = options || {};
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(optionsHeaders || {}),
      };
      
      console.log('📤 Request headers:', headers);
      console.log('📤 Request options:', otherOptions);
      
      const response = await fetch(url, {
        ...otherOptions,
        headers,
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}, body:`, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Response data:`, data);
      return data;
    } catch (error) {
      console.error('💥 API request failed:', error);
      throw error;
    }
  }

  // Get all interview categories
  async getCategories(type?: string): Promise<InterviewCategory[]> {
    try {
      console.log('interviewService.getCategories() called with type:', type);
      const params = type ? `?type=${type}` : '';
      const endpoint = `/admin/interview/categories${params}`;
      console.log('interviewService.getCategories() endpoint:', endpoint);
      
      const response = await this.makeRequest<{ success: boolean; data: InterviewCategory[] }>(endpoint);
      console.log('interviewService.getCategories() response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        console.log('interviewService.getCategories() returning data:', response.data);
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

  // Get questions by category
  async getQuestionsByCategory(
    categoryId: string, 
    difficulty?: string, 
    limit = 10, 
    page = 1
  ): Promise<{
    category: InterviewCategory;
    questions: Question[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      console.log('interviewService.getQuestionsByCategory() called with categoryId:', categoryId);
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });
      
      if (difficulty) {
        params.append('difficulty', difficulty);
      }

      const endpoint = `/admin/interview/questions/${categoryId}?${params}`;
      console.log('interviewService.getQuestionsByCategory() endpoint:', endpoint);
      
      const response = await this.makeRequest<{
        success: boolean;
        data: {
          category: InterviewCategory;
          questions: Question[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
          };
        };
      }>(endpoint);
      
      console.log('interviewService.getQuestionsByCategory() response:', response);
      
      if (response.success && response.data) {
        console.log('interviewService.getQuestionsByCategory() returning data:', response.data);
        return response.data;
      } else {
        console.warn('Invalid questions response:', response);
        return {
          category: {} as InterviewCategory,
          questions: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 1
          }
        };
      }
    } catch (error) {
      console.error('Failed to fetch questions for category:', categoryId, error);
      return {
        category: {} as InterviewCategory,
        questions: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        }
      };
    }
  }

  // Get companies with question counts
  async getCompanies(): Promise<Company[]> {
    return this.makeRequest<Company[]>('/interview/companies');
  }

  // Get practice data for frontend
  async getPracticeData(category?: string, difficulty?: string, company?: string): Promise<PracticeData> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    if (company) params.append('company', company);

    const queryString = params.toString();
    const endpoint = `/interview/practice${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<PracticeData>(endpoint);
  }

  // Get specific question details
  async getQuestionDetails(questionId: string): Promise<Question> {
    return this.makeRequest<Question>(`/interview/questions/detail/${questionId}`);
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
    // Get auth token using the proper utility
    const token = getAuthTokenString();
    if (!token) {
      throw new Error('Authentication required');
    }

    return this.makeRequest('/interview/ai/start', {
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
  }

  // Get detailed interview report
  async getDetailedReport(interviewId: string): Promise<DetailedInterviewReport> {
    const token = getAuthTokenString();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await this.makeRequest<{ success: boolean; data: DetailedInterviewReport }>(`/interview/ai/${interviewId}/detailed-report`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.success) {
      throw new Error('Failed to fetch detailed report');
    }

    return response.data;
  }

  // Admin interview management methods
  async getAdminInterviews(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    type?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    success: boolean;
    data: {
      interviews: any[];
      pagination: {
        current: number;
        total: number;
        count: number;
        totalCount: number;
      };
    };
  }> {
    try {
      console.log('🔍 getAdminInterviews called with params:', params);
      
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const endpoint = `/admin/interviews?${queryParams.toString()}`;
      console.log('🔍 Calling endpoint:', endpoint);
      
      const result = await this.makeRequest<{
        success: boolean;
        data: {
          interviews: any[];
          pagination: {
            current: number;
            total: number;
            count: number;
            totalCount: number;
          };
        };
      }>(endpoint);
      console.log('✅ getAdminInterviews result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ getAdminInterviews failed:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Authentication failed. Please login as admin.');
      }
      
      // Check if it's an authorization error
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Check if it's a network error
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  async getAdminInterviewById(id: string): Promise<{
    success: boolean;
    data: any;
  }> {
    return this.makeRequest(`/admin/interviews/${id}`);
  }

  async createAdminInterview(data: {
    name?: string;
    displayName?: string;
    title?: string;
    type: string;
    category?: string;
    description?: string;
    icon?: string;
    color?: string;
    questions?: Array<{
      title?: string;
      content?: string;
      question?: string;
      type: string;
      difficulty?: string;
      expectedDuration?: number;
      metadata?: {
        estimatedTime?: number;
        points?: number;
      };
    }>;
    interviewConfig?: {
      defaultDuration?: number;
      questionCount?: number;
      allowFollowUps?: boolean;
      enableVoiceRecording?: boolean;
      enableVideoRecording?: boolean;
      scoringCriteria?: Array<{
        criterion: string;
        weight: number;
        description: string;
      }>;
    };
    status?: {
      isActive?: boolean;
      isPublic?: boolean;
      isFeatured?: boolean;
      sortOrder?: number;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.makeRequest('/admin/interviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async updateAdminInterview(id: string, data: {
    displayName?: string;
    description?: string;
    type?: string;
    questions?: Array<{
      title?: string;
      content?: string;
      question?: string;
      type: string;
      difficulty?: string;
      expectedDuration?: number;
      metadata?: {
        estimatedTime?: number;
        points?: number;
      };
    }>;
    interviewConfig?: {
      defaultDuration?: number;
      questionCount?: number;
      allowFollowUps?: boolean;
      enableVoiceRecording?: boolean;
      enableVideoRecording?: boolean;
      scoringCriteria?: Array<{
        criterion: string;
        weight: number;
        description: string;
      }>;
    };
    status?: {
      isActive?: boolean;
      isPublic?: boolean;
      isFeatured?: boolean;
      sortOrder?: number;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.makeRequest(`/admin/interviews/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async deleteAdminInterview(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('🗑️ deleteAdminInterview called with ID:', id);
      
      if (!id || id.startsWith('sample-')) {
        throw new Error('Cannot delete sample or invalid interviews');
      }
      
      const result = await this.makeRequest<{
        success: boolean;
        message: string;
      }>(`/admin/interviews/${id}`, {
        method: 'DELETE',
      });
      
      console.log('✅ deleteAdminInterview result:', result);
      return result;
    } catch (error) {
      console.error('❌ deleteAdminInterview failed:', error);
      
      // Check if it's a 404 error (interview not found)
      if (error instanceof Error && error.message.includes('404')) {
        throw new Error(`Interview with ID ${id} not found. It may have been deleted already or doesn't exist.`);
      }
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Authentication failed. Please login as admin.');
      }
      
      // Check if it's an authorization error
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      throw error;
    }
  }

  async getInterviewStatistics(): Promise<{
    success: boolean;
    data: {
      totalInterviews: number;
      interviewsByCategory: any[];
      interviewsByType: any[];
      interviewsByStatus: any[];
      recentInterviews: any[];
    };
  }> {
    return this.makeRequest('/admin/interviews/statistics');
  }

  // Note: Individual question management is now handled through the main category endpoints
  // Questions are managed as part of the category create/update operations
}

export const interviewService = new InterviewService(); 