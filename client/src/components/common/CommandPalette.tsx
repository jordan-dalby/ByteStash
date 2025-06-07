import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Command, FileCode, Hash } from 'lucide-react';
import { fuzzySearchEngine, FuzzySearchResult, SearchOptions } from '../../utils/fuzzySearch';
import { Snippet } from '../../types/snippets';

export interface CommandAction {
  id: string;
  label: string;
  description: string;
  action: () => void;
  keywords: string[];
  icon?: React.ReactNode;
  category?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
  snippets: Snippet[];
  onSnippetSelect?: (snippet: Snippet) => void;
}

interface SearchResult {
  type: 'action' | 'snippet';
  action?: CommandAction;
  snippet?: FuzzySearchResult;
  score: number;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  actions,
  snippets,
  onSnippetSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState<'all' | 'snippets' | 'actions'>('all');
  const [searchOptions] = useState<SearchOptions>({
    threshold: 0.4,
    limit: 20,
    includeCode: true
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  // Update fuzzy search index when snippets change
  useEffect(() => {
    console.log('CommandPalette: Updating fuzzy search index with', snippets.length, 'snippets');
    console.log('CommandPalette: Snippet titles:', snippets.map(s => s.title));
    if (snippets.length > 0) {
      fuzzySearchEngine.updateIndex(snippets);
      console.log('CommandPalette: Fuzzy search index updated');
      
      // Test search immediately after index update
      if (searchTerm.trim()) {
        const testResults = fuzzySearchEngine.advancedSearch(searchTerm, searchOptions);
        console.log('CommandPalette: Test search after index update found', testResults.length, 'results:', 
          testResults.map(r => ({ title: r.item.title, score: r.score })));
      }
    }
  }, [snippets, searchTerm, searchOptions]);

  // Enhanced search that combines actions and snippets
  const searchResults = useCallback((): SearchResult[] => {
    console.log('CommandPalette: searchResults called with searchTerm:', searchTerm, 'searchMode:', searchMode);
    
    if (!searchTerm.trim()) {
      // Show recent/popular actions when no search term
      return actions.slice(0, 8).map(action => ({
        type: 'action' as const,
        action,
        score: 0
      }));
    }

    const results: SearchResult[] = [];

    // Search through actions if not in snippet-only mode
    if (searchMode !== 'snippets') {
      const filteredActions = actions.filter(action => {
        const searchLower = searchTerm.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchLower) ||
          action.description.toLowerCase().includes(searchLower) ||
          action.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
        );
      }).map(action => ({
        type: 'action' as const,
        action,
        score: 0.1 // Give actions slight priority
      }));

      results.push(...filteredActions);
    }

    // Search through snippets if not in action-only mode
    if (searchMode !== 'actions' && snippets.length > 0) {
      try {
        console.log('CommandPalette: Searching snippets for:', searchTerm, 'with', snippets.length, 'snippets available');
        const snippetResults = fuzzySearchEngine.advancedSearch(searchTerm, searchOptions);
        console.log('CommandPalette: Found', snippetResults.length, 'snippet results:', 
          snippetResults.map(r => ({ title: r.item.title, score: r.score })));
        
        const mappedSnippetResults = snippetResults.map(result => ({
          type: 'snippet' as const,
          snippet: result,
          score: result.score
        }));

        results.push(...mappedSnippetResults);
      } catch (error) {
        console.error('Error searching snippets:', error);
      }
    }

    // Sort by score (lower is better for fuzzy search, but higher for actions)
    results.sort((a, b) => {
      if (a.type === 'action' && b.type === 'snippet') return -1;
      if (a.type === 'snippet' && b.type === 'action') return 1;
      return a.score - b.score;
    });

    return results.slice(0, searchOptions.limit || 20);
  }, [searchTerm, actions, snippets, searchMode, searchOptions]);

