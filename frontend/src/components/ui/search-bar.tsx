import React from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onClick?: () => void;
  showShortcut?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search stocks, indices (e.g. RELIANCE, NIFTY)...',
  onClear,
  onClick,
  showShortcut = false,
  className,
  autoFocus = false,
}) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-center w-full rounded-md border border-border-subtle bg-bg-surface px-3 py-1.5 transition-colors focus-within:border-border-focus focus-within:ring-1 focus-within:ring-border-focus hover:border-border-medium',
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-text-muted mr-2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      {value && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-0.5 text-text-muted hover:text-text-primary rounded"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showShortcut && !value && (
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          <span>{isMac ? '⌘' : 'Ctrl'}</span>
          <span>K</span>
        </kbd>
      )}
    </div>
  );
};
