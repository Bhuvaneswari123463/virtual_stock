import React from 'react';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline' | 'accent';
  'aria-label': string; // Enforce accessible label
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', variant = 'ghost', 'aria-label': ariaLabel, children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-7 w-7 text-xs',
      md: 'h-9 w-9 text-sm',
      lg: 'h-10 w-10 text-base',
    }[size];

    const variantStyles = {
      default: 'bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border-subtle',
      ghost: 'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
      outline: 'border border-border-subtle hover:bg-bg-hover text-text-primary',
      accent: 'bg-accent-primary-subtle text-accent-primary hover:bg-accent-primary/20',
    }[variant];

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-40',
          sizeStyles,
          variantStyles,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
