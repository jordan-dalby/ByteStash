import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  FilterInput,
  FilterSelect,
  AdminTable,
  Pagination,
  ResultsCount,
  StatusBadge,
  formatDate,
  type TableColumn,
} from '../common';

export const UsersTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [authType, setAuthType] = useState('');
  const [isActive, setIsActive] = useState('');
  const [offset, setOffset] = useState(0);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const limit = 50;

  const debouncedSearch = useDebounce(search, 300);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', offset, debouncedSearch, authType, isActive],
    queryFn: () =>
      adminApi.getUsers({
        offset,
        limit,
        search: debouncedSearch,
        authType,
        isActive,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      addToast('User deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to delete user', 'error');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserActive(id),
    onSuccess: () => {
      addToast('User status updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error: any) => {
      addToast(error.message || 'Failed to update user status', 'error');
    },
  });

  const users = data?.users || [];
  const total = data?.total || 0;

  const columns: TableColumn<any>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text dark:text-dark-text">
          {user.id}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text dark:text-dark-text">
          {user.username}
          {user.is_admin && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-light-primary dark:bg-dark-primary text-white rounded">
              Admin
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {user.email || '-'}
        </span>
      ),
    },
    {
      key: 'auth_type',
      label: 'Auth Type',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {user.oidc_id ? 'OIDC' : 'Internal'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(user.created_at)}
        </span>
      ),
    },
    {
      key: 'last_login_at',
      label: 'Last Login',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDate(user.last_login_at)}
        </span>
      ),
    },
    {
      key: 'snippet_count',
      label: 'Snippets',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {user.snippet_count}
        </span>
      ),
    },
    {
      key: 'api_key_count',
      label: 'API Keys',
      render: (user) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {user.api_key_count}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={user.is_active ? 'Active' : 'Inactive'}
            variant={user.is_active ? 'success' : 'danger'}
          />
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => toggleActiveMutation.mutate(user.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded"
            title={user.is_active ? 'Deactivate user' : 'Activate user'}
          >
            {user.is_active ? (
              <ToggleRight className="w-4 h-4 text-green-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded text-red-600 dark:text-red-400"
            title="Delete user"
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
          value={search}
          onChange={(value) => {
            setSearch(value);
            setOffset(0);
          }}
          placeholder="Search users..."
          className="flex-1"
          showSearchIcon
        />
        <FilterSelect
          value={authType}
          onChange={(value) => {
            setAuthType(value);
            setOffset(0);
          }}
          options={[
            { value: 'internal', label: 'Internal' },
            { value: 'oidc', label: 'OIDC' },
          ]}
          placeholder="All Auth Types"
        />
        <FilterSelect
          value={isActive}
          onChange={(value) => {
            setIsActive(value);
            setOffset(0);
          }}
          options={[
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
          placeholder="All Status"
        />
      </div>

      <ResultsCount offset={offset} limit={limit} total={total} entityName="users" />

      <AdminTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found"
        loadingMessage="Loading users..."
        getRowKey={(user) => user.id}
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
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
        title="Delete User"
        message="Are you sure you want to delete this user? This will permanently delete all their snippets, API keys, and shares. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
