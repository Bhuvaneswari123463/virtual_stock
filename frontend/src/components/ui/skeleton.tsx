import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-bg-elevated/70 border border-border-subtle/30',
        variantStyles,
        className
      )}
      {...props}
    />
  );
};
