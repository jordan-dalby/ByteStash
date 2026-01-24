import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api/admin';
import { Users, FileText, Key, Share2 } from 'lucide-react';

export const DashboardTab: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-light-text-secondary dark:text-dark-text-secondary">
          Loading statistics...
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Users',
      icon: Users,
      total: stats?.users.total || 0,
      details: [
        { label: 'Internal', value: stats?.users.internal || 0 },
        { label: 'OIDC', value: stats?.users.oidc || 0 },
      ],
    },
    {
      title: 'Snippets',
      icon: FileText,
      total: stats?.snippets.total || 0,
      details: [
        { label: 'Public', value: stats?.snippets.public || 0 },
        { label: 'Private', value: stats?.snippets.private || 0 },
      ],
    },
    {
      title: 'API Keys',
      icon: Key,
      total: stats?.apiKeys.active || 0,
      details: [{ label: 'Active', value: stats?.apiKeys.active || 0 }],
    },
    {
      title: 'Shares',
      icon: Share2,
      total: stats?.shares.total || 0,
      details: [{ label: 'Total', value: stats?.shares.total || 0 }],
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
