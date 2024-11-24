import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '../../common/layout/PageContainer';
import { useToast } from '../../../hooks/useToast';
import { handleOIDCError } from '../../../utils/oidcErrorHandler';

export const OIDCCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const message = params.get('message');

    if (token) {
      login(token, null);
      navigate('/', { replace: true });
    } else if (error) {
      handleOIDCError(error, addToast, undefined, message || undefined);
      navigate('/login', { replace: true });
    } else {
      handleOIDCError('auth_failed', addToast);
      navigate('/login', { replace: true });
    }
  }, [login, navigate, addToast]);

  return (
    <PageContainer>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="text-gray-200 text-lg">Completing sign in...</span>
        </div>
      </div>
    </PageContainer>
  );
};