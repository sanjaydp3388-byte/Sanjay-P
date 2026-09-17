import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  loginAsDemo: (role: 'admin' | 'staff') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('inventory_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.auth.me();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid, logging out:', err);
        localStorage.removeItem('inventory_auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    const res = await api.auth.login(identifier, pass);
    localStorage.setItem('inventory_auth_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginAsDemo = async (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      await login('admin', 'admin123');
    } else {
      await login('staff', 'staff123');
    }
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    localStorage.removeItem('inventory_auth_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, isStaff, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
