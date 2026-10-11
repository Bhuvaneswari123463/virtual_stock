import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-text-secondary select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-md border bg-bg-surface px-3 py-2 pr-8 text-xs text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-border-focus focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
              error ? 'border-trade-loss' : 'border-border-subtle hover:border-border-medium',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 flex items-center text-text-muted">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && <span className="text-[11px] text-trade-loss font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
