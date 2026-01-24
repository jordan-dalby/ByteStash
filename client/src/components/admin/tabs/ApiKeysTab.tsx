import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { Trash2 } from 'lucide-react';
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
      addToast('API key deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteKeyId(null);
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete API key', 'error');
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
      label: 'Name',
      render: (key) => (
        <span className="text-light-text dark:text-dark-text">{key.name}</span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {key.username || `User #${key.user_id}`}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(key.created_at)}
        </span>
      ),
    },
    {
      key: 'last_used',
      label: 'Last Used',
      render: (key) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(key.last_used_at)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (key) => (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={key.is_active ? 'Active' : 'Inactive'}
            variant={key.is_active ? 'success' : 'neutral'}
          />
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
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
          placeholder="Filter by User ID"
          className="w-64"
        />
      </div>

      <ResultsCount offset={offset} limit={limit} total={total} entityName="API keys" />

      <AdminTable
        columns={columns}
        data={apiKeys}
        isLoading={isLoading}
        emptyMessage="No API keys found"
        loadingMessage="Loading API keys..."
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
        title="Delete API Key"
        message="Are you sure you want to delete this API key? The key owner will no longer be able to use it to access the API. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
