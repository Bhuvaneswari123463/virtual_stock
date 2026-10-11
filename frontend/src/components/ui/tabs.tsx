import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pill';
  size?: 'sm' | 'md';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1',
        variant === 'underline' && 'border-b border-border-subtle',
        variant === 'pill' && 'p-1 rounded-lg bg-bg-surface border border-border-subtle',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        const sizeStyles = {
          sm: 'px-2.5 py-1 text-xs',
          md: 'px-3 py-1.5 text-xs sm:text-sm',
        }[size];

        const variantStyles = {
          underline: cn(
            'border-b-2 font-medium transition-colors -mb-px',
            isActive
              ? 'border-accent-primary text-accent-primary font-semibold'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-medium'
          ),
          pill: cn(
            'rounded font-medium transition-all',
            isActive
              ? 'bg-bg-elevated text-text-primary shadow-sm font-semibold'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
          ),
        }[variant];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-1.5 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-secondary disabled:opacity-40 disabled:pointer-events-none',
              sizeStyles,
              variantStyles
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 text-[10px] font-mono leading-none',
                  isActive
                    ? 'bg-accent-primary-subtle text-accent-primary'
                    : 'bg-bg-hover text-text-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
