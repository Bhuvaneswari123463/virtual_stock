import React from 'react';
import { cn } from '@/lib/utils';
import { TimeframeSelector } from './timeframe-selector';
import { Maximize2, Minimize2, BarChart2 } from 'lucide-react';
import { IconButton } from './icon-button';

export interface ChartContainerProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  timeframe?: string;
  timeframes?: string[];
  onTimeframeChange?: (tf: string) => void;
  isLoading?: boolean;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  timeframe = '1D',
  timeframes,
  onTimeframeChange,
  isLoading = false,
  children,
  height = 360,
  className,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border-subtle bg-bg-surface transition-all duration-200 overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 shadow-2xl',
        className
      )}
    >
      {/* Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5 bg-bg-elevated/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-bg-elevated text-accent-secondary border border-border-subtle">
            <BarChart2 className="h-4 w-4" />
          </div>
          <div>
            {title && <div className="text-xs font-bold text-text-primary leading-tight">{title}</div>}
            {subtitle && <div className="text-[10px] text-text-muted">{subtitle}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onTimeframeChange && (
            <TimeframeSelector
              active={timeframe}
              timeframes={timeframes}
              onChange={onTimeframeChange}
            />
          )}

          <IconButton
            size="sm"
            variant="ghost"
            aria-label={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            onClick={() => setIsFullscreen((prev) => !prev)}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </IconButton>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
        style={{ height: isFullscreen ? 'calc(100% - 48px)' : height }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-surface/70 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
              <svg className="animate-spin h-4 w-4 text-accent-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Rendering Chart Data...</span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
