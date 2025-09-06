import React, { useRef } from "react";
import { Upload } from "lucide-react";
import {
  processUploadedFile,
  ACCEPTED_FILE_EXTENSIONS,
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
    </>
  );
};

export default FileUploadButton;
