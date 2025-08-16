'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, Building2, GraduationCap } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  package: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Rehana Sayyed",
    role: "Software Engineer",
    company: "Cognizant",
    package: "4 LPA",
    content: "The comprehensive practice tests and mock interviews helped me build confidence. The platform's analytics showed me exactly where to focus my efforts.",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  },
  {
    id: 2,
    name: "Majji Naveen Sai Kumar",
    role: "Software Engineer",
    company: "Cognizant",
    package: "4 LPA",
    content: "The quiz system and coding challenges were exactly what I needed. The detailed feedback helped me understand my mistakes and improve significantly.",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  },
  {
    id: 3,
    name: "Jami Anjana Adi Sathvik",
    role: "Software Engineer",
    company: "Cognizant",
    package: "4 LPA",
    content: "The voice-enabled interviews were amazing! They helped me practice my communication skills and get comfortable with technical discussions.",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  },
  {
    id: 4,
    name: "Dantu Vyshnavi Satya",
    role: "Software Engineer",
    company: "Cognizant",
    package: "4 LPA",
    content: "The interview simulation with AI feedback was invaluable. It helped me prepare for real interview scenarios and improve my problem-solving approach.",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  },
  {
    id: 5,
    name: "Javvadi Tulasi",
    role: "Software Engineer",
    company: "Collabera Tech",
    package: "4 LPA",
    content: "The platform's comprehensive approach to placement preparation is outstanding. From quizzes to interviews, everything I needed was in one place.",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  },
  {
    id: 6,
    name: "Ezaz Ahmed",
    role: "Software Engineer",
    company: "Cognizant",
    package: "4 LPA",
    content: "The detailed analytics and performance tracking helped me identify my weak areas and focus on improvement. Highly recommended for placement preparation!",
    rating: 5,
    avatar: "/api/placeholder/60/60"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Success Stories from{' '}
              <span className="text-gradient-primary">Students</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the community of students who have successfully prepared for their placements with our comprehensive platform
            </p>
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Quote Icon */}
              <div className="mb-6">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                  <Quote className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 text-lg leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <p className="text-gray-700 font-medium">{testimonial.role}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <p className="text-blue-600 font-semibold">{testimonial.company}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold inline-block">
                    {testimonial.package}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-primary rounded-2xl p-8 text-white shadow-xl">
            <h3 className="text-3xl font-bold mb-4">
              If you face any problem or need assistance
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Email <span className="font-semibold">ascendskillsedutech@gmail.com</span> or call <span className="font-semibold">+91 81218 40706</span>
            </p>
            <a href="/contact" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
