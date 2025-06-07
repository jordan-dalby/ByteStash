import Fuse from 'fuse.js';
import { Snippet } from '../types/snippets';

export interface SearchableSnippet extends Snippet {
  // Flattened searchable content for better search performance
  searchableContent?: string;
  languageNames?: string;
  allText?: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface FuzzySearchResult {
  item: SearchableSnippet;
  score: number;
  matches?: any[];
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
    categories?: string[];
  };
}

export interface SearchOptions {
  includeCode?: boolean;
  languageFilter?: string;
  categoryFilter?: string[];
  dateFilter?: DateFilter;
  showUntagged?: boolean; // Show only snippets with no categories
  complexityFilter?: 'simple' | 'medium' | 'complex';
  threshold?: number; // 0 = perfect match, 1 = match anything
  limit?: number;
}

export interface DateFilter {
  type: 'today' | 'this_week' | 'this_month' | 'last_week' | 'last_month' | 'last_year' | 'recent' | 'custom';
  customRange?: {
    start: Date;
    end: Date;
  };
}

class FuzzySearchEngine {
  private snippets: SearchableSnippet[] = [];

  // Calculate snippet complexity based on various factors
  private calculateComplexity(snippet: Snippet): 'simple' | 'medium' | 'complex' {
    let complexityScore = 0;
    
    // Factor 1: Total lines of code
    const totalLines = snippet.fragments.reduce((total, fragment) => {
      return total + fragment.code.split('\n').length;
    }, 0);
    
    if (totalLines > 50) complexityScore += 3;
    else if (totalLines > 15) complexityScore += 2;
    else if (totalLines > 5) complexityScore += 1;
    
    // Factor 2: Number of fragments
    if (snippet.fragments.length > 3) complexityScore += 2;
    else if (snippet.fragments.length > 1) complexityScore += 1;
    
    // Factor 3: Language complexity (some languages are inherently more complex)
    const languages = snippet.fragments.map(f => f.language.toLowerCase());
    const complexLanguages = ['rust', 'cpp', 'c++', 'haskell', 'scala', 'assembly'];
    const mediumLanguages = ['java', 'csharp', 'c#', 'kotlin', 'go', 'typescript', 'swift'];
    
    if (languages.some(lang => complexLanguages.includes(lang))) complexityScore += 2;
    else if (languages.some(lang => mediumLanguages.includes(lang))) complexityScore += 1;
    
    // Factor 4: Code patterns that indicate complexity
    const allCode = snippet.fragments.map(f => f.code).join('\n').toLowerCase();
    const complexPatterns = [
      'async', 'await', 'promise', 'callback', 'recursion', 'algorithm',
      'class', 'interface', 'generic', 'template', 'inheritance',
      'database', 'sql', 'query', 'transaction', 'api', 'rest',
      'regex', 'pattern', 'thread', 'concurrent', 'parallel'
    ];
    
    const complexPatternMatches = complexPatterns.filter(pattern => 
      allCode.includes(pattern)
    ).length;
    
    if (complexPatternMatches > 5) complexityScore += 2;
    else if (complexPatternMatches > 2) complexityScore += 1;
    
    // Factor 5: Description complexity indicators
    const description = snippet.description.toLowerCase();
    const complexDescriptions = [
      'algorithm', 'optimization', 'performance', 'advanced', 'enterprise',
      'architecture', 'design pattern', 'framework', 'library', 'complex'
    ];
    
    if (complexDescriptions.some(term => description.includes(term))) {
      complexityScore += 1;
    }
    
    // Determine final complexity level
    if (complexityScore >= 6) return 'complex';
    if (complexityScore >= 3) return 'medium';
    return 'simple';
  }

