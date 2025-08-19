'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BackendUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const DEFAULT_API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? 'http://localhost:5000/api'
    : 'https://ascendskills.onrender.com/api';
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        const token = authService.getToken();
        if (token && authService.isAuthenticated()) {
          // Fetch user info from backend
          const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const backendUser: BackendUser = data.data;
              setUser({
                id: backendUser.id || backendUser._id || '',
                name: backendUser.name,
                email: backendUser.email,
                role: backendUser.role
              });
            } else {
              authService.logout();
              setUser(null);
            }
          } else {
            authService.logout();
            setUser(null);
          }
        } else {
          // No token found, user is not authenticated
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        // Set user data from login response
        const backendUser: BackendUser = response.data.user;
        setUser({
          id: backendUser.id || backendUser._id || '',
          name: backendUser.name,
          email: backendUser.email,
          role: backendUser.role
        });
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const signup = async (userData: any) => {
    try {
      const response = await authService.signup(userData);
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 