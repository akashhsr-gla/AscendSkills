import { authService } from './authService';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'company';
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
  status: {
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isDefaulter: boolean;
    lastLogin?: Date;
    loginAttempts: number;
    lockUntil?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  _id: string;
  key: 'monthly' | 'quarterly' | 'half_yearly';
  name: string;
  description?: string;
  durationDays: number;
  priceInr: number;
  isActive: boolean;
  sortOrder: number;
}

export interface PaymentTransaction {
  _id: string;
  user: { _id: string; name: string; email: string } | string;
  plan: SubscriptionPlan | string;
  amountInr: number;
  currency: 'INR';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin' | 'company';
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

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'student' | 'admin' | 'company';
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
  status?: {
    isActive?: boolean;
  };
}

export interface UsersResponse {
  users: User[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalCount: number;
  };
}

class AdminService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json'
    };
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    subscriptionType?: string;
    isDefaulter?: string;
  } = {}): Promise<{ success: boolean; data?: UsersResponse; message?: string }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/admin/users?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch users' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, message: 'Network error while fetching users' };
    }
  }

  async getUserById(id: string): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch user' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { success: false, message: 'Network error while fetching user' };
    }
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to create user' };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Network error while creating user' };
    }
  }

  async updateUser(id: string, updateData: UpdateUserData): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to update user' };
      }

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: 'Network error while updating user' };
    }
  }

  async deleteUser(id: string, permanent: boolean = false, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ permanent, reason })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to delete user' };
      }

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Network error while deleting user' };
    }
  }

  async getUserStatistics(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/statistics`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, message: result.message || 'Failed to fetch user statistics' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      return { success: false, message: 'Network error while fetching user statistics' };
    }
  }

  // Subscriptions (admin + public)
  async getSubscriptionPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/plans`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to fetch plans' };
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching plans:', error);
      return { success: false, message: 'Network error while fetching plans' };
    }
  }

  async seedDefaultPlans(): Promise<{ success: boolean; data?: SubscriptionPlan[]; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/admin/seed`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to seed plans' };
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error seeding plans:', error);
      return { success: false, message: 'Network error while seeding plans' };
    }
  }

  async upsertPlan(payload: { key: SubscriptionPlan['key']; name: string; description?: string; durationDays: number; priceInr: number; isActive?: boolean; sortOrder?: number }): Promise<{ success: boolean; data?: SubscriptionPlan; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/admin/plan`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to save plan' };
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error saving plan:', error);
      return { success: false, message: 'Network error while saving plan' };
    }
  }

  async togglePlan(planId: string): Promise<{ success: boolean; data?: SubscriptionPlan; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/admin/plan/${planId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to toggle plan' };
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error toggling plan:', error);
      return { success: false, message: 'Network error while toggling plan' };
    }
  }

  async setUserSubscription(userId: string, payload: { planKey: 'monthly' | 'quarterly' | 'half_yearly' | null; isActive: boolean }): Promise<{ success: boolean; message?: string; data?: User }> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/admin/user/${userId}/subscription`, {
        method: 'PUT',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to update user subscription' } as any;
      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      console.error('Error setting user subscription:', error);
      return { success: false, message: 'Network error while setting subscription' } as any;
    }
  }

  async listTransactions(params: { page?: number; limit?: number; status?: string; userId?: string } = {}): Promise<{ success: boolean; data?: { items: PaymentTransaction[]; pagination: { page: number; limit: number; total: number } }; message?: string }> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') query.append(k, String(v)); });
      const response = await fetch(`${this.baseUrl}/subscriptions/admin/transactions?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to fetch transactions' } as any;
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return { success: false, message: 'Network error while fetching transactions' } as any;
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newPassword })
      });
      
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to reset user password' };
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error resetting user password:', error);
      return { success: false, message: 'Network error while resetting password' };
    }
  }

  async getUserPasswordStatus(userId: string): Promise<{ success: boolean; data?: PasswordStatus; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/password-status`, {
        method: 'GET',
        credentials: 'include',
        headers: this.getAuthHeaders()
      });
      
      const result = await response.json();
      if (!response.ok) return { success: false, message: result.message || 'Failed to get user password status' };
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error getting user password status:', error);
      return { success: false, message: 'Network error while getting password status' };
    }
  }
}

// ==================== PASSWORD MANAGEMENT INTERFACES ====================

export interface PasswordStatus {
  isPasswordSet: boolean;
  passwordResetToken: string;
  passwordResetTokenExpiresAt: string | null;
}

export const adminService = new AdminService(); 