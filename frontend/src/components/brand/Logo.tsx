import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className }) => {
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }[size];

  const titleSizes = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-xl font-extrabold',
  }[size];

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* Brand Icon Glyph */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg bg-gradient-to-br from-bg-elevated to-bg-surface border border-border-medium shadow-sm overflow-hidden',
          iconSizes
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full p-1"
        >
          {/* Subtle background grid nodes */}
          <circle cx="8" cy="8" r="1" fill="#1E2C3D" />
          <circle cx="24" cy="8" r="1" fill="#1E2C3D" />
          <circle cx="8" cy="24" r="1" fill="#1E2C3D" />
          <circle cx="24" cy="24" r="1" fill="#1E2C3D" />

          {/* Upward Trading Trajectory Vector */}
          <path
            d="M6 22L13 15L18 20L26 9"
            stroke="var(--color-accent-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 9H26V14"
            stroke="var(--color-accent-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Candlestick Body Indicator */}
          <rect
            x="11.5"
            y="12"
            width="3"
            height="6"
            rx="0.5"
            fill="var(--color-accent-secondary)"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={cn('tracking-tight text-text-primary', titleSizes)}>Virtual</span>
          <span className={cn('tracking-tight text-accent-primary', titleSizes)}>Trade</span>
        </div>
        {showTagline && (
          <span className="text-[9px] font-mono font-medium tracking-widest text-text-muted uppercase mt-0.5">
            NSE · BSE TERMINAL
          </span>
        )}
      </div>
    </div>
  );
};
