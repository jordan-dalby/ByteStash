import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Copy, ExternalLink, Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import {
  FilterInput,
  FilterSelect,
  AdminTable,
  Pagination,
  ResultsCount,
  StatusBadge,
  formatDate,
  isExpired,
  type TableColumn,
} from '../common';

export const SharesTab: React.FC = () => {
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/admin/tabs/shares');
  const [userId, setUserId] = useState('');
  const [requiresAuth, setRequiresAuth] = useState('');
  const [offset, setOffset] = useState(0);
  const [deleteShareId, setDeleteShareId] = useState<string | null>(null);
  const limit = 50;

  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shares', offset, userId, requiresAuth],
    queryFn: () =>
      adminApi.getShares({
        offset,
        limit,
        userId,
        requiresAuth,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteShare(id),
    onSuccess: () => {
      addToast(translate('success.delete.default'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteShareId(null);
    },
    onError: (error: any) => {
      addToast(error.message || translate('error.delete.default'), 'error');
    },
  });

  const shares = data?.shares || [];
  const total = data?.total || 0;

  const copyShareLink = (shareId: string) => {
    const shareUrl = `${window.location.origin}${window.__BASE_PATH__ || ''}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    addToast(translate('success.copied.default'), 'success');
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'id',
      label: translate('columns.labels.id'),
      render: (share) => (
        <span className="whitespace-nowrap font-mono text-light-text dark:text-dark-text">
          {share.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: 'title',
      label: translate('columns.labels.title'),
      render: (share) => (
        <span className="text-light-text dark:text-dark-text max-w-xs truncate">
          {share.snippet_title || 'Untitled'}
        </span>
      ),
    },
    {
      key: 'owner',
      label: translate('columns.labels.owner'),
      render: (share) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {share.username || `User #${share.user_id}`}
        </span>
      ),
    },
    {
      key: 'auth',
      label: translate('columns.labels.auth'),
      render: (share) => (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={share.requires_auth ? 'Yes' : 'No'}
            variant={share.requires_auth ? 'warning' : 'success'}
            icon={share.requires_auth ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          />
        </span>
      ),
    },
    {
      key: 'expires',
      label: translate('columns.labels.expires'),
      render: (share) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {share.expires_at ? (
            <span className={isExpired(share.expires_at) ? 'text-red-600 dark:text-red-400' : ''}>
              {formatDate(share.expires_at)}
              {isExpired(share.expires_at) && ' (Expired)'}
            </span>
          ) : (
            'Never'
          )}
        </span>
      ),
    },
    {
      key: 'created',
      label: translate('columns.labels.created'),
      render: (share) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(share.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: translate('columns.labels.actions'),
      render: (share) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => copyShareLink(share.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-light-text-secondary dark:text-dark-text-secondary"
            title={translate('action.copyShareLink')}
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`${ROUTES.SNIPPETS}/${share.snippet_id}`)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-light-text-secondary dark:text-dark-text-secondary"
            title={translate('action.viewSnippet')}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteShareId(share.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-red-600 dark:text-red-400"
            title={translate('action.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FilterInput
          value={userId}
          onChange={(value) => {
            setUserId(value);
            setOffset(0);
          }}
          placeholder={translate('filters.userId')}
          className="w-64"
        />
        <FilterSelect
          value={requiresAuth}
          onChange={(value) => {
            setRequiresAuth(value);
            setOffset(0);
          }}
          options={[
            { value: 'true', label: translate('filters.authType.requiresAuth') },
            { value: 'false', label: translate('filters.authType.public') },
          ]}
          placeholder={translate('filters.authType.all')}
        />
      </div>

      <ResultsCount offset={offset} limit={limit} total={total} entityName={translate('entityName', { count: total })} />

      <AdminTable
        columns={columns}
        data={shares}
        isLoading={isLoading}
        emptyMessage={translate('table.emptyMessage')}
        loadingMessage={translate('table.loadingMessage')}
        getRowKey={(share) => share.id}
      />

      <Pagination
        offset={offset}
        limit={limit}
        total={total}
        onPrevious={() => setOffset(Math.max(0, offset - limit))}
        onNext={() => setOffset(offset + limit)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteShareId !== null}
        onClose={() => setDeleteShareId(null)}
        onConfirm={() => deleteShareId && deleteMutation.mutate(deleteShareId)}
        title={translate('confirmationModal.title')}
        message={translate('confirmationModal.message')}
        confirmLabel={t('action.delete')}
        cancelLabel={t('action.cancel')}
        variant="danger"
      />
    </div>
  );
};