  // Prepare snippets for searching by creating searchable content
  private prepareSnippets(snippets: Snippet[]): SearchableSnippet[] {
    return snippets.map(snippet => {
      // Extract and combine all code content
      const codeContent = snippet.fragments
        .map(fragment => `${fragment.file_name}\n${fragment.code}`)
        .join('\n\n');

      // Extract unique language names
      const languages = [...new Set(snippet.fragments.map(f => f.language))];
      const languageNames = languages.join(' ');

      // Create comprehensive searchable content
      const searchableContent = snippet.fragments
        .map(fragment => {
          // Include filename, language, and code
          return `${fragment.file_name} ${fragment.language} ${fragment.code}`;
        })
        .join(' ');

      // All text for full-text search
      const allText = `${snippet.title} ${snippet.description} ${snippet.categories.join(' ')} ${codeContent}`;

      return {
        ...snippet,
        searchableContent,
        languageNames,
        allText,
        complexity: this.calculateComplexity(snippet)
      };
    });
  }

  // Update the search index with new snippets
  updateIndex(snippets: Snippet[]): void {
    console.log('FuzzySearch: Updating index with snippets:', snippets.map(s => ({ 
      title: s.title, 
      updated_at: s.updated_at,
      updated_date: new Date(s.updated_at)
    })));
    this.snippets = this.prepareSnippets(snippets);
  }

