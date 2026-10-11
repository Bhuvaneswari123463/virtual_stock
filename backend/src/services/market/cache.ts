import { NormalizedQuote, NormalizedCandle, NormalizedMarketOverview } from './types';
import { MarketDataCache } from '../../models';
import { dbManager } from '../../config/database';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class MarketCache {
  private quoteCache = new Map<string, CacheEntry<NormalizedQuote>>();
  private candleCache = new Map<string, CacheEntry<NormalizedCandle[]>>();
  private overviewCache: CacheEntry<NormalizedMarketOverview> | null = null;

  // Default TTLs
  private defaultQuoteTtlMs = 30 * 1000; // 30 seconds
  private defaultCandleTtlMs = 5 * 60 * 1000; // 5 minutes
  private defaultOverviewTtlMs = 30 * 1000; // 30 seconds

  constructor(quoteTtlSeconds = 30) {
    this.defaultQuoteTtlMs = quoteTtlSeconds * 1000;
  }

  // --- Quote Cache ---
  getQuote(symbol: string): { quote: NormalizedQuote | null; isStale: boolean } {
    const key = symbol.toUpperCase();
    const entry = this.quoteCache.get(key);
    if (!entry) return { quote: null, isStale: false };

    const age = Date.now() - entry.timestamp;
    const isStale = age > entry.ttlMs;

    return {
      quote: {
        ...entry.data,
        isStale,
      },
      isStale,
    };
  }

  setQuote(quote: NormalizedQuote, ttlMs = this.defaultQuoteTtlMs): void {
    const key = quote.symbol.toUpperCase();
    this.quoteCache.set(key, {
      data: { ...quote, isStale: false },
      timestamp: Date.now(),
      ttlMs,
    });

    // Asynchronously synchronize with MongoDB if connected
    if (dbManager.isConnected()) {
      MarketDataCache.findOneAndUpdate(
        { symbol: quote.symbol },
        {
          symbol: quote.symbol,
          companyName: quote.companyName,
          sector: quote.sector,
          exchange: quote.exchange,
          ltpPaise: quote.ltpPaise,
          openPaise: quote.openPaise,
          highPaise: quote.highPaise,
          lowPaise: quote.lowPaise,
          previousClosePaise: quote.previousClosePaise,
          volume: quote.volume,
          changePaise: quote.changePaise,
          changePercent: quote.changePercent,
          lastUpdated: new Date(quote.lastUpdated),
        },
        { upsert: true }
      ).catch(() => {});
    }
  }

  // --- Candle Cache ---
  getCandles(key: string): { candles: NormalizedCandle[] | null; isStale: boolean } {
    const entry = this.candleCache.get(key);
    if (!entry) return { candles: null, isStale: false };

    const age = Date.now() - entry.timestamp;
    const isStale = age > entry.ttlMs;
    return { candles: entry.data, isStale };
  }

  setCandles(key: string, candles: NormalizedCandle[], ttlMs = this.defaultCandleTtlMs): void {
    this.candleCache.set(key, {
      data: candles,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  // --- Overview Cache ---
  getOverview(): { overview: NormalizedMarketOverview | null; isStale: boolean } {
    if (!this.overviewCache) return { overview: null, isStale: false };
    const age = Date.now() - this.overviewCache.timestamp;
    const isStale = age > this.overviewCache.ttlMs;
    return { overview: this.overviewCache.data, isStale };
  }

  setOverview(overview: NormalizedMarketOverview, ttlMs = this.defaultOverviewTtlMs): void {
    this.overviewCache = {
      data: overview,
      timestamp: Date.now(),
      ttlMs,
    };
  }

  clear(): void {
    this.quoteCache.clear();
    this.candleCache.clear();
    this.overviewCache = null;
  }
}

export const marketCache = new MarketCache();
