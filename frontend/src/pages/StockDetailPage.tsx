import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  marketService,
  StockDetailData,
  BackendCandle,
} from '@/services/marketService';
import { CandlestickData } from '@/fixtures/candles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import { TradingViewChart } from '@/components/charts/TradingViewChart';
import { OrderTicket } from '@/components/trading/OrderTicket';
import { useWatchlist } from '@/context/WatchlistContext';
import { useMarketFeed } from '@/context/MarketFeedContext';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  Bookmark,
  BookmarkCheck,
  BarChart2,
  AlertCircle,
  RefreshCw,
  Info,
  Radio,
  Layers,
} from 'lucide-react';

export const StockDetailPage: React.FC = () => {
  const { symbol = 'RELIANCE' } = useParams<{ symbol: string }>();
  const upperSymbol = symbol.trim().toUpperCase();

  const [detail, setDetail] = useState<StockDetailData | null>(null);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watchlist & Market Feed hooks
  const { isSymbolInWatchlist, addSymbol, removeSymbol } = useWatchlist();
  const { subscribe, unsubscribe, getLiveQuote, connectionStatus } = useMarketFeed();
  const { portfolio, refreshProfile } = useAuth();

  const isInWatchlist = isSymbolInWatchlist(upperSymbol);

  // Subscribe symbol to real-time feed
  useEffect(() => {
    subscribe(upperSymbol);
    return () => {
      unsubscribe(upperSymbol);
    };
  }, [upperSymbol, subscribe, unsubscribe]);

  // Load stock detail from backend
  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await marketService.getStockDetail(upperSymbol);
      if (res.success && res.data) {
        setDetail(res.data);
      } else {
        setError(res.error?.message || `Stock '${upperSymbol}' could not be found.`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error connecting to market service.'
      );
    } finally {
      setLoading(false);
    }
  }, [upperSymbol]);

  // Load historical candles
  const loadCandles = useCallback(async () => {
    setChartLoading(true);
    try {
      const resolution =
        timeframe === '1m'
          ? '1m'
          : timeframe === '5m'
          ? '5m'
          : timeframe === '15m'
          ? '15m'
          : timeframe === '1h'
          ? '1h'
          : timeframe === '1W'
          ? '1W'
          : timeframe === '1M'
          ? '1M'
          : '1D';

      const res = await marketService.getCandles(upperSymbol, resolution);
      if (res.success && res.data && res.data.length > 0) {
        const formatted: CandlestickData[] = res.data.map((c: BackendCandle) => {
          const dateStr =
            typeof c.timestamp === 'number'
              ? new Date(c.timestamp > 1e11 ? c.timestamp : c.timestamp * 1000)
                  .toISOString()
                  .split('T')[0]
              : String(c.timestamp);
          return {
            time: dateStr,
            open: c.openPaise / 100,
            high: c.highPaise / 100,
            low: c.lowPaise / 100,
            close: c.closePaise / 100,
            volume: c.volume,
          };
        });
        setCandles(formatted);
      } else {
        // Fallback generator if remote candles empty
        const legacyCandles = await marketService.getHistoricalCandles(upperSymbol, timeframe);
        setCandles(legacyCandles);
      }
    } catch (err) {
      console.warn('Error loading candles:', err);
    } finally {
      setChartLoading(false);
    }
  }, [upperSymbol, timeframe]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    loadCandles();
  }, [loadCandles]);

  // Merge live ticks into quote if available
  const liveTick = getLiveQuote(upperSymbol);
  const currentQuote = useMemo(() => {
    if (!detail) return null;
    if (!liveTick) return detail.quote;

    return {
      ...detail.quote,
      ltpPaise: liveTick.ltpPaise,
      ltpFormatted: liveTick.ltpFormatted,
      changePaise: liveTick.changePaise,
      changePercent: liveTick.changePercent,
      changeFormatted: liveTick.changeFormatted,
      highFormatted: liveTick.highFormatted,
      lowFormatted: liveTick.lowFormatted,
      volume: liveTick.volume,
      lastUpdated: liveTick.lastUpdated,
    };
  }, [detail, liveTick]);

  // Watchlist toggle handler
  const handleToggleWatchlist = async () => {
    if (isInWatchlist) {
      await removeSymbol(upperSymbol);
    } else {
      await addSymbol(upperSymbol);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <RefreshCw className="h-8 w-8 text-accent-primary animate-spin mb-3" />
        <p className="text-sm text-text-secondary">Loading market data for {upperSymbol}...</p>
      </div>
    );
  }

  if (error || !detail || !currentQuote) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
        <h2 className="text-base font-bold text-text-primary">Stock Symbol Not Found</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-sm">
          {error || `We couldn't locate symbol "${upperSymbol}" in the active market feed.`}
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Link to="/app/markets">
            <Button variant="secondary" size="sm">Back to Markets</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => loadDetail()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { marketDepth } = detail;
  const isPositive = currentQuote.changePercent >= 0;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      {/* Header, Symbol Info & Watchlist Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-3">
          <Link to="/app/markets">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              aria-label="Back to Markets"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-text-primary">
                {currentQuote.symbol}
              </h1>
              <Badge variant="outline" size="sm">{currentQuote.sector}</Badge>
              <Badge variant="default" size="sm">{currentQuote.exchange}</Badge>
              <Badge variant="subtle" size="sm">{currentQuote.currency}</Badge>

              {currentQuote.isMock ? (
                <Badge variant="warning" size="sm">Simulated Paper Feed</Badge>
              ) : currentQuote.isDelayed ? (
                <Badge variant="accent" size="sm">15m Delayed</Badge>
              ) : null}

              {currentQuote.isStale && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Cached / Stale
                </Badge>
              )}

              {/* Real-time Connection Indicator */}
              <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono ml-1">
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
                    ? 'Live WebSocket'
                    : connectionStatus === 'FALLBACK_POLLING'
                    ? 'Polling Fallback'
                    : 'Disconnected'}
                </span>
              </div>
            </div>

            <p className="text-xs text-text-secondary mt-0.5">{currentQuote.companyName}</p>
          </div>
        </div>

        {/* Right side: Watchlist Toggle & LTP Display */}
        <div className="flex items-center gap-4">
          <Button
            variant={isInWatchlist ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleWatchlist}
            className={`h-8 px-2.5 text-xs flex items-center gap-1.5 ${
              isInWatchlist
                ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isInWatchlist ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">In Watchlist</span>
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add to Watchlist</span>
              </>
            )}
          </Button>

          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-text-primary">
              {currentQuote.ltpFormatted || `₹${(currentQuote.ltpPaise / 100).toFixed(2)}`}
            </div>
            <div
              className={`flex items-center justify-end text-xs font-mono font-semibold ${
                isPositive ? 'text-performance-positive' : 'text-performance-negative'
              }`}
            >
              {isPositive ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
              {currentQuote.changeFormatted || `${isPositive ? '+' : ''}${currentQuote.changePercent.toFixed(2)}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Chart & Order Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column (2 Cols): Interactive Chart & Statistics & Depth */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Chart Surface */}
          <Card className="p-4 bg-bg-surface border-border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-accent-primary" />
                <span className="text-xs font-semibold text-text-primary">
                  Candlestick Chart & Volume
                </span>
                <span className="text-[10px] text-text-muted font-mono hidden sm:inline">
                  (Lightweight Charts)
                </span>
              </div>
              <TimeframeSelector
                active={timeframe}
                onChange={setTimeframe}
                timeframes={['1m', '5m', '15m', '1h', '1D', '1W']}
              />
            </div>

            {chartLoading ? (
              <div className="h-[380px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-accent-primary animate-spin" />
              </div>
            ) : (
              <TradingViewChart data={candles} height={380} showVolume={true} />
            )}
          </Card>

          {/* Key Fundamentals & OHLC Statistics */}
          <Card className="p-4 bg-bg-surface border-border-subtle">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-accent-primary" />
              Price Statistics & Day Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Day High</div>
                <div className="text-text-primary font-bold mt-0.5">{currentQuote.highFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Day Low</div>
                <div className="text-text-primary font-bold mt-0.5">{currentQuote.lowFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">52-Week High</div>
                <div className="text-performance-positive font-bold mt-0.5">{currentQuote.week52HighFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">52-Week Low</div>
                <div className="text-performance-negative font-bold mt-0.5">{currentQuote.week52LowFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Open Price</div>
                <div className="text-text-primary font-bold mt-0.5">{currentQuote.openFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Previous Close</div>
                <div className="text-text-primary font-bold mt-0.5">{currentQuote.previousCloseFormatted}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Volume</div>
                <div className="text-text-primary font-bold mt-0.5">{currentQuote.volume.toLocaleString('en-IN')}</div>
              </div>
              <div className="p-2 rounded bg-bg-elevated border border-border-subtle">
                <div className="text-[10px] text-text-muted">Data Source</div>
                <div className="text-text-primary font-bold mt-0.5 font-sans">{currentQuote.dataSource}</div>
              </div>
            </div>
          </Card>

          {/* 5-Level Simulated Market Depth */}
          <Card className="p-4 bg-bg-surface border-border-subtle">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-accent-primary" />
                Simulated Market Depth (Order Book)
              </h3>
              <span className="text-[10px] text-text-muted font-mono">Tick ₹0.05</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Bids */}
              <div>
                <div className="flex justify-between text-[10px] text-text-muted border-b border-border-subtle pb-1 mb-1 font-sans">
                  <span>Orders</span>
                  <span>Qty</span>
                  <span className="text-right">Bid (₹)</span>
                </div>
                {marketDepth.bids.map((b, i) => (
                  <div key={`bid-${i}`} className="flex justify-between py-0.5 text-performance-positive">
                    <span className="text-text-muted">{b.orders}</span>
                    <span>{b.quantity}</span>
                    <span className="font-bold text-right">{b.priceFormatted}</span>
                  </div>
                ))}
                <div className="border-t border-border-subtle pt-1 mt-1 flex justify-between text-[11px] font-semibold text-text-primary">
                  <span>Total Bids</span>
                  <span>{marketDepth.totalBidQuantity.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Asks */}
              <div>
                <div className="flex justify-between text-[10px] text-text-muted border-b border-border-subtle pb-1 mb-1 font-sans">
                  <span>Ask (₹)</span>
                  <span>Qty</span>
                  <span className="text-right">Orders</span>
                </div>
                {marketDepth.asks.map((a, i) => (
                  <div key={`ask-${i}`} className="flex justify-between py-0.5 text-performance-negative">
                    <span className="font-bold">{a.priceFormatted}</span>
                    <span>{a.quantity}</span>
                    <span className="text-text-muted text-right">{a.orders}</span>
                  </div>
                ))}
                <div className="border-t border-border-subtle pt-1 mt-1 flex justify-between text-[11px] font-semibold text-text-primary">
                  <span>Total Asks</span>
                  <span>{marketDepth.totalAskQuantity.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Ticket Panel */}
        <div className="flex flex-col gap-4">
          <OrderTicket
            symbol={currentQuote.symbol}
            companyName={currentQuote.companyName}
            ltpPaise={currentQuote.ltpPaise}
            virtualCashPaise={portfolio?.cashBalancePaise}
            onOrderPlaced={() => {
              loadDetail();
              refreshProfile();
            }}
          />
        </div>
      </div>
    </div>
  );
};
