import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = 'left',
  title,
  children,
  className,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionStyles = {
    left: 'left-0 top-0 bottom-0 border-r animate-in slide-in-from-left duration-200',
    right: 'right-0 top-0 bottom-0 border-l animate-in slide-in-from-right duration-200',
  }[position];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 flex h-full w-full max-w-xs sm:max-w-sm flex-col bg-bg-surface border-border-subtle p-4 shadow-dropdown text-text-primary',
          positionStyles,
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="text-sm font-semibold text-text-primary">{title}</div>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Close drawer"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto py-3">{children}</div>
      </div>
    </div>
  );
};
