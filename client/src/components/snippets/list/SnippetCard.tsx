import React, { useState } from 'react';
import { Clock, Users, FileCode, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import SnippetCardMenu from './SnippetCardMenu';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { Snippet } from '../../../types/snippets';
import CategoryList from '../../categories/CategoryList';
import { PreviewCodeBlock } from '../../editor/PreviewCodeBlock';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';
import { getUniqueLanguages } from '../../../utils/language/languageUtils';

interface SnippetCardProps {
  snippet: Snippet;
  viewMode: 'grid' | 'list';
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onEdit: (snippet: Snippet) => void;
  onShare: (snippet: Snippet) => void;
  onDuplicate: (snippet: Snippet) => void;
  onCategoryClick: (category: string) => void;
  compactView: boolean;
  showCodePreview: boolean;
  previewLines: number;
  showCategories: boolean;
  expandCategories: boolean;
  showLineNumbers: boolean;
  isPublicView?: boolean;
  isAuthenticated: boolean;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  viewMode,
  onOpen,
  onDelete,
  onEdit,
  onShare,
  onDuplicate,
  onCategoryClick,
  compactView,
  showCodePreview,
  previewLines,
  showCategories,
  expandCategories,
  showLineNumbers,
  isPublicView = false,
  isAuthenticated
}) => {
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getRelativeUpdateTime = (updatedAt: string): string => {
    try {
      const updateDate = new Date(updatedAt);
      return formatDistanceToNow(updateDate);
    } catch (error) {
      console.error('Error formatting update date:', error);
      return 'Unknown';
    }
  };

  const handleDeleteConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(snippet.id);
    setIsDeleteModalOpen(false);
  };

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    onCategoryClick(category);
  };

  const handlePrevFragment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFragmentIndex(prev => prev > 0 ? prev - 1 : snippet.fragments.length - 1);
  };

  const handleNextFragment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFragmentIndex(prev => prev < snippet.fragments.length - 1 ? prev + 1 : 0);
  };

  const handleOpenInNewTab = () => {
    window.open(`/snippets/${snippet.id}`, '_blank');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleDeleteModalClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleteModalOpen(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(snippet);
  };

  const currentFragment = snippet.fragments[currentFragmentIndex];

  return (
    <>
      <div
        className={`bg-light-surface dark:bg-dark-surface rounded-lg ${viewMode === 'grid' ? 'h-full' : 'mb-4'} 
          cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors relative group`}
        onClick={() => onOpen(snippet)}
      >
        {(snippet.is_public === 1 || snippet.updated_at) && (
          <div className="bg-light-hover/50 dark:bg-dark-hover/50 px-3 py-1 text-xs flex items-center justify-between">
            {snippet.is_public === 1 && (
              <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                <Globe size={12} />
                <span>Public</span>
              </div>
            )}
            {!isPublicView && (snippet.share_count || 0) > 0 && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded ml-2">
                <Users size={12} />
                <span>Shared</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary ml-auto">
              <Clock size={12} />
              <span>{getRelativeUpdateTime(snippet.updated_at)} ago</span>
            </div>
          </div>
        )}

        <div className="p-4 pt-2">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className={`${compactView ? 'text-lg' : 'text-xl'} font-bold text-light-text dark:text-dark-text 
                truncate leading-normal mb-2`}>
                {snippet.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary">
                  <FileCode size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
                  <span>{getUniqueLanguages(snippet.fragments)}</span>
                </div>

                {snippet.username && isPublicView && (
                  <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary">
                    <Users size={14} />
                    <span>{snippet.username}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <SnippetCardMenu
                onEdit={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onEdit(snippet);
                }}
                onDelete={handleDelete}
                onShare={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onShare(snippet);
                }}
                onOpenInNewTab={handleOpenInNewTab}
                onDuplicate={handleDuplicate}
                isPublicView={isPublicView}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          {!compactView && (
            <p className="text-sm text-light-text dark:text-dark-text mb-3 line-clamp-1">
              <ReactMarkdown className={`markdown prose max-w-none`}>
                {snippet.description || 'No description available'}
              </ReactMarkdown>
            </p>
          )}

          {showCategories && (
            <div className="mb-3">
              <CategoryList
                categories={snippet.categories}
                onCategoryClick={handleCategoryClick}
                variant="clickable"
                showAll={expandCategories}
              />
            </div>
          )}

          {showCodePreview && currentFragment && (
            <div>
              <div className="flex items-center justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1 bg-light-hover/50 dark:bg-dark-hover/50 rounded px-2 h-7">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <FileCode size={12} className="text-light-text-secondary dark:text-dark-text-secondary shrink-0" />
                  <span className="truncate">{currentFragment.file_name}</span>
                </div>
                <div className="flex items-center gap-0.5 ml-2">
                  {snippet.fragments.length > 1 ? (
                    <>
                      <button
                        onClick={handlePrevFragment}
                        className="p-0.5 hover:bg-light-hover dark:hover:bg-dark-hover rounded transition-colors"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span className="mx-1 text-light-text-secondary dark:text-dark-text-secondary">
                        {currentFragmentIndex + 1}/{snippet.fragments.length}
                      </span>
                      <button
                        onClick={handleNextFragment}
                        className="p-0.5 hover:bg-light-hover dark:hover:bg-dark-hover rounded transition-colors"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="w-[14px]" />
                  )}
                </div>
              </div>

              <PreviewCodeBlock
                code={currentFragment.code}
                language={currentFragment.language}
                previewLines={previewLines}
                showLineNumbers={showLineNumbers}
                isPublicView={isPublicView}
                snippetId={snippet.id}
                fragmentId={currentFragment.id}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${snippet.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </>
  );
};
