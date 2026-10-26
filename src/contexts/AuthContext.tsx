import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { apiLogin, apiRegister, apiGetMe, apiLogout, hasToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; bio: string; skillsToTeach: { name: string }[]; skillsToLearn: { name: string; level: 'Low' | 'Medium' | 'High' }[] }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (hasToken()) {
        const u = await apiGetMe();
        setUser(u);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      if (hasToken()) {
        try {
          const u = await apiGetMe();
          setUser(u);
        } catch {
          // Backend unreachable or token invalid — clear silently
          apiLogout();
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: u } = await apiLogin(email, password);
      setUser(u);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const register = async (data: { name: string; email: string; password: string; bio: string; skillsToTeach: { name: string }[]; skillsToLearn: { name: string; level: 'Low' | 'Medium' | 'High' }[] }) => {
    try {
      const { user: u } = await apiRegister(data);
      setUser(u);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
