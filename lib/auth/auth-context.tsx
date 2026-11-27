'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService, type AdminUser, type LoginCredentials } from '@/services/auth';
import { ApiError } from '@/lib/http';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AdminUser | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Restore authenticated session via /auth/me
  const refreshUser = useCallback(async (): Promise<AdminUser | null> => {
    try {
      const res = await authService.getCurrentUser();
      const currentUser = res?.data?.user;
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser);
        return currentUser;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const res = await authService.getCurrentUser();
        if (mounted) {
          const currentUser = res?.data?.user;
          if (currentUser && currentUser.role === 'admin') {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AdminUser> => {
    setIsLoggingIn(true);
    try {
      const res = await authService.adminLogin(credentials);
      const admin = res?.data?.admin;
      if (!admin) {
        throw new ApiError('Invalid response from login server', 500);
      }
      setUser(admin);
      return admin;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      setUser(null);
      setIsLoggingOut(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isLoggingIn,
      isLoggingOut,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, isLoggingIn, isLoggingOut, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
