import React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-lg border border-border-subtle bg-bg-surface">
      <table ref={ref} className={cn('w-full caption-bottom text-xs', className)} {...props} />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('border-b border-border-subtle bg-bg-elevated/70', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-border-subtle/50 font-normal', className)} {...props} />
  )
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('transition-colors hover:bg-bg-hover/60 data-[state=selected]:bg-bg-hover', className)}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, align = 'left', ...props }, ref) => {
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align];

    return (
      <th
        ref={ref}
        className={cn(
          'h-9 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary select-none',
          alignClass,
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = 'left', numeric = false, ...props }, ref) => {
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    }[align];

    return (
      <td
        ref={ref}
        className={cn(
          'p-3 align-middle text-text-primary',
          numeric && 'font-mono tabular-nums',
          alignClass,
          className
        )}
        {...props}
      />
    );
  }
);
TableCell.displayName = 'TableCell';
