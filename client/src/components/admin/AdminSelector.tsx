import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileCode, Key, Share2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

interface AdminSelectorProps {
  selected: 'users' | 'snippets' | 'api-keys' | 'shares';
}

const AdminSelector: React.FC<AdminSelectorProps> = ({ selected }) => {
  const navigate = useNavigate();

  const options = [
    { value: 'users' as const, label: 'Users', icon: Users, route: ROUTES.ADMIN_USERS },
    { value: 'snippets' as const, label: 'Snippets', icon: FileCode, route: ROUTES.ADMIN_SNIPPETS },
    { value: 'api-keys' as const, label: 'API Keys', icon: Key, route: ROUTES.ADMIN_API_KEYS },
    { value: 'shares' as const, label: 'Shares', icon: Share2, route: ROUTES.ADMIN_SHARES },
  ];

  return (
    <div className="flex items-center gap-3 text-sm text-light-text dark:text-dark-text">
      <div
        className="flex gap-0.5 rounded-lg bg-light-surface dark:bg-dark-surface px-0.5 py-0.5 min-w-[400px]"
        role="group"
      >
        {options.map(({ value, label, icon: Icon, route }) => (
          <button
            key={value}
            type="button"
            onClick={() => navigate(route)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-md transition-all duration-200 flex-1
              ${selected === value
                ? 'bg-light-hover dark:bg-dark-hover'
                : 'hover:bg-light-hover/50 dark:hover:bg-dark-hover/50'
              }
            `}
          >
            <Icon
              className={`
                stroke-[2] transition-colors duration-200
                ${selected === value ? 'text-light-primary dark:text-dark-primary' : 'text-light-text/50 dark:text-dark-text/50'}
              `}
              size={14}
            />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminSelector;
