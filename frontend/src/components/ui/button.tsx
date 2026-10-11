import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'buy' | 'sell' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-45 select-none rounded-md active:scale-[0.98]';

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
    }[size];

    const variantStyles = {
      primary:
        'bg-accent-primary hover:bg-accent-primary-hover text-text-inverse font-semibold shadow-sm hover:shadow-glow',
      secondary:
        'bg-bg-elevated hover:bg-bg-hover text-text-primary border border-border-subtle shadow-sm',
      accent:
        'bg-accent-secondary hover:bg-accent-secondary-hover text-white font-semibold shadow-sm',
      buy:
        'bg-trade-profit hover:brightness-110 text-text-inverse font-semibold shadow-sm',
      sell:
        'bg-trade-loss hover:brightness-110 text-white font-semibold shadow-sm',
      outline:
        'border border-border-subtle hover:bg-bg-hover hover:border-border-medium text-text-primary',
      ghost:
        'hover:bg-bg-hover text-text-secondary hover:text-text-primary',
      danger:
        'bg-trade-loss hover:brightness-110 text-white font-semibold',
    }[variant];

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
