import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { DashboardTab } from './tabs/DashboardTab';
import { UsersTab } from './tabs/UsersTab';
import { SnippetsTab } from './tabs/SnippetsTab';
import { ApiKeysTab } from './tabs/ApiKeysTab';
import { SharesTab } from './tabs/SharesTab';
import { AppHeader } from '../common/layout/AppHeader';
import { UserDropdown } from '../auth/UserDropdown';
import AdminSelector from './AdminSelector';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.is_admin) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Derive selected tab from URL
  const getSelectedTab = (): 'dashboard' | 'users' | 'snippets' | 'api-keys' | 'shares' => {
    if (location.pathname.includes('/admin/users')) return 'users';
    if (location.pathname.includes('/admin/snippets')) return 'snippets';
    if (location.pathname.includes('/admin/api-keys')) return 'api-keys';
    if (location.pathname.includes('/admin/shares')) return 'shares';
    return 'dashboard';
  };

  return (
    <div className="min-h-screen p-8 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="flex items-start justify-between mb-4">
        <AppHeader>
          <AdminSelector selected={getSelectedTab()} />
        </AppHeader>
        <UserDropdown />
      </div>

      {/* Tab Content */}
      <div>
        <Routes>
          <Route path="dashboard" element={<DashboardTab />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="snippets" element={<SnippetsTab />} />
          <Route path="api-keys" element={<ApiKeysTab />} />
          <Route path="shares" element={<SharesTab />} />
          <Route path="/" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
        </Routes>
      </div>
    </div>
  );
};
