import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, checked, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none text-xs text-text-primary',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="relative flex items-center justify-center">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-4 w-4 rounded border border-border-medium bg-bg-surface transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-accent-secondary peer-checked:bg-accent-primary peer-checked:border-accent-primary peer-checked:text-text-inverse flex items-center justify-center',
              className
            )}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" />}
          </div>
        </div>
        {label && <span className="leading-tight">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
