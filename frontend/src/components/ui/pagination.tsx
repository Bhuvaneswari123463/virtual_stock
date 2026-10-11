import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary', className)}>
      {totalItems !== undefined && pageSize !== undefined && (
        <div>
          Showing{' '}
          <span className="font-semibold text-text-primary font-mono tabular-nums">
            {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-text-primary font-mono tabular-nums">
            {Math.min(currentPage * pageSize, totalItems)}
          </span>{' '}
          of <span className="font-semibold text-text-primary font-mono tabular-nums">{totalItems}</span> entries
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        <span className="px-2 font-mono text-xs text-text-primary">
          Page <span className="font-semibold">{currentPage}</span> of{' '}
          <span className="font-semibold">{Math.max(totalPages, 1)}</span>
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
