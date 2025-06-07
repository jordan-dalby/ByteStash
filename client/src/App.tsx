import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SnippetsProvider, useSnippetsContext } from './contexts/SnippetsContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { OIDCCallback } from './components/auth/oidc/OIDCCallback';
import { ROUTES } from './constants/routes';
import { PageContainer } from './components/common/layout/PageContainer';
import { ToastProvider } from './contexts/ToastContext';
import SnippetStorage from './components/snippets/view/SnippetStorage';
import SharedSnippetView from './components/snippets/share/SharedSnippetView';
import SnippetPage from './components/snippets/view/SnippetPage';
import PublicSnippetStorage from './components/snippets/view/public/PublicSnippetStorage';
import EmbedView from './components/snippets/embed/EmbedView';
import { CommandPalette } from './components/common/CommandPalette';
import { snippetTemplates, SnippetTemplate } from './utils/snippetTemplates';
import EditSnippetModal from './components/snippets/edit/EditSnippetModal';

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-dark-text dark:text-dark-text text-xl">Loading...</div>
        </div>
      </PageContainer>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <SnippetStorage />;
};

const EmbedViewWrapper: React.FC = () => {
  const { shareId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  
  if (!shareId) {
    return <div>Invalid share ID</div>;
  }

  const theme = searchParams.get('theme') as 'light' | 'dark' | 'system' | null;

  return (
    <EmbedView
      shareId={shareId}
      showTitle={searchParams.get('showTitle') === 'true'}
      showDescription={searchParams.get('showDescription') === 'true'}
      showFileHeaders={searchParams.get('showFileHeaders') !== 'false'}
      showPoweredBy={searchParams.get('showPoweredBy') !== 'false'}
      theme={theme || 'system'}
      fragmentIndex={searchParams.get('fragmentIndex') ? parseInt(searchParams.get('fragmentIndex')!, 10) : undefined}
    />
  );
};

// CommandPalette wrapper with global state and actions
const CommandPaletteWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedSnippet, setSelectedSnippet] = React.useState<any>(null);
  const [createModalSnippet, setCreateModalSnippet] = React.useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const { snippets } = useSnippetsContext();
  const { isAuthenticated } = useAuth();

  // Handle template-based snippet creation
  const handleTemplateCreate = (template: SnippetTemplate) => {
    // Create a mock snippet with template data but without id/updated_at
    const templateSnippet = {
      id: 'template-' + Date.now(), // temporary ID for template
      updated_at: new Date().toISOString(),
      ...template.template
    };
    setCreateModalSnippet(templateSnippet);
    setIsCreateModalOpen(true);
  };

  // Global keyboard shortcut and event listeners
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    const handleOpenCreateSnippet = () => {
      // Open blank snippet creation modal
      setCreateModalSnippet(null);
      setIsCreateModalOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('seanstash:open-create-snippet', handleOpenCreateSnippet);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('seanstash:open-create-snippet', handleOpenCreateSnippet);
    };
  }, []);

  // Enhanced actions with icons and categories including templates
  const actions = [
    {
      id: 'create-snippet',
      label: 'Create New Snippet',
      description: 'Create a blank code snippet',
      category: 'Snippets',
      keywords: ['new', 'create', 'snippet', 'add', 'blank'],
      icon: <span className="text-green-500">📝</span>,
      action: () => {
        // This would trigger the actual snippet creation modal
        window.dispatchEvent(new CustomEvent('seanstash:open-create-snippet'));
        setIsOpen(false);
      }
    },
    // Add template-based creation actions
    ...snippetTemplates.map(template => ({
      id: `create-${template.id}`,
      label: `Create ${template.name}`,
      description: `${template.description} (Template)`,
      category: 'Templates',
      keywords: ['template', 'create', 'new', ...template.category, template.name.toLowerCase()],
      icon: <span className="text-blue-500">{template.icon}</span>,
      action: () => {
        handleTemplateCreate(template);
        setIsOpen(false);
      }
    })),
    {
      id: 'search-snippets',
      label: 'Search Snippets',
      description: 'Find snippets by content or tags',
      category: 'Search',
      keywords: ['search', 'find', 'snippets'],
      icon: <span className="text-blue-500">🔍</span>,
      action: () => {
        // This would focus the main search input
        window.dispatchEvent(new CustomEvent('seanstash:focus-search'));
        setIsOpen(false);
      }
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure application settings',
      category: 'Settings',
      keywords: ['settings', 'preferences', 'configure'],
      icon: <span className="text-gray-500">⚙️</span>,
      action: () => {
        // This would open the settings modal
        window.dispatchEvent(new CustomEvent('seanstash:open-settings'));
        setIsOpen(false);
      }
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      category: 'Settings',
      keywords: ['theme', 'dark', 'light', 'mode'],
      icon: <span className="text-yellow-500">🌓</span>,
      action: () => {
        // This would toggle the theme
        window.dispatchEvent(new CustomEvent('seanstash:toggle-theme'));
        setIsOpen(false);
      }
    },
    {
      id: 'export-snippets',
      label: 'Export All Snippets',
      description: 'Download all snippets as JSON backup',
      category: 'Data',
      keywords: ['export', 'backup', 'download', 'save'],
      icon: <span className="text-indigo-500">💾</span>,
      action: () => {
        // This would trigger export
        window.dispatchEvent(new CustomEvent('seanstash:export-snippets'));
        setIsOpen(false);
      }
    },
    // Date-based search actions
    {
      id: 'search-today',
      label: 'Today\'s Snippets',
      description: 'Find snippets created/updated today',
      category: 'Search',
      keywords: ['today', 'date', 'recent', 'new'],
      icon: <span className="text-green-500">📝</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'today' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-this-week',
      label: 'This Week\'s Snippets',
      description: 'Find snippets from this week',
      category: 'Search',
      keywords: ['this week', 'week', 'recent'],
      icon: <span className="text-blue-500">📅</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'this week' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-this-month',
      label: 'This Month\'s Snippets',
      description: 'Find snippets from this month',
      category: 'Search',
      keywords: ['this month', 'month', 'recent'],
      icon: <span className="text-purple-500">🗓️</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'this month' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-last-month',
      label: 'Last Month\'s Snippets',
      description: 'Find snippets from last month',
      category: 'Search',
      keywords: ['last month', 'month', 'previous'],
      icon: <span className="text-orange-500">📊</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'last month' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-last-year',
      label: 'Last Year\'s Snippets',
      description: 'Find snippets from last year',
      category: 'Search',
      keywords: ['last year', 'year', 'old', 'archive'],
      icon: <span className="text-gray-500">🗂️</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'last year' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-untagged',
      label: 'Untagged Snippets',
      description: 'Find snippets with no categories or tags',
      category: 'Search',
      keywords: ['untagged', 'no tags', 'no categories', 'uncategorized', 'without tags'],
      icon: <span className="text-red-500">🏷️</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'untagged' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-recent',
      label: 'Recently Modified',
      description: 'Find snippets modified in the last 3 days',
      category: 'Search',
      keywords: ['recent', 'recently', 'modified', 'edited', 'recent changes', 'latest'],
      icon: <span className="text-cyan-500">🕐</span>,
      action: () => {
        console.log('App: Dispatching recent search query event');
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'recent' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-simple',
      label: 'Simple Snippets',
      description: 'Find simple and basic code snippets',
      category: 'Search',
      keywords: ['simple', 'basic', 'easy', 'beginner', 'simple snippets'],
      icon: <span className="text-green-500">🟢</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'simple' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-medium',
      label: 'Medium Complexity',
      description: 'Find intermediate complexity snippets',
      category: 'Search',
      keywords: ['medium', 'intermediate', 'moderate', 'medium complexity'],
      icon: <span className="text-yellow-500">🟡</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'medium' }));
        // Don't close palette - let user see results
      }
    },
    {
      id: 'search-complex',
      label: 'Complex Snippets',
      description: 'Find advanced and complex code snippets',
      category: 'Search',
      keywords: ['complex', 'advanced', 'difficult', 'complicated', 'complex snippets'],
      icon: <span className="text-red-500">🔴</span>,
      action: () => {
        window.dispatchEvent(new CustomEvent('seanstash:search-query', { detail: 'complex' }));
        // Don't close palette - let user see results
      }
    }
  ];

  const handleSnippetSelect = (snippet: any) => {
    // Open the snippet modal
    setSelectedSnippet(snippet);
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null; // Don't show command palette if not authenticated
  }

  return (
    <>
      <CommandPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        actions={actions}
        snippets={snippets}
        onSnippetSelect={handleSnippetSelect}
      />
      
      {/* Snippet Modal for command palette selections */}
      {selectedSnippet && (
        <div 
          className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSnippet(null)}
        >
          <div 
            className="bg-light-surface dark:bg-dark-surface rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
                {selectedSnippet.title}
              </h2>
              <button
                onClick={() => setSelectedSnippet(null)}
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text"
              >
                ✕
              </button>
            </div>
            {selectedSnippet.description && (
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                {selectedSnippet.description}
              </p>
            )}
            <div className="space-y-4">
              {selectedSnippet.fragments?.map((fragment: any, index: number) => (
                <div key={index} className="bg-light-background dark:bg-dark-background rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-light-text dark:text-dark-text">
                      {fragment.file_name}
                    </span>
                    <span className="text-xs px-2 py-1 bg-light-primary bg-opacity-20 dark:bg-dark-primary dark:bg-opacity-20 rounded text-light-primary dark:text-dark-primary">
                      {fragment.language}
                    </span>
                  </div>
                  <pre className="text-sm text-light-text dark:text-dark-text overflow-x-auto">
                    <code>{fragment.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Creation Modal (Templates + Blank Snippets) */}
      {isCreateModalOpen && (
        <EditSnippetModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setCreateModalSnippet(null);
            setIsCreateModalOpen(false);
          }}
          onSubmit={async (snippetData) => {
            // Here you would integrate with your actual snippet creation API
            console.log('Creating snippet:', snippetData);
            // Close the modal
            setCreateModalSnippet(null);
            setIsCreateModalOpen(false);
            
            // Dispatch event to refresh snippets if needed
            window.dispatchEvent(new CustomEvent('seanstash:snippet-created', { detail: snippetData }));
          }}
          snippetToEdit={createModalSnippet}
          showLineNumbers={true}
          allCategories={snippets.flatMap(s => s.categories).filter((c, i, arr) => arr.indexOf(c) === i).sort()}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router basename={window.__BASE_PATH__} future={{ v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
          <ToastProvider>
            <AuthProvider>
              <SnippetsProvider>
                <CommandPaletteWrapper />
                <Routes>
                  <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                  <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                  <Route path={ROUTES.AUTH_CALLBACK} element={<OIDCCallback />} />
                  <Route path={ROUTES.SHARED_SNIPPET} element={<SharedSnippetView />} />
                  <Route path={ROUTES.PUBLIC_SNIPPETS} element={<PublicSnippetStorage />} />
                  <Route path={ROUTES.EMBED} element={<EmbedViewWrapper />} />
                  <Route path={ROUTES.SNIPPET} element={<SnippetPage />} />
                  <Route path={ROUTES.HOME} element={<AuthenticatedApp />} />
                </Routes>
              </SnippetsProvider>
            </AuthProvider>
          </ToastProvider>
        </div>
      </ThemeProvider>
    </Router>
  );
};

export default App;
