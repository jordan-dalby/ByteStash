import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Key, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../utils/api/admin';

export const DashboardTab: React.FC = () => {
  const { t: translate } = useTranslation('components/admin/tabs/dashboard');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-light-text-secondary dark:text-dark-text-secondary">
          {translate('loadingMessage')}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: translate('card.users.title'),
      icon: Users,
      total: stats?.users.total || 0,
      details: [
        { label: translate('card.users.authType.internal'), value: stats?.users.internal || 0 },
        { label: translate('card.users.authType.oidc'), value: stats?.users.oidc || 0 },
      ],
    },
    {
      title: translate('card.snippets.title'),
      icon: FileText,
      total: stats?.snippets.total || 0,
      details: [
        { label: translate('card.snippets.viewType.public'), value: stats?.snippets.public || 0 },
        { label: translate('card.snippets.viewType.private'), value: stats?.snippets.private || 0 },
      ],
    },
    {
      title: translate('card.apiKeys.title'),
      icon: Key,
      total: stats?.apiKeys.active || 0,
      details: [{ label: translate('card.snippets.apiKeys.active'), value: stats?.apiKeys.active || 0 }],
    },
    {
      title: translate('card.shares.title'),
      icon: Share2,
      total: stats?.shares.total || 0,
      details: [{ label: translate('card.snippets.shares.total'), value: stats?.shares.total || 0 }],
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  {card.title}
                </h3>
                <Icon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              </div>
              <div className="text-3xl font-bold text-light-text dark:text-dark-text mb-4">
                {card.total}
              </div>
              <div className="space-y-1">
                {card.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex justify-between text-sm text-light-text-secondary dark:text-dark-text-secondary"
                  >
                    <span>{detail.label}:</span>
                    <span className="font-medium">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
