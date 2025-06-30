import React, { useState, useEffect } from 'react';
import { useSnippets } from '../../../hooks/useSnippets';
import { useSettings } from '../../../hooks/useSettings';
import { useToast } from '../../../hooks/useToast';
import { initializeMonaco } from '../../../utils/language/languageUtils';
import EditSnippetModal from '../edit/EditSnippetModal';
import SettingsModal from '../../settings/SettingsModal';
import { ShareMenu } from '../share/ShareMenu';
import { UserDropdown } from '../../auth/UserDropdown';
import BaseSnippetStorage from './common/BaseSnippetStorage';
import { Snippet } from '../../../types/snippets';
import { useAuth } from '../../../hooks/useAuth';

const SnippetStorage: React.FC = () => {
  const { 
    snippets, 
    isLoading, 
    addSnippet, 
    updateSnippet, 
    removeSnippet, 
    reloadSnippets 
  } = useSnippets();
  
  const { 
    viewMode, setViewMode, compactView, showCodePreview, 
    previewLines, includeCodeInSearch, updateSettings,
    showCategories, expandCategories, showLineNumbers,
    theme
  } = useSettings();

  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const [isEditSnippetModalOpen, setIsEditSnippetModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [snippetToEdit, setSnippetToEdit] = useState<Snippet | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [snippetToShare, setSnippetToShare] = useState<Snippet | null>(null);

  useEffect(() => {
    initializeMonaco();
  }, []);

  const openEditSnippetModal = (snippet: Snippet | null = null) => {
    setSnippetToEdit(snippet);
    setIsEditSnippetModalOpen(true);
  };

  const closeEditSnippetModal = () => {
    setSnippetToEdit(null);
    setIsEditSnippetModalOpen(false);
  };

  const handleSnippetSubmit = async (snippetData: Omit<Snippet, 'id' | 'updated_at'>) => {
    try {
      if (snippetToEdit) {
        await updateSnippet(snippetToEdit.id, snippetData);
      } else {
        await addSnippet(snippetData);
      }
      await reloadSnippets();
      closeEditSnippetModal();
    } catch (error) {
      console.error('Error saving snippet:', error);
      throw error;
    }
  };

  const openShareMenu = (snippet: Snippet) => {
    setSnippetToShare(snippet);
    setIsShareMenuOpen(true);
  };

  const closeShareMenu = () => {
    setSnippetToShare(null);
    setIsShareMenuOpen(false);
  };

  const handleDuplicate = async (snippet: Snippet) => {
    try {
      const duplicatedSnippet: Omit<Snippet, 'id' | 'updated_at' | 'share_count'> = {
        title: `${snippet.title}`,
        description: snippet.description,
        categories: [...snippet.categories],
        fragments: snippet.fragments.map(f => ({ ...f })),
        is_public: snippet.is_public
      };
      
      await addSnippet(duplicatedSnippet);
    } catch (error) {
      console.error('Failed to duplicate snippet:', error);
      addToast('Failed to duplicate snippet', 'error');
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
        onNewSnippet={() => openEditSnippetModal(null)}
        onDelete={removeSnippet}
        onEdit={openEditSnippetModal}
        onShare={openShareMenu}
        onDuplicate={handleDuplicate}
        headerRight={<UserDropdown />}
        isPublicView={false}
        isRecycleView={false}
        isAuthenticated={isAuthenticated}
      />

      <EditSnippetModal
        isOpen={isEditSnippetModalOpen}
        onClose={closeEditSnippetModal}
        onSubmit={handleSnippetSubmit}
        snippetToEdit={snippetToEdit}
        showLineNumbers={showLineNumbers}
        allCategories={[...new Set(snippets.flatMap(snippet => snippet.categories))].sort()}
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
        snippets={snippets}
        addSnippet={addSnippet}
        reloadSnippets={reloadSnippets}
        isPublicView={false}
      />

      {snippetToShare && (
        <ShareMenu
          snippet={snippetToShare}
          isOpen={isShareMenuOpen}
          onClose={closeShareMenu}
        />
      )}
    </>
  );
};

export default SnippetStorage;
