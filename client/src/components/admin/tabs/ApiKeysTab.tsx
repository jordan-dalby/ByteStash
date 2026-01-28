import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import {
  FilterInput,
  AdminTable,
  Pagination,
  ResultsCount,
  StatusBadge,
  formatDate,
  type TableColumn,
} from '../common';

export const ApiKeysTab: React.FC = () => {
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/admin/tabs/apiKeys');
  const [userId, setUserId] = useState('');
  const [offset, setOffset] = useState(0);
  const [deleteKeyId, setDeleteKeyId] = useState<number | null>(null);
  const limit = 50;

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'api-keys', offset, userId],
    queryFn: () =>
      adminApi.getApiKeys({
        offset,
        limit,
        userId,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteApiKey(id),
    onSuccess: () => {
      addToast(translate('apiKeyDeletedSuccessfully'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteKeyId(null);
    },
    onError: (error: any) => {
      addToast(error.message || translate('error.default'), 'error');
    },
  });

  const apiKeys = data?.apiKeys || [];
  const total = data?.total || 0;

  const columns: TableColumn<any>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (key) => (
        <span className="whitespace-nowrap text-light-text dark:text-dark-text">
          {key.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: translate('columns.labels.name'),
      render: (key) => (
        <span className="text-light-text dark:text-dark-text">{key.name}</span>
      ),
    },
    {
      key: 'owner',
      label: translate('columns.labels.owner'),
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {key.username || `User #${key.user_id}`}
        </span>
      ),
    },
    {
      key: 'created',
      label: translate('columns.labels.created'),
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(key.created_at)}
        </span>
      ),
    },
    {
      key: 'last_used',
      label: translate('columns.labels.lastUsed'),
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(key.last_used_at)}
        </span>
      ),
    },
    {
      key: 'status',
      label: translate('columns.labels.status'),
      render: (key) => (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={key.is_active ? translate('status.active') : translate('status.inactive')}
            variant={key.is_active ? 'success' : 'neutral'}
          />
        </span>
      ),
    },
    {
      key: 'actions',
      label: translate('columns.labels.actions'),
      render: (key) => (
        <div className="whitespace-nowrap">
          <button
            onClick={() => setDeleteKeyId(key.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-red-600 dark:text-red-400"
            title="Delete API key"
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
      </div>

      <ResultsCount offset={offset} limit={limit} total={total} entityName={translate('entityName', { count: total })} />

      <AdminTable
        columns={columns}
        data={apiKeys}
        isLoading={isLoading}
        emptyMessage={translate('table.emptyMessage')}
        loadingMessage={translate('table.loadingMessage')}
        getRowKey={(key) => key.id}
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
        isOpen={deleteKeyId !== null}
        onClose={() => setDeleteKeyId(null)}
        onConfirm={() => deleteKeyId && deleteMutation.mutate(deleteKeyId)}
        title={translate('confirmationModal.title')}
        message={translate('confirmationModal.message')}
        confirmLabel={t('action.delete')}
        cancelLabel={t('action.cancel')}
        variant="danger"
      />
    </div>
  );
};
