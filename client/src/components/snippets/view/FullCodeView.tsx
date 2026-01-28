import React from "react";
import { FileCode, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Snippet } from "../../../types/snippets";
import CategoryList from "../../categories/CategoryList";
import {
  getLanguageLabel,
  getUniqueLanguages,
} from "../../../utils/language/languageUtils";
import { FullCodeBlock } from "../../editor/FullCodeBlock";
import DownloadButton from "../../common/buttons/DownloadButton";
import DownloadArchiveButton from "../../common/buttons/DownloadArchiveButton";

interface FullCodeViewProps {
  showTitle?: boolean;
  snippet: Snippet;
  onCategoryClick?: (category: string) => void;
  showLineNumbers?: boolean;
  className?: string;
  isModal?: boolean;
  isPublicView?: boolean;
}

export const FullCodeView: React.FC<FullCodeViewProps> = ({
  showTitle = true,
  snippet,
  onCategoryClick,
  showLineNumbers = true,
  className = "",
  isModal = false,
  isPublicView = false,
}) => {
  const { t: translate } = useTranslation('components/snippets/view/all');

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    onCategoryClick?.(category);
  };

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

  const containerClasses = isModal
    ? `overflow-hidden ${className}`
    : `bg-light-surface dark:bg-dark-surface rounded-lg overflow-hidden ${className}`;

  return (
    <div className={containerClasses}>
      {/* Status Bar with Update Time */}
      {!isModal && snippet.updated_at && (
        <div className="bg-light-hover/50 dark:bg-dark-hover/50 px-3 py-1.5 text-xs flex items-center justify-end">
          <div className="flex items-center gap-1 text-light-text-secondary dark:text-dark-text-secondary">
            <Clock size={12} />
            <span>{translate('fullCodeView.dateTimeAgo', { dateTime: getRelativeUpdateTime(snippet.updated_at) })}</span>
          </div>
        </div>
      )}

      <div className={isModal ? "p-2 pt-0" : "p-4 pt-0"}>
        {/* Header Section */}
        <div>
          {showTitle && (
            <h1
              className={`text-xl md:text-2xl font-bold text-light-text dark:text-dark-text ${
                isModal ? "" : "mt-2"
              }`}
            >
              {snippet.title}
            </h1>
          )}

          {/* Language Info */}
          <div
            className={`flex items-center gap-1 text-sm text-light-text-secondary dark:text-dark-text-secondary mt-${
              showTitle ? "2" : "0"
            }`}
          >
            <FileCode
              size={14}
              className="text-light-text-secondary dark:text-dark-text-secondary"
            />
            <span>{getUniqueLanguages(snippet.fragments)}</span>
          </div>

          {/* Description */}
          <div className="mt-3 text-sm text-light-text dark:text-dark-text">
            <ReactMarkdown className={`markdown prose max-w-none`}>
              {snippet.description || translate('fullCodeView.defaultDescription')}
            </ReactMarkdown>
          </div>

          {/* Categories */}
          <div className="mt-3">
            <CategoryList
              categories={snippet.categories}
              onCategoryClick={handleCategoryClick}
              variant="clickable"
              showAll={true}
            />
          </div>
        </div>

        {/* Download Archive Button */}
        {snippet.fragments.length > 1 && (
          <div className="flex justify-end mt-4">
            <DownloadArchiveButton
              snippetTitle={snippet.title}
              fragments={snippet.fragments}
              variant="secondary"
              size="sm"
            />
          </div>
        )}

        {/* Code Fragments */}
        <div className="mt-4 space-y-4">
          {snippet.fragments.map((fragment, index) => (
            <div key={index}>
              {/* File Header */}
              <div className="flex items-center justify-between px-3 mb-1 text-xs rounded text-light-text-secondary dark:text-dark-text-secondary bg-light-hover/50 dark:bg-dark-hover/50 h-7">
                <div className="flex items-center flex-1 min-w-0 gap-1">
                  <FileCode
                    size={12}
                    className="text-light-text-secondary dark:text-dark-text-secondary shrink-0"
                  />
                  <span className="truncate">{fragment.file_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">
                    {getLanguageLabel(fragment.language)}
                  </span>
                  <DownloadButton
                    code={fragment.code}
                    fileName={fragment.file_name}
                    language={fragment.language}
                    className="scale-75"
                  />
                </div>
              </div>

              {/* Code Block */}
              <FullCodeBlock
                code={fragment.code}
                language={fragment.language}
                showLineNumbers={showLineNumbers}
                isPublicView={isPublicView}
                snippetId={snippet.id}
                fragmentId={fragment.id}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FullCodeView;
