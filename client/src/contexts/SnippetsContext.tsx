import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSnippets, createSnippet, editSnippet, deleteSnippet, toggleSnippetLock } from '../utils/api/snippets';
import { Snippet } from '../types/snippets';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

interface SnippetsContextType {
  snippets: Snippet[];
  isLoading: boolean;
  addSnippet: (snippetData: Omit<Snippet, 'id' | 'updated_at'>, toast?: boolean) => Promise<Snippet>;
  updateSnippet: (id: string, snippetData: Omit<Snippet, 'id' | 'updated_at'>) => Promise<Snippet>;
  removeSnippet: (id: string) => Promise<void>;
  toggleLock: (id: string, locked: boolean) => Promise<void>;
  reloadSnippets: () => void;
}

const SnippetsContext = createContext<SnippetsContextType | undefined>(undefined);

export const useSnippetsContext = () => {
  const context = useContext(SnippetsContext);
  if (!context) {
    throw new Error('useSnippetsContext must be used within a SnippetsProvider');
  }
  return context;
};

interface SnippetsProviderProps {
  children: React.ReactNode;
}

export const SnippetsProvider: React.FC<SnippetsProviderProps> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { logout, isAuthenticated } = useAuth();
  const hasLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(false);

  const handleAuthError = useCallback((error: any) => {
    if (error.status === 401 || error.status === 403) {
      logout();
      addToast('Session expired. Please login again.', 'error');
    }
  }, [logout, addToast]);

  const loadSnippets = useCallback(async (force: boolean) => {
    if ((!isLoading && !force) || (hasLoadedRef.current && !force)) {
      return;
    }

    if (!isAuthenticated) {
      setSnippets([]);
      setIsLoading(false);
      return;
    }

    if (loadingPromiseRef.current) {
      await loadingPromiseRef.current;
      return;
    }

    const loadPromise = (async () => {
      try {
        const fetchedSnippets = await fetchSnippets();
        
        if (mountedRef.current) {
          const sortedSnippets = fetchedSnippets.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          setSnippets(sortedSnippets);
          
          if (!hasLoadedRef.current && !force) {
            addToast('Snippets loaded successfully', 'success');
          }
          hasLoadedRef.current = true;
        }
      } catch (error: any) {
        console.error('Failed to fetch snippets:', error);
        if (mountedRef.current) {
          handleAuthError(error);
          if (!hasLoadedRef.current) {
            addToast('Failed to load snippets. Please try again.', 'error');
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
        loadingPromiseRef.current = null;
      }
    })();

    loadingPromiseRef.current = loadPromise;
    await loadPromise;
  }, [addToast, handleAuthError, isLoading, isAuthenticated]);

  const addSnippetFn = useCallback(async (snippetData: Omit<Snippet, 'id' | 'updated_at'>, toast: boolean = true) => {
    try {
      const newSnippet = await createSnippet(snippetData);
      console.log('SnippetsContext: Created new snippet:', newSnippet.title, 'at', newSnippet.updated_at);
      setSnippets(prevSnippets => {
        const updated = [newSnippet, ...prevSnippets];
        console.log('SnippetsContext: Updated snippets state, now has', updated.length, 'snippets');
        return updated;
      });
      if (toast) {
        addToast('New snippet created successfully', 'success');
      }
      return newSnippet;
    } catch (error: any) {
      console.error('Error creating snippet:', error);
      handleAuthError(error);
      addToast('Failed to create snippet', 'error');
      throw error;
    }
  }, [addToast, handleAuthError]);

  const updateSnippetFn = useCallback(async (id: string, snippetData: Omit<Snippet, 'id' | 'updated_at'>) => {
    try {
      const updatedSnippet = await editSnippet(id, snippetData);
      setSnippets(prevSnippets =>
        prevSnippets.map(s => s.id === updatedSnippet.id ? updatedSnippet : s)
      );
      addToast('Snippet updated successfully', 'success');
      return updatedSnippet;
    } catch (error: any) {
      console.error('Error updating snippet:', error);
      handleAuthError(error);
      addToast('Failed to update snippet', 'error');
      throw error;
    }
  }, [addToast, handleAuthError]);

  const removeSnippetFn = useCallback(async (id: string) => {
    try {
      await deleteSnippet(id);
      setSnippets(prevSnippets => prevSnippets.filter(snippet => snippet.id !== id));
      addToast('Snippet deleted successfully', 'success');
    } catch (error: any) {
      console.error('Failed to delete snippet:', error);
      handleAuthError(error);
      addToast('Failed to delete snippet. Please try again.', 'error');
      throw error;
    }
  }, [addToast, handleAuthError]);

  const toggleLockFn = useCallback(async (id: string, locked: boolean) => {
    try {
      const updatedSnippet = await toggleSnippetLock(id, locked);
      setSnippets(prevSnippets =>
        prevSnippets.map(s => s.id === updatedSnippet.id ? updatedSnippet : s)
      );
      addToast(`Snippet ${locked ? 'locked' : 'unlocked'} successfully`, 'success');
    } catch (error: any) {
      console.error('Failed to toggle snippet lock:', error);
      handleAuthError(error);
      addToast('Failed to toggle snippet lock. Please try again.', 'error');
      throw error;
    }
  }, [addToast, handleAuthError]);

  const reloadSnippets = useCallback(() => {
    hasLoadedRef.current = false;
    setIsLoading(true);
    loadSnippets(true);
  }, [loadSnippets]);

  // Reset when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setSnippets([]);
      setIsLoading(false);
      hasLoadedRef.current = false;
    } else if (!hasLoadedRef.current) {
      setIsLoading(true);
      loadSnippets(false);
    }
  }, [isAuthenticated, loadSnippets]);

  // Simple React approach: SnippetsContext updates its state, 
  // CommandPalette automatically gets updated via props

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const contextValue = useMemo(() => ({
    snippets,
    isLoading,
    addSnippet: addSnippetFn,
    updateSnippet: updateSnippetFn,
    removeSnippet: removeSnippetFn,
    toggleLock: toggleLockFn,
    reloadSnippets
  }), [
    snippets,
    isLoading,
    addSnippetFn,
    updateSnippetFn,
    removeSnippetFn,
    toggleLockFn,
    reloadSnippets
  ]);

  return (
    <SnippetsContext.Provider value={contextValue}>
      {children}
    </SnippetsContext.Provider>
  );
}; 