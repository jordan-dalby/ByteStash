import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../common/layout/PageContainer';
import { login as loginApi } from '../../utils/api/auth';
import { useToast } from '../../hooks/useToast';
import { ROUTES } from '../../constants/routes';
import { apiClient } from '../../utils/api/apiClient';

interface OIDCConfig {
  enabled: boolean;
  displayName: string;
}

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oidcConfig, setOIDCConfig] = useState<OIDCConfig | null>(null);
  const { login, isAuthenticated, authConfig } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'auth_failed') {
      addToast('Authentication failed. Please try again.', 'error');
    } else if (params.get('error') === 'registration_disabled') {
      addToast('Registration is disabled on this ByteStash instance.', 'error');
    }
  }, []);

  useEffect(() => {
    const fetchOIDCConfig = async () => {
      try {
        const response = await apiClient.get<OIDCConfig>('/api/auth/oidc/config');
        setOIDCConfig(response);
      } catch (error) {
        console.error('Failed to fetch OIDC config:', error);
      }
    };
    
    fetchOIDCConfig();
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (authConfig && !authConfig.hasUsers) {
    return <Navigate to="/register" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token, user } = await loginApi(username, password);
      login(token, user);
    } catch (err: any) {
      addToast('Invalid username or password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOIDCLogin = () => {
    window.location.href = `${window.__BASE_PATH__}/api/auth/oidc/auth`;
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            ByteStash
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please sign in to continue
            {authConfig?.allowNewAccounts ? (
              <>
                , create an{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300">
                  account
                </Link>
                {' '}or{' '}
              </>
            ) : (
              ' or '
            )}
            <Link to={ROUTES.PUBLIC_SNIPPETS} className="text-blue-400 hover:text-blue-300">
              browse public snippets
            </Link>
          </p>
        </div>

        {oidcConfig?.enabled && (
          <>
            <button
              onClick={handleOIDCLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign in with {oidcConfig.displayName}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
              <span className="px-2 bg-gray-900 text-gray-500 text-sm">
                  Or continue with password
                </span>
              </div>
            </div>
          </>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                  border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                  border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};