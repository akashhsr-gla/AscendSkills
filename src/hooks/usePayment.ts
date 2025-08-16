import { useState } from 'react';
import { subscriptionService } from '@/services/subscriptionService';

interface PaymentState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  orderData: any | null;
}

interface UsePaymentReturn {
  paymentState: PaymentState;
  initiatePayment: (planKey: string) => Promise<void>;
  verifyPayment: (paymentData: any) => Promise<boolean>;
  resetPayment: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    success: false,
    orderData: null
  });

  const initiatePayment = async (planKey: string) => {
    setPaymentState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: false
    }));

    try {
      const response = await subscriptionService.createOrder(planKey);
      
      if (response.success && response.data) {
        setPaymentState(prev => ({
          ...prev,
          isLoading: false,
          orderData: response.data
        }));
      } else {
        throw new Error(response.message || 'Failed to create payment order');
      }
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Payment initialization failed'
      }));
    }
  };

  const verifyPayment = async (paymentData: any): Promise<boolean> => {
    setPaymentState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const response = await subscriptionService.verifyPayment(paymentData);
      
      if (response.success) {
        setPaymentState(prev => ({
          ...prev,
          isLoading: false,
          success: true
        }));
        return true;
      } else {
        throw new Error(response.message || 'Payment verification failed');
      }
    } catch (error) {
      setPaymentState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }));
      return false;
    }
  };

  const resetPayment = () => {
    setPaymentState({
      isLoading: false,
      error: null,
      success: false,
      orderData: null
    });
  };

  return {
    paymentState,
    initiatePayment,
    verifyPayment,
    resetPayment
  };
};
