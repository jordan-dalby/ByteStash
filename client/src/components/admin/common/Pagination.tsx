import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  offset: number;
  limit: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  offset,
  limit,
  total,
  onPrevious,
  onNext,
}) => {
  const hasMore = offset + limit < total;
  const hasPrevious = offset > 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-light-surface dark:bg-dark-surface px-6 py-4 rounded-lg border border-light-border dark:border-dark-border">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        className="inline-flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors font-medium text-sm shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-light-text dark:text-dark-text">
          Page {currentPage} of {totalPages}
        </span>
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
          ({total} total)
        </span>
      </div>
      <button
        onClick={onNext}
        disabled={!hasMore}
        className="inline-flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors font-medium text-sm shadow-sm"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
