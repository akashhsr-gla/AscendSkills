'use client';

import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RazorpayModal from './RazorpayModal';
import { subscriptionService } from '@/services/subscriptionService';

interface SubscriptionPlan {
  _id: string;
  key: string;
  name: string;
  durationDays: number;
  priceInr: number;
  isActive: boolean;
}

// Server-side data fetching function
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const DEFAULT_API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
      ? 'http://localhost:5000'
      : 'https://ascendskills.onrender.com';
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_API}/api`).replace(/\/$/, '');
    const response = await fetch(`${API_BASE}/subscriptions/plans`, {
      cache: 'no-store' // Ensure fresh data
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || [];
    }
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
  }
  
  // Return empty array if API fails - no fallback prices
  return [];
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

const PricingSection = () => {
  const { isAuthenticated } = useAuth();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const router = useRouter();

  // Fetch subscription plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansResponse = await subscriptionService.getAvailablePlans();
        if (plansResponse.success && plansResponse.data) {
          console.log('📊 Backend subscription plans:', plansResponse.data);
          setSubscriptionPlans(plansResponse.data);
        } else {
          // No fallback - just set empty array if API fails
          console.error('Failed to fetch subscription plans from backend');
          setSubscriptionPlans([]);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        // No fallback - just set empty array if API fails
        setSubscriptionPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Get price for a specific plan
  const getPlanPrice = (planKey: string) => {
    const plan = subscriptionPlans.find(p => p.key === planKey);
    const price = plan ? plan.priceInr : 0;
    console.log(`💰 Price for ${planKey}:`, price, 'from plan:', plan);
    return price;
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

  // Get features for a specific plan (all same, just one line different)
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

  // Handle plan selection
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }
    
    setSelectedPlan(plan);
    setShowRazorpayModal(true);
  };

  // Handle Razorpay modal close
  const handleRazorpayModalClose = () => {
    setShowRazorpayModal(false);
    setSelectedPlan(null);
  };

  return (
    <section id="pricing" className="py-16 bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose Your{' '}
            <span className="text-gradient-primary">
              Success Plan
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Flexible pricing options designed to fit your learning journey and budget. 
            Start your placement preparation today!
          </p>
        </motion.div>

        {/* Pricing Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscription plans...</p>
          </div>
        ) : subscriptionPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Plans</h3>
            <p className="text-gray-600 mb-4">Please try refreshing the page or contact support.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = getPlanPrice(plan.key);
              const periodText = getPeriodText(plan.key);
              const features = getPlanFeatures(plan.key);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
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
                          {loading ? '...' : `₹${price}`}
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
                    <button 
                      onClick={() => handlePlanSelect({
                        _id: plan.key,
                        key: plan.key,
                        name: plan.name,
                        durationDays: plan.key === 'monthly' ? 30 : plan.key === 'quarterly' ? 90 : 180,
                        priceInr: getPlanPrice(plan.key),
                        isActive: true
                      })}
                      disabled={loading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular 
                          ? 'bg-gradient-secondary text-white hover:shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-primary-300'
                    }`}>
                      {loading ? 'Loading...' : 'Subscribe Now'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}

        {/* Payment Modal */}
        <RazorpayModal
          isOpen={showRazorpayModal}
          onClose={handleRazorpayModalClose}
          plan={selectedPlan}
        />
      </div>
    </section>
  );
};

export default PricingSection; 