import React, { useState } from "react";
import {
  Clock,
  Users,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Globe,
  Pin,
  Star,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import SnippetCardMenu from "./SnippetCardMenu";
import SnippetRecycleCardMenu from "./SnippetRecycleCardMenu";
import { ConfirmationModal } from "../../common/modals/ConfirmationModal";
import { Snippet } from "../../../types/snippets";
import CategoryList from "../../categories/CategoryList";
import { PreviewCodeBlock } from "../../editor/PreviewCodeBlock";
import { getUniqueLanguages } from "../../../utils/language/languageUtils";

interface SnippetCardProps {
  snippet: Snippet;
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
  isPublicView?: boolean;
  isRecycleView?: boolean;
  isAuthenticated: boolean;
  pinSnippet?: (id: string, isPinned: boolean) => Promise<Snippet | undefined>;
  favoriteSnippet?: (
    id: string,
    isFavorite: boolean
  ) => Promise<Snippet | undefined>;
}

export const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
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
  isPublicView = false,
  isRecycleView = false,
  isAuthenticated,
  pinSnippet,
  favoriteSnippet,
}) => {
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/snippets/list/snippetCard');
  const [currentSnippet, setCurrentSnippet] = useState<Snippet>(snippet);
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(snippet.is_pinned);
  const [isFavorite, setIsFavorite] = useState(snippet.is_favorite);

  const getRelativeUpdateTime = (updatedAt: string): string => {
    const defaultUpdateTime = translate('defaultUpdateTime');

    try {
      if (!updatedAt) {
        return defaultUpdateTime;
      }
      const updateDate = new Date(updatedAt);
      if (isNaN(updateDate.getTime())) {
        return defaultUpdateTime;
      }
      return formatDistanceToNow(updateDate);
    } catch (error) {
      console.error("Error formatting update date:", error);
      return defaultUpdateTime;
    }
  };

  const handleDeleteConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(snippet.id);
    setIsDeleteModalOpen(false);
  };

  const handleRestoreConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onRestore(snippet.id);
    setIsRestoreModalOpen(false);
  };

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    onCategoryClick(category);
  };

  const handlePrevFragment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFragmentIndex((prev) =>
      prev > 0 ? prev - 1 : snippet.fragments.length - 1
    );
  };

  const handleNextFragment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFragmentIndex((prev) =>
      prev < snippet.fragments.length - 1 ? prev + 1 : 0
    );
  };

  const handleOpenInNewTab = () => {
    window.open(`/snippets/${snippet.id}`, "_blank");
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRestoreModalOpen(true);
  };

  const handleDeleteModalClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDeleteModalOpen(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(snippet);
  };

  const handlePin = async () => {
    if (!pinSnippet) return;
    try {
      const updatedSnippet = await pinSnippet(
        currentSnippet.id,
        currentSnippet.is_pinned === 1
      );
      if (updatedSnippet) {
        setCurrentSnippet(updatedSnippet);
        setIsPinned(updatedSnippet.is_pinned);
      }
    } catch (error) {
      console.error("Error pinning snippet:", error);
    }
  };

  const handleFavorite = async () => {
    if (!favoriteSnippet) return;
    try {
      const updatedSnippet = await favoriteSnippet(
        currentSnippet.id,
        currentSnippet.is_favorite === 1
      );
      if (updatedSnippet) {
        setCurrentSnippet(updatedSnippet);
        setIsFavorite(updatedSnippet.is_favorite);
      }
    } catch (error) {
      console.error("Error favoriting snippet:", error);
    }
  };

  const currentFragment = snippet.fragments[currentFragmentIndex];

  return (
    <>
      <div
        className={`bg-light-surface dark:bg-dark-surface rounded-lg ${
          viewMode === "grid" ? "h-full" : "mb-4"
        } 
          cursor-pointer hover:bg-light-hover dark:hover:bg-dark-hover transition-colors relative group`}
        onClick={() => {
          if (!isRecycleView) onOpen(snippet);
        }}
      >
        {(snippet.is_public === 1 ||
          snippet.updated_at ||
          snippet.is_pinned === 1 ||
          snippet.is_favorite === 1) && (
          <div className="flex items-center justify-between px-3 py-1 text-xs rounded-t-lg bg-light-hover/50 dark:bg-dark-hover/50">
            <div className="flex items-center gap-2">
              {snippet.is_public === 1 && (
                <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                  <Globe size={12} />
                  <span>{translate('public')}</span>
                </div>
              )}
              {isPublicView && (snippet.share_count || 0) > 0 && (
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  <Users size={12} />
                  <span>{translate('shared')}</span>
                </div>
              )}
              {snippet.is_pinned === 1 && (
                <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                  <Pin size={12} />
                  <span>{translate('pinned')}</span>
                </div>
              )}
              {snippet.is_favorite === 1 && (
                <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                  <Star size={12} />
                  <span>{translate('favorite')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-auto text-light-text-secondary dark:text-dark-text-secondary">
              <Clock size={12} />
              {!isRecycleView ? (
                <span>{translate('date.ago', { date: getRelativeUpdateTime(snippet.updated_at) })}</span>
              ) : snippet.expiry_date ? (
                <span>
                  {translate('date.left', { date: getRelativeUpdateTime(snippet.expiry_date) })}
                </span>
              ) : (
                <span>{translate('date.expiringSoon')}</span>
              )}
            </div>
          </div>
        )}

        <div className="p-4 pt-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3
                className={`${
                  compactView ? "text-lg" : "text-xl"
                } font-bold text-light-text dark:text-dark-text 
                truncate leading-normal mb-2`}
              >
                {snippet.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary">
                  <FileCode
                    size={14}
                    className="text-light-text-secondary dark:text-dark-text-secondary"
                  />
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
            <div className="transition-opacity opacity-0 group-hover:opacity-100">
              {!isRecycleView ? (
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
                  isPinned={isPinned === 1}
                  isFavorite={isFavorite === 1}
                  handlePin={handlePin}
                  handleFavorite={handleFavorite}
                />
              ) : (
                <SnippetRecycleCardMenu
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                />
              )}
            </div>
          </div>

          {!compactView && (
            <p className="mb-3 text-sm text-light-text dark:text-dark-text line-clamp-1">
              <ReactMarkdown className={`markdown prose max-w-none`}>
                {snippet.description || translate('defaultDescription')}
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
              <div className="flex items-center justify-between px-2 mb-1 text-xs rounded text-light-text-secondary dark:text-dark-text-secondary bg-light-hover/50 dark:bg-dark-hover/50 h-7">
                <div className="flex items-center flex-1 min-w-0 gap-1">
                  <FileCode
                    size={12}
                    className="text-light-text-secondary dark:text-dark-text-secondary shrink-0"
                  />
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
                isRecycleView={isRecycleView}
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
        title={
          isRecycleView
            ? translate('confirmationModalDelete.title.isRecycleView.true')
            : translate('confirmationModalDelete.title.isRecycleView.false')
        }
        message={
          isRecycleView
            ? translate('confirmationModalDelete.message.isRecycleView.true', { title: snippet.title })
            : translate('confirmationModalDelete.message.isRecycleView.false', { title: snippet.title })
        }
        confirmLabel={
          isRecycleView
            ? translate('confirmationModalDelete.confirmLabel.isRecycleView.true')
            : translate('confirmationModalDelete.confirmLabel.isRecycleView.false')
        }
        cancelLabel={t('action.cancel')}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={handleRestoreConfirm}
        title={translate('confirmationModalRestore.title')}
        message={translate('confirmationModalRestore.message', { title: snippet.title })}
        confirmLabel={t('action.restore')}
        cancelLabel={t('action.cancel')}
        variant="info"
      />
    </>
  );
};
