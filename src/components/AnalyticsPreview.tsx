'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, Target, Award, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AnalyticsPreview = () => {
  const router = useRouter();

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-accent-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Monitor Your{' '}
            <span className="text-gradient-primary">
              Performance
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Track your progress, analyze your performance, and get insights to improve your placement preparation journey
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Performance Overview</h3>
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-6 mb-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Overall Accuracy</span>
                    <span className="text-white font-semibold">87%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "87%" }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="bg-gradient-primary h-3 rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Speed Improvement</span>
                    <span className="text-white font-semibold">+34%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "74%" }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="bg-gradient-secondary h-3 rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Interview Score</span>
                    <span className="text-white font-semibold">92%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "92%" }}
                      transition={{ duration: 1.5, delay: 0.9 }}
                      className="bg-gradient-to-r from-accent-500 to-green-500 h-3 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-300">Tests Taken</div>
                  <div className="text-2xl font-bold text-white">147</div>
                </div>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-300">Avg Time</div>
                  <div className="text-2xl font-bold text-white">2.3m</div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-gradient-primary p-4 rounded-xl shadow-lg"
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg"
            >
              <div className="flex items-center text-sm">
                <Award className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-gray-700 font-medium">Good Peformance</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Interview Analytics Card */}
            <div 
              onClick={() => router.push('/interview')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-300"
            >
              <Clock className="w-12 h-12 text-secondary-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Interview Analytics</h3>
              <p className="text-gray-300 leading-relaxed">
                Track your interview performance with communication scores, technical accuracy, 
                and confidence metrics. Analyze your responses and get improvement suggestions.
              </p>
            </div>

            {/* Practice Questions Card */}
            <div 
              onClick={() => router.push('/quiz')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-300"
            >
              <BarChart3 className="w-12 h-12 text-primary-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Practice Questions</h3>
              <p className="text-gray-300 leading-relaxed">
                Access a vast library of practice questions across different difficulty levels. 
                Improve your problem-solving skills with instant feedback and detailed solutions.
              </p>
            </div>

            {/* Job Portal Feature Card */}
            <div 
              onClick={() => router.push('/jobs')}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-300"
            >
              <Target className="w-12 h-12 text-accent-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Find the Perfect Job</h3>
              <p className="text-gray-300 leading-relaxed">
                Find perfect jobs for yourself with our job portal. Discover roles that match your skills and interests, and apply seamlessly.
              </p>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <a href="/dashboard" className="block w-full bg-gradient-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center">
                <BarChart3 className="w-5 h-5 inline mr-2" />
                View Your Dashboard
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/10"
        >
          <div className="text-center">
            <div className="text-white font-semibold mb-2">Practice Questions</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold mb-2">Interview Categories</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold mb-2">Coding Problems</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold mb-2">24/7 Practice Available</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AnalyticsPreview; 