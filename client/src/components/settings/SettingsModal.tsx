import React, { useRef, useState } from 'react';
import { AlertCircle, BookOpen, Clock, Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import Modal from '../common/modals/Modal';
import ChangelogModal from '../common/modals/ChangelogModal';
import { useToast } from '../../hooks/useToast';
import { Snippet } from '../../types/snippets';
import { Switch } from '../common/switch/Switch';
import { getAssetPath } from '../../utils/paths';

const GITHUB_URL = "https://github.com/jordan-dalby/ByteStash";
const DOCKER_URL = "https://github.com/jordan-dalby/ByteStash/pkgs/container/bytestash";
const REDDIT_URL = "https://www.reddit.com/r/selfhosted/comments/1gb1ail/selfhosted_code_snippet_manager/";
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
  snippets: Omit<Snippet, 'id' | 'updated_at'>[];
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
    theme: 'light' | 'dark' | 'system';
  };
  onSettingsChange: (newSettings: SettingsModalProps['settings']) => void;
  snippets: Snippet[];
  addSnippet: (snippet: Omit<Snippet, 'id' | 'updated_at'>, toast: boolean) => Promise<Snippet>;
  reloadSnippets: () => void;
  isPublicView: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange,
  snippets,
  addSnippet,
  reloadSnippets,
  isPublicView
}) => {
  const [compactView, setCompactView] = useState(settings.compactView);
  const [showCodePreview, setShowCodePreview] = useState(settings.showCodePreview);
  const [previewLines, setPreviewLines] = useState(settings.previewLines);
  const [includeCodeInSearch, setIncludeCodeInSearch] = useState(settings.includeCodeInSearch);
  const [showCategories, setShowCategories] = useState(settings.showCategories);
  const [expandCategories, setExpandCategories] = useState(settings.expandCategories);
  const [showLineNumbers, setShowLineNumbers] = useState(settings.showLineNumbers);
  const [themePreference, setThemePreference] = useState(settings.theme);
  const [showChangelog, setShowChangelog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeApiKeyStatus, setClaudeApiKeyStatus] = useState<'unchecked' | 'checking' | 'valid' | 'invalid'>('unchecked');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Load Claude API key when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadClaudeApiKey();
    }
  }, [isOpen]);

  const loadClaudeApiKey = async () => {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v2/ai/config', {
        headers: {
          'bytestashauth': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          setClaudeApiKey(data.apiKey);
          setClaudeApiKeyStatus('valid');
        }
      }
    } catch (error) {
      console.error('Failed to load Claude API key:', error);
    }
  };

  const testClaudeApiKey = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeApiKeyStatus('invalid');
      addToast('Please enter an API key', 'error');
      return;
    }

    setClaudeApiKeyStatus('checking');
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v2/ai/test-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bytestashauth': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: claudeApiKey })
      });

      if (response.ok) {
        const result = await response.json();
        setClaudeApiKeyStatus('valid');
        addToast(`Claude API key is valid! (${result.model})`, 'success');
      } else {
        const error = await response.json();
        setClaudeApiKeyStatus('invalid');
        addToast(`Invalid Claude API key: ${error.message || 'Authentication failed'}`, 'error');
      }
    } catch (error) {
      setClaudeApiKeyStatus('invalid');
      addToast('Failed to test Claude API key', 'error');
    }
  };


  const saveClaudeApiKey = async () => {
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/v2/ai/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bytestashauth': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: claudeApiKey })
      });

      if (response.ok) {
        addToast('Claude API key saved successfully', 'success');
      } else {
        const error = await response.json();
        addToast(`Failed to save Claude API key: ${error.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      addToast('Failed to save Claude API key', 'error');
    }
  };


  const handleSave = async () => {
    // Save UI settings
    onSettingsChange({
      compactView,
      showCodePreview,
      previewLines,
      includeCodeInSearch,
      showCategories,
      expandCategories,
      showLineNumbers,
      theme: themePreference
    });

    // Save Claude API key if it was changed
    if (claudeApiKey.trim()) {
      await saveClaudeApiKey();
    }


    onClose();
  };

  const resetImportState = () => {
    setImporting(false);
    setImportProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateImportData = (data: any): data is ImportData => {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.version !== 'string') return false;
    if (!Array.isArray(data.snippets)) return false;
    
    return data.snippets.every((snippet: Snippet) => 
      typeof snippet === 'object' &&
      typeof snippet.title === 'string' &&
      Array.isArray(snippet.fragments) &&
      Array.isArray(snippet.categories)
    );
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const content = await file.text();
      const importData = JSON.parse(content);

      if (!validateImportData(importData)) {
        throw new Error('Invalid import file format');
      }

      const progress: ImportProgress = {
        total: importData.snippets.length,
        current: 0,
        succeeded: 0,
        failed: 0,
        errors: []
      };

      setImportProgress(progress);

      for (const snippet of importData.snippets) {
        try {
          await addSnippet(snippet, false);
          progress.succeeded += 1;
        } catch (error) {
          progress.failed += 1;
          progress.errors.push({
            title: snippet.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`Failed to import snippet "${snippet.title}":`, error);
        }
        
        progress.current += 1;
        setImportProgress({ ...progress });
      }

      if (progress.failed === 0) {
        addToast(`Successfully imported ${progress.succeeded} snippets`, 'success');
        reloadSnippets();
      } else {
        addToast(
          `Imported ${progress.succeeded} snippets, ${progress.failed} failed. Check console for details.`,
          'warning'
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      addToast(
        error instanceof Error ? error.message : 'Failed to import snippets',
        'error'
      );
    } finally {
      resetImportState();
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        snippets: snippets
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bytestash-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast('Snippets exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Failed to export snippets', 'error');
    }
  };

  const SettingsGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3 p-4 pt-0 gpl-0 bg-light-surface dark:bg-dark-surface rounded-lg">
      <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">{title}</h3>
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
    <div className={`${indent ? 'ml-4' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label htmlFor={htmlFor} className="text-light-text dark:text-dark-text text-sm">
            {label}
          </label>
          {description && (
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-xs">
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
      title={<h2 className="text-xl font-bold text-light-text dark:text-dark-text">Settings</h2>}
    >
      <div className="pb-4">
        <div className="space-y-4">
          <SettingsGroup title="Theme Settings">
            <div className="flex gap-2 justify-start">
              <button
                onClick={() => setThemePreference('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${themePreference === 'light' 
                    ? 'bg-light-primary dark:bg-dark-primary text-white' 
                    : 'bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more'
                  }`}
              >
                <Sun size={16} />
                Light
              </button>
              <button
                onClick={() => setThemePreference('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${themePreference === 'dark'
                    ? 'bg-light-primary dark:bg-dark-primary text-white'
                    : 'bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more'
                  }`}
              >
                <Moon size={16} />
                Dark
              </button>
              <button
                onClick={() => setThemePreference('system')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm
                  ${themePreference === 'system'
                    ? 'bg-light-primary dark:bg-dark-primary text-white'
                    : 'bg-light-hover dark:bg-dark-hover text-light-text dark:text-dark-text hover:bg-light-hover-more dark:hover:bg-dark-hover-more'
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
                    onChange={(e) => setPreviewLines(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="20"
                    className="form-input w-20 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text p-1 text-sm"
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
            <SettingsGroup title="🤖 Claude AI Settings">
              <div className="space-y-3">
                <SettingRow 
                  label="Claude API Key" 
                  htmlFor="claudeApiKey"
                  description="Enter your Anthropic Claude API key for AI-powered command analysis"
                >
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      id="claudeApiKey"
                      value={claudeApiKey}
                      onChange={(e) => {
                        setClaudeApiKey(e.target.value);
                        setClaudeApiKeyStatus('unchecked');
                      }}
                      placeholder="enter your API key here..."
                      autoComplete="off"
                      spellCheck="false"
                      style={{ fontFamily: 'monospace' }}
                      className="form-input w-64 rounded-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text p-2 text-sm"
                    />
                    <button
                      onClick={testClaudeApiKey}
                      disabled={!claudeApiKey.trim() || claudeApiKeyStatus === 'checking'}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        claudeApiKeyStatus === 'checking'
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : claudeApiKeyStatus === 'valid'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : claudeApiKeyStatus === 'invalid'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {claudeApiKeyStatus === 'checking' && '🔄 Testing...'}
                      {claudeApiKeyStatus === 'valid' && '✅ Valid'}
                      {claudeApiKeyStatus === 'invalid' && '❌ Invalid'}
                      {claudeApiKeyStatus === 'unchecked' && '🧪 Test'}
                    </button>
                  </div>
                </SettingRow>
                

                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary space-y-1">
                  <p>• Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Anthropic Console</a></p>
                  <p>• Your credit balance is automatically fetched and displayed in the header</p>
                  <p>• Cost: ~$0.007-0.012 per command analysis</p>
                  <p>• Required for enhanced mode: <code className="bg-light-hover dark:bg-dark-hover px-1 rounded">sse '!command'</code></p>
                </div>
              </div>
            </SettingsGroup>
          )}

          {!isPublicView && (
            <SettingsGroup title="Data Management">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more rounded-md transition-colors text-sm text-light-text dark:text-dark-text"
                >
                  <Download size={16} />
                  Export Snippets
                </button>
                <label
                  className={`flex items-center gap-2 px-4 py-2 bg-light-hover dark:bg-dark-hover hover:bg-light-hover-more dark:hover:bg-dark-hover-more rounded-md transition-colors text-sm cursor-pointer text-light-text dark:text-dark-text ${
                    importing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    disabled={importing}
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
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  
                  <div className="w-full h-2 bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-light-primary dark:bg-dark-primary transition-all duration-200"
                      style={{
                        width: `${(importProgress.current / importProgress.total) * 100}%`
                      }}
                    />
                  </div>

                  {importProgress.errors.length > 0 && (
                    <div className="mt-2 text-sm">
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle size={14} />
                        <span>{importProgress.errors.length} errors occurred</span>
                      </div>
                      <div className="mt-1 max-h-24 overflow-y-auto">
                        {importProgress.errors.map((error, index) => (
                          <div key={index} className="text-red-400 text-xs">
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

          <div className="border-t border-light-border dark:border-dark-border pt-4 mt-4">
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowChangelog(true)}
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="Changelog"
              >
                <Clock className="w-6 h-6 text-light-text dark:text-dark-text" />
              </button>
              <a 
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="GitHub Repository"
              >
                <img src={getAssetPath('/github-mark-white.svg')} alt="GitHub" className="w-6 h-6 dark:brightness-100 brightness-0" />
              </a>
              <a 
                href={DOCKER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="GitHub Packages"
              >
                <img src={getAssetPath('/docker-mark-white.svg')} alt="Docker" className="w-6 h-6 dark:brightness-100 brightness-0" />
              </a>
              <a 
                href={REDDIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="Reddit Post"
              >
                <img src={getAssetPath('/reddit-mark-white.svg')} alt="Reddit" className="w-6 h-6 dark:brightness-100 brightness-0" />
              </a>
              <a 
                href={WIKI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100 transition-opacity"
                title="Documentation"
              >
                <BookOpen className="w-6 h-6 text-light-text dark:text-dark-text" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="mr-2 px-4 py-2 bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text rounded-md hover:bg-light-hover dark:hover:bg-dark-hover text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-light-primary dark:bg-dark-primary text-white rounded-md hover:opacity-90 text-sm"
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
