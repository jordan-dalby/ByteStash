import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Snippet } from '../../../types/snippets';
import { useAuth } from '../../../hooks/useAuth';
import { getSharedSnippet } from '../../../utils/api/share';
import { FullCodeView } from '../view/FullCodeView';
import { ROUTES } from '../../../constants/routes';

const SharedSnippetView: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSharedSnippet();
  }, [shareId, isAuthenticated]);

  const loadSharedSnippet = async () => {
    if (!shareId) return;
  
    try {
      setIsLoading(true);
      const shared = await getSharedSnippet(shareId);
      setSnippet(shared);
      setError(null);
      setErrorCode(null);
    } catch (err: any) {
      setErrorCode(err.status);
      setError(err.error);

      if (err.status === 401 && !isAuthenticated) {
        navigate(`${ROUTES.LOGIN}`, { replace: true });
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary animate-spin" />
          <span className="text-light-text dark:text-dark-text text-lg">Loading snippet...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 dark:text-red-400 text-xl">{error}</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-light-primary dark:text-dark-primary hover:opacity-80"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  if (errorCode === 410) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center gap-4">
        <div className="text-light-text dark:text-dark-text text-xl">This shared snippet has expired</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-light-primary dark:text-dark-primary hover:opacity-80"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center gap-4">
        <div className="text-light-text dark:text-dark-text text-xl">Snippet not found</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-light-primary dark:text-dark-primary hover:opacity-80"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text p-8">
      <div className="max-w-4xl mx-auto">
        <FullCodeView snippet={snippet} isPublicView={true} />
      </div>
    </div>
  );
};

export default SharedSnippetView;
