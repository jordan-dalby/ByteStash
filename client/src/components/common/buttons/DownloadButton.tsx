import React from "react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../hooks/useToast";
import { downloadFragment } from "../../../utils/downloadUtils";

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
  const { t: translate } = useTranslation('components/common/buttons');
  const { addToast } = useToast();

  const handleDownload = (e: React.MouseEvent) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      if (!code || !fileName) {
        addToast(translate('downloadButton.warning.nothing'), "warning");
        return;
      }

      downloadFragment(code, fileName, language);
      addToast(translate('downloadButton.success.downloaded', { fileName }), "success");
    } catch (error) {
      console.error("Download failed:", error);
      addToast(translate('downloadButton.error.failedDownload'), "error");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center justify-center w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary bg-light-surface dark:bg-dark-surface hover:bg-light-hover dark:hover:bg-dark-hover rounded border border-light-border dark:border-dark-border transition-colors ${className}`}
      title={translate('downloadButton.title', { fileName })}
      aria-label={translate('downloadButton.title', { fileName })}
    >
      <Download size={20} />
    </button>
  );
};

export default DownloadButton;
