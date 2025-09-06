import React from "react";
import { Download } from "lucide-react";
import { downloadFragment } from "../../../utils/downloadUtils";
import { useToast } from "../../../hooks/useToast";

interface DownloadButtonProps {
  code: string;
  fileName: string;
  language: string;
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  code,
  fileName,
  language,
  className = "",
}) => {
  const { addToast } = useToast();

  const handleDownload = (e: React.MouseEvent) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      if (!code || !fileName) {
        addToast("Nothing to download", "warning");
        return;
      }

      downloadFragment(code, fileName, language);
      addToast(`"${fileName}" downloaded successfully`, "success");
    } catch (error) {
      console.error("Download failed:", error);
      addToast("Failed to download file", "error");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center justify-center w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary bg-light-surface dark:bg-dark-surface hover:bg-light-hover dark:hover:bg-dark-hover rounded border border-light-border dark:border-dark-border transition-colors ${className}`}
      title={`Download ${fileName}`}
      aria-label={`Download ${fileName}`}
    >
      <Download size={20} />
    </button>
  );
};

export default DownloadButton;
