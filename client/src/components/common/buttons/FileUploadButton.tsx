import React, { useRef, useState } from "react";
import { Upload, Link } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../hooks/useToast";
import {
  processUploadedFile,
  ACCEPTED_FILE_EXTENSIONS,
  detectLanguageFromFilename,
} from "../../../utils/fileUploadUtils";

interface FileUploadButtonProps {
  onFileProcessed: (fileData: {
    file_name: string;
    code: string;
    language: string;
    position: number;
  }) => void;
  onError: (error: string) => void;
  className?: string;
  multiple?: boolean;
  existingFragments?: Array<{
    file_name: string;
    language: string;
  }>;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileProcessed,
  onError,
  className = "",
  multiple = true,
  existingFragments = [],
}) => {
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/common/buttons');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileData = await processUploadedFile(file);
        // Check for duplicates
        const isDuplicate = existingFragments.some(
          (existing) =>
            existing.file_name === fileData.file_name &&
            existing.language === fileData.language
        );

        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        onFileProcessed(fileData);
        successCount++;
      } catch (error) {
        const errorMessage = `${
          error instanceof Error ? error.message : translate('fileUploadButton.error.unknown')
        }`;
        onError(errorMessage);
        addToast(errorMessage, "error");
      }
    }

    // Show success toast for successfully processed files
    if (successCount > 0) {
      if (successCount === 1 && files.length === 1) {
        addToast(translate('fileUploadButton.success.fileUploaded', { fileName: files[0].name }), "success");
      } else if (successCount === files.length) {
        addToast(translate('fileUploadButton.success.filesUploaded', { count: successCount }), "success");
      } else {
        addToast(translate('fileUploadButton.success.someFilesUploaded', { successCount, total: files.length }), "success");
      }
    }

    // Show summary toast if there were duplicates
    if (duplicateCount > 0) {
      if (duplicateCount === 1) {
        addToast(translate('fileUploadButton.info.duplicateDetected'), "info");
      } else {
        addToast(translate('fileUploadButton.info.duplicatesDetected', { count: duplicateCount }), "info");
      }
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) {
      addToast(translate('fileUploadButton.loadFromUrl.invalidUrl'), "error");
      return;
    }

    setIsLoadingUrl(true);
    try {
      // Fetch content from URL
      const response = await fetch(urlInput);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const code = await response.text();

      // Extract filename from URL
      const urlPath = new URL(urlInput).pathname;
      const fullFileName = urlPath.split("/").pop() || "untitled.txt";
      const fileName = fullFileName.split(".").slice(0, -1).join(".") || fullFileName;
      const language = detectLanguageFromFilename(fullFileName);

      // Check for duplicates
      const isDuplicate = existingFragments.some(
        (existing) =>
          existing.file_name === fileName && existing.language === language
      );

      if (isDuplicate) {
        addToast(translate('fileUploadButton.info.duplicateDetected'), "info");
        setShowUrlModal(false);
        setUrlInput("");
        setIsLoadingUrl(false);
        return;
      }

      // Validate size (max 1MB)
      if (code.length > 1024 * 1024) {
        throw new Error(translate('fileUploadButton.loadFromUrl.contentMaxSizeError', { max: '1MB' }));
      }

      const fileData = {
        file_name: fileName,
        code: code,
        language: language,
        position: 0,
      };

      onFileProcessed(fileData);
      addToast(translate('fileUploadButton.success.fileUploaded', { fileName: fullFileName }), "success");
      setShowUrlModal(false);
      setUrlInput("");
    } catch (error) {
      const errorMessage = `Failed to load from URL: ${
        error instanceof Error ? error.message : translate('fileUploadButton.error.unknown')
      }`;
      onError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        multiple={multiple}
        accept={ACCEPTED_FILE_EXTENSIONS}
        className="hidden"
        aria-label={translate('fileUploadButton.label')}
      />
      <div className="inline-flex gap-2">
        <button
          type="button"
          onClick={handleFileSelect}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
            bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text border-light-border dark:border-dark-border
            hover:bg-light-hover/80 dark:hover:bg-dark-hover/80 hover:border-light-border dark:hover:border-dark-border
            focus:outline-none
            ${className}`}
          title={translate('fileUploadButton.title')}
        >
          <Upload size={16} />
          <span>{translate('fileUploadButton.label')}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowUrlModal(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
            bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text border-light-border dark:border-dark-border
            hover:bg-light-hover/80 dark:hover:bg-dark-hover/80 hover:border-light-border dark:hover:border-dark-border
            focus:outline-none
            ${className}`}
          title={translate('fileUploadButton.loadFromUrl.title')}
        >
          <Link size={16} />
          <span>{translate('fileUploadButton.loadFromUrl.label')}</span>
        </button>
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-dark-text">
              {translate('fileUploadButton.loadFromUrl.label')}
            </h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoadingUrl) {
                  handleUrlLoad();
                } else if (e.key === "Escape") {
                  setShowUrlModal(false);
                  setUrlInput("");
                }
              }}
              placeholder="https://raw.githubusercontent.com/..."
              className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-md
                bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text
                focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              disabled={isLoadingUrl}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlInput("");
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border transition-colors
                  bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text
                  border-light-border dark:border-dark-border
                  hover:bg-light-hover/80 dark:hover:bg-dark-hover/80"
                disabled={isLoadingUrl}
              >
                {t('action.cancel')}
              </button>
              <button
                type="button"
                onClick={handleUrlLoad}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors
                  bg-blue-600 text-white hover:bg-blue-700
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingUrl}
              >
                {isLoadingUrl ? "Loading..." : t('action.load')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploadButton;
