import React from "react";
import { ArrowDownToLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../hooks/useToast";
import { downloadSnippetArchive } from "../../../utils/downloadUtils";

interface DownloadArchiveButtonProps {
  snippetTitle: string;
  fragments: Array<{
    code: string;
    file_name: string;
    language: string;
  }>;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export const DownloadArchiveButton: React.FC<DownloadArchiveButtonProps> = ({
  snippetTitle,
  fragments,
  className = "",
  size = "md",
  variant = "primary",
}) => {
  const { t: translate } = useTranslation('components/common/buttons');
  const { addToast } = useToast();

  const handleDownload = async () => {
    if (fragments.length === 0) {
      addToast("No fragments to download", "warning");
      return;
    }

    try {
      await downloadSnippetArchive(snippetTitle, fragments);
      addToast(translate('downloadArchiveButton.success.downloadedAll'), "success");
    } catch (error) {
      console.error("Failed to download archive:", error);
      addToast(translate('downloadArchiveButton.error.failedDownload'), "error");
    }
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary:
      "bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover/80 dark:hover:bg-dark-hover/80",
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <button
      onClick={handleDownload}
      disabled={fragments.length === 0}
      className={`
        inline-flex items-center gap-2 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title={translate('downloadArchiveButton.title')}
    >
      <ArrowDownToLine size={iconSize[size]} />
      <span>{translate('downloadArchiveButton.label')}</span>
      <span className="opacity-70">
        {translate('downloadArchiveButton.fileLabel', { count: fragments.length })}
      </span>
    </button>
  );
};

export default DownloadArchiveButton;
