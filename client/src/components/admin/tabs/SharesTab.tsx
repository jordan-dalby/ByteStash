import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { Trash2, Copy, ExternalLink, Lock, Unlock } from 'lucide-react';
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
      addToast('Share deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'shares'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteShareId(null);
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete share', 'error');
    },
  });

  const shares = data?.shares || [];
  const total = data?.total || 0;

  const copyShareLink = (shareId: string) => {
    const shareUrl = `${window.location.origin}${window.__BASE_PATH__ || ''}/share/${shareId}`;
    navigator.clipboard.writeText(shareUrl);
    addToast('Share link copied to clipboard', 'success');
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'id',
      label: 'Share ID',
      render: (share) => (
        <span className="whitespace-nowrap font-mono text-light-text dark:text-dark-text">
          {share.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Snippet Title',
      render: (share) => (
        <span className="text-light-text dark:text-dark-text max-w-xs truncate">
          {share.snippet_title || 'Untitled'}
        </span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (share) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {share.username || `User #${share.user_id}`}
        </span>
      ),
    },
    {
      key: 'auth',
      label: 'Auth Required',
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
      label: 'Expires At',
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
      label: 'Created',
      render: (share) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(share.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (share) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => copyShareLink(share.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-light-text-secondary dark:text-dark-text-secondary"
            title="Copy share link"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`${ROUTES.SNIPPETS}/${share.snippet_id}`)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-light-text-secondary dark:text-dark-text-secondary"
            title="View snippet"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteShareId(share.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-red-600 dark:text-red-400"
            title="Delete share"
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
        <FilterSelect
          value={requiresAuth}
          onChange={(value) => {
            setRequiresAuth(value);
            setOffset(0);
          }}
          options={[
            { value: 'true', label: 'Requires Auth' },
            { value: 'false', label: 'Public' },
          ]}
          placeholder="All Auth Types"
        />
      </div>

      <ResultsCount offset={offset} limit={limit} total={total} entityName="shares" />

      <AdminTable
        columns={columns}
        data={shares}
        isLoading={isLoading}
        emptyMessage="No shares found"
        loadingMessage="Loading shares..."
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
        title="Delete Share"
        message="Are you sure you want to delete this share link? Anyone with the link will no longer be able to access the snippet. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
