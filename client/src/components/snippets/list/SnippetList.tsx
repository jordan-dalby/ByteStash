import React from "react";
import { useTranslation } from "react-i18next";
import { Snippet } from "../../../types/snippets";
import { SnippetCard } from "./SnippetCard";

export interface SnippetListProps {
  snippets: Snippet[];
  viewMode: "grid" | "list";
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
  pinSnippet?: (id: string, isPinned: boolean) => Promise<Snippet | undefined>;
  favoriteSnippet?: (
    id: string,
    isFavorite: boolean
  ) => Promise<Snippet | undefined>;
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
  isAuthenticated,
  pinSnippet,
  favoriteSnippet,
}) => {
  const { t: translate } = useTranslation('components/snippets/list/snippetList');

  if (snippets.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-xl text-light-text-secondary dark:text-dark-text-secondary">
          {translate('noSnippetsMatch')}
        </p>
      </div>
    );
  }
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-6"
      }
    >
      {snippets.map((snippet) => (
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
          pinSnippet={pinSnippet}
          favoriteSnippet={favoriteSnippet}
        />
      ))}
    </div>
  );
};

export default SnippetList;
