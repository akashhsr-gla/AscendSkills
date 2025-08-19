import { authService } from './authService';

export interface QuizQuestion {
  _id: string;
  title: string;
  content: string;
  type: 'mcqs' | 'fill_in_blanks' | 'true_false' | 'coding';
  category: string;
  categoryType: 'company' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  correctAnswer: string;
  points: number;
  timeLimit: number;
  tags: string[];
  mcqs?: {
    options: string[];
    correctOptionIndex: number;
  };
  fillInBlanks?: {
    placeholder: string;
    caseSensitive: boolean;
    ignoreSpaces: boolean;
  };
  trueFalse?: {
    correctAnswer: boolean;
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
    starterCode: string;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      isHidden: boolean;
    }>;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  usageCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizStatistics {
  overview: {
    totalQuestions: number;
    averageSuccessRate: number;
    totalUsage: number;
  };
  byType: Array<{
    _id: string;
    count: number;
    avgSuccessRate: number;
  }>;
  byDifficulty: Array<{
    _id: string;
    count: number;
    avgSuccessRate: number;
  }>;
}

class QuizService {
  private baseURL = (process.env.NEXT_PUBLIC_API_URL || (
    (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'http://localhost:5000/api'
      : 'https://ascendskills.onrender.com/api'
  )).replace(/\/$/, '');

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}/quiz${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all quiz questions with filtering
  async getQuizQuestions(params?: {
    category?: string;
    categoryType?: 'company' | 'subjective';
    type?: string;
    difficulty?: string;
    limit?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.categoryType) queryParams.append('categoryType', params.categoryType);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    return this.makeRequest(`/?${queryString}`);
  }

  // Get quiz questions by category
  async getQuizQuestionsByCategory(category: string, params?: {
    difficulty?: string;
    type?: string;
    categoryType?: 'company' | 'subjective';
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.categoryType) queryParams.append('categoryType', params.categoryType);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return this.makeRequest(`/category/${category}?${queryString}`);
  }

  // Get quiz questions by category type
  async getQuizQuestionsByCategoryType(categoryType: 'company' | 'subjective', params?: {
    difficulty?: string;
    type?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return this.makeRequest(`/category-type/${categoryType}?${queryString}`);
  }

  // Get quiz statistics
  async getQuizStatistics(params?: {
    category?: string;
    categoryType?: 'company' | 'subjective';
    type?: string;
    difficulty?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.categoryType) queryParams.append('categoryType', params.categoryType);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);

    const queryString = queryParams.toString();
    return this.makeRequest(`/statistics?${queryString}`);
  }

  // Get a single quiz question by ID
  async getQuizQuestionById(id: string) {
    return this.makeRequest(`/${id}`);
  }

  // Validate an answer for a quiz question
  async validateAnswer(questionId: string, answer: any) {
    return this.makeRequest(`/${questionId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  // Create a new quiz question (requires authentication)
  async createQuizQuestion(questionData: Partial<QuizQuestion>) {
    return this.makeRequest('/', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  // Update a quiz question (requires authentication)
  async updateQuizQuestion(id: string, questionData: Partial<QuizQuestion>) {
    return this.makeRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  }

  // Delete a quiz question (requires authentication)
  async deleteQuizQuestion(id: string) {
    return this.makeRequest(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Submit coding answer for quiz question
  async submitCodingAnswer(questionId: string, sourceCode: string, language: string): Promise<{
    success: boolean;
    data: {
      submission: any;
      points: number;
      message: string;
    };
  }> {
    return this.makeRequest(`/${questionId}/submit-code`, {
      method: 'POST',
      body: JSON.stringify({
        sourceCode,
        language
      }),
    });
  }

  // Get coding submission status for quiz
  async getCodingSubmissionStatus(questionId: string, userId: string): Promise<{
    success: boolean;
    data: {
      status: string;
      score: number;
      executionTime?: number;
      memoryUsed?: number;
      passedTestCases: number;
      totalTestCases: number;
      submittedAt: string;
      completedAt?: string;
    };
  }> {
    return this.makeRequest(`/submission/${questionId}/${userId}`);
  }

  // Save quiz result
  async saveQuizResult(resultData: any): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return this.makeRequest('/result', {
      method: 'POST',
      body: JSON.stringify(resultData)
    });
  }

  // Get user's quiz history
  async getUserQuizHistory(userId: string, params?: {
    page?: number;
    limit?: number;
    categoryType?: 'company' | 'subjective';
    quizCategory?: string;
  }): Promise<{
    success: boolean;
    data: {
      results: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.categoryType) queryParams.append('categoryType', params.categoryType);
    if (params?.quizCategory) queryParams.append('quizCategory', params.quizCategory);

    const queryString = queryParams.toString();
    return this.makeRequest(`/history/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  // Get specific quiz result by ID
  async getQuizResultById(resultId: string): Promise<{
    success: boolean;
    data: any;
  }> {
    return this.makeRequest(`/result/${resultId}`);
  }

  // Timer Management Functions
  // Get category timer information
  async getCategoryTimer(category: string, categoryType?: 'company' | 'subjective'): Promise<{
    success: boolean;
    data: {
      totalQuestions: number;
      totalTimeLimit: number;
      totalTimeMinutes: number;
      averageTimePerQuestion: number;
      averageTimeMinutes: number;
      questions: Array<{
        _id: string;
        title: string;
        timeLimit: number;
        type: string;
        difficulty: string;
      }>;
    };
  }> {
    const endpoint = categoryType ? `/timer/category-type/${categoryType}` : `/timer/category/${category}`;
    return this.makeRequest(endpoint);
  }

  // Update individual question time limit
  async updateQuestionTimeLimit(questionId: string, timeLimit: number): Promise<{
    success: boolean;
    message: string;
    data: {
      _id: string;
      title: string;
      timeLimit: number;
    };
  }> {
    return this.makeRequest(`/${questionId}/time-limit`, {
      method: 'PUT',
      body: JSON.stringify({ timeLimit })
    });
  }

  // Update category time limits (bulk update)
  async updateCategoryTimeLimits(
    category: string, 
    categoryType: 'company' | 'subjective',
    timeLimits: Array<{ questionId: string; timeLimit: number }>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      totalQuestions: number;
      totalTimeLimit: number;
      totalTimeMinutes: number;
      averageTimePerQuestion: number;
      averageTimeMinutes: number;
    };
  }> {
    const endpoint = `/timer/category-type/${categoryType}`;
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ timeLimits })
    });
  }

  // Admin Quiz Management Methods
  async getAdminQuizQuestions(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    categoryType?: string;
    type?: string;
    difficulty?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/questions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch questions' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching admin quiz questions:', error);
      return { success: false, message: 'Network error while fetching questions' };
    }
  }

  async getAdminQuizQuestionById(id: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/questions/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch question' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching admin quiz question:', error);
      return { success: false, message: 'Network error while fetching question' };
    }
  }

  async createAdminQuizQuestion(questionData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to create question' };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error creating admin quiz question:', error);
      return { success: false, message: 'Network error while creating question' };
    }
  }

  async updateAdminQuizQuestion(id: string, updateData: any): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/questions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to update question' };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error updating admin quiz question:', error);
      return { success: false, message: 'Network error while updating question' };
    }
  }

  async deleteAdminQuizQuestion(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to delete question' };
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error deleting admin quiz question:', error);
      return { success: false, message: 'Network error while deleting question' };
    }
  }

  async getAdminQuizStatistics(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseURL.replace('/quiz', '')}/admin/quiz/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch statistics' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching admin quiz statistics:', error);
      return { success: false, message: 'Network error while fetching statistics' };
    }
  }
}

export const quizService = new QuizService(); 