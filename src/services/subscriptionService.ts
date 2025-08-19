const DEFAULT_API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5000/api'
  : 'https://ascendskills.onrender.com/api';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '');
import { authService } from './authService';

export interface UserSubscription {
  type: 'free' | 'basic' | 'premium' | 'enterprise' | 'monthly' | 'quarterly' | 'half_yearly';
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId: string | null;
  amount: number;
  features: Array<{
    name: string;
    enabled: boolean;
  }>;
}

export interface SubscriptionPlan {
  _id: string;
  key: string;
  name: string;
  description?: string;
  durationDays: number;
  priceInr: number;
  isActive: boolean;
  sortOrder: number;
}

export interface SubscriptionResponse {
  success: boolean;
  data?: UserSubscription;
  message?: string;
}

export interface PlansResponse {
  success: boolean;
  data?: SubscriptionPlan[];
  message?: string;
}

class SubscriptionService {
  private getAuthHeaders(): HeadersInit {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  async getUserSubscription(): Promise<SubscriptionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          data: data.data.subscription
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch subscription'
        };
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return {
        success: false,
        message: 'Network error while fetching subscription'
      };
    }
  }

  async getAvailablePlans(): Promise<PlansResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to fetch plans'
        };
      }
    } catch (error) {
      console.error('Error fetching available plans:', error);
      return {
        success: false,
        message: 'Network error while fetching plans'
      };
    }
  }

  async createOrder(planKey: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/order`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ planKey })
      });

      const data = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to create order'
        };
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: 'Network error while creating order'
      };
    }
  }

  async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          message: data.message
        };
      } else {
        return {
          success: false,
          message: data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        message: 'Network error while verifying payment'
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();
