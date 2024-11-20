import React, { createContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { EVENTS } from '../constants/events';
import { getAuthConfig, verifyToken } from '../utils/api/auth';
import type { User, AuthConfig } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  authConfig: AuthConfig | null;
  login: (token: string, user: User | null) => void;
  logout: () => void;
  refreshAuthConfig: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const handleAuthError = () => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener(EVENTS.AUTH_ERROR, handleAuthError);
    return () => window.removeEventListener(EVENTS.AUTH_ERROR, handleAuthError);
  }, [addToast]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const config = await getAuthConfig();
        setAuthConfig(config);

        const token = localStorage.getItem('token');
        if (token) {
          const response = await verifyToken();
          if (response.valid && response.user) {
            setIsAuthenticated(true);
            setUser(response.user);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User | null) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    addToast('Successfully logged out.', 'info');
  };

  const refreshAuthConfig = async () => {
    try {
      const config = await getAuthConfig();
      setAuthConfig(config);
    } catch (error) {
      console.error('Error refreshing auth config:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isLoading, 
        user,
        authConfig,
        login, 
        logout,
        refreshAuthConfig
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};