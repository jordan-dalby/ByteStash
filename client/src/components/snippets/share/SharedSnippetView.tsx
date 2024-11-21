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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="text-gray-200 text-lg">Loading snippet...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-xl">{error}</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-blue-400 hover:text-blue-300"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  if (errorCode === 410) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-white text-xl">This shared snippet has expired</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-blue-400 hover:text-blue-300"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-white text-xl">Snippet not found</div>
        <Link 
          to={ROUTES.PUBLIC_SNIPPETS}
          className="text-blue-400 hover:text-blue-300"
        >
          Browse public snippets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <FullCodeView snippet={snippet} />
      </div>
    </div>
  );
};

export default SharedSnippetView;