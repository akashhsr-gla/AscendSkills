'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    if (user?.role === 'admin') {
      logout('/admin/login');
    } else {
      logout('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              Home
            </a>
            
            <a href="/jobs" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              Jobs
            </a>
            <a href="/quiz" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              Quiz
            </a>
            <a href="/interview" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              Interview
            </a>
            <a href="/about" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              About Us
            </a>
            <a href="/contact" className="text-gray-700 hover:text-primary-500 transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <a 
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user?.name}</span>
                </a>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-500 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <a href="/auth/login" className="text-gray-700 hover:text-primary-500 font-medium transition-colors">
                  Login
                </a>
                <a href="/auth/signup" className="bg-gradient-primary text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  Get Started
                </a>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-black"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} className="text-black" /> : <Menu size={24} className="text-black" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <a href="/" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Home
              </a>
              <a href="/about" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                About
              </a>
              <a href="/jobs" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Jobs
              </a>
              <a href="/quiz" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Quiz
              </a>
              <a href="/interview" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Interview
              </a>
              <a href="/about" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Plans
              </a>
              <a href="/contact" className="block px-3 py-2 text-gray-700 hover:text-primary-500 font-medium">
                Contact
              </a>
              <div className="px-3 py-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    <a 
                      href="/dashboard"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-500 font-medium px-3 py-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      <span>{user?.name}</span>
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 text-gray-700 hover:text-red-500 font-medium px-3 py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                </button>
                  </>
                ) : (
                  <>
                    <a href="/auth/login" className="block w-full text-left text-gray-700 hover:text-primary-500 font-medium px-3 py-2">
                      Login
                    </a>
                    <a href="/auth/signup" className="block w-full bg-gradient-primary text-white px-4 py-2 rounded-lg font-medium">
                      Get Started
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 