"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'couturier' | 'admin';
  imageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'client' | 'couturier') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Try to verify token with backend
        const response = await authApi.me();
        setUser({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role as 'client' | 'couturier' | 'admin',
        });
      } catch {
        // Token invalid or API error - clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
      } finally {
        setIsLoading(false);
      }
    };

    // Timeout fallback - if API doesn't respond, treat as logged out
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    checkAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  // Prevent back navigation when logged in
  useEffect(() => {
    if (!user || isLoading) return;

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      
      // If trying to go back to auth or home, redirect to dashboard
      if (currentPath === '/auth' || currentPath === '/') {
        const dashboardPath = user.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
        window.location.href = dashboardPath;
      }
    };

    // Replace current history entry so back button goes to dashboard
    const dashboardPath = user.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
    window.history.replaceState(null, '', dashboardPath);

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, isLoading]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as 'client' | 'couturier' | 'admin',
      };
      
      setUser(userData);
      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      // Set cookie
      document.cookie = `token=${response.tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Use window.location to force full page redirect (ensures visual update)
      const dashboardPath = userData.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
      window.location.href = dashboardPath;
    } catch (error: unknown) {
      console.error('Login error:', error);
      setIsLoading(false);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || 'Erreur de connexion';
        throw new Error(message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur de connexion');
    }
    // Note: No finally block - we don't set isLoading false on success because we're redirecting
  };

  const register = async (name: string, email: string, password: string, role: 'client' | 'couturier') => {
    setIsLoading(true);
    try {
      const response = await authApi.register({ name, email, password, role });
      
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as 'client' | 'couturier' | 'admin',
      };
      
      setUser(userData);
      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      // Set cookie
      document.cookie = `token=${response.tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Use window.location to force full page redirect (ensures visual update)
      const dashboardPath = userData.role === 'couturier' ? '/dashboard/couturier' : '/dashboard/client';
      window.location.href = dashboardPath;
    } catch (error: unknown) {
      console.error('Register error:', error);
      setIsLoading(false);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const message = axiosError.response?.data?.message || "Erreur d'inscription";
        throw new Error(message);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erreur d'inscription");
    }
    // Note: No finally block - we don't set isLoading false on success because we're redirecting
  };

  const logout = () => {
    // Clear state first
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthTime');
    
    // Clear cookie
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    
    // Use window.location to completely replace the history
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
