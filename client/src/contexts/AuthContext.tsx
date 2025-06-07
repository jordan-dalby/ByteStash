import React, { createContext, useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { EVENTS } from '../constants/events';
import { anonymous, getAuthConfig, verifyToken } from '../utils/api/auth';
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
      document.cookie = 'bytestash_token=; path=/; max-age=0';
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

        if (config.disableAccounts) {
          try {
            const response = await anonymous();
            if (response.token && response.user) {
              login(response.token, response.user);
            }
          } catch (error) {
            console.error('Failed to create anonymous session:', error);
            addToast('Failed to initialize anonymous session', 'error');
          }
        } else {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await verifyToken();
            if (response.valid && response.user) {
              setIsAuthenticated(true);
              setUser(response.user);
            } else {
              localStorage.removeItem('token');
              document.cookie = 'bytestash_token=; path=/; max-age=0';
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        document.cookie = 'bytestash_token=; path=/; max-age=0';
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User | null) => {
    localStorage.setItem('token', token);
    // Also set as httpOnly cookie for direct browser API access
    document.cookie = `bytestash_token=${token}; path=/; max-age=86400; SameSite=Lax`;
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Clear the cookie as well
    document.cookie = 'bytestash_token=; path=/; max-age=0';
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