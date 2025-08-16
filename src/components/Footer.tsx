'use client';

import React from 'react';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-6">
              <Image
                src="/aslogo.svg"
                alt="Ascend Skills"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="ml-3 text-xl font-bold text-gradient-primary">
                Ascend Skills
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Empowering students to crack their dream jobs with AI-powered preparation tools 
              and expert guidance.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Navigation</h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="/jobs" className="text-gray-400 hover:text-white transition-colors">Jobs</a></li>
              <li><a href="/quiz" className="text-gray-400 hover:text-white transition-colors">Quiz</a></li>
              <li><a href="/interview" className="text-gray-400 hover:text-white transition-colors">Interview</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Help</a></li>
            </ul>
          </div>

          {/* Plans & Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Plans & Contact</h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">Plans</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              <li><a href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
              <li><a href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Get Started</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Info</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span>ascendskillsedutech@gmail.com</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span>Nandigama, Krishna dist,<br />Andhra Pradesh, India-521185</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>+91 81218 40706</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Ascend Skills. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Made with ❤️ in India
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 