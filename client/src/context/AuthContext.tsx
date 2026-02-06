import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getStoreHeaders, setStoreId } from '../utils/storeDetection';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'staff' | 'customer';
  storeId?: string;
  forcePasswordChange?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            ...getStoreHeaders()
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.user.storeId) {
            setStoreId(data.user.storeId);
          }
        } else {
          // Invalid token, clear it
          sessionStorage.removeItem('token');
          setToken(null);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getStoreHeaders()
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        if (data.user.storeId) {
          setStoreId(data.user.storeId);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  // Register
  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getStoreHeaders()
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        if (data.user.storeId) {
          setStoreId(data.user.storeId);
        }
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Error al registrar' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: { name?: string; phone?: string }) => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...getStoreHeaders()
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setUser(prev => prev ? { ...prev, ...data } : null);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'staff',
    login,
    register,
    logout,
    updateProfile,
    forgotPassword: async (email: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...getStoreHeaders()
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            return { success: response.ok, error: data.error };
        } catch (error) {
            return { success: false, error: 'Error de conexión' };
        }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(requireAdmin = false) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return { authorized: false, loading: true };
  if (!isAuthenticated) return { authorized: false, loading: false, reason: 'not_authenticated' };
  if (requireAdmin && !isAdmin) return { authorized: false, loading: false, reason: 'not_admin' };

  return { authorized: true, loading: false };
}