  // Main search function
  search(query: string, options: SearchOptions = {}): FuzzySearchResult[] {
    const {
      languageFilter,
      categoryFilter,
      dateFilter,
      showUntagged,
      complexityFilter,
      threshold = 0.4,
      limit = 50
    } = options;

    // Apply filters to snippets first
    let filteredSnippets = this.snippets;

    if (languageFilter) {
      filteredSnippets = filteredSnippets.filter(snippet =>
        snippet.fragments.some(fragment =>
          fragment.language.toLowerCase().includes(languageFilter.toLowerCase())
        )
      );
    }

    if (categoryFilter && categoryFilter.length > 0) {
      filteredSnippets = filteredSnippets.filter(snippet =>
        snippet.categories.some(cat =>
          categoryFilter.some(filter =>
            cat.toLowerCase().includes(filter.toLowerCase())
          )
        )
      );
    }

    if (showUntagged) {
      filteredSnippets = filteredSnippets.filter(snippet =>
        !snippet.categories || snippet.categories.length === 0
      );
    }

    if (dateFilter) {
      filteredSnippets = this.filterByDate(filteredSnippets, dateFilter);
    }

    if (complexityFilter) {
      filteredSnippets = filteredSnippets.filter(snippet => 
        snippet.complexity === complexityFilter
      );
    }

    // If no search query but we have filters applied, return filtered results directly
    if (!query.trim() && (showUntagged || dateFilter || languageFilter || complexityFilter || (categoryFilter && categoryFilter.length > 0))) {
      return filteredSnippets.slice(0, limit).map(snippet => ({
        item: snippet,
        score: 0, // No search score for filter-only results
        matches: [],
        highlights: {}
      }));
    }

    // If no query and no filters, return empty
    if (!query.trim()) {
      return [];
    }

    // Configure Fuse.js for this search
    const fuseOptions = {
      threshold,
      distance: 1000,
      minMatchCharLength: 2,
      includeMatches: true,
      includeScore: true,
      useExtendedSearch: true,
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'categories', weight: 0.15 },
        { name: 'languageNames', weight: 0.1 },
        { name: 'searchableContent', weight: 0.2 },
        { name: 'allText', weight: 0.05 },
      ]
    };

    const fuse = new Fuse(filteredSnippets, fuseOptions);
    const results = fuse.search(query, { limit });
    return this.processResults(results);
  }

  // Advanced search with specific syntax
  advancedSearch(query: string, options: SearchOptions = {}): FuzzySearchResult[] {
    // Parse advanced search syntax
    const parsedQuery = this.parseAdvancedQuery(query);
    
    if (parsedQuery.filters.length > 0) {
      // Apply filters from query
      options = {
        ...options,
        ...this.extractFiltersFromQuery(parsedQuery)
      };
    }

    return this.search(parsedQuery.cleanQuery, options);
  }

  // Parse advanced search queries like "lang:javascript", "cat:utils", "created:today", etc.
  private parseAdvancedQuery(query: string): {
    cleanQuery: string;
    filters: Array<{ type: string; value: string }>;
  } {
    const filters: Array<{ type: string; value: string }> = [];
    let cleanQuery = query;

    // Match patterns like "lang:javascript", "category:utils", "file:main.js", "created:today"
    const filterPatterns = [
      /\b(?:lang|language):(\w+)/gi,
      /\b(?:cat|category):(\w+)/gi,
      /\b(?:file|filename):(\w+)/gi,
      /\b(?:ext|extension):(\w+)/gi,
      /\b(?:created|date|when):([a-z_]+)/gi,
      /\b(?:complexity|complex):(\w+)/gi
    ];

    filterPatterns.forEach(pattern => {
      const matches = [...query.matchAll(pattern)];
      matches.forEach(match => {
        const [fullMatch, value] = match;
        filters.push({
          type: match[0].split(':')[0].toLowerCase(),
          value: value.toLowerCase()
        });
        cleanQuery = cleanQuery.replace(fullMatch, '').trim();
      });
    });

    // Also parse natural language date queries directly
    const dateQueries = [
      'today', 'this week', 'this month', 'last week', 'last month', 'last year',
      'yesterday', 'this_week', 'this_month', 'last_week', 'last_month', 'last_year',
      'recent', 'recently', 'recently edited', 'recently modified', 'recent changes'
    ];

    dateQueries.forEach(dateQuery => {
      const regex = new RegExp(`\\b${dateQuery.replace('_', '\\s*')}\\b`, 'gi');
      if (regex.test(cleanQuery)) {
        filters.push({
          type: 'date',
          value: dateQuery.replace(/\s+/g, '_').toLowerCase()
        });
        cleanQuery = cleanQuery.replace(regex, '').trim();
      }
    });

    // Parse untagged/no tags queries
    const untaggedQueries = [
      'untagged', 'no tags', 'no categories', 'without tags', 'without categories',
      'uncategorized', 'no_tags', 'no_categories'
    ];

    untaggedQueries.forEach(untaggedQuery => {
      const regex = new RegExp(`\\b${untaggedQuery.replace('_', '\\s*')}\\b`, 'gi');
      if (regex.test(cleanQuery)) {
        filters.push({
          type: 'untagged',
          value: 'true'
        });
        cleanQuery = cleanQuery.replace(regex, '').trim();
      }
    });

    // Parse complexity queries
    const complexityQueries = [
      'simple', 'simple snippets', 'easy', 'basic',
      'medium', 'medium complexity', 'intermediate', 'moderate',
      'complex', 'complex snippets', 'advanced', 'difficult', 'complicated'
    ];

    complexityQueries.forEach(complexityQuery => {
      const regex = new RegExp(`\\b${complexityQuery.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      if (regex.test(cleanQuery)) {
        let complexityValue: 'simple' | 'medium' | 'complex';
        
        if (/simple|easy|basic/i.test(complexityQuery)) {
          complexityValue = 'simple';
        } else if (/medium|intermediate|moderate/i.test(complexityQuery)) {
          complexityValue = 'medium';
        } else {
          complexityValue = 'complex';
        }
        
        filters.push({
          type: 'complexity',
          value: complexityValue
        });
        cleanQuery = cleanQuery.replace(regex, '').trim();
      }
    });

    return { cleanQuery, filters };
  }

  private extractFiltersFromQuery(parsedQuery: {
    filters: Array<{ type: string; value: string }>;
  }): Partial<SearchOptions> {
    const options: Partial<SearchOptions> = {};

    parsedQuery.filters.forEach(filter => {
      switch (filter.type) {
        case 'lang':
        case 'language':
          options.languageFilter = filter.value;
          break;
        case 'cat':
        case 'category':
          options.categoryFilter = options.categoryFilter || [];
          options.categoryFilter.push(filter.value);
          break;
        case 'created':
        case 'date':
        case 'when':
          options.dateFilter = this.parseDateFilter(filter.value);
          break;
        case 'untagged':
          options.showUntagged = filter.value === 'true';
          break;
        case 'complexity':
        case 'complex':
          if (['simple', 'medium', 'complex'].includes(filter.value)) {
            options.complexityFilter = filter.value as 'simple' | 'medium' | 'complex';
          }
          break;
      }
    });

    return options;
  }

  // Parse date filter values into DateFilter objects
  private parseDateFilter(value: string): DateFilter {
    const normalizedValue = value.toLowerCase().replace(/\s+/g, '_');
    
    switch (normalizedValue) {
      case 'today':
        return { type: 'today' };
      case 'this_week':
      case 'thisweek':
        return { type: 'this_week' };
      case 'this_month':
      case 'thismonth':
        return { type: 'this_month' };
      case 'last_week':
      case 'lastweek':
        return { type: 'last_week' };
      case 'last_month':
      case 'lastmonth':
        return { type: 'last_month' };
      case 'last_year':
      case 'lastyear':
        return { type: 'last_year' };
      case 'recent':
      case 'recently':
      case 'recently_edited':
      case 'recently_modified':
      case 'recent_changes':
        return { type: 'recent' };
      default:
        return { type: 'today' }; // fallback
    }
  }

  // Filter snippets by date range
  private filterByDate(snippets: SearchableSnippet[], dateFilter: DateFilter): SearchableSnippet[] {
    // Use browser's local timezone, not Docker container's UTC time
    const now = new Date();
    const localOffset = now.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
    const localNow = new Date(now.getTime() - localOffset);
    
    let startDate: Date;
    let endDate: Date = now; // Keep as full timestamp for upper bound

    switch (dateFilter.type) {
      case 'today':
        // Start of today in user's local timezone
        startDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
        // Convert back to UTC for comparison with snippet timestamps
        startDate = new Date(startDate.getTime() + localOffset);
        
        console.log('Today date range calculation (Hawaii time):', {
          now: now.toISOString(),
          localNow: localNow.toISOString(),
          localTime: localNow.toLocaleString('en-US', { timeZone: 'Pacific/Honolulu' }),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        break;
      case 'this_week':
        const dayOfWeek = localNow.getDay();
        startDate = new Date(localNow);
        startDate.setDate(localNow.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        // Convert back to UTC for comparison
        startDate = new Date(startDate.getTime() + localOffset);
        break;
      case 'this_month':
        startDate = new Date(localNow.getFullYear(), localNow.getMonth(), 1);
        // Convert back to UTC for comparison
        startDate = new Date(startDate.getTime() + localOffset);
        break;
      case 'last_week':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        startDate = lastWeekStart;
        endDate = new Date(lastWeekStart);
        endDate.setDate(lastWeekStart.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'recent':
        // Recent = last 3 days (more immediate than "this week")
        startDate = new Date(localNow);
        startDate.setDate(localNow.getDate() - 3);
        startDate.setHours(0, 0, 0, 0);
        // Convert back to UTC for comparison
        startDate = new Date(startDate.getTime() + localOffset);
        break;
      case 'custom':
        if (dateFilter.customRange) {
          startDate = dateFilter.customRange.start;
          endDate = dateFilter.customRange.end;
        } else {
          return snippets; // No custom range provided
        }
        break;
      default:
        return snippets; // Unknown filter type
    }

    return snippets.filter(snippet => {
      const snippetDate = new Date(snippet.updated_at);
      const isInRange = snippetDate >= startDate && snippetDate <= endDate;
      
      // Debug logging for date searches
      if (dateFilter.type === 'today' || dateFilter.type === 'recent') {
        console.log(`${dateFilter.type} filter debug:`, {
          snippet: snippet.title,
          snippetDate: snippetDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          now: new Date().toISOString(),
          isInRange
        });
      }
      
      return isInRange;
    });
  }

  // Process search results and add highlighting
  private processResults(results: any[]): FuzzySearchResult[] {
    return results.map((result: any) => ({
      item: result.item,
      score: result.score || 0,
      matches: result.matches,
      highlights: this.generateHighlights(result)
    }));
  }

  // Generate highlighted text for search matches
  private generateHighlights(result: any): FuzzySearchResult['highlights'] {
    const highlights: FuzzySearchResult['highlights'] = {};

    if (!result.matches) return highlights;

    result.matches.forEach((match: any) => {
      const { key, value, indices } = match;
      
      if (!value || !key) return;

      switch (key) {
        case 'title':
          highlights.title = this.highlightText(value, indices);
          break;
        case 'description':
          highlights.description = this.highlightText(value, indices);
          break;
        case 'searchableContent':
          highlights.content = this.highlightText(
            value.substring(0, 200) + (value.length > 200 ? '...' : ''),
            indices
          );
          break;
        case 'categories':
          if (Array.isArray(result.item.categories)) {
            highlights.categories = result.item.categories.map((cat: any) =>
              this.highlightText(cat, indices)
            );
          }
          break;
      }
    });

    return highlights;
  }

  // Apply highlighting markup to matched text
  private highlightText(text: string, indices: any[]): string {
    if (!indices.length) return text;

    let highlighted = '';
    let lastIndex = 0;

    indices.forEach(([start, end]: [number, number]) => {
      highlighted += text.slice(lastIndex, start);
      highlighted += `<mark class="search-highlight">${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });

    highlighted += text.slice(lastIndex);
    return highlighted;
  }

  // Get search suggestions based on current snippets
  getSearchSuggestions(partialQuery: string, limit: number = 5): string[] {
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();

    // Get suggestions from titles
    this.snippets.forEach(snippet => {
      if (snippet.title.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(snippet.title);
      }

      // Add category suggestions
      snippet.categories.forEach(category => {
        if (category.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(`category:${category}`);
        }
      });

      // Add language suggestions
      snippet.fragments.forEach(fragment => {
        if (fragment.language.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(`lang:${fragment.language}`);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// Export singleton instance
export const fuzzySearchEngine = new FuzzySearchEngine();

// Utility functions for common search patterns
export const searchUtils = {
  // Search for snippets by language
  searchByLanguage: (snippets: Snippet[], language: string): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search(`lang:${language}`, { languageFilter: language });
  },

  // Search for snippets by category
  searchByCategory: (snippets: Snippet[], category: string): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search(`category:${category}`, { categoryFilter: [category] });
  },



  // Find similar snippets based on content
  findSimilar: (snippets: Snippet[], targetSnippet: Snippet, limit: number = 5): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets.filter(s => s.id !== targetSnippet.id));
    
    // Use snippet's categories and languages as search terms
    const searchTerms = [
      ...targetSnippet.categories,
      ...targetSnippet.fragments.map(f => f.language)
    ].join(' ');

    return fuzzySearchEngine.search(searchTerms, { limit });
  },

  // Search for snippets created/updated today
  searchToday: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'today' } });
  },

  // Search for snippets from this week
  searchThisWeek: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'this_week' } });
  },

  // Search for snippets from this month
  searchThisMonth: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'this_month' } });
  },

  // Search for snippets from last month
  searchLastMonth: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'last_month' } });
  },

  // Search for snippets from last year
  searchLastYear: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'last_year' } });
  },

  // Search for snippets with no tags/categories
  searchUntagged: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { showUntagged: true });
  },

  // Search for recently modified snippets (last 3 days)
  searchRecent: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { dateFilter: { type: 'recent' } });
  },

  // Search for simple snippets
  searchSimple: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { complexityFilter: 'simple' });
  },

  // Search for medium complexity snippets
  searchMedium: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { complexityFilter: 'medium' });
  },

  // Search for complex snippets
  searchComplex: (snippets: Snippet[]): FuzzySearchResult[] => {
    fuzzySearchEngine.updateIndex(snippets);
    return fuzzySearchEngine.search('', { complexityFilter: 'complex' });
  }
}; 