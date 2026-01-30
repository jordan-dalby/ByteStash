import React, { useRef, useState, useEffect } from "react";
import {
  AlertCircle,
  BookOpen,
  Clock,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import Modal from "../common/modals/Modal";
import ChangelogModal from "../common/modals/ChangelogModal";
import { useToast } from "../../hooks/useToast";
import { Snippet } from "../../types/snippets";
import { Switch } from "../common/switch/Switch";
import { getAssetPath } from "../../utils/paths";
import { snippetService } from "../../service/snippetService";
import JSZip from "jszip";

const GITHUB_URL = "https://github.com/jordan-dalby/ByteStash";
const DOCKER_URL =
  "https://github.com/jordan-dalby/ByteStash/pkgs/container/bytestash";
const REDDIT_URL =
  "https://www.reddit.com/r/selfhosted/comments/1gb1ail/selfhosted_code_snippet_manager/";
const WIKI_URL = "https://github.com/jordan-dalby/ByteStash/wiki";

interface ImportProgress {
  total: number;
  current: number;
  succeeded: number;
  failed: number;
  errors: { title: string; error: string }[];
}

interface ImportData {
  version: string;
  exported_at: string;
  snippets: Omit<Snippet, "id" | "updated_at">[];
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    compactView: boolean;
    showCodePreview: boolean;
    previewLines: number;
    includeCodeInSearch: boolean;
    showCategories: boolean;
    expandCategories: boolean;
    showLineNumbers: boolean;
    theme: "light" | "dark" | "system";
  };
  onSettingsChange: (newSettings: SettingsModalProps["settings"]) => void;
  isPublicView: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  isPublicView,
}) => {
  const [compactView, setCompactView] = useState(settings.compactView);
  const [showCodePreview, setShowCodePreview] = useState(
    settings.showCodePreview
  );
  const [previewLines, setPreviewLines] = useState(settings.previewLines);
  const [includeCodeInSearch, setIncludeCodeInSearch] = useState(
    settings.includeCodeInSearch
  );
  const [showCategories, setShowCategories] = useState(settings.showCategories);
  const [expandCategories, setExpandCategories] = useState(
    settings.expandCategories
  );
  const [showLineNumbers, setShowLineNumbers] = useState(
    settings.showLineNumbers
  );
  const [themePreference, setThemePreference] = useState(settings.theme);
  const [showChangelog, setShowChangelog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Scroll preservation setup
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    const modalEl = modalContentRef.current;
    if (!modalEl) return;

    const handleScroll = () => {
      scrollPosition.current = modalEl.scrollTop;
    };

    modalEl.addEventListener("scroll", handleScroll);
    return () => modalEl.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const modalEl = modalContentRef.current;
    if (modalEl) modalEl.scrollTop = scrollPosition.current;
  });

  const handleSave = () => {
    onSettingsChange({
      compactView,
      showCodePreview,
      previewLines,
      includeCodeInSearch,
      showCategories,
      expandCategories,
      showLineNumbers,
      theme: themePreference,
    });
    onClose();
  };

  const resetImportState = () => {
    setImporting(false);
    setImportProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateImportData = (data: any): data is ImportData => {
    if (!data || typeof data !== "object") return false;
    if (typeof data.version !== "string") return false;
    if (!Array.isArray(data.snippets)) return false;

    return data.snippets.every(
      (snippet: Snippet) =>
        typeof snippet === "object" &&
        typeof snippet.title === "string" &&
        Array.isArray(snippet.fragments) &&
        Array.isArray(snippet.categories)
    );
  };

  const fetchAllSnippets = async (): Promise<Snippet[]> => {
    try {
      const allSnippets = await snippetService.getAllSnippets();
      return allSnippets;
    } catch (error) {
      console.error("Error fetching all snippets for export:", error);
      throw error;
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const content = await file.text();
      const importData = JSON.parse(content);

      if (!validateImportData(importData)) {
        throw new Error("Invalid import file format");
      }

      const progress: ImportProgress = {
        total: importData.snippets.length,
        current: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
      };

      setImportProgress(progress);

      for (const snippet of importData.snippets) {
        try {
          await snippetService.createSnippet(snippet);
          progress.succeeded += 1;
        } catch (error) {
          progress.failed += 1;
          progress.errors.push({
            title: snippet.title,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          console.error(`Failed to import snippet "${snippet.title}":`, error);
        }

        progress.current += 1;
        setImportProgress({ ...progress });
      }

      if (progress.failed === 0) {
        addToast(
          `Successfully imported ${progress.succeeded} snippets. Close settings to see them.`,
          "success"
        );
      } else {
        addToast(
          `Imported ${progress.succeeded} snippets, ${progress.failed} failed. Check console for details.`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      addToast(
        error instanceof Error ? error.message : "Failed to import snippets",
        "error"
      );
    } finally {
      resetImportState();
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const allSnippets = await fetchAllSnippets();

      if (allSnippets.length === 0) {
        addToast("No snippets available for export", "warning");
        return;
      }

      const exportData = {
        version: "1.0",
        exported_at: new Date().toISOString(),
        snippets: allSnippets,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bytestash-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast(`Exported ${allSnippets.length} snippets successfully`, "success");
    } catch (error) {
      console.error("Export error:", error);
      addToast("Failed to export snippets", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const snippetToMarkdown = (snippet: Snippet): string => {
    const lines: string[] = [];

    // title
    if (snippet.title) {
      lines.push(`# ${snippet.title}`, "");
    }

    // description
    if (snippet.description) {
      lines.push(snippet.description, "");
    }

    // tags
    if (snippet.categories?.length) {
      snippet.categories.forEach((tag) => {
        lines.push(`• ${tag}`);
      });
      lines.push("");
    }

    // code fragments
    snippet.fragments?.forEach((fragment) => {
      lines.push(
        "```" + (fragment.language || ""),
        fragment.code || "",
        "```",
        ""
      );
    });

    return lines.join("\n");
  };

  const handleMarkdownExport = async () => {
    try {
      setIsExporting(true);
      const allSnippets = await fetchAllSnippets();

      if (allSnippets.length === 0) {
        addToast("No snippets available for export", "warning");
        return;
      }

      const zip = new JSZip();

      allSnippets.forEach((snippet: Snippet) => {
        const mdContent = snippetToMarkdown(snippet);
        const filename = `${(snippet.title || "snippet").replace(
          /[^\w-]/g,
          "_"
        )}.md`;
        zip.file(filename, mdContent);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bytestash-export-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast(`Exported ${allSnippets.length} snippets as Markdown successfully`, "success");
    } catch (error) {
      console.error("Markdown export error:", error);
      addToast("Failed to export Markdown", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const SettingsGroup: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <div className="p-4 pt-0 space-y-3 rounded-lg gpl-0 bg-light-surface dark:bg-dark-surface">
      <h3 className="mb-3 text-sm font-medium text-light-text dark:text-dark-text">
        {title}
      </h3>
      {children}
    </div>
  );

  const SettingRow: React.FC<{
    label: string;
    htmlFor: string;
    children: React.ReactNode;
    indent?: boolean;
    description?: string;
  }> = ({ label, htmlFor, children, indent, description }) => (
    <div className={`${indent ? "ml-4" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label
            htmlFor={htmlFor}
            className="text-sm text-light-text dark:text-dark-text"
          >
            {label}
          </label>
          {description && (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <h2 className="text-xl font-bold text-light-text dark:text-dark-text">
          Settings
        </h2>
      }
      contentRef={modalContentRef}
    >
      <div className="pb-4">
        <div className="space-y-4">
          <SettingsGroup title="Theme Settings">
            <div className="flex justify-start gap-2">
              <button
                onClick={() => setThemePreference("light")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${
                    themePreference === "light"
                      ? "bg-light-primary dark:bg-dark-primary text-white"
                      : "bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
                  }`}
              >
                <Sun size={16} />
                Light
              </button>
              <button
                onClick={() => setThemePreference("dark")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${
                    themePreference === "dark"
                      ? "bg-light-primary dark:bg-dark-primary text-white"
                      : "bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
                  }`}
              >
                <Moon size={16} />
                Dark
              </button>
              <button
                onClick={() => setThemePreference("system")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${
                    themePreference === "system"
                      ? "bg-light-primary dark:bg-dark-primary text-white"
                      : "bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more"
                  }`}
              >
                <Monitor size={16} />
                System
              </button>
            </div>
          </SettingsGroup>

          <SettingsGroup title="View Settings">
            <SettingRow
              label="Compact View"
              htmlFor="compactView"
              description="Display snippets in a more condensed format"
            >
              <Switch
                id="compactView"
                checked={compactView}
                onChange={setCompactView}
              />
            </SettingRow>

            <div className="space-y-3">
              <SettingRow
                label="Show Code Preview"
                htmlFor="showCodePreview"
                description="Display a preview of the code in the snippet list"
              >
                <Switch
                  id="showCodePreview"
                  checked={showCodePreview}
                  onChange={setShowCodePreview}
                />
              </SettingRow>

              {showCodePreview && (
                <SettingRow
                  label="Number of Preview Lines"
                  htmlFor="previewLines"
                  indent
                  description="Maximum number of lines to show in preview (1-20)"
                >
                  <input
                    type="number"
                    id="previewLines"
                    value={previewLines}
                    onChange={(e) =>
                      setPreviewLines(
                        Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                      )
                    }
                    min="1"
                    max="20"
                    className="w-20 p-1 text-sm border rounded-md form-input bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
                  />
                </SettingRow>
              )}
            </div>

            <SettingRow
              label="Show Line Numbers"
              htmlFor="showLineNumbers"
              description="Display line numbers in code blocks"
            >
              <Switch
                id="showLineNumbers"
                checked={showLineNumbers}
                onChange={setShowLineNumbers}
              />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup title="Category Settings">
            <SettingRow
              label="Show Categories"
              htmlFor="showCategories"
              description="Display category labels for snippets"
            >
              <Switch
                id="showCategories"
                checked={showCategories}
                onChange={setShowCategories}
              />
            </SettingRow>

            {showCategories && (
              <SettingRow
                label="Expand Categories"
                htmlFor="expandCategories"
                indent
                description="Automatically expand category groups"
              >
                <Switch
                  id="expandCategories"
                  checked={expandCategories}
                  onChange={setExpandCategories}
                />
              </SettingRow>
            )}
          </SettingsGroup>

          <SettingsGroup title="Search Settings">
            <SettingRow
              label="Include Code in Search"
              htmlFor="includeCodeInSearch"
              description="Search within code content, not just titles"
            >
              <Switch
                id="includeCodeInSearch"
                checked={includeCodeInSearch}
                onChange={setIncludeCodeInSearch}
              />
            </SettingRow>
          </SettingsGroup>

          {!isPublicView && (
            <SettingsGroup title="Data Management">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={isExporting || importing}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-md bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more text-light-text dark:text-dark-text ${
                    isExporting || importing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={16} />
                  {isExporting ? "Exporting..." : "Export Snippets (JSON)"}
                </button>
                <button
                  onClick={handleMarkdownExport}
                  disabled={isExporting || importing}
                  className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors rounded-md bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more text-light-text dark:text-dark-text ${
                    isExporting || importing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <Download size={16} />
                  {isExporting ? "Exporting..." : "Export Snippets (Markdown)"}
                </button>
                <label
                  className={`flex items-center gap-2 px-4 py-2 bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more rounded-md transition-colors text-sm cursor-pointer text-light-text dark:text-dark-text ${
                    importing || isExporting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    disabled={importing || isExporting}
                    className="hidden"
                  />
                  <Upload size={16} />
                  Import Snippets
                </label>
              </div>

              {importProgress && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-light-text dark:text-dark-text">
                    <span>Importing snippets...</span>
                    <span>
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>

                  <div className="w-full h-2 overflow-hidden rounded-full bg-light-surface dark:bg-dark-surface">
                    <div
                      className="h-full transition-all duration-200 bg-light-primary dark:bg-dark-primary"
                      style={{
                        width: `${
                          (importProgress.current / importProgress.total) * 100
                        }%`,
                      }}
                    />
                  </div>

                  {importProgress.errors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle size={14} />
                        <span>
                          {importProgress.errors.length} errors occurred
                        </span>
                      </div>
                      <div className="mt-1 overflow-y-auto max-h-24">
                        {importProgress.errors.map((error, index) => (
                          <div key={index} className="text-xs text-red-400">
                            Failed to import "{error.title}": {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SettingsGroup>
          )}

          <div className="pt-4 mt-4 border-t border-light-border dark:border-dark-border">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowChangelog(true)}
                className="transition-opacity opacity-60 hover:opacity-100"
                title="Changelog"
              >
                <Clock className="w-6 h-6 text-light-text dark:text-dark-text" />
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity opacity-60 hover:opacity-100"
                title="GitHub Repository"
              >
                <img
                  src={getAssetPath("/github-mark-white.svg")}
                  alt="GitHub"
                  className="w-6 h-6 dark:brightness-100 brightness-0"
                />
              </a>
              <a
                href={DOCKER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity opacity-60 hover:opacity-100"
                title="GitHub Packages"
              >
                <img
                  src={getAssetPath("/docker-mark-white.svg")}
                  alt="Docker"
                  className="w-6 h-6 dark:brightness-100 brightness-0"
                />
              </a>
              <a
                href={REDDIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity opacity-60 hover:opacity-100"
                title="Reddit Post"
              >
                <img
                  src={getAssetPath("/reddit-mark-white.svg")}
                  alt="Reddit"
                  className="w-6 h-6 dark:brightness-100 brightness-0"
                />
              </a>
              <a
                href={WIKI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity opacity-60 hover:opacity-100"
                title="Documentation"
              >
                <BookOpen className="w-6 h-6 text-light-text dark:text-dark-text" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-2 text-sm rounded-md bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white rounded-md bg-light-primary dark:bg-dark-primary hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </Modal>
  );
};

export default SettingsModal;
