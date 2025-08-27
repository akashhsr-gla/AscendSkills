import { authService } from './authService';

export interface UserProfile {
  name: string;
  email: string;
  profile: {
    phone?: string;
    college?: string;
    degree?: string;
    year?: number;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    resumeUrl?: string;
    profilePicture?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: Date;
    gender?: string;
  };
  subscription: {
    type: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    paymentStatus: string;
    transactionId?: string;
    amount: number;
    features: Array<{
      name: string;
      enabled: boolean;
    }>;
  };
  analytics: {
    totalQuizzes: number;
    totalInterviews: number;
    totalCodingProblems: number;
    averageQuizScore: number;
    averageInterviewScore: number;
    averageCodingScore: number;
    overallRating: number;
    strengths: string[];
    weaknesses: string[];
    totalTimeSpent: number;
    streakCount: number;
    lastActivityDate?: Date;
  };
}

export interface ProfileUpdateData {
  name?: string;
  profile?: {
    phone?: string;
    college?: string;
    degree?: string;
    year?: number;
    branch?: string;
    cgpa?: number;
    skills?: string[];
    resumeUrl?: string;
    profilePicture?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    bio?: string;
    location?: string;
    dateOfBirth?: Date;
    gender?: string;
  };
}

class ProfileService {
  private baseUrl = (process.env.NEXT_PUBLIC_API_URL || (
    (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'http://localhost:5000/api'
      : 'https://ascendskills.onrender.com/api'
  )).replace(/\/$/, '');

  async getProfile(): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch profile' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { success: false, message: 'Network error while fetching profile' };
    }
  }

  async updateProfile(updateData: ProfileUpdateData): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors specifically
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map((error: any) => error.message).join('. ');
          return { success: false, message: errorMessages || result.message || 'Failed to update profile' };
        }
        return { success: false, message: result.message || 'Failed to update profile' };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: 'Network error while updating profile' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = authService.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to change password' };
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: 'Network error while changing password' };
    }
  }
}

export const profileService = new ProfileService(); 