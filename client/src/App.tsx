import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import EmbedView from './components/snippets/embed/EmbedView';
import RecycleSnippetStorage from './components/snippets/view/recycle/RecycleSnippetStorage';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-dark-text dark:text-dark-text text-xl">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <SnippetStorage />;
};

const EmbedViewWrapper: React.FC = () => {
  const { shareId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  
  if (!shareId) {
    return <div>Invalid share ID</div>;
  }

  const theme = searchParams.get('theme') as 'light' | 'dark' | 'system' | null;

  return (
    <EmbedView
      shareId={shareId}
      showTitle={searchParams.get('showTitle') === 'true'}
      showDescription={searchParams.get('showDescription') === 'true'}
      showFileHeaders={searchParams.get('showFileHeaders') !== 'false'}
      showPoweredBy={searchParams.get('showPoweredBy') !== 'false'}
      theme={theme || 'system'}
      fragmentIndex={searchParams.get('fragmentIndex') ? parseInt(searchParams.get('fragmentIndex')!, 10) : undefined}
    />
  );
};

const App: React.FC = () => {
  return (
    <Router basename={window.__BASE_PATH__} future={{ v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTES.AUTH_CALLBACK} element={<OIDCCallback />} />
                <Route path={ROUTES.SHARED_SNIPPET} element={<SharedSnippetView />} />
                <Route path={ROUTES.PUBLIC_SNIPPETS} element={<PublicSnippetStorage />} />
                <Route path={ROUTES.RECYCLE} element={<RecycleSnippetStorage />} />
                <Route path={ROUTES.EMBED} element={<EmbedViewWrapper />} />
                <Route path={ROUTES.SNIPPET} element={<SnippetPage />} />
                <Route path={ROUTES.HOME} element={<AuthenticatedApp />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </div>
      </ThemeProvider>
    </Router>
  );
};

export default App;
