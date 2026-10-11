import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
  }[align];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1.5 w-48 rounded-lg border border-border-medium bg-bg-elevated p-1 text-text-primary shadow-dropdown animate-in fade-in zoom-in-95',
            alignStyles,
            className
          )}
        >
          {items.map((item) => (
            <React.Fragment key={item.id}>
              {item.divider && <div className="my-1 border-t border-border-subtle" />}
              <button
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-left transition-colors select-none',
                  item.variant === 'danger'
                    ? 'text-trade-loss hover:bg-trade-loss-subtle'
                    : 'text-text-primary hover:bg-bg-hover'
                )}
              >
                {item.icon && <span className="h-4 w-4 shrink-0 text-text-muted">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
