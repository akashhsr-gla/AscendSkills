'use client';

import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Target, 
  BarChart3, 
  MessageSquare, 
  CreditCard, 
  Settings,
  Volume2,
  TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const features = [
  {
    icon: BarChart3,
    title: "Smart Quiz Engine",
    description: "Timed practice tests with MCQ, fill-in-the-blank, and coding questions. Get instant feedback and detailed explanations for every answer.",
    gradient: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
    link: "/quiz"
  },
  {
    icon: Volume2,
    title: "Voice-Enabled Interviews",
    description: "Practice mock interviews with AI-powered voice recognition. Get real-time feedback on your communication and technical skills.",
    gradient: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
    link: "/interview"
  },
  {
    icon: TrendingUp,
    title: "Detailed Analytics",
    description: "Track your performance with comprehensive analytics. Monitor accuracy, speed, and improvement across all practice sessions.",
    gradient: "from-green-500 to-green-600",
    bgGradient: "from-green-50 to-green-100",
    link: "/dashboard"
  },
  {
    icon: MessageSquare,
    title: "Interview Simulation",
    description: "Practice with realistic interview scenarios including behavioral, technical, and system design questions with AI follow-ups.",
    gradient: "from-orange-500 to-orange-600",
    bgGradient: "from-orange-50 to-orange-100",
    link: "/interview"
  },
  {
    icon: CreditCard,
    title: "Flexible Subscriptions",
    description: "Choose from monthly, quarterly, or yearly plans with secure Razorpay payment integration and comprehensive access.",
    gradient: "from-indigo-500 to-indigo-600",
    bgGradient: "from-indigo-50 to-indigo-100",
    link: "/#pricing"
  }
];

const FeaturesGrid = () => {
  const router = useRouter();

  const handleFeatureClick = (link: string) => {
    if (link.startsWith('/#')) {
      // Handle anchor links
      const elementId = link.substring(2);
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Handle regular navigation
      router.push(link);
    }
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for{' '}
            <span className="text-gradient-primary">
              Placement Success
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From practice quizzes to mock interviews, coding challenges to detailed analytics— 
            we provide all the tools you need to excel in your placement journey.
          </p>
        </motion.div>

        {/* Features Grid - All cards in one line */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="group relative cursor-pointer"
                onClick={() => handleFeatureClick(feature.link)}
              >
                {/* Card */}
                <div className="relative h-full bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>

                    {/* Hover Effect Arrow */}
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="flex items-center text-primary-600 text-sm font-semibold">
                        Learn more
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="ml-1"
                        >
                          →
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-gray-100 rounded-full -translate-y-10 translate-x-10 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white to-gray-100 rounded-full translate-y-8 -translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
              </motion.div>
            );
          })}
        </div>

     
      </div>
    </section>
  );
};

export default FeaturesGrid; 