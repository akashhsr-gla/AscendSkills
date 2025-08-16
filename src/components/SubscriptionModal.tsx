'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Check, AlertCircle, Loader2, User, Calendar, Shield, Star, Zap, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscriptionService, type SubscriptionPlan } from '@/services/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionPlans: SubscriptionPlan[];
}

interface PaymentStatus {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

const plans = [
  {
    name: "Monthly",
    key: "monthly",
    description: "Perfect for getting started with placement preparation",
    icon: Zap,
    gradient: "from-primary-500 to-primary-600",
    bgGradient: "from-primary-50 to-primary-100",
    popular: false
  },
  {
    name: "Quarterly",
    key: "quarterly",
    description: "Most popular choice for serious learners",
    icon: Star,
    gradient: "from-secondary-500 to-secondary-600",
    bgGradient: "from-secondary-50 to-secondary-100",
    popular: true,
    discount: "Save 17%"
  },
  {
    name: "Yearly",
    key: "half_yearly",
    description: "Best value for serious learners and career growth",
    icon: Crown,
    gradient: "from-accent-500 to-accent-600",
    bgGradient: "from-accent-50 to-accent-100",
    popular: false,
    discount: "Save 33%"
  }
];

// Common features for all plans
const commonFeatures = [
  "AI Based Interview Insights Report",
  "Quizzes Access",
  "Company Wise Interview Prep",
  "HR Interview Prep",
  "Exclusive Dashboard to Track Progress"
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, subscriptionPlans }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'idle',
    message: ''
  });
  const [orderData, setOrderData] = useState<Record<string, unknown> | null>(null);
  const [userSubscription, setUserSubscription] = useState<{
    isActive?: boolean;
    type?: string;
    endDate?: string | null;
  } | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Load Razorpay script and check user subscription
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      checkUserSubscription();
    }
  }, [isOpen]);

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

  // Get price for a specific plan
  const getPlanPrice = (planKey: string) => {
    const plan = subscriptionPlans.find(p => p.key === planKey);
    return plan ? plan.priceInr : 0;
  };

  // Get period text for a plan
  const getPeriodText = (planKey: string) => {
    switch (planKey) {
      case 'monthly': return '/month';
      case 'quarterly': return '/3 months';
      case 'half_yearly': return '/6 months';
      default: return '';
    }
  };

  // Get features for a specific plan
  const getPlanFeatures = (planKey: string) => {
    const baseFeatures = [...commonFeatures];
    
    // Add one unique feature per plan
    switch (planKey) {
      case 'monthly':
        return [...baseFeatures, "For trial and affordability"];
      case 'quarterly':
        return [...baseFeatures, "Save more"];
      case 'half_yearly':
        return [...baseFeatures, "Long term growth and maximum saving"];
      default:
        return baseFeatures;
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }
    
    setSelectedPlan(plan);
    handlePayment(plan);
  };

  const handlePayment = async (plan: SubscriptionPlan) => {
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
        handler: async (response: Record<string, unknown>) => {
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

  const handlePaymentSuccess = async (response: Record<string, unknown>) => {
    setPaymentStatus({ status: 'loading', message: 'Verifying payment...' });

    try {
      const verifyResponse = await subscriptionService.verifyPayment({
        razorpay_order_id: response.razorpay_order_id as string,
        razorpay_payment_id: response.razorpay_payment_id as string,
        razorpay_signature: response.razorpay_signature as string
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
              className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Choose Your Success Plan</h3>
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

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {plans.map((plan, index) => {
                    const Icon = plan.icon;
                    const price = getPlanPrice(plan.key);
                    const periodText = getPeriodText(plan.key);
                    const features = getPlanFeatures(plan.key);
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative ${plan.popular ? 'md:-mt-2 md:mb-2' : ''}`}
                      >
                        {/* Popular Badge */}
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-gradient-secondary text-white px-4 py-1 rounded-full text-xs font-medium shadow-lg">
                              Most Popular
                            </div>
                          </div>
                        )}

                        {/* Card */}
                        <div className={`relative h-full bg-white rounded-xl border-2 ${plan.popular ? 'border-secondary-300' : 'border-gray-200'} p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                          {/* Background Gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgGradient} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
                          
                          {/* Content */}
                          <div className="relative z-10">
                            {/* Icon & Discount */}
                            <div className="flex items-center justify-between mb-4">
                              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r ${plan.gradient} text-white shadow-md`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              {plan.discount && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {plan.discount}
                                </span>
                              )}
                            </div>

                            {/* Plan Name & Description */}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{plan.description}</p>

                            {/* Price */}
                            <div className="mb-6">
                              <div className="flex items-baseline">
                                <span className="text-3xl font-bold text-gray-900">
                                  ₹{price}
                                </span>
                                <span className="text-gray-500 ml-1 text-sm">{periodText}</span>
                              </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-6">
                              {features.map((feature, featureIndex) => (
                                <li key={featureIndex} className="flex items-start">
                                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            {/* CTA Button */}
                            {!isAuthenticated ? (
                              <button
                                onClick={() => router.push('/auth/login')}
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 ${
                                  plan.popular 
                                    ? 'bg-gradient-secondary text-white hover:shadow-lg' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-primary-300'
                                }`}
                              >
                                Login to Subscribe
                              </button>
                            ) : userSubscription && userSubscription.isActive && userSubscription.type !== 'free' ? (
                              <button
                                disabled
                                className="w-full py-3 px-4 rounded-lg font-semibold text-base bg-gray-400 text-white cursor-not-allowed"
                              >
                                Already Subscribed
                              </button>
                            ) : (
                              <button 
                                onClick={() => handlePlanSelect({
                                  _id: plan.key,
                                  key: plan.key,
                                  name: plan.name,
                                  durationDays: plan.key === 'monthly' ? 30 : plan.key === 'quarterly' ? 90 : 180,
                                  priceInr: getPlanPrice(plan.key),
                                  isActive: true,
                                  sortOrder: plan.key === 'monthly' ? 1 : plan.key === 'quarterly' ? 2 : 3
                                })}
                                disabled={paymentStatus.status === 'loading'}
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  plan.popular 
                                    ? 'bg-gradient-secondary text-white hover:shadow-lg' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-primary-300'
                                }`}
                              >
                                {paymentStatus.status === 'loading' ? 'Processing...' : `Subscribe Now`}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Security Notice */}
                <div className="text-center">
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

export default SubscriptionModal;
