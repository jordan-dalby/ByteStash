import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { OIDCCallback } from './components/auth/oidc/OIDCCallback';
import { ROUTES } from './constants/routes';
import { PageContainer } from './components/common/layout/PageContainer';
import { ToastProvider } from './contexts/ToastContext';
import SnippetStorage from './components/snippets/view/SnippetStorage';
import SharedSnippetView from './components/snippets/share/SharedSnippetView';
import SnippetPage from './components/snippets/view/SnippetPage';
import PublicSnippetStorage from './components/snippets/view/public/PublicSnippetStorage';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <SnippetStorage />;
};

const App: React.FC = () => {
  return (
    <Router basename={window.__BASE_PATH__} future={{ v7_relativeSplatPath: true }}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.AUTH_CALLBACK} element={<OIDCCallback />} />
            <Route path={ROUTES.SHARED_SNIPPET} element={<SharedSnippetView />} />
            <Route path={ROUTES.PUBLIC_SNIPPETS} element={<PublicSnippetStorage />} />
            <Route path={ROUTES.SNIPPET} element={<SnippetPage />} />
            <Route path={ROUTES.HOME} element={<AuthenticatedApp />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;