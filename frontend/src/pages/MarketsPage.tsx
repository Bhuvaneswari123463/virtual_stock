import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  marketService,
  MarketQuoteItem,
  MarketOverviewData,
} from '@/services/marketService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { Tabs } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  Clock,
  Activity,
  Filter,
  Info,
} from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [stocks, setStocks] = useState<MarketQuoteItem[]>([]);
  const [overview, setOverview] = useState<MarketOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedExchange, setSelectedExchange] = useState<'NSE' | 'BSE'>('NSE');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'ltpPaise' | 'changePercent' | 'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Load Market Overview
  const loadOverview = useCallback(async () => {
    try {
      const res = await marketService.getMarketOverview();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err: unknown) {
      console.warn('Market overview error:', err instanceof Error ? err.message : err);
    }
  }, []);

  // Load Markets Listing
  const loadMarkets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setIsRateLimited(false);

    try {
      const minPaise = minPrice ? Math.round(Number(minPrice) * 100) : undefined;
      const maxPaise = maxPrice ? Math.round(Number(maxPrice) * 100) : undefined;

      const res = await marketService.getMarkets({
        page,
        limit: 15,
        search: search.trim() || undefined,
        sector: selectedSector !== 'all' ? selectedSector : undefined,
        exchange: selectedExchange,
        sortBy,
        sortOrder,
        minPricePaise: !isNaN(Number(minPaise)) ? minPaise : undefined,
        maxPricePaise: !isNaN(Number(maxPaise)) ? maxPaise : undefined,
      });

      if (res.success && res.data) {
        setStocks(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      } else {
        if (res.error?.code === 'RATE_LIMIT_EXCEEDED') {
          setIsRateLimited(true);
        }
        setError(res.error?.message || 'Failed to load market data.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Network error while contacting market service.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    page,
    search,
    selectedSector,
    selectedExchange,
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  // Handle Sort Toggle
  const handleSort = (field: 'symbol' | 'ltpPaise' | 'changePercent' | 'volume') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Distinct sectors
  const sectors = useMemo(() => {
    const defaultSectors = [
      'Energy & Petrochemicals',
      'Information Technology',
      'Financial Services',
      'Automobile',
      'Banking',
      'Telecommunications',
      'FMCG',
      'Infrastructure',
    ];
    return ['all', ...defaultSectors];
  }, []);

  // Filter based on active tab
  const displayedStocks = useMemo(() => {
    if (activeTab === 'gainers') {
      return stocks.filter((s) => s.changePercent > 0);
    }
    if (activeTab === 'losers') {
      return stocks.filter((s) => s.changePercent < 0);
    }
    return stocks;
  }, [stocks, activeTab]);

  // Determine active data source indicator
  const firstStock = stocks[0];
  const isMockData = firstStock?.isMock ?? overview?.isMock ?? true;
  const isDelayedData = firstStock?.isDelayed ?? overview?.isDelayed ?? false;
  const isStaleData = firstStock?.isStale ?? overview?.isStale ?? false;
  const dataSourceLabel = isMockData
    ? 'Simulated Paper Feed'
    : isDelayedData
    ? '15m Delayed Real Feed'
    : 'Real-Time Feed';

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      {/* Header & Freshness / Provider Status Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent-primary" />
              Indian Stock Explorer
            </h1>
            <Badge
              variant={isMockData ? 'warning' : 'accent'}
              className="font-mono text-[11px] uppercase tracking-wider"
            >
              {dataSourceLabel}
            </Badge>
            {isStaleData && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] flex items-center gap-1">
                <Clock className="h-3 w-3" /> Cached / Stale
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            NSE & BSE Equities · 09:15 - 15:30 IST Session · Educational Simulated Margin
          </p>
        </div>

        {/* Global Overview Bar & Refresh */}
        <div className="flex items-center gap-3">
          {overview?.session && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  overview.session.status === 'OPEN'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-text-secondary">IST:</span>
              <span className="font-mono font-medium text-text-primary">
                {overview.session.currentTimeIST}
              </span>
              <span className="text-[11px] text-text-muted hidden sm:inline">
                ({overview.session.statusLabel})
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadOverview();
              loadMarkets(true);
            }}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Overview Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {overview?.indices.map((idx) => {
          const isPos = idx.change >= 0;
          return (
            <Card key={idx.symbol} className="p-3 bg-bg-surface border-border-subtle">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">{idx.name}</span>
                <span className="font-mono text-[10px]">{idx.symbol}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-lg font-bold font-mono text-text-primary">
                  {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`flex items-center text-xs font-mono font-medium ${
                    isPos ? 'text-performance-positive' : 'text-performance-negative'
                  }`}
                >
                  {isPos ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                  {isPos ? '+' : ''}
                  {idx.change.toFixed(2)} ({isPos ? '+' : ''}{idx.changePercent.toFixed(2)}%)
                </div>
              </div>
            </Card>
          );
        })}

        {/* Market Breadth: Advances vs Declines */}
        <Card className="p-3 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Market Breadth</span>
            <span className="text-[10px] text-text-muted">NSE Equities</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1 text-performance-positive">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Adv: {overview?.advancesCount ?? 14}</span>
            </div>
            <div className="flex items-center gap-1 text-performance-negative">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>Dec: {overview?.declinesCount ?? 6}</span>
            </div>
          </div>
          {/* Ratio bar */}
          <div className="mt-2 h-1.5 w-full bg-rose-500/30 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{
                width: `${
                  overview
                    ? (overview.advancesCount /
                        Math.max(1, overview.advancesCount + overview.declinesCount)) *
                      100
                    : 70
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Trading Session Info Card */}
        <Card className="p-3 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">Market Session</span>
            <Activity className="h-3.5 w-3.5 text-accent-primary" />
          </div>
          <div className="mt-1 flex flex-col justify-center">
            <div className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  overview?.session.status === 'OPEN'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              {overview?.session.status === 'OPEN' ? 'Live Normal Trading' : 'Session Closed'}
            </div>
            <span className="text-[11px] text-text-muted mt-0.5">
              Next Open: {overview?.session.nextOpenIST || '09:15 IST'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Explorer Surface */}
      <Card className="p-4 bg-bg-surface border-border-subtle">
        {/* Search, Exchange Switch, Filter Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Tabs
              tabs={[
                { id: 'all', label: 'All Equities', count: totalCount || stocks.length },
                { id: 'gainers', label: 'Gainers' },
                { id: 'losers', label: 'Losers' },
              ]}
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setPage(1);
              }}
              variant="pill"
            />

            {/* Exchange Toggle (NSE / BSE) */}
            <div className="inline-flex rounded-lg border border-border-subtle p-0.5 bg-bg-elevated text-xs ml-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedExchange('NSE');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedExchange === 'NSE'
                    ? 'bg-accent-primary text-bg-surface font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                NSE
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedExchange('BSE');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedExchange === 'BSE'
                    ? 'bg-accent-primary text-bg-surface font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                BSE
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full sm:w-64">
              <SearchBar
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch('');
                  setPage(1);
                }}
                placeholder="Search symbol or company..."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 flex items-center gap-1.5 text-xs ${
                showFilters || selectedSector !== 'all' || minPrice || maxPrice
                  ? 'border-accent-primary text-accent-primary'
                  : ''
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </Button>
          </div>
        </div>

        {/* Collapsible Advanced Filters (Sector, Min Price, Max Price) */}
        {showFilters && (
          <div className="mb-4 p-3 rounded-lg bg-bg-elevated border border-border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-text-secondary mb-1 font-medium">Sector</label>
              <select
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="all">All Sectors</option>
                {sectors.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-text-secondary mb-1 font-medium">Min Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-text-primary font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary mb-1 font-medium">Max Price (₹)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-text-primary font-mono focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        )}

        {/* Rate Limit Alert */}
        {isRateLimited && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Market data provider rate limit encountered. Serving cached snapshots with bounded retry.
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isRateLimited && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMarkets(false)}
              className="text-xs h-7 border-rose-500/40 hover:bg-rose-500/10"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stock Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort('symbol')}
                  className="cursor-pointer select-none hover:text-text-primary"
                >
                  <div className="flex items-center gap-1">
                    Symbol & Company
                    {sortBy === 'symbol' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-primary" /> : <ArrowDown className="h-3 w-3 text-accent-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-text-muted" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Sector</TableHead>
                <TableHead
                  align="right"
                  onClick={() => handleSort('ltpPaise')}
                  className="cursor-pointer select-none hover:text-text-primary"
                >
                  <div className="flex items-center justify-end gap-1">
                    LTP (₹)
                    {sortBy === 'ltpPaise' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-primary" /> : <ArrowDown className="h-3 w-3 text-accent-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-text-muted" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  align="right"
                  onClick={() => handleSort('changePercent')}
                  className="cursor-pointer select-none hover:text-text-primary"
                >
                  <div className="flex items-center justify-end gap-1">
                    24h Change
                    {sortBy === 'changePercent' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-primary" /> : <ArrowDown className="h-3 w-3 text-accent-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-text-muted" />
                    )}
                  </div>
                </TableHead>
                <TableHead align="right">Day High / Low</TableHead>
                <TableHead
                  align="right"
                  onClick={() => handleSort('volume')}
                  className="cursor-pointer select-none hover:text-text-primary"
                >
                  <div className="flex items-center justify-end gap-1">
                    Volume
                    {sortBy === 'volume' ? (
                      sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-primary" /> : <ArrowDown className="h-3 w-3 text-accent-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-text-muted" />
                    )}
                  </div>
                </TableHead>
                <TableHead align="center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <div className="h-4 w-24 bg-border-subtle/50 rounded animate-pulse mb-1" />
                      <div className="h-3 w-36 bg-border-subtle/30 rounded animate-pulse" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-border-subtle/40 rounded animate-pulse" />
                    </TableCell>
                    <TableCell align="right">
                      <div className="h-4 w-16 bg-border-subtle/50 rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell align="right">
                      <div className="h-4 w-14 bg-border-subtle/50 rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell align="right">
                      <div className="h-4 w-28 bg-border-subtle/30 rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell align="right">
                      <div className="h-4 w-16 bg-border-subtle/40 rounded animate-pulse ml-auto" />
                    </TableCell>
                    <TableCell align="center">
                      <div className="h-7 w-16 bg-border-subtle/40 rounded animate-pulse mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : displayedStocks.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <Info className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium text-text-primary">No matching equities found</p>
                      <p className="text-xs mt-1">Try adjusting your search criteria, exchange, or price filters.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearch('');
                          setSelectedSector('all');
                          setMinPrice('');
                          setMaxPrice('');
                        }}
                        className="mt-3 text-xs"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedStocks.map((stock) => {
                  const isPositive = stock.changePercent >= 0;
                  return (
                    <TableRow
                      key={stock.symbol}
                      onClick={() => navigate(`/app/markets/${stock.symbol}`)}
                      className="cursor-pointer hover:bg-bg-hover transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-text-primary font-mono">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-bg-elevated border border-border-subtle text-text-muted">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-muted truncate max-w-[200px]">
                          {stock.companyName}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" size="sm" className="text-[10px] max-w-[140px] truncate">
                          {stock.sector}
                        </Badge>
                      </TableCell>

                      <TableCell align="right">
                        <span className="font-mono font-bold text-text-primary">
                          {stock.ltpFormatted || `₹${(stock.ltpPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
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
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </TableCell>

                      <TableCell align="right">
                        <div className="text-[11px] font-mono text-text-secondary">
                          <span className="text-performance-positive">
                            {stock.highFormatted || `₹${(stock.highPaise / 100).toFixed(2)}`}
                          </span>
                          {' / '}
                          <span className="text-performance-negative">
                            {stock.lowFormatted || `₹${(stock.lowPaise / 100).toFixed(2)}`}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell align="right">
                        <span className="font-mono text-xs text-text-secondary">
                          {stock.volume.toLocaleString('en-IN')}
                        </span>
                      </TableCell>

                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/app/markets/${stock.symbol}`)}
                          className="h-7 px-2.5 text-xs font-medium"
                        >
                          Trade
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-subtle pt-3 mt-3 text-xs text-text-secondary">
            <div>
              Showing page {page} of {totalPages} ({totalCount} total equities)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
