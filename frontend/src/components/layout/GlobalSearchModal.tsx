import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import { Search, TrendingUp, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_TICKERS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 295050, change: 1.45 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 389020, change: -0.62 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 168000, change: 0.85 },
  { symbol: 'INFY', name: 'Infosys Ltd.', ltp: 178550, change: 2.15 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 124500, change: -0.35 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', ltp: 96000, change: 1.90 },
];

const QUICK_ACTIONS = [
  { label: 'Markets Overview', path: '/app/markets', icon: TrendingUp },
  { label: 'Trading Academy', path: '/app/learn', icon: BookOpen },
  { label: 'Active Competitions', path: '/app/competitions', icon: Trophy },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle or open handled by parent
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTickers = POPULAR_TICKERS.filter(
    (t) =>
      t.symbol.toLowerCase().includes(query.toLowerCase()) ||
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg" className="p-0 overflow-hidden">
      {/* Search Bar Input */}
      <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 bg-bg-surface">
        <Search className="h-5 w-5 text-text-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks by symbol or name (e.g. RELIANCE, TCS)..."
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          autoFocus
        />
        <kbd className="hidden sm:inline-block rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          ESC
        </kbd>
      </div>

      {/* Results Container */}
      <div className="max-h-80 overflow-y-auto p-3 space-y-4">
        {/* Tickers Section */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Indian Equities (NSE / BSE)
          </div>
          {filteredTickers.length > 0 ? (
            <div className="space-y-1">
              {filteredTickers.map((ticker) => {
                const isPositive = ticker.change >= 0;
                return (
                  <button
                    key={ticker.symbol}
                    onClick={() => handleSelect(`/app/markets/${ticker.symbol}`)}
                    className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-bg-hover transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">{ticker.symbol}</div>
                      <div className="text-[11px] text-text-secondary">{ticker.name}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-semibold text-text-primary">
                        {formatINR(ticker.ltp)}
                      </div>
                      <div
                        className={`text-[11px] ${
                          isPositive ? 'text-trade-profit' : 'text-trade-loss'
                        }`}
                      >
                        {isPositive ? `+${ticker.change}%` : `${ticker.change}%`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-text-muted">
              No symbols matched &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Terminal Shortcuts
          </div>
          <div className="space-y-1">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => handleSelect(action.path)}
                  className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-bg-hover transition-colors text-xs text-text-secondary hover:text-text-primary"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-accent-secondary" />
                    <span>{action.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
