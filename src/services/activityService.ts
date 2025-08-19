import { authService } from './authService';

export interface ActivityItem {
  id: string;
  type: 'quiz' | 'coding' | 'interview';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  score?: number;
  status?: string;
  executionTime?: number;
  memoryUsed?: number;
  passedTestCases?: number;
  totalTestCases?: number;
  // Detailed data for expanded view
  details?: {
    quiz?: {
      questionAnalysis: Array<{
        type: string;
        difficulty: string;
        isCorrect: boolean;
        timeSpent: number;
        points: number;
        userAnswer: string | null;
        correctAnswer: string;
        explanation: string;
        questionText?: string;
      }>;
      performanceByType: any;
      performanceByDifficulty: any;
      totalQuestions: number;
      answeredQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      unansweredQuestions: number;
      timeTaken: number;
      averageTimePerQuestion: number;
    };
    interview?: {
      category: {
        displayName: string;
        type: string;
        icon: string;
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
      };
      status: {
        current: string;
        isActive: boolean;
        currentQuestionIndex: number;
      };
      questions?: Array<{
        question: string;
        userAnswer: string;
        aiFeedback: string;
        followUpQuestions?: string[];
      }>;
    };
  };
}

class ActivityService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get recent user activity combining quiz results and coding submissions
  async getRecentActivity(limit: number = 5): Promise<{
    success: boolean;
    data: ActivityItem[];
  }> {
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        return {
          success: false,
          data: []
        };
      }

      // Fetch recent quiz results (backend will use token to identify user)
      const quizResponse = await this.makeRequest(`/quiz/history/me?limit=${limit}&page=1`);
      
      // Fetch recent coding submissions (backend will use token to identify user)
      const codingResponse = await this.makeRequest(`/coding/user/me/history?limit=${limit}&page=1`);
      
      // Fetch recent interviews (backend will use token to identify user)
      const interviewResponse = await this.makeRequest(`/interview/user/history?limit=${limit}&page=1`);

      const activities: ActivityItem[] = [];

      // Process quiz results
      if (quizResponse.success && quizResponse.data?.results) {
        quizResponse.data.results.forEach((quiz: any) => {
          activities.push({
            id: quiz._id,
            type: 'quiz',
            title: `${quiz.quizTitle || 'Quiz'} Quiz`,
            description: `Scored ${quiz.score}%`,
            time: this.formatTimeAgo(new Date(quiz.createdAt)),
            icon: 'BookOpen',
            color: 'bg-green-100 text-green-600',
            score: quiz.score,
            status: quiz.grade || 'Completed',
            details: {
              quiz: {
                questionAnalysis: quiz.questionAnalysis || [],
                performanceByType: quiz.performanceByType,
                performanceByDifficulty: quiz.performanceByDifficulty,
                totalQuestions: quiz.totalQuestions,
                answeredQuestions: quiz.answeredQuestions,
                correctAnswers: quiz.correctAnswers,
                incorrectAnswers: quiz.incorrectAnswers,
                unansweredQuestions: quiz.unansweredQuestions,
                timeTaken: quiz.timeTaken,
                averageTimePerQuestion: quiz.averageTimePerQuestion
              }
            }
          });
        });
      }

      // Process coding submissions
      if (codingResponse.success && codingResponse.data?.submissions) {
        codingResponse.data.submissions.forEach((submission: any) => {
          activities.push({
            id: submission.submissionId,
            type: 'coding',
            title: submission.problemTitle || 'Coding Problem',
            description: submission.status === 'accepted' 
              ? `Solved in ${submission.executionTime || 0}ms`
              : `Attempted - ${submission.passedTestCases || 0}/${submission.totalTestCases || 0} test cases passed`,
            time: this.formatTimeAgo(new Date(submission.submittedAt)),
            icon: 'Code',
            color: submission.status === 'accepted' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600',
            status: submission.status,
            executionTime: submission.executionTime,
            memoryUsed: submission.memoryUsed,
            passedTestCases: submission.passedTestCases,
            totalTestCases: submission.totalTestCases
          });
        });
      }

      // Process interview results
      if (interviewResponse.success && interviewResponse.data?.interviews) {
        interviewResponse.data.interviews.forEach((interview: any) => {
          activities.push({
            id: interview._id,
            type: 'interview',
            title: interview.title || `${interview.category?.displayName || 'Interview'}`,
            description: interview.finalAssessment?.overallScore 
              ? `Scored ${interview.finalAssessment.overallScore}%`
              : interview.status.current === 'completed' 
                ? 'Completed'
                : 'In Progress',
            time: this.formatTimeAgo(new Date(interview.startTime)),
            icon: 'Video',
            color: interview.finalAssessment?.overallScore 
              ? (interview.finalAssessment.overallScore >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600')
              : 'bg-blue-100 text-blue-600',
            score: interview.finalAssessment?.overallScore,
            status: interview.status.current,
            details: {
              interview: {
                category: interview.category,
                finalAssessment: interview.finalAssessment,
                status: interview.status,
                questions: interview.questions || []
              }
            }
          });
        });
      }

      // Sort by time (most recent first) and limit
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      return {
        success: true,
        data: activities.slice(0, limit)
      };

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return empty data if API fails
      return {
        success: false,
        data: []
      };
    }
  }

  // Get user statistics (total counts)
  async getUserStats(): Promise<{
    success: boolean;
    data: {
      totalQuizzes: number;
      totalInterviews: number;
      totalCoding: number;
    };
  }> {
    try {
      // Fetch quiz count - use limit=1 to get just the pagination info
      const quizResponse = await this.makeRequest('/quiz/history/me?limit=1&page=1');
      
      // Fetch interview count - use limit=1 to get just the pagination info
      const interviewResponse = await this.makeRequest('/interview/user/history?limit=1&page=1');
      
      // Fetch coding count - use limit=1 to get just the pagination info
      const codingResponse = await this.makeRequest('/coding/user/me/history?limit=1&page=1');

      const stats = {
        totalQuizzes: quizResponse.success ? (quizResponse.data?.pagination?.total || 0) : 0,
        totalInterviews: interviewResponse.success ? (interviewResponse.data?.pagination?.totalCount || 0) : 0,
        totalCoding: codingResponse.success ? (codingResponse.data?.pagination?.totalCount || 0) : 0
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        data: {
          totalQuizzes: 0,
          totalInterviews: 0,
          totalCoding: 0
        }
      };
    }
  }

  // Get all interviews for history section
  async getAllInterviews(): Promise<{
    success: boolean;
    data: ActivityItem[];
  }> {
    try {
      const interviewResponse = await this.makeRequest('/interview/user/history?limit=100&page=1');
      
      const interviews: ActivityItem[] = [];
      
      if (interviewResponse.success && interviewResponse.data?.interviews) {
        interviewResponse.data.interviews.forEach((interview: any) => {
          // Only include completed interviews
          if (interview.status.current === 'completed') {
            interviews.push({
              id: interview._id,
              type: 'interview',
              title: interview.title || `${interview.category?.displayName || 'Interview'}`,
              description: interview.finalAssessment?.overallScore 
                ? `Scored ${interview.finalAssessment.overallScore}%`
                : 'Completed',
              time: this.formatTimeAgo(new Date(interview.startTime)),
              icon: 'Video',
              color: interview.finalAssessment?.overallScore 
                ? (interview.finalAssessment.overallScore >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600')
                : 'bg-blue-100 text-blue-600',
              score: interview.finalAssessment?.overallScore,
              status: interview.status.current,
              details: {
                interview: {
                  category: interview.category,
                  finalAssessment: interview.finalAssessment,
                  status: interview.status,
                  questions: interview.questions || []
                }
              }
            });
          }
        });
      }

      return {
        success: true,
        data: interviews
      };
    } catch (error) {
      console.error('Error fetching all interviews:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get all quizzes for history section
  async getAllQuizzes(): Promise<{
    success: boolean;
    data: ActivityItem[];
  }> {
    try {
      // Fetch all quizzes without pagination limits
      const quizResponse = await this.makeRequest('/quiz/history/me?limit=1000&page=1');
      
      const quizzes: ActivityItem[] = [];
      
      if (quizResponse.success && quizResponse.data?.results) {
        quizResponse.data.results.forEach((quiz: any) => {
          quizzes.push({
            id: quiz._id,
            type: 'quiz',
            title: `${quiz.quizTitle || 'Quiz'} Quiz`,
            description: `Scored ${quiz.score}%`,
            time: this.formatTimeAgo(new Date(quiz.createdAt)),
            icon: 'BookOpen',
            color: 'bg-green-100 text-green-600',
            score: quiz.score,
            status: quiz.grade || 'Completed',
            details: {
              quiz: {
                questionAnalysis: quiz.questionAnalysis || [],
                performanceByType: quiz.performanceByType,
                performanceByDifficulty: quiz.performanceByDifficulty,
                totalQuestions: quiz.totalQuestions,
                answeredQuestions: quiz.answeredQuestions,
                correctAnswers: quiz.correctAnswers,
                incorrectAnswers: quiz.incorrectAnswers,
                unansweredQuestions: quiz.unansweredQuestions,
                timeTaken: quiz.timeTaken,
                averageTimePerQuestion: quiz.averageTimePerQuestion
              }
            }
          });
        });
      }

      return {
        success: true,
        data: quizzes
      };
    } catch (error) {
      console.error('Error fetching all quizzes:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }
}

export const activityService = new ActivityService(); 