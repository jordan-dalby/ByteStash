import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface AdminTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  getRowKey: (item: T) => string | number;
}

export function AdminTable<T>({
  columns,
  data,
  isLoading,
  getRowKey,
  ...props
}: AdminTableProps<T>) {
  const { t: translate } = useTranslation('components/admin/common');

  const emptyMessage = props.emptyMessage || translate('adminTable.defaultEmptyMessage');
  const loadingMessage = props.loadingMessage || translate('adminTable.defaultLoadingMessage');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
        <Loader2 className="w-8 h-8 text-light-primary dark:text-dark-primary animate-spin mb-3" />
        <div className="text-light-text-secondary dark:text-dark-text-secondary">
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
        <div className="text-light-text-secondary dark:text-dark-text-secondary text-base">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border shadow-sm">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
          <thead className="bg-light-surface dark:bg-dark-surface sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider ${
                    column.width || ''
                  } ${column.className || ''}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-light-bg dark:bg-dark-bg divide-y divide-light-border dark:divide-dark-border">
            {data.map((item, index) => (
              <tr
                key={getRowKey(item)}
                className={`
                  transition-colors duration-150
                  hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary
                  ${index % 2 === 0 ? 'bg-light-bg dark:bg-dark-bg' : 'bg-light-surface/50 dark:bg-dark-surface/50'}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm ${column.className || ''}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
