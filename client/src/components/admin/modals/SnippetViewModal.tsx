import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api/admin';
import Modal from '../../common/modals/Modal';
import { FullCodeView } from '../../snippets/view/FullCodeView';
import { Loader2, AlertCircle } from 'lucide-react';

interface SnippetViewModalProps {
  snippetId: number | null;
  onClose: () => void;
}

export const SnippetViewModal: React.FC<SnippetViewModalProps> = ({
  snippetId,
  onClose,
}) => {
  const { data: snippet, isLoading, error } = useQuery({
    queryKey: ['admin', 'snippet', snippetId],
    queryFn: () => adminApi.getSnippetDetails(snippetId!),
    enabled: snippetId !== null,
  });

  return (
    <Modal
      isOpen={snippetId !== null}
      onClose={onClose}
      title={snippet?.title || 'Loading snippet...'}
      width="max-w-5xl"
      expandable
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary animate-spin" />
            <span className="text-light-text dark:text-dark-text">Loading snippet...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
            <span>Failed to load snippet</span>
          </div>
        </div>
      )}

      {snippet && !isLoading && !error && (
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          <FullCodeView
            snippet={snippet}
            showTitle={false}
            isModal={true}
            showLineNumbers={true}
          />
        </div>
      )}
    </Modal>
  );
};
