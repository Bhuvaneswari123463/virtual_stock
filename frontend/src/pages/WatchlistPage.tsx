import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '@/context/WatchlistContext';
import { useMarketFeed } from '@/context/MarketFeedContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatINR } from '@/lib/formatters';
import {
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  Plus,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Radio,
  Layers,
  ExternalLink,
} from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    watchlists,
    activeWatchlist,
    loading,
    refreshWatchlists,
    setActiveWatchlistId,
    addSymbol,
    removeSymbol,
    reorderSymbols,
    createWatchlist,
  } = useWatchlist();

  const { connectionStatus } = useMarketFeed();

  // Search & add symbol states
  const [newSymbolInput, setNewSymbolInput] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  // Filter items in active watchlist
  const filteredItems = useMemo(() => {
    if (!activeWatchlist?.items) return [];
    if (!filterSearch.trim()) return activeWatchlist.items;

    const s = filterSearch.trim().toLowerCase();
    return activeWatchlist.items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(s) ||
        item.companyName.toLowerCase().includes(s) ||
        item.sector.toLowerCase().includes(s)
    );
  }, [activeWatchlist, filterSearch]);

  // Handle Add Symbol
  const handleAddSymbol = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSymbolInput.trim()) return;

    const success = await addSymbol(newSymbolInput.trim());
    if (success) {
      setNewSymbolInput('');
    }
  };

  // Handle Create New Watchlist
  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    const success = await createWatchlist(newWatchlistName.trim());
    if (success) {
      setNewWatchlistName('');
      setShowCreateModal(false);
    }
  };

  // Reorder Item Up/Down
  const handleMove = async (symbol: string, direction: 'UP' | 'DOWN') => {
    if (!activeWatchlist?.items) return;
    const currentSymbols = activeWatchlist.items.map((i) => i.symbol);
    const index = currentSymbols.indexOf(symbol);
    if (index === -1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSymbols.length) return;

    // Swap elements
    const updated = [...currentSymbols];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    await reorderSymbols(updated);
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      {/* Header & Real-time Feed Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent-primary" />
              Watchlists & Real-Time Tracker
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-[11px] font-mono text-text-muted">
              <Radio
                className={`h-3 w-3 ${
                  connectionStatus === 'CONNECTED'
                    ? 'text-emerald-400 animate-pulse'
                    : connectionStatus === 'FALLBACK_POLLING'
                    ? 'text-amber-400'
                    : 'text-text-muted'
                }`}
              />
              <span className="hidden sm:inline">
                {connectionStatus === 'CONNECTED'
                  ? 'Live Stream'
                  : connectionStatus === 'FALLBACK_POLLING'
                  ? 'Polling 5s'
                  : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Personalized equity baskets with live tick merging, order book navigation, and ordering preferences.
          </p>
        </div>

        {/* Action Controls: Refresh & Create List */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshWatchlists()}
            disabled={loading}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 text-xs flex items-center gap-1.5"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            New Watchlist
          </Button>
        </div>
      </div>

      {/* Watchlist Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-2 overflow-x-auto">
        {watchlists.map((w) => {
          const isActive = activeWatchlist?.id === w.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setActiveWatchlistId(w.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-accent-primary text-bg-surface font-bold shadow-sm'
                  : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              <span>{w.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-bg-surface/20 text-bg-surface' : 'bg-bg-elevated text-text-muted'
                }`}
              >
                {w.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Watchlist Card */}
      <Card className="p-4 bg-bg-surface border-border-subtle">
        {/* Search within watchlist & Quick Add Symbol */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-3">
          <div className="w-full sm:w-64">
            <SearchBar
              value={filterSearch}
              onChange={setFilterSearch}
              onClear={() => setFilterSearch('')}
              placeholder="Filter saved stocks..."
            />
          </div>

          <form onSubmit={handleAddSymbol} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value.toUpperCase())}
              placeholder="Add symbol (e.g. SBIN, ITC)..."
              className="bg-bg-elevated border border-border-subtle rounded-md px-3 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-accent-primary w-full sm:w-56"
            />
            <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs shrink-0 flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </form>
        </div>

        {/* Watchlist Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol & Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead align="right">LTP (₹)</TableHead>
                <TableHead align="right">Daily Change</TableHead>
                <TableHead align="right">Day High / Low</TableHead>
                <TableHead align="right">Volume</TableHead>
                <TableHead align="center">Reorder</TableHead>
                <TableHead align="center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <div className="h-4 w-20 bg-border-subtle/50 rounded animate-pulse mb-1" />
                      <div className="h-3 w-32 bg-border-subtle/30 rounded animate-pulse" />
                    </TableCell>
                    <TableCell><div className="h-5 w-20 bg-border-subtle/40 rounded animate-pulse" /></TableCell>
                    <TableCell align="right"><div className="h-4 w-16 bg-border-subtle/50 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell align="right"><div className="h-4 w-14 bg-border-subtle/50 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell align="right"><div className="h-4 w-24 bg-border-subtle/30 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell align="right"><div className="h-4 w-16 bg-border-subtle/40 rounded animate-pulse ml-auto" /></TableCell>
                    <TableCell align="center"><div className="h-5 w-12 bg-border-subtle/30 rounded animate-pulse mx-auto" /></TableCell>
                    <TableCell align="center"><div className="h-7 w-16 bg-border-subtle/40 rounded animate-pulse mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                // Empty Watchlist State
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <Layers className="h-10 w-10 mb-2 opacity-40 text-accent-primary" />
                      <p className="text-sm font-semibold text-text-primary">Your Watchlist is Empty</p>
                      <p className="text-xs mt-1 max-w-sm">
                        Track your favorite Indian equities by entering a stock symbol above, or click on popular stocks below to add them instantly:
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS'].map((sym) => (
                          <Button
                            key={sym}
                            variant="outline"
                            size="sm"
                            onClick={() => addSymbol(sym)}
                            className="text-xs h-7 font-mono"
                          >
                            + {sym}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => {
                  const isPositive = item.changePercent >= 0;
                  return (
                    <TableRow key={item.symbol} className="hover:bg-bg-hover transition-colors">
                      <TableCell>
                        <div
                          className="cursor-pointer group flex flex-col"
                          onClick={() => navigate(`/app/markets/${item.symbol}`)}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-primary font-mono group-hover:text-accent-primary transition-colors">
                              {item.symbol}
                            </span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-bg-elevated border border-border-subtle text-text-muted">
                              {item.exchange}
                            </span>
                            {item.isMock && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                                Paper
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-text-muted truncate max-w-[180px]">
                            {item.companyName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" size="sm" className="text-[10px] max-w-[130px] truncate">
                          {item.sector}
                        </Badge>
                      </TableCell>

                      <TableCell align="right">
                        <span className="font-mono font-bold text-text-primary">
                          {item.ltpFormatted || formatINR(item.ltpPaise)}
                        </span>
                      </TableCell>

                      <TableCell align="right">
                        <span
                          className={`font-mono text-xs font-semibold inline-flex items-center gap-0.5 ${
                            isPositive
                              ? 'text-performance-positive'
                              : 'text-performance-negative'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {isPositive ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </span>
                      </TableCell>

                      <TableCell align="right">
                        <div className="text-[11px] font-mono text-text-secondary">
                          <span className="text-performance-positive">
                            {item.highFormatted || formatINR(item.ltpPaise * 1.01)}
                          </span>
                          {' / '}
                          <span className="text-performance-negative">
                            {item.lowFormatted || formatINR(item.ltpPaise * 0.99)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell align="right">
                        <span className="font-mono text-xs text-text-secondary">
                          {item.volume.toLocaleString('en-IN')}
                        </span>
                      </TableCell>

                      {/* Reorder Buttons */}
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleMove(item.symbol, 'UP')}
                            disabled={idx === 0}
                            aria-label={`Move ${item.symbol} up`}
                            className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(item.symbol, 'DOWN')}
                            disabled={idx === filteredItems.length - 1}
                            aria-label={`Move ${item.symbol} down`}
                            className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Actions: Trade & Delete */}
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/app/markets/${item.symbol}`)}
                            className="h-7 px-2 text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Trade
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeSymbol(item.symbol)}
                            aria-label={`Remove ${item.symbol} from watchlist`}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-text-muted hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create Watchlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-5 bg-bg-surface border-border-subtle shadow-xl">
            <h3 className="text-sm font-bold text-text-primary mb-3">Create New Watchlist</h3>
            <form onSubmit={handleCreateWatchlist} className="space-y-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Watchlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. IT Giants, High Dividend..."
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-md px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Create Watchlist
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
