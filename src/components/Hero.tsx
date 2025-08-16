'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Play, Target, Brain, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <section id="home" className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 text-primary-600 text-sm font-medium mb-6"
            >
              <Target className="w-4 h-4 mr-2" />
              Comprehensive Placement Preparation Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              Master Your{' '}
              <span className="text-gradient-primary">
                Placement Journey
              </span>{' '}
              With AI-Powered Tools
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Practice quizzes, mock interviews, coding challenges, and detailed analytics—all in one platform. 
              Get real-time feedback, track your progress, and ace your placement interviews with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button 
                onClick={() => router.push('/dashboard')}
                className="group bg-gradient-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Start Preparing
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="group bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-primary-200 hover:border-primary-400 hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <Play className="mr-2 w-5 h-5" />
                Explore Features
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary-600">500+</div>
                <div className="text-sm text-gray-600">Practice Quizzes</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-secondary-600">50+</div>
                <div className="text-sm text-gray-600">Interview Categories</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-accent-600">200+</div>
                <div className="text-sm text-gray-600">Coding Problems</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative z-10">
              {/* Main Card */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Live Assessment</h3>
                  <div className="flex items-center text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Active
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Questions Solved</span>
                    <span className="font-semibold text-primary-600">47/50</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "94%" }}
                      transition={{ duration: 2, delay: 1 }}
                      className="bg-gradient-primary h-2 rounded-full"
                    ></motion.div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <Brain className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">AI Analysis</div>
                      <div className="font-semibold text-green-600">98%</div>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Improvement</div>
                      <div className="font-semibold text-blue-600">+23%</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-gradient-secondary text-white p-4 rounded-xl shadow-lg"
              >
                <Target className="w-6 h-6" />
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-primary-200"
              >
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-700 font-medium">Interview Ready</span>
                </div>
              </motion.div>
            </div>

            {/* Background Circles */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary-200 rounded-full opacity-20 animate-float"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-secondary-200 rounded-full opacity-20 animate-float delay-1000"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 