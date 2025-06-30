import React from 'react';
import { SnippetCard } from './SnippetCard';
import { Snippet } from '../../../types/snippets';

export interface SnippetListProps {
  snippets: Snippet[];
  viewMode: 'grid' | 'list';
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
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
  isPublicView: boolean;
  isRecycleView: boolean;
  isAuthenticated: boolean;
}

const SnippetList: React.FC<SnippetListProps> = ({ 
  snippets, 
  viewMode, 
  onOpen, 
  onDelete,
  onRestore, 
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
  isPublicView,
  isRecycleView,
  isAuthenticated
}) => {
  if (snippets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mb-4">
          No snippets match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
      : 'space-y-6'
    }>
      {snippets.map(snippet => (
        <SnippetCard 
          key={snippet.id} 
          snippet={snippet} 
          viewMode={viewMode}
          onOpen={onOpen}
          onDelete={onDelete}
          onRestore={onRestore}
          onEdit={onEdit}
          onShare={onShare}
          onDuplicate={onDuplicate}
          onCategoryClick={onCategoryClick}
          compactView={compactView}
          showCodePreview={showCodePreview}
          previewLines={previewLines}
          showCategories={showCategories}
          expandCategories={expandCategories}
          showLineNumbers={showLineNumbers}
          isPublicView={isPublicView}
          isRecycleView={isRecycleView}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
};

export default SnippetList;
