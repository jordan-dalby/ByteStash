import React, { useRef, useState } from "react";
import { Upload, Link } from "lucide-react";
import {
  processUploadedFile,
  ACCEPTED_FILE_EXTENSIONS,
  detectLanguageFromFilename,
} from "../../../utils/fileUploadUtils";
import { useToast } from "../../../hooks/useToast";

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
          error instanceof Error ? error.message : "Unknown error"
        }`;
        onError(errorMessage);
        addToast(errorMessage, "error");
      }
    }

    // Show success toast for successfully processed files
    if (successCount > 0) {
      if (successCount === 1 && files.length === 1) {
        addToast(`"${files[0].name}" uploaded successfully`, "success");
      } else if (successCount === files.length) {
        addToast(`All ${successCount} files uploaded successfully`, "success");
      } else {
        addToast(
          `${successCount} of ${files.length} files uploaded successfully`,
          "success"
        );
      }
    }

    // Show summary toast if there were duplicates
    if (duplicateCount > 0) {
      if (duplicateCount === 1) {
        addToast(`Duplicate file detected`, "info");
      } else {
        addToast(`${duplicateCount} duplicate files detected`, "info");
      }
    }

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) {
      addToast("Please enter a valid URL", "error");
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
        addToast("Duplicate file detected", "info");
        setShowUrlModal(false);
        setUrlInput("");
        setIsLoadingUrl(false);
        return;
      }

      // Validate size (max 1MB)
      if (code.length > 1024 * 1024) {
        throw new Error("Content size must be less than 1MB");
      }

      const fileData = {
        file_name: fileName,
        code: code,
        language: language,
        position: 0,
      };

      onFileProcessed(fileData);
      addToast(`"${fullFileName}" loaded successfully`, "success");
      setShowUrlModal(false);
      setUrlInput("");
    } catch (error) {
      const errorMessage = `Failed to load from URL: ${
        error instanceof Error ? error.message : "Unknown error"
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
        aria-label="Upload code files"
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
          title="Upload code files to auto-create fragments."
        >
          <Upload size={16} />
          <span>Upload code file(s)</span>
        </button>
        <button
          type="button"
          onClick={() => setShowUrlModal(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors
            bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text border-light-border dark:border-dark-border
            hover:bg-light-hover/80 dark:hover:bg-dark-hover/80 hover:border-light-border dark:hover:border-dark-border
            focus:outline-none
            ${className}`}
          title="Load code from a URL (e.g., raw GitHub link)."
        >
          <Link size={16} />
          <span>Load from URL</span>
        </button>
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-xl max-w-md w-full mx-4 border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 text-light-text dark:text-dark-text">
              Load Code from URL
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUrlLoad}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors
                  bg-blue-600 text-white hover:bg-blue-700
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingUrl}
              >
                {isLoadingUrl ? "Loading..." : "Load"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploadButton;
