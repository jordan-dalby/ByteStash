import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '../../common/layout/PageContainer';

export const OIDCCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Store the token and redirect
      login(token, null);
      navigate('/', { replace: true });
    } else {
      // Handle error case
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, [login, navigate]);

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