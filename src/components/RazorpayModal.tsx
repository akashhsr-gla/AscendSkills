'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, CheckCircle, AlertCircle, Loader2, Lock, User, Calendar, Star, Zap, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface RazorpayModalProps {
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

interface PaymentStep {
  step: 'order' | 'payment' | 'verification' | 'success' | 'error';
  message: string;
}

const RazorpayModal: React.FC<RazorpayModalProps> = ({ isOpen, onClose, plan }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<PaymentStep>({
    step: 'order',
    message: 'Initializing payment...'
  });
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Load Razorpay script and check user subscription
  useEffect(() => {
    if (isOpen && plan) {
      console.log('💳 RazorpayModal received plan:', plan);
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
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  };

  const initializePayment = async () => {
    if (!plan) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      setCurrentStep({ 
        step: 'error', 
        message: 'Please log in to continue with the payment.' 
      });
      return;
    }

    // Check if user already has an active subscription
    if (userSubscription && userSubscription.isActive && userSubscription.type !== 'free') {
      setCurrentStep({ 
        step: 'error', 
        message: 'You already have an active subscription.' 
      });
      return;
    }

    setCurrentStep({ step: 'order', message: 'Creating payment order...' });

    try {
      // Create order on backend
      const orderResponse = await subscriptionService.createOrder(plan.key);
      
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      setOrderData(orderResponse.data);
      setCurrentStep({ step: 'payment', message: 'Opening payment gateway...' });

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
        amount: orderResponse.data.order.amount,
        currency: orderResponse.data.order.currency,
        name: 'Ascend Skills',
        description: `${plan.name} Subscription - ${plan.durationDays} days`,
        order_id: orderResponse.data.order.id,
        handler: async (response: any) => {
          setPaymentResponse(response);
          await handlePaymentSuccess(response);
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '+91 00000 00000'
        },
        notes: {
          plan_key: plan.key,
          plan_name: plan.name,
          duration_days: plan.durationDays.toString()
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setCurrentStep({ step: 'order', message: 'Payment cancelled' });
            setOrderData(null);
            setPaymentResponse(null);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initialization error:', error);
      setCurrentStep({
        step: 'error',
        message: error instanceof Error ? error.message : 'Failed to initialize payment'
      });
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    setCurrentStep({ step: 'verification', message: 'Verifying payment...' });

    try {
      const verifyResponse = await subscriptionService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });

      if (verifyResponse.success) {
        setCurrentStep({
          step: 'success',
          message: 'Payment verified successfully! Your subscription has been activated.'
        });
        
        // Close modal after 5 seconds
        setTimeout(() => {
          onClose();
          resetModal();
          // Refresh the page to update user state
          window.location.reload();
        }, 5000);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setCurrentStep({
        step: 'error',
        message: 'Payment verification failed. Please contact support.'
      });
    }
  };

  const resetModal = () => {
    setCurrentStep({ step: 'order', message: 'Initializing payment...' });
    setOrderData(null);
    setPaymentResponse(null);
  };

  const getStepIcon = () => {
    switch (currentStep.step) {
      case 'order':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-600" />;
      case 'payment':
        return <CreditCard className="w-8 h-8 text-blue-600" />;
      case 'verification':
        return <Shield className="w-8 h-8 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <CreditCard className="w-8 h-8 text-blue-600" />;
    }
  };

  const getStepColor = () => {
    switch (currentStep.step) {
      case 'order':
      case 'payment':
        return 'text-blue-600';
      case 'verification':
        return 'text-yellow-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStepBgColor = () => {
    switch (currentStep.step) {
      case 'order':
      case 'payment':
        return 'bg-blue-50 border-blue-200';
      case 'verification':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
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
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">Secure Payment</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-gray-500">Powered by</span>
                        <Image 
                          src="/Razorpay_logo.svg" 
                          alt="Razorpay" 
                          width={70} 
                          height={18}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <Image 
                        src="/Razorpay_logo.svg" 
                        alt="Razorpay" 
                        width={80} 
                        height={20}
                      />
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Plan Summary */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">{plan.name} Subscription</h4>
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
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Unlimited Practice Tests
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      AI Mock Interviews
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Detailed Analytics
                    </div>
                    <div className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Priority Support
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
                <div className={`mb-6 p-4 rounded-lg border ${getStepBgColor()}`}>
                  <div className="flex items-center space-x-3">
                    {getStepIcon()}
                    <div className="flex-1">
                      <h5 className={`font-semibold text-lg ${getStepColor()}`}>
                        {currentStep.step === 'order' && 'Creating Order'}
                        {currentStep.step === 'payment' && 'Payment Gateway'}
                        {currentStep.step === 'verification' && 'Verifying Payment'}
                        {currentStep.step === 'success' && 'Payment Successful'}
                        {currentStep.step === 'error' && 'Payment Failed'}
                      </h5>
                      <p className="text-gray-700">{currentStep.message}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                {orderData && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h5 className="font-semibold text-gray-900 mb-4">Payment Details</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Order ID:</span>
                        <p className="font-mono text-gray-900">{orderData.order.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <p className="font-semibold text-gray-900">₹{orderData.order.amount / 100}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Currency:</span>
                        <p className="text-gray-900">{orderData.order.currency}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="text-gray-900 capitalize">{orderData.order.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {!isAuthenticated ? (
                    <>
                      <button
                        onClick={() => router.push('/auth/login')}
                        className="flex-1 bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => router.push('/auth/signup')}
                        className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : userSubscription && userSubscription.isActive && userSubscription.type !== 'free' ? (
                    <>
                      <button
                        disabled
                        className="flex-1 bg-gray-400 text-white py-4 px-6 rounded-lg font-medium cursor-not-allowed"
                      >
                        Already Subscribed
                      </button>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="flex-1 bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </>
                  ) : currentStep.step === 'order' ? (
                    <button
                      onClick={initializePayment}
                      className="flex-1 bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Start Payment
                    </button>
                  ) : currentStep.step === 'error' ? (
                    <>
                      <button
                        onClick={initializePayment}
                        className="flex-1 bg-primary-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 bg-gray-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : currentStep.step === 'success' ? (
                    <button
                      onClick={onClose}
                      className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Continue
                    </button>
                  ) : null}
                </div>

                {/* Security Features */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-green-700 font-medium">SSL Secured</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Lock className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-blue-700 font-medium">PCI Compliant</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-purple-700 font-medium">Verified</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Secure payment by</span>
                    <Image 
                      src="/Razorpay_logo.svg" 
                      alt="Razorpay" 
                      width={50} 
                      height={12}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Your payment information is encrypted and secure.
                  </p>
                  <p className="text-xs text-gray-400">
                    Need help? Contact support at ascendskillsedutech@gmail.com
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

export default RazorpayModal;
