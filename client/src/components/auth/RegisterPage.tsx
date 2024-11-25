import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { register } from '../../utils/api/auth';
import { PageContainer } from '../common/layout/PageContainer';
import { useToast } from '../../hooks/useToast';
import { AlertCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { OIDCConfig } from '../../types/auth';
import { apiClient } from '../../utils/api/apiClient';
import { handleOIDCError } from '../../utils/oidcErrorHandler';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oidcConfig, setOIDCConfig] = useState<OIDCConfig | null>(null);
  const { login, authConfig, isAuthenticated, refreshAuthConfig } = useAuth();
  const { addToast } = useToast();

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const message = params.get('message');
    
    if (error) {
      handleOIDCError(error, addToast, oidcConfig?.displayName, message || undefined);
    }
  }, [addToast, oidcConfig]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!authConfig?.allowNewAccounts && authConfig?.hasUsers) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-light-text dark:text-dark-text">Registration Disabled</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">New account registration is currently disabled.</p>
          <Link 
            to="/login" 
            className="text-light-primary dark:text-dark-primary hover:opacity-80"
          >
            Return to Login
          </Link>
        </div>
      </PageContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(username, password);
      if (response.token && response.user) {
        await refreshAuthConfig();
        login(response.token, response.user);
      }
    } catch (err: any) {
      const errorMessage = err.error || 'Failed to register';
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOIDCLogin = () => {
    window.location.href = `${window.__BASE_PATH__}/api/auth/oidc/auth`;
  };

  const showInternalRegistration = !authConfig?.disableInternalAccounts;

  return (
    <PageContainer className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-light-text dark:text-dark-text">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {authConfig?.hasUsers ? (
              <>
                Or{' '}
                <Link to="/login" className="text-light-primary dark:text-dark-primary hover:opacity-80">
                  sign in to your account
                </Link>
                {' '}or{' '}
                <Link to={ROUTES.PUBLIC_SNIPPETS} className="text-light-primary dark:text-dark-primary hover:opacity-80">
                  browse public snippets
                </Link>
              </>
            ) : (
              <div className="mt-4 relative overflow-hidden">
                <div className="rounded-xl bg-light-primary/10 dark:bg-dark-primary/10 p-4 border border-light-primary/20 dark:border-dark-primary/20">
                  <div className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-light-primary/20 dark:bg-dark-primary/20 flex items-center justify-center flex-shrink-0 mt-0.25">
                      <AlertCircle size={14} className="text-light-primary dark:text-dark-primary" />
                    </div>
                    <p className="text-sm text-light-text dark:text-dark-text text-left">
                      This is the first account to be created. All existing snippets will be
                      automatically migrated to this account.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
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
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                    border-light-border dark:border-dark-border placeholder-light-text-secondary dark:placeholder-dark-text-secondary 
                    text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface
                    focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border 
                    border-light-border dark:border-dark-border placeholder-light-text-secondary dark:placeholder-dark-text-secondary 
                    text-light-text dark:text-dark-text bg-light-surface dark:bg-dark-surface rounded-b-md
                    focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-dark-primary focus:border-light-primary dark:focus:border-dark-primary focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
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
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

        {!showInternalRegistration && !oidcConfig?.enabled && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-400 mb-4">Registration Not Available</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Internal account registration is disabled and no SSO providers are configured.
              Please contact your administrator.
            </p>
            <Link 
              to={ROUTES.PUBLIC_SNIPPETS}
              className="text-light-primary dark:text-dark-primary hover:opacity-80"
            >
              Browse public snippets
            </Link>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
