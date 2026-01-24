import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { UsersTab } from './tabs/UsersTab';
import { SnippetsTab } from './tabs/SnippetsTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { SharesTab } from './tabs/SharesTab';

type TabType = 'users' | 'snippets' | 'api-keys' | 'shares';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  if (!user?.is_admin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'snippets', label: 'Snippets' },
    { id: 'api-keys', label: 'API Keys' },
    { id: 'shares', label: 'Shares' },
  ];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="h-full px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">
            Admin Panel
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Manage users, snippets, API keys, and shares
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-light-border dark:border-dark-border mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary'
                      : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text hover:border-light-border dark:hover:border-dark-border'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'snippets' && <SnippetsTab />}
          {activeTab === 'api-keys' && <ApiKeysTab />}
          {activeTab === 'shares' && <SharesTab />}
        </div>
      </div>
    </div>
  );
};
