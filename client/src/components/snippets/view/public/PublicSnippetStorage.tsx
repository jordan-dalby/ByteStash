import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../../../hooks/useSettings';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../hooks/useAuth';
import { initializeMonaco } from '../../../../utils/language/languageUtils';
import SettingsModal from '../../../settings/SettingsModal';
import BaseSnippetStorage from '../common/BaseSnippetStorage';
import { fetchPublicSnippets } from '../../../../utils/api/snippets';
import { Snippet } from '../../../../types/snippets';
import { UserDropdown } from '../../../auth/UserDropdown';
import { ROUTES } from '../../../../constants/routes';

const PublicSnippetStorage: React.FC = () => {
  const { 
    viewMode, setViewMode, compactView, showCodePreview, 
    previewLines, includeCodeInSearch, updateSettings,
    showCategories, expandCategories, showLineNumbers
  } = useSettings();

  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    initializeMonaco();
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    try {
      const fetchedSnippets = await fetchPublicSnippets();
      setSnippets(fetchedSnippets);
    } catch (error) {
      console.error('Failed to load public snippets:', error);
      addToast('Failed to load public snippets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (snippet: Snippet) => {
    if (!isAuthenticated) {
      addToast('Please sign in to add this snippet to your collection', 'info');
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      const duplicatedSnippet: Omit<Snippet, 'id' | 'updated_at' | 'share_count' | 'username'> = {
        title: `${snippet.title}`,
        description: snippet.description,
        categories: [...snippet.categories],
        fragments: snippet.fragments.map(f => ({ ...f })),
        is_public: 0
      };
      
      const { createSnippet } = await import('../../../../utils/api/snippets');
      await createSnippet(duplicatedSnippet);
      addToast('Snippet added to your collection', 'success');
    } catch (error) {
      console.error('Failed to duplicate snippet:', error);
      addToast('Failed to add snippet to your collection', 'error');
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
        expandCategories={expandCategories}
        showLineNumbers={showLineNumbers}
        onSettingsOpen={() => setIsSettingsModalOpen(true)}
        onNewSnippet={() => null}
        onDuplicate={handleDuplicate}
        headerRight={<UserDropdown />}
        isPublicView={true}
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
          showLineNumbers 
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

export default PublicSnippetStorage;