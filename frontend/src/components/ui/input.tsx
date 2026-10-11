import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-md border bg-bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1 focus:ring-border-focus focus:border-border-focus disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error ? 'border-trade-loss focus:ring-trade-loss' : 'border-border-subtle hover:border-border-medium',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-[11px] text-trade-loss font-medium">{error}</span>}
        {!error && helperText && <span className="text-[11px] text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
