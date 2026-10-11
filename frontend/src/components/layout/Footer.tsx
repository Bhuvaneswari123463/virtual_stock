import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background-panel py-8 px-4 text-xs text-foreground-subtle">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-foreground-muted">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            VirtualTrade is strictly an educational simulation platform. No real-money brokerage, trades, or securities transactions occur.
          </span>
        </div>
        <div className="text-right text-foreground-subtle">
          <span>&copy; {new Date().getFullYear()} VirtualTrade. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};