  const filteredResults = useMemo(() => {
    const results = searchResults();
    console.log('CommandPalette: Filtered results updated, count:', results.length, 
      'types:', results.map(r => r.type));
    console.log('CommandPalette: Snippet results being displayed:', 
      results.filter(r => r.type === 'snippet').map(r => ({ 
        title: r.snippet?.item?.title, 
        score: r.snippet?.score 
      })));
    return results;
  }, [searchResults]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Focus search input when palette opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Simplified: No event listeners needed, React props handle updates automatically

  // Listen for search query events from actions
  useEffect(() => {
    const handleSearchQuery = (e: any) => {
      console.log('CommandPalette: Received search query event:', e.detail, 'isOpen:', isOpen);
      if (e.detail) {
        console.log('CommandPalette: Setting search term to:', e.detail);
        // Use setTimeout to ensure the search term is set after any potential state updates
        setTimeout(() => {
          setSearchTerm(e.detail);
          setSelectedIndex(0);
          console.log('CommandPalette: Search term set, should trigger search now');
        }, 0);
      }
    };

    window.addEventListener('seanstash:search-query', handleSearchQuery);
    return () => window.removeEventListener('seanstash:search-query', handleSearchQuery);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        handleResultSelect(filteredResults[selectedIndex]);
        break;
      case 'Tab':
        e.preventDefault();
        // Cycle through search modes
        const modes: Array<'all' | 'snippets' | 'actions'> = ['all', 'snippets', 'actions'];
        const currentIndex = modes.indexOf(searchMode);
        setSearchMode(modes[(currentIndex + 1) % modes.length]);
        break;
    }
  }, [filteredResults, selectedIndex, onClose, searchMode]);

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    console.log('CommandPalette: handleResultSelect called with:', result);
    if (result.type === 'action' && result.action) {
      // Check if this is a search action that should keep the palette open
      const isSearchAction = result.action.id.startsWith('search-');
      console.log('CommandPalette: Action selected:', result.action.id, 'isSearchAction:', isSearchAction);
      
      if (isSearchAction) {
        console.log('CommandPalette: Executing search action, keeping palette open');
        // For search actions, execute immediately and synchronously
        result.action.action();
        // Don't call onClose() for search actions
      } else {
        console.log('CommandPalette: Executing regular action, closing palette');
        // For other actions, execute and close
        result.action.action();
        onClose();
      }
    } else if (result.type === 'snippet' && result.snippet && onSnippetSelect) {
      console.log('CommandPalette: Snippet selected, closing palette');
      onSnippetSelect(result.snippet.item);
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Render search result item
  const renderResultItem = (result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;

    if (result.type === 'action' && result.action) {
      return (
        <div
          key={`action-${result.action.id}`}
          data-testid="command-item"
          data-highlighted={isSelected ? 'true' : 'false'}
          className={`px-4 py-3 cursor-pointer border-l-2 transition-colors flex items-center space-x-3 ${
            isSelected
              ? 'bg-light-primary bg-opacity-10 dark:bg-dark-primary dark:bg-opacity-10 border-light-primary dark:border-dark-primary'
              : 'border-transparent hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover'
          }`}
          onClick={() => handleResultSelect(result)}
        >
          {result.action.icon && (
            <div className="flex-shrink-0 text-light-text-secondary dark:text-dark-text-secondary">
              {result.action.icon}
            </div>
          )}
          <div className="flex-grow">
            <div className="font-medium text-light-text dark:text-dark-text">
              {result.action.label}
            </div>
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {result.action.description}
            </div>
          </div>
          {result.action.category && (
            <div className="text-xs px-2 py-1 bg-light-background dark:bg-dark-background rounded text-light-text-secondary dark:text-dark-text-secondary">
              {result.action.category}
            </div>
          )}
        </div>
      );
    }

    if (result.type === 'snippet' && result.snippet) {
      const snippet = result.snippet.item;
      const highlights = result.snippet.highlights;
      
      return (
        <div
          key={`snippet-${snippet.id}`}
          data-testid="command-item"
          data-highlighted={isSelected ? 'true' : 'false'}
          className={`px-4 py-3 cursor-pointer border-l-2 transition-colors ${
            isSelected
              ? 'bg-light-primary bg-opacity-10 dark:bg-dark-primary dark:bg-opacity-10 border-light-primary dark:border-dark-primary'
              : 'border-transparent hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover'
          }`}
          onClick={() => handleResultSelect(result)}
        >
          <div className="flex items-start space-x-3">
            <FileCode className="flex-shrink-0 mt-1 text-light-text-secondary dark:text-dark-text-secondary" size={16} />
            <div className="flex-grow min-w-0">
              <div className="font-medium text-light-text dark:text-dark-text">
                {highlights?.title ? (
                  <span dangerouslySetInnerHTML={{ __html: highlights.title }} />
                ) : (
                  snippet.title
                )}
              </div>
              {snippet.description && (
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                  {highlights?.description ? (
                    <span dangerouslySetInnerHTML={{ __html: highlights.description }} />
                  ) : (
                    snippet.description
                  )}
                </div>
              )}
              {highlights?.content && (
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 font-mono bg-light-background dark:bg-dark-background p-2 rounded">
                  <span dangerouslySetInnerHTML={{ __html: highlights.content }} />
                </div>
              )}
              <div className="flex items-center space-x-3 mt-2">
                {snippet.categories.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Hash size={12} className="text-light-text-secondary dark:text-dark-text-secondary" />
                    <div className="flex space-x-1">
                      {snippet.categories.slice(0, 3).map((category, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 bg-light-background dark:bg-dark-background rounded text-light-text-secondary dark:text-dark-text-secondary"
                        >
                          {highlights?.categories?.[i] ? (
                            <span dangerouslySetInnerHTML={{ __html: highlights.categories[i] }} />
                          ) : (
                            category
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {snippet.fragments.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {snippet.fragments[0].language}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              Relevance: {(100 - result.snippet.score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center pt-20"
      onClick={handleBackdropClick}
    >
      <div 
        role="dialog"
        aria-label="Command palette"
        className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-full max-w-3xl mx-4"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Search Input */}
        <div className="relative border-b border-light-border dark:border-dark-border">
          <Search 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" 
            size={20} 
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchMode === 'all' ? "Search commands and snippets..." : 
                        searchMode === 'snippets' ? "Search snippets..." : "Search commands..."}
            aria-label="Search commands and snippets"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-20 py-4 bg-transparent text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none text-lg"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <div className="text-xs px-2 py-1 bg-light-background dark:bg-dark-background rounded text-light-text-secondary dark:text-dark-text-secondary">
              {searchMode === 'all' ? 'All' : searchMode === 'snippets' ? 'Snippets' : 'Commands'}
            </div>
            <Command size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
          </div>
        </div>

        {/* Results */}
        <div 
          ref={commandListRef}
          className="max-h-96 overflow-y-auto"
        >
          {filteredResults.length > 0 ? (
            <>
              {filteredResults.map((result, index) => renderResultItem(result, index))}
            </>
          ) : (
            <div className="px-4 py-8 text-center">
              <div className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                No {searchMode === 'all' ? 'results' : searchMode} found for "{searchTerm}"
              </div>
              <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Try different keywords or use advanced search syntax like "lang:javascript", "cat:utils", or "complexity:simple"
              </div>
            </div>
          )}
        </div>

        {/* Status announcement for screen readers */}
        <div 
          role="status" 
          aria-live="polite" 
          className="sr-only"
        >
          {filteredResults.length === 1 
            ? '1 result found' 
            : `${filteredResults.length} results found`
          }
        </div>

        {/* Footer with keyboard hints and search tips */}
        <div className="border-t border-light-border dark:border-dark-border px-4 py-2">
          <div className="flex justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>⇥ Mode</span>
              <span>⎋ Close</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{filteredResults.length} results</span>
              {searchTerm && (
                <span className="text-blue-500">
                  Try: lang:js, cat:utils, today, recent, simple, complex
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 