import React, { useState, useEffect } from 'react';
import { Eye, EyeClosed } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageContainer } from '../common/layout/PageContainer';
import { login as loginApi } from '../../utils/api/auth';
import { useToast } from '../../hooks/useToast';
import { ROUTES } from '../../constants/routes';
import { OIDCConfig } from '../../types/auth';
import { apiClient } from '../../utils/api/apiClient';
import { handleOIDCError } from '../../utils/oidcErrorHandler';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [oidcConfig, setOIDCConfig] = useState<OIDCConfig | null>(null);
  const { login, isAuthenticated, authConfig } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const message = params.get('message');
    
    if (error) {
      handleOIDCError(error, addToast, oidcConfig?.displayName, message || undefined);
    }
  }, [addToast, oidcConfig]);

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
    window.location.href = `${window.__BASE_PATH__ || ''}/api/auth/oidc/auth`;
  };

  const showInternalRegistration = !authConfig?.disableInternalAccounts;

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-light-text dark:text-dark-text">
            ByteStash
          </h2>
          <p className="mt-2 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Please sign in to continue
            {authConfig?.allowNewAccounts && showInternalRegistration ? (
              <>
                , create an{' '}
                <Link to="/register" className="text-light-primary dark:text-dark-primary hover:opacity-80">
                  account
                </Link>
                {' '}or{' '}
              </>
            ) : (
              ' or '
            )}
            <Link to={ROUTES.PUBLIC_SNIPPETS} className="text-light-primary dark:text-dark-primary hover:opacity-80">
              browse public snippets
            </Link>
          </p>
        </div>

        {oidcConfig?.enabled && (
          <>
            <button
              onClick={handleOIDCLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                bg-light-primary dark:bg-dark-primary text-white rounded-md hover:opacity-90 transition-colors"
            >
              Sign in with {oidcConfig.displayName}
            </button>
            {showInternalRegistration && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-light-border dark:border-dark-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-light-bg dark:bg-dark-bg text-light-text-secondary dark:text-dark-text-secondary text-sm">
                    Or continue with password
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {showInternalRegistration && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                    border-light-border dark:border-dark-border placeholder-light-text-secondary dark:placeholder-dark-text-secondary 
                    text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface rounded-t-md 
                    focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border 
                    border-light-border dark:border-dark-border placeholder-light-text-secondary dark:placeholder-dark-text-secondary 
                    text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface rounded-b-md 
                    focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary 
                    focus:border-light-primary dark:focus:border-dark-primary sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-700 dark:text-gray-500 focus:outline-none"
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                >
                  {isPasswordVisible ? <EyeClosed size={18} /> : <Eye size={18} />}
                </button>
              </div>


            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                  text-sm font-medium rounded-md text-white bg-light-primary dark:bg-dark-primary hover:opacity-90
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-light-primary dark:focus:ring-dark-primary 
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
        )}
      </div>
    </PageContainer>
  );
};
