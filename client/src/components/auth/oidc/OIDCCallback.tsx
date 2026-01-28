import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '../../common/layout/PageContainer';
import { useOidcErrorHandler } from '../../../hooks/useOidcErrorHandler';
import { useToast } from '../../../hooks/useToast';

export const OIDCCallback: React.FC = () => {
  const { t: translate } = useTranslation('components/auth');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const handleOIDCError = useOidcErrorHandler();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const message = params.get('message');

    if (token) {
      login(token, null);
      navigate('/', { replace: true });
    } else if (error) {
      handleOIDCError(error, undefined, message || undefined);
      navigate('/login', { replace: true });
    } else {
      handleOIDCError('auth_failed');
      navigate('/login', { replace: true });
    }
  }, [login, navigate, addToast]);

  return (
    <PageContainer>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary animate-spin" />
          <span className="text-light-text dark:text-dark-text text-lg">{translate('signIn.completing')}</span>
        </div>
      </div>
    </PageContainer>
  );
};
