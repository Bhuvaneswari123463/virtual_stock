import React from 'react';
import { cn } from '@/lib/utils';

export interface TimeframeSelectorProps {
  timeframes?: string[];
  active: string;
  onChange: (timeframe: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

const DEFAULT_TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframes = DEFAULT_TIMEFRAMES,
  active,
  onChange,
  size = 'sm',
  className,
}) => {
  return (
    <div
      role="group"
      aria-label="Select timeframe"
      className={cn(
        'inline-flex items-center rounded-md bg-bg-surface p-0.5 border border-border-subtle',
        className
      )}
    >
      {timeframes.map((tf) => {
        const isActive = active === tf;

        const sizeStyles = {
          sm: 'px-2 py-0.5 text-[11px]',
          md: 'px-2.5 py-1 text-xs',
        }[size];

        return (
          <button
            key={tf}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tf)}
            className={cn(
              'rounded font-mono font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-secondary',
              sizeStyles,
              isActive
                ? 'bg-bg-elevated text-accent-primary font-semibold shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            {tf}
          </button>
        );
      })}
    </div>
  );
};
