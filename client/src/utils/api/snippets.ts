import { snippetService } from '../../service/snippetService';
import type { Snippet } from '../../types/snippets';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../../constants/api';
import { createCustomEvent, EVENTS } from '../../constants/events';

export const fetchSnippets = async (): Promise<Snippet[]> => {
  try {
    return await snippetService.getAllSnippets();
  } catch (error) {
    console.error('Error fetching snippets:', error);
    throw error;
  }
};

export const fetchPublicSnippets = async (): Promise<Snippet[]> => {
  try {
    return await apiClient.get<Snippet[]>(`${API_ENDPOINTS.PUBLIC}`);
  } catch (error) {
    console.error('Error fetching public snippets:', error);
    throw error;
  }
};

export const createSnippet = async (
  snippet: Omit<Snippet, 'id' | 'updated_at'>
): Promise<Snippet> => {
  try {
    const newSnippet = await snippetService.createSnippet(snippet);
    window.dispatchEvent(createCustomEvent(EVENTS.SNIPPET_UPDATED));
    return newSnippet;
  } catch (error) {
    console.error('Error creating snippet:', error);
    throw error;
  }
};

export const deleteSnippet = async (id: string): Promise<void> => {
  try {
    await snippetService.deleteSnippet(id);
    window.dispatchEvent(createCustomEvent(EVENTS.SNIPPET_DELETED));
  } catch (error) {
    console.error('Error deleting snippet:', error);
    throw error;
  }
};

export const editSnippet = async (
  id: string, 
  snippet: Omit<Snippet, 'id' | 'updated_at'>
): Promise<Snippet> => {
  try {
    const updatedSnippet = await snippetService.updateSnippet(id, snippet);
    window.dispatchEvent(createCustomEvent(EVENTS.SNIPPET_UPDATED));
    return updatedSnippet;
  } catch (error) {
    console.error('Error updating snippet:', error);
    throw error;
  }
};

export const getSnippetById = async (id: string): Promise<Snippet> => {
  try {
    return await snippetService.getSnippetById(id);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    throw error;
  }
};

export const getPublicSnippetById = async (id: string): Promise<Snippet> => {
  try {
    return await apiClient.get<Snippet>(`${API_ENDPOINTS.PUBLIC}/${id}`);
  } catch (error) {
    console.error('Error fetching public snippet:', error);
    throw error;
  }
};

export const getRecycleSnippets = async (): Promise<Snippet[]> => {
  try {
    return await snippetService.getRecycleSnippets();
  } catch (error) {
    console.error('Error fetching recycled snippets:', error);
    throw error;
  }
};

export const restoreSnippetById = async (id: string): Promise<void> => {
  try {
    await snippetService.restoreSnippet(id);
  } catch (error) {
    console.error('Error restoring snippet:', error);
    throw error;
  }
};

export const moveToRecycleBin = async (id: string): Promise<void> => {
  try {
    await snippetService.moveToRecycleBin(id);
  } catch (error) {
    console.error('Error moving snippet to recycle bin:', error);
    throw error;
  }
};
