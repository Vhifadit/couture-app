"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'couturier' | 'admin';
  imageUrl?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, expectedRole?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'client' | 'couturier') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==================== CHECK AUTH ====================
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'user=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();

        const userData: User = {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role as 'client' | 'couturier' | 'admin',
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        document.cookie = `token=${storedToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `user_role=${userData.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'user=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    checkAuth().finally(() => clearTimeout(timeoutId));
  }, []);

// ==================== NAVIGATION CONTROL ====================
  // Removed: Aggressive history manipulation and popstate traps.
  // Middleware and page-level checks now handle protection.
  // Login/register still redirect to dashboard.

  // ==================== LOGIN ====================
  const login = async (email: string, password: string, expectedRole?: string) => {
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as 'client' | 'couturier' | 'admin',
      };

      if (expectedRole && userData.role !== expectedRole) {
        throw new Error(`Ce compte n'est pas un compte ${expectedRole}. Veuillez choisir le bon rôle.`);
      }

      setUser(userData);

      const tokens = response.tokens;
      if (!tokens) throw new Error('Tokens manquants');

      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      localStorage.setItem('lastAuthTime', Date.now().toString());

      // Cookies
      document.cookie = `token=${tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `user_role=${userData.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;


      // Redirection
      let dashboardPath = '/dashboard/client';
      if (userData.role === 'admin') dashboardPath = '/dashboard/admin';
      else if (userData.role === 'couturier') dashboardPath = '/dashboard/couturier';

      window.location.href = dashboardPath;

    } catch (error: unknown) {
      console.error('Login error:', error);
      setIsLoading(false);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        throw new Error(axiosError.response?.data?.message || 'Erreur de connexion');
      }

      if (error instanceof Error) throw error;

      throw new Error('Erreur de connexion');
    }
  };

  // ==================== REGISTER ====================
  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'client' | 'couturier'
  ) => {
    setIsLoading(true);

    try {
      const response = await authApi.register({ name, email, password, role });

      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as 'client' | 'couturier' | 'admin',
        status: response.user.status,
      };

      // Removed couturier validation check - auto-login like clients
      // Backend login will block if status != 'actif'

      setUser(userData);

      const tokens = response.tokens;
      if (!tokens) throw new Error('Tokens manquants');

      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('lastAuthTime', Date.now().toString());

      document.cookie = `token=${tokens.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `user_role=${userData.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      let dashboardPath = '/dashboard/client';
      if (userData.role === 'admin') dashboardPath = '/dashboard/admin';
      else if (userData.role === 'couturier') dashboardPath = '/dashboard/couturier';

      window.location.href = dashboardPath;

    } catch (error: unknown) {
      console.error('Register error:', error);
      setIsLoading(false);

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        throw new Error(axiosError.response?.data?.message || "Erreur d'inscription");
      }

      if (error instanceof Error) throw error;

      throw new Error("Erreur d'inscription");
    }
  };

  // ==================== REFRESH USER ====================
  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      const refreshedUser: User = {
        id: response.id,
        name: response.name,
        email: response.email,
        role: response.role as 'client' | 'couturier' | 'admin',
      };
      setUser(refreshedUser);
      localStorage.setItem('user', JSON.stringify(refreshedUser));
      document.cookie = `user=${JSON.stringify(refreshedUser)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      document.cookie = `user_role=${refreshedUser.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  // ==================== LOGOUT ====================
  const logout = () => {
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthTime');

    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'user=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';

    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== HOOK ====================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
