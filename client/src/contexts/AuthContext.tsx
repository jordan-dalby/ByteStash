import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { EVENTS } from '../constants/events';
import { anonymous, getAuthConfig, verifyToken, logout as logoutApi } from '../utils/api/auth';
import type { User, AuthConfig } from '../types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  authConfig: AuthConfig | null;
  login: (user: User | null) => void;
  logout: () => void;
  refreshAuthConfig: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t: translate } = useTranslation('components/auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const handleAuthError = () => {
      if (isAuthenticated) {
        logoutApi().catch(() => {});
      }
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener(EVENTS.AUTH_ERROR, handleAuthError);
    return () => window.removeEventListener(EVENTS.AUTH_ERROR, handleAuthError);
  }, [addToast, isAuthenticated]);

  useEffect(() => {
    const initializeAuth = async () => {
      localStorage.removeItem('token');
      try {
        const config = await getAuthConfig();
        setAuthConfig(config);

        if (config.disableAccounts) {
          try {
            const response = await anonymous();
            if (response.user) {
              login(response.user);
            }
          } catch (error) {
            console.error('Failed to create anonymous session:', error);
            addToast(translate('authProvider.error.failedCreateAnonymousSession'), 'error');
          }
        } else {
          const response = await verifyToken().catch(() => null);
          if (response?.valid && response.user) {
            setIsAuthenticated(true);
            setUser(response.user);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: User | null) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    logoutApi().catch(() => {});
    setIsAuthenticated(false);
    setUser(null);
    addToast(translate('authProvider.info.logoutSuccess'), 'info');
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