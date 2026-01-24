import React from 'react';
import { Navigate, Link, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { UsersTab } from './tabs/UsersTab';
import { SnippetsTab } from './tabs/SnippetsTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { SharesTab } from './tabs/SharesTab';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.is_admin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  const tabs: { path: string; label: string }[] = [
    { path: ROUTES.ADMIN_USERS, label: 'Users' },
    { path: ROUTES.ADMIN_SNIPPETS, label: 'Snippets' },
    { path: ROUTES.ADMIN_API_KEYS, label: 'API Keys' },
    { path: ROUTES.ADMIN_SHARES, label: 'Shares' },
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
              <Link
                key={tab.path}
                to={tab.path}
                className={`
                  pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    location.pathname === tab.path
                      ? 'border-light-primary dark:border-dark-primary text-light-primary dark:text-dark-primary'
                      : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text hover:border-light-border dark:hover:border-dark-border'
                  }
                `}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          <Routes>
            <Route index element={<Navigate to={ROUTES.ADMIN_USERS} replace />} />
            <Route path="users" element={<UsersTab />} />
            <Route path="snippets" element={<SnippetsTab />} />
            <Route path="api-keys" element={<ApiKeysTab />} />
            <Route path="shares" element={<SharesTab />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
