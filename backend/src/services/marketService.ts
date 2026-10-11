import { MarketProviderFactory } from './market/providerFactory';
import { IMarketDataProvider } from './market/provider.interface';
import {
  NormalizedQuote,
  NormalizedCandle,
  NormalizedMarketOverview,
  SymbolSearchResult,
} from './market/types';
import { MarketCache } from './market/cache';
import { RequestDeduplicator } from './market/deduplicator';
import { MarketFilterQuery, CandleQuery } from '../schemas/marketSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';
import { Money } from '../utilities/money';
import { NotFoundError } from '../utilities/errors';
import { config } from '../config';
import { logger } from '../utilities/logger';

export interface MarketQuoteFormatted extends NormalizedQuote {
  ltpFormatted: string;
  changeFormatted: string;
  highFormatted: string;
  lowFormatted: string;
  openFormatted: string;
  previousCloseFormatted: string;
  week52HighFormatted: string;
  week52LowFormatted: string;
}

export interface StockDetailResponse {
  quote: MarketQuoteFormatted;
  marketDepth: {
    bids: Array<{ pricePaise: number; priceFormatted: string; quantity: number; orders: number }>;
    asks: Array<{ pricePaise: number; priceFormatted: string; quantity: number; orders: number }>;
    totalBidQuantity: number;
    totalAskQuantity: number;
  };
}

export class MarketService {
  private provider: IMarketDataProvider;
  private cache: MarketCache;
  private deduplicator: RequestDeduplicator;

  constructor(
    provider?: IMarketDataProvider,
    cacheTtlSeconds = config.MARKET_DATA_CACHE_TTL_SECONDS
  ) {
    this.provider = provider || MarketProviderFactory.getDefault();
    this.cache = new MarketCache(cacheTtlSeconds);
    this.deduplicator = new RequestDeduplicator();
  }

  setProvider(provider: IMarketDataProvider): void {
    this.provider = provider;
  }

  getProvider(): IMarketDataProvider {
    return this.provider;
  }

  getCache(): MarketCache {
    return this.cache;
  }

  async getMarkets(query: MarketFilterQuery): Promise<PaginatedResult<MarketQuoteFormatted>> {
    const {
      page = 1,
      limit = 20,
      search,
      sector,
      exchange = 'NSE',
      sortBy = 'volume',
      sortOrder = 'desc',
      minPricePaise,
      maxPricePaise,
    } = query;

    const candidateSymbols = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'TATAMOTORS', 'SBIN', 'BHARTIARTL', 'ITC', 'LT',
      'HINDUNILVR', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE',
      'MARUTI', 'SUNPHARMA', 'TITAN', 'ASIANPAINT', 'WIPRO', 'ADANIENT'
    ];

    // Fetch quotes with caching
    const quotes = await this.getQuotesWithCache(candidateSymbols);

