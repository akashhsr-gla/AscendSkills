'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Check, AlertCircle, Loader2, User, Calendar, Shield, Lock, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    _id: string;
    key: string;
    name: string;
    durationDays: number;
    priceInr: number;
    isActive: boolean;
  } | null;
}

interface PaymentStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'idle',
    message: ''
  });
  const [orderData, setOrderData] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Load Razorpay script and check user subscription
  useEffect(() => {
    if (isOpen && plan) {
      console.log('💳 PaymentModal received plan:', plan);
      loadRazorpayScript();
      checkUserSubscription();
    }
  }, [isOpen, plan]);

  // Check user's current subscription
  const checkUserSubscription = async () => {
    if (!isAuthenticated) return;
    
    setLoadingSubscription(true);
    try {
      const response = await subscriptionService.getUserSubscription();
      if (response.success && response.data) {
        setUserSubscription(response.data);
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  };

  const handlePayment = async () => {
    if (!plan) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setPaymentStatus({ 
        status: 'error', 
        message: 'Please log in to continue with the payment.' 
      });
      return;
    }

    // Check if user already has an active subscription
    if (userSubscription && userSubscription.isActive && userSubscription.type !== 'free') {
      setPaymentStatus({ 
        status: 'error', 
        message: 'You already have an active subscription.' 
      });
      return;
    }

    setPaymentStatus({ status: 'loading', message: 'Creating payment order...' });

    try {
      // Create order on backend
      const orderResponse = await subscriptionService.createOrder(plan.key);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      setOrderData(orderResponse.data);

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
        amount: orderResponse.data.order.amount,
        currency: orderResponse.data.order.currency,
        name: 'Ascend Skills',
        description: `${plan.name} Subscription`,
        order_id: orderResponse.data.order.id,
        handler: async (response: any) => {
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '+91 00000 00000'
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus({ status: 'idle', message: '' });
            setOrderData(null);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment failed. Please try again.'
      });
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    setPaymentStatus({ status: 'loading', message: 'Verifying payment...' });

    try {
      const verifyResponse = await subscriptionService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyResponse.success) {
        setPaymentStatus({
          status: 'success',
          message: 'Payment successful! Your subscription has been activated.'
        });
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setPaymentStatus({ status: 'idle', message: '' });
          setOrderData(null);
          // Optionally refresh the page or update user state
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus({
        status: 'error',
        message: 'Payment verification failed. Please contact support.'
      });
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'loading':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case 'success':
        return <Check className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus.status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Complete Payment</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gray-500 text-sm">Powered by</span>
                        <Image 
                          src="/Razorpay_logo.svg" 
                          alt="Razorpay" 
                          width={80} 
                          height={20}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Plan Details */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{plan.name} Plan</h4>
                      <p className="text-gray-600 text-sm">{plan.durationDays} days access</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">₹{plan.priceInr}</div>
                      <div className="text-sm text-gray-500">
                        {plan.key === 'monthly' ? '/month' : 
                         plan.key === 'quarterly' ? '/3 months' : '/6 months'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Subscription Warning */}
                {userSubscription && userSubscription.isActive && userSubscription.type !== 'free' && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          You already have an active {userSubscription.type} subscription
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Valid until: {userSubscription.endDate ? new Date(userSubscription.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Authentication Required */}
                {!isAuthenticated && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Please log in to continue
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          You need to be logged in to complete this purchase
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Status */}
                {paymentStatus.message && (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    paymentStatus.status === 'success' ? 'bg-green-50 border-green-200' :
                    paymentStatus.status === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon()}
                      <p className={`text-sm font-medium ${getStatusColor()}`}>
                        {paymentStatus.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Features */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-3">What's included:</h5>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Unlimited practice tests & quizzes
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      AI-powered mock interviews
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Detailed analytics & progress tracking
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Priority support & study materials
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Login to Continue
                    </button>
                    <button
                      onClick={() => router.push('/auth/signup')}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                ) : userSubscription && userSubscription.isActive && userSubscription.type !== 'free' ? (
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                    >
                      Already Subscribed
                    </button>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePayment}
                    disabled={paymentStatus.status === 'loading'}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      paymentStatus.status === 'success' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : paymentStatus.status === 'error'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {paymentStatus.status === 'loading' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : paymentStatus.status === 'success' ? (
                      'Payment Successful!'
                    ) : paymentStatus.status === 'error' ? (
                      'Try Again'
                    ) : (
                      `Pay ₹${plan.priceInr}`
                    )}
                  </button>
                )}

                {/* Security Notice */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-base font-medium text-gray-700">Secure payment by</span>
                    <Image 
                      src="/Razorpay_logo.svg" 
                      alt="Razorpay" 
                      width={80} 
                      height={20}
                    />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Your payment information is encrypted and secure.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
