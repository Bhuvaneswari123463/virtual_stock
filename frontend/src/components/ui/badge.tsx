import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'profit' | 'loss' | 'accent' | 'warning' | 'outline' | 'subtle';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  }[size];

  const variantStyles = {
    default: 'bg-bg-elevated text-text-secondary border-border-subtle',
    profit: 'bg-trade-profit-subtle text-trade-profit border-trade-profit/30 font-semibold',
    loss: 'bg-trade-loss-subtle text-trade-loss border-trade-loss/30 font-semibold',
    accent: 'bg-accent-primary-subtle text-accent-primary border-accent-primary/30 font-semibold',
    warning: 'bg-warning-subtle text-warning border-warning/30 font-semibold',
    outline: 'border-border-subtle text-text-secondary bg-transparent',
    subtle: 'bg-bg-hover text-text-primary border-transparent',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded border font-medium transition-colors select-none tabular-nums',
        sizeStyles,
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