    // Apply filtering
    let filtered = quotes.filter((q) => {
      if (exchange && q.exchange !== exchange) return false;
      if (sector && q.sector.toLowerCase() !== sector.toLowerCase()) return false;
      if (minPricePaise !== undefined && q.ltpPaise < minPricePaise) return false;
      if (maxPricePaise !== undefined && q.ltpPaise > maxPricePaise) return false;

      if (search && search.trim().length > 0) {
        const s = search.trim().toLowerCase();
        const matchesSymbol = q.symbol.toLowerCase().includes(s);
        const matchesName = q.companyName.toLowerCase().includes(s);
        if (!matchesSymbol && !matchesName) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortBy === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
      } else if (sortBy === 'ltpPaise') {
        valA = a.ltpPaise;
        valB = b.ltpPaise;
      } else if (sortBy === 'changePercent') {
        valA = a.changePercent;
        valB = b.changePercent;
      } else if (sortBy === 'volume') {
        valA = a.volume;
        valB = b.volume;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: paginated.map((q) => this.formatQuote(q)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getStockDetail(symbol: string): Promise<StockDetailResponse> {
    const upperSymbol = symbol.trim().toUpperCase();

    // 1. Check cache first
    const cached = this.cache.getQuote(upperSymbol);

    // If cache is fresh, return directly
    if (cached.quote && !cached.isStale) {
      return this.buildStockDetailResponse(cached.quote);
    }

    // 2. Fetch fresh quote with deduplication
    try {
      const quote = await this.deduplicator.deduplicate(`quote:${upperSymbol}`, async () => {
        return await this.provider.getQuote(upperSymbol);
      });

      if (quote) {
        this.cache.setQuote(quote);
        return this.buildStockDetailResponse(quote);
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch fresh quote for ${upperSymbol} from provider:`, err.message);

      // If provider threw error but we have stale cache, serve stale cache
      if (cached.quote) {
        return this.buildStockDetailResponse({
          ...cached.quote,
          isStale: true,
        });
      }

      throw err;
    }

    // 3. Fallback to cached (even if stale)
    if (cached.quote) {
      return this.buildStockDetailResponse(cached.quote);
    }

    throw new NotFoundError(`Stock with symbol '${upperSymbol}' not found`);
  }

  async getCandles(
    symbol: string,
    query: CandleQuery
  ): Promise<NormalizedCandle[]> {
    const upperSymbol = symbol.trim().toUpperCase();
    const resolution = query.resolution;
    const from = query.from;
    const to = query.to;

    const cacheKey = `candles:${upperSymbol}:${resolution}:${Math.floor(from.getTime() / 1000)}:${Math.floor(to.getTime() / 1000)}`;

    const cached = this.cache.getCandles(cacheKey);
    if (cached.candles && !cached.isStale) {
      return cached.candles;
    }

    try {
      const candles = await this.deduplicator.deduplicate(cacheKey, async () => {
        return await this.provider.getCandles(upperSymbol, resolution, from, to);
      });

      if (candles && candles.length > 0) {
        this.cache.setCandles(cacheKey, candles);
        return candles;
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch candles for ${upperSymbol}:`, err.message);
      if (cached.candles) {
        return cached.candles;
      }
      throw err;
    }

    if (cached.candles) {
      return cached.candles;
    }

    return [];
  }

  async getMarketOverview(): Promise<NormalizedMarketOverview> {
    const cached = this.cache.getOverview();
    if (cached.overview && !cached.isStale) {
      return cached.overview;
    }

    try {
      const overview = await this.deduplicator.deduplicate('market:overview', async () => {
        return await this.provider.getMarketOverview();
      });

      this.cache.setOverview(overview);
      return overview;
    } catch (err: any) {
      logger.warn('Failed to fetch fresh market overview:', err.message);
      if (cached.overview) {
        return {
          ...cached.overview,
          isStale: true,
        };
      }
      throw err;
    }
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    return await this.deduplicator.deduplicate(`search:${query.trim()}`, async () => {
      return await this.provider.searchSymbols(query.trim());
    });
  }

  private async getQuotesWithCache(symbols: string[]): Promise<NormalizedQuote[]> {
    const quotes: NormalizedQuote[] = [];
    const missing: string[] = [];

    for (const sym of symbols) {
      const cached = this.cache.getQuote(sym);
      if (cached.quote && !cached.isStale) {
        quotes.push(cached.quote);
      } else {
        missing.push(sym);
      }
    }

    if (missing.length > 0) {
      try {
        const fetched = await this.provider.getQuotes(missing);
        for (const q of fetched) {
          this.cache.setQuote(q);
          quotes.push(q);
        }
      } catch (err: any) {
        logger.warn('Failed to fetch batch quotes from provider', { error: err?.message || String(err) });
        // Fall back to any stale quotes for missing symbols
        for (const sym of missing) {
          const cached = this.cache.getQuote(sym);
          if (cached.quote) quotes.push(cached.quote);
        }
      }
    }

    return quotes;
  }

  private buildStockDetailResponse(quote: NormalizedQuote): StockDetailResponse {
    const formattedQuote = this.formatQuote(quote);

    // Realistic 5-level simulated market depth order book based on LTP
    const ltpPaise = quote.ltpPaise;
    const tickPaise = 5; // 5 paise NSE minimum tick size

    const bids = [
      { pricePaise: ltpPaise - tickPaise, quantity: 1520, orders: 12 },
      { pricePaise: ltpPaise - tickPaise * 2, quantity: 2840, orders: 19 },
      { pricePaise: ltpPaise - tickPaise * 3, quantity: 4100, orders: 25 },
      { pricePaise: ltpPaise - tickPaise * 4, quantity: 6200, orders: 34 },
      { pricePaise: ltpPaise - tickPaise * 5, quantity: 9800, orders: 48 },
    ].map((b) => ({
      ...b,
      priceFormatted: Money.fromPaise(b.pricePaise).toINR(),
    }));

    const asks = [
      { pricePaise: ltpPaise + tickPaise, quantity: 1240, orders: 9 },
      { pricePaise: ltpPaise + tickPaise * 2, quantity: 2150, orders: 16 },
      { pricePaise: ltpPaise + tickPaise * 3, quantity: 3900, orders: 22 },
      { pricePaise: ltpPaise + tickPaise * 4, quantity: 5800, orders: 31 },
      { pricePaise: ltpPaise + tickPaise * 5, quantity: 8400, orders: 42 },
    ].map((a) => ({
      ...a,
      priceFormatted: Money.fromPaise(a.pricePaise).toINR(),
    }));

    const totalBidQuantity = bids.reduce((acc, b) => acc + b.quantity, 0);
    const totalAskQuantity = asks.reduce((acc, a) => acc + a.quantity, 0);

    return {
      quote: formattedQuote,
      marketDepth: {
        bids,
        asks,
        totalBidQuantity,
        totalAskQuantity,
      },
    };
  }

  formatQuote(quote: NormalizedQuote): MarketQuoteFormatted {
    const ltpMoney = Money.fromPaise(quote.ltpPaise);
    const changeMoney = Money.fromPaise(quote.changePaise);

    return {
      ...quote,
      ltpFormatted: ltpMoney.toINR(),
      changeFormatted: `${quote.changePaise >= 0 ? '+' : ''}${changeMoney.toINR()} (${
        quote.changePercent >= 0 ? '+' : ''
      }${quote.changePercent.toFixed(2)}%)`,
      highFormatted: Money.fromPaise(quote.highPaise).toINR(),
      lowFormatted: Money.fromPaise(quote.lowPaise).toINR(),
      openFormatted: Money.fromPaise(quote.openPaise).toINR(),
      previousCloseFormatted: Money.fromPaise(quote.previousClosePaise).toINR(),
      week52HighFormatted: Money.fromPaise(quote.week52HighPaise).toINR(),
      week52LowFormatted: Money.fromPaise(quote.week52LowPaise).toINR(),
    };
  }
}

export const marketService = new MarketService();
