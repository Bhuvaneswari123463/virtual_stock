import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  change?: number; // e.g. +2.45 or -1.20
  changeLabel?: string; // e.g. 'vs yesterday' or 'today'
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'today',
  icon,
  subtitle,
  className,
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <Card className={cn('flex flex-col justify-between p-4 bg-bg-surface border-border-subtle', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-elevated text-accent-secondary border border-border-subtle">
            {icon}
          </div>
        )}
      </div>

      <div className="my-2">
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
          {value}
        </div>
        {subtitle && <p className="text-[11px] text-text-muted mt-0.5">{subtitle}</p>}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums',
              isPositive && 'bg-trade-profit-subtle text-trade-profit',
              isNegative && 'bg-trade-loss-subtle text-trade-loss',
              isNeutral && 'bg-bg-hover text-text-secondary'
            )}
          >
            {isPositive && <ArrowUpRight className="h-3 w-3" />}
            {isNegative && <ArrowDownRight className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`}
          </span>
          {changeLabel && <span className="text-[11px] text-text-muted">{changeLabel}</span>}
        </div>
      )}
    </Card>
  );
};
