import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

export interface ErrorPanelProps {
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  title = 'Something went wrong',
  message,
  errorCode,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 rounded-lg border border-trade-loss/30 bg-trade-loss-subtle/20 text-text-primary',
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-trade-loss-subtle text-trade-loss mb-3">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">{message}</p>
      {errorCode && (
        <span className="mt-2 text-[10px] font-mono text-text-muted uppercase">
          Error Code: {errorCode}
        </span>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
};
