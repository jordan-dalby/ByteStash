import React, { useState, useEffect } from 'react';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../hooks/useAuth';
import { initializeMonaco } from '../../../../utils/language/languageUtils';
import SettingsModal from '../../../settings/SettingsModal';
import BaseSnippetStorage from '../common/BaseSnippetStorage';
import { getRecycleSnippets } from '../../../../utils/api/snippets';
import { useSnippets } from '../../../../hooks/useSnippets';
import { Snippet } from '../../../../types/snippets';
import { UserDropdown } from '../../../auth/UserDropdown';

const RecycleSnippetStorage: React.FC = () => {
  const { 
    viewMode, setViewMode, compactView, showCodePreview, 
    previewLines, includeCodeInSearch, updateSettings,
    showCategories, expandCategories, showLineNumbers,
    theme
  } = useSettings();

  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { permanentDeleteSnippet, restoreSnippet } = useSnippets();

  useEffect(() => {
    initializeMonaco();
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      const fetchedSnippets = await getRecycleSnippets();
      setSnippets(fetchedSnippets);
    } catch (error) {
      console.error('Failed to load recycled snippets:', error);
      addToast('Failed to load recycled snippets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <BaseSnippetStorage
        snippets={snippets}
        isLoading={isLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
        compactView={compactView}
        showCodePreview={showCodePreview}
        previewLines={previewLines}
        includeCodeInSearch={includeCodeInSearch}
        showCategories={showCategories}
        onDelete={async (id) => {
          await permanentDeleteSnippet(id);
          loadSnippets(); // refresh after delete
        }}
        onRestore={restoreSnippet}
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        onSettingsOpen={() => setIsSettingsModalOpen(true)}
        onNewSnippet={() => null}
        headerRight={<UserDropdown />}
        isPublicView={false}
        isRecycleView={true}
        isAuthenticated={isAuthenticated}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={{ 
          compactView, 
          showCodePreview, 
          previewLines, 
          includeCodeInSearch, 
          showCategories, 
          expandCategories, 
          showLineNumbers,
          theme
        }}
        onSettingsChange={updateSettings}
        snippets={[]}
        addSnippet={() => Promise.resolve({} as Snippet)}
        reloadSnippets={() => {}}
        isPublicView={true}
      />
    </>
  );
};

export default RecycleSnippetStorage;
