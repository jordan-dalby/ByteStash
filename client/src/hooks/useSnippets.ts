import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSnippets, createSnippet, editSnippet, moveToRecycleBin, deleteSnippet, restoreSnippetById } from '../utils/api/snippets';
import { Snippet } from '../types/snippets';
import { useToast } from './useToast';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export const useSnippets = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { logout } = useAuth();
  const hasLoadedRef = useRef(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(false);
  const navigate = useNavigate();

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
  }, [addToast, handleAuthError, isLoading]);

  const addSnippet = useCallback(async (snippetData: Omit<Snippet, 'id' | 'updated_at'>, toast: boolean = true) => {
    try {
      const newSnippet = await createSnippet(snippetData);
      setSnippets(prevSnippets => [...prevSnippets, newSnippet]);
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

  const updateSnippet = useCallback(async (id: string, snippetData: Omit<Snippet, 'id' | 'updated_at'>) => {
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

  const removeSnippet = useCallback(async (id: string) => {
    try {
      await moveToRecycleBin(id);
      setSnippets(prevSnippets => prevSnippets.filter(snippet => snippet.id !== id));
      addToast('Snippet moved to recycle bin successfully', 'success');
    } catch (error: any) {
      console.error('Failed to move snippet to recycle bin:', error);
      handleAuthError(error);
      addToast('Failed to move snippet to recycle bin. Please try again.', 'error');
      throw error;
    }
  }, [addToast, handleAuthError]);

  const permanentDeleteSnippet = useCallback(async (id: string) => {
    try {
      await deleteSnippet(id);
      addToast('Snippet deleted successfully', 'success');
    } catch (error: any) {
      console.error('Failed to delete snippet:', error);  
      handleAuthError(error);
      addToast('Failed to delete snippet. Please try again.', 'error');
    }
  }, [addToast, handleAuthError]);

  const restoreSnippet = useCallback(async (id: string) => {
    try {
      await restoreSnippetById(id);
      addToast('Snippet restored successfully', 'success');
      navigate(`/`);
    } catch (error: any) {
      console.error('Failed to restore snippet:', error);
      handleAuthError(error);
      addToast('Failed to restore snippet. Please try again.', 'error');
    }
  }, [addToast, handleAuthError]);

  const reloadSnippets = useCallback(() => {
    hasLoadedRef.current = false;
    setIsLoading(true);
    loadSnippets(true);
  }, [loadSnippets]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!hasLoadedRef.current) {
      loadSnippets(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [loadSnippets]);

  return useMemo(() => ({
    snippets,
    isLoading,
    addSnippet,
    updateSnippet,
    removeSnippet,
    permanentDeleteSnippet,
    restoreSnippet,
    reloadSnippets
  }), [
    snippets,
    isLoading,
    addSnippet,
    updateSnippet,
    removeSnippet,
    permanentDeleteSnippet,
    restoreSnippet,
    reloadSnippets
  ]);
};