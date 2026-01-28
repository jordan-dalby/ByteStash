import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Globe, Lock, AlertTriangle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../utils/api/admin';
import { useToast } from '../../../hooks/useToast';
import { ConfirmationModal } from '../../common/modals/ConfirmationModal';
import { useDebounce } from '../../../hooks/useDebounce';
import { IconButton } from '../../common/buttons/IconButton';
import { SnippetViewModal } from '../modals/SnippetViewModal';
import {
  FilterInput,
  FilterSelect,
  AdminTable,
  Pagination,
  ResultsCount,
  StatusBadge,
  formatDateShort,
  type TableColumn,
} from '../common';

export const SnippetsTab: React.FC = () => {
  const { t } = useTranslation();
  const { t: translate } = useTranslation('components/admin/tabs/snippets');
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [isPublic, setIsPublic] = useState('');
  const [offset, setOffset] = useState(0);
  const [deleteSnippetId, setDeleteSnippetId] = useState<number | null>(null);
  const [viewSnippetId, setViewSnippetId] = useState<number | null>(null);
  const [showOffensiveOnly, setShowOffensiveOnly] = useState(false);
  const limit = 50;

  const debouncedSearch = useDebounce(search, 300);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'snippets', offset, debouncedSearch, userId, isPublic, showOffensiveOnly],
    queryFn: () => {
      if (showOffensiveOnly) {
        return adminApi.scanSnippetsForOffensive();
      }

      return adminApi.getSnippets({
        offset,
        limit,
        search: debouncedSearch,
        userId,
        isPublic,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSnippet(id),
    onSuccess: () => {
      addToast(translate('success.delete.default'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'snippets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setDeleteSnippetId(null);
    },
    onError: (error: any) => {
      addToast(error.message || translate('error.delete.default'), 'error');
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleSnippetPublic(id),
    onSuccess: () => {
      addToast(translate('success.update.default'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'snippets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (error: any) => {
      addToast(error.message || translate('error.update.default'), 'error');
    },
  });

  const snippets = data?.snippets || [];
  const total = data?.total || 0;

  const handleToggleOffensiveScan = () => {
    setShowOffensiveOnly(!showOffensiveOnly);
    setOffset(0);
  };

  const columns: TableColumn<any>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (snippet) => (
        <span className="whitespace-nowrap text-light-text dark:text-dark-text">
          {snippet.id}
        </span>
      ),
    },
    {
      key: 'title',
      label: translate('columns.labels.title'),
      render: (snippet) => (
        <div className="flex items-center gap-2">
          {snippet.flagged_words && snippet.flagged_words.length > 0 && (
            <span
              className="text-red-600 dark:text-red-400"
              title={translate('containsOffensiveWords', { words: snippet.flagged_words.join(', ') })}
            >
              <AlertTriangle className="w-4 h-4" />
            </span>
          )}
          <button
            onClick={() => setViewSnippetId(snippet.id)}
            className="text-light-text dark:text-dark-text hover:text-light-primary dark:hover:text-dark-primary hover:underline text-left max-w-xs truncate"
          >
            {snippet.title}
          </button>
        </div>
      ),
    },
    {
      key: 'owner',
      label: translate('columns.labels.owner'),
      render: (snippet) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {snippet.username || `User #${snippet.user_id}`}
        </span>
      ),
    },
    {
      key: 'visibility',
      label: translate('columns.labels.visibility'),
      render: (snippet) => (
        <span className="whitespace-nowrap">
          <StatusBadge
            label={snippet.is_public ? translate('filters.visibility.public') : translate('filters.visibility.private')}
            variant={snippet.is_public ? 'success' : 'neutral'}
            icon={snippet.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          />
        </span>
      ),
    },
    {
      key: 'fragments',
      label: translate('columns.labels.fragments'),
      render: (snippet) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {snippet.fragment_count}
        </span>
      ),
    },
    {
      key: 'updated',
      label: translate('columns.labels.updated'),
      render: (snippet) => (
        <span className="whitespace-nowrap text-light-text-secondary dark:text-dark-text-secondary">
          {formatDateShort(snippet.updated_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: translate('columns.labels.actions'),
      render: (snippet) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={() => setViewSnippetId(snippet.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded"
            title={translate('action.viewSnippet')}
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            onClick={() => togglePublicMutation.mutate(snippet.id)}
            className="p-1 hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary rounded"
            title={snippet.is_public ? translate('action.makePrivate') : translate('action.makePublic')}
          >
            {snippet.is_public ? (
              <Lock className="w-4 h-4 text-gray-600" />
            ) : (
              <Globe className="w-4 h-4 text-green-600" />
            )}
          </button>
          <button
            onClick={() => setDeleteSnippetId(snippet.id)}
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
      {/* Offensive Content Alert */}
      {showOffensiveOnly && total > 0 && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
          <AlertTriangle className="w-5 h-5" />
          <span>
            {
              translate(
                'offensiveContentMessage',
                {
                  total,
                  entityName: translate('entityName', { count: total })
                }
              )
            }
          </span>
        </div>
      )}

      {/* Filters with Offensive Scan Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {!showOffensiveOnly && (
          <>
            <FilterInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setOffset(0);
              }}
              placeholder={translate('filters.search')}
              className="flex-1"
              showSearchIcon
            />
            <FilterInput
              value={userId}
              onChange={(value) => {
                setUserId(value);
                setOffset(0);
              }}
              placeholder={translate('filters.userId')}
              className="w-32"
            />
            <FilterSelect
              value={isPublic}
              onChange={(value) => {
                setIsPublic(value);
                setOffset(0);
              }}
              options={[
                { value: 'true', label: translate('filters.visibility.public') },
                { value: 'false', label: translate('filters.visibility.private') },
              ]}
              placeholder={translate('filters.visibility.all')}
            />
          </>
        )}
        <IconButton
          icon={<AlertTriangle className="w-4 h-4" />}
          onClick={handleToggleOffensiveScan}
          label={showOffensiveOnly ? translate('action.showAllSnippets') : translate('action.scanForOffensiveContent')}
          variant={showOffensiveOnly ? 'danger' : 'secondary'}
          showLabel
          size="md"
          className="px-4 whitespace-nowrap"
        />
      </div>

      {!showOffensiveOnly && (
        <ResultsCount offset={offset} limit={limit} total={total} entityName={translate('entityName', { count: total })} />
      )}

      <AdminTable
        columns={columns}
        data={snippets}
        isLoading={isLoading}
        emptyMessage={translate('table.emptyMessage')}
        loadingMessage={translate('table.loadingMessage')}
        getRowKey={(snippet) => snippet.id}
      />

      {!showOffensiveOnly && (
        <Pagination
          offset={offset}
          limit={limit}
          total={total}
          onPrevious={() => setOffset(Math.max(0, offset - limit))}
          onNext={() => setOffset(offset + limit)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteSnippetId !== null}
        onClose={() => setDeleteSnippetId(null)}
        onConfirm={() => deleteSnippetId && deleteMutation.mutate(deleteSnippetId)}
        title={translate('confirmationModal.title')}
        message={translate('confirmationModal.message')}
        confirmLabel={t('action.delete')}
        cancelLabel={t('action.cancel')}
        variant="danger"
      />

      {/* Snippet View Modal */}
      <SnippetViewModal
        snippetId={viewSnippetId}
        onClose={() => setViewSnippetId(null)}
      />
    </div>
  );
};
