import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { Snippet } from '../../../../types/snippets';
import { getSnippetById } from '../../../../utils/api/snippets';
import { getPublicSnippetById } from '../../../../utils/api/snippets';
import { FullCodeView } from '../FullCodeView';
import { ROUTES } from '../../../../constants/routes';

const AuthAwareSnippetView: React.FC = () => {
  const { snippetId } = useParams<{ snippetId: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [tryingPublicAccess, setTryingPublicAccess] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadSnippet();
  }, [snippetId, isAuthenticated]);

  const loadSnippet = async () => {
    if (!snippetId) return;
    
    setIsLoading(true);
    setError(null);
    setTryingPublicAccess(false);
    setRequiresAuth(false);

    try {
      if (isAuthenticated) {
        const data = await getSnippetById(snippetId);
        setSnippet(data);
        return;
      }

      setTryingPublicAccess(true);
      const publicData = await getPublicSnippetById(snippetId);
      setSnippet(publicData);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setRequiresAuth(true);
        if (!tryingPublicAccess) {
          try {
            const publicData = await getPublicSnippetById(snippetId);
            setSnippet(publicData);
            setRequiresAuth(false);
            setError(null);
            return;
          } catch (publicErr: any) {
            setError('This snippet requires authentication to view');
          }
        } else {
          setError('This snippet requires authentication to view');
        }
      } else {
        setError(err.message || 'Failed to load snippet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-gray-600 dark:text-gray-400 animate-spin" />
          <span className="text-gray-800 dark:text-gray-200 text-lg">Loading snippet...</span>
        </div>
      </div>
    );
  }

  if (requiresAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 dark:text-red-400 text-xl mb-4">
          This snippet requires authentication to view
        </div>
        <div className="flex gap-4">
          <Link 
            to={ROUTES.LOGIN} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Sign in
          </Link>
          <Link 
            to={ROUTES.PUBLIC_SNIPPETS}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors"
          >
            Browse public snippets
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-600 dark:text-red-400 text-xl">{error}</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-gray-900 dark:text-white text-xl">Snippet not found</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <FullCodeView snippet={snippet} />
      </div>
    </div>
  );
};

export default AuthAwareSnippetView;
