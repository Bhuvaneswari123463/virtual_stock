import { apiRequest, ApiResponse } from '../lib/apiClient';
import { CandlestickData } from '../fixtures/candles';
import { FIXTURE_STOCKS, StockQuote } from '../fixtures/stocks';

export interface MarketQuoteItem {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  currency: 'INR';
  ltpPaise: number;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  previousClosePaise: number;
  volume: number;
  changePaise: number;
  changePercent: number;
  week52HighPaise: number;
  week52LowPaise: number;
  dataSource: string;
  isDelayed: boolean;
  isMock: boolean;
  isStale: boolean;
  lastUpdated: string;
  ltpFormatted: string;
  changeFormatted: string;
  highFormatted: string;
  lowFormatted: string;
  openFormatted: string;
  previousCloseFormatted: string;
  week52HighFormatted: string;
  week52LowFormatted: string;
}

export interface MarketDepthEntry {
  pricePaise: number;
  priceFormatted: string;
  quantity: number;
  orders: number;
}

export interface StockDetailData {
  quote: MarketQuoteItem;
  marketDepth: {
    bids: MarketDepthEntry[];
    asks: MarketDepthEntry[];
    totalBidQuantity: number;
    totalAskQuantity: number;
  };
}

export interface MarketIndexItem {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  lastUpdated: string;
}

export interface MarketOverviewData {
  indices: MarketIndexItem[];
  session: {
    status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';
    statusLabel: string;
    exchange: 'NSE' | 'BSE';
    currentTimeIST: string;
    nextOpenIST: string;
    isTradingDay: boolean;
  };
  topGainers: MarketQuoteItem[];
  topLosers: MarketQuoteItem[];
  mostActive: MarketQuoteItem[];
  advancesCount: number;
  declinesCount: number;
  dataSource: string;
  isDelayed: boolean;
  isMock: boolean;
  isStale?: boolean;
  lastUpdated: string;
}

export interface BackendCandle {
  timestamp: number;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  closePaise: number;
  volume: number;
}

export interface MarketQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sector?: string;
  exchange?: 'NSE' | 'BSE';
  sortBy?: 'symbol' | 'ltpPaise' | 'changePercent' | 'volume';
  sortOrder?: 'asc' | 'desc';
  minPricePaise?: number;
  maxPricePaise?: number;
}

class BackendMarketService {
  async getMarkets(params: MarketQueryParams = {}): Promise<ApiResponse<MarketQuoteItem[]>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.sector && params.sector !== 'all') query.set('sector', params.sector);
    if (params.exchange) query.set('exchange', params.exchange);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.minPricePaise !== undefined) query.set('minPricePaise', String(params.minPricePaise));
    if (params.maxPricePaise !== undefined) query.set('maxPricePaise', String(params.maxPricePaise));

    const qs = query.toString();
    const endpoint = `/markets${qs ? `?${qs}` : ''}`;
    return await apiRequest<MarketQuoteItem[]>(endpoint);
  }

  async getMarketOverview(): Promise<ApiResponse<MarketOverviewData>> {
    return await apiRequest<MarketOverviewData>('/markets/overview');
  }

  async getStockDetail(symbol: string): Promise<ApiResponse<StockDetailData>> {
    return await apiRequest<StockDetailData>(`/markets/${encodeURIComponent(symbol.toUpperCase())}`);
  }

  async getCandles(
    symbol: string,
    resolution = '1D',
    from?: Date,
    to?: Date
  ): Promise<ApiResponse<BackendCandle[]>> {
    const query = new URLSearchParams();
    query.set('resolution', resolution);
    if (from) query.set('from', String(Math.floor(from.getTime() / 1000)));
    if (to) query.set('to', String(Math.floor(to.getTime() / 1000)));

    return await apiRequest<BackendCandle[]>(
      `/markets/${encodeURIComponent(symbol.toUpperCase())}/candles?${query.toString()}`
    );
  }

  async searchStocks(query: string): Promise<ApiResponse<MarketQuoteItem[]>> {
    return await apiRequest<MarketQuoteItem[]>(`/markets/search?q=${encodeURIComponent(query)}`);
  }

  // --- Backward-Compatible Methods with fallback ---
  async getAllStocks(): Promise<StockQuote[]> {
    try {
      const res = await this.getMarkets({ limit: 50 });
      if (res.success && res.data && res.data.length > 0) {
        return res.data.map(this.mapQuoteToLegacy);
      }
    } catch {
      // fallback
    }
    return [...FIXTURE_STOCKS];
  }

  async getStockBySymbol(symbol: string): Promise<StockQuote | undefined> {
    try {
      const res = await this.getStockDetail(symbol);
      if (res.success && res.data?.quote) {
        return this.mapQuoteToLegacy(res.data.quote);
      }
    } catch {
      // fallback
    }
    return FIXTURE_STOCKS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  }

  async getHistoricalCandles(symbol: string, timeframe = '1D'): Promise<CandlestickData[]> {
    try {
      const res = await this.getCandles(symbol, timeframe);
      if (res.success && res.data && res.data.length > 0) {
        return res.data.map((c) => {
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
      }
    } catch {
      // fallback
    }
    const stock = await this.getStockBySymbol(symbol);
    const basePriceRupees = stock ? stock.ltpPaise / 100 : 2500;
    // Generate fallback candles
    const candles: CandlestickData[] = [];
    const now = Math.floor(Date.now() / 1000);
    let price = basePriceRupees;
    for (let i = 50; i >= 0; i--) {
      const time = now - i * 86400;
      const dateStr = new Date(time * 1000).toISOString().split('T')[0];
      const change = (Math.random() - 0.48) * (price * 0.02);
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * (price * 0.01);
      const low = Math.min(open, close) - Math.random() * (price * 0.01);
      candles.push({
        time: dateStr,
        open,
        high,
        low,
        close,
        volume: Math.round(50000 + Math.random() * 200000),
      });
      price = close;
    }
    return candles;
  }

  async getMarketMovers(type: 'gainers' | 'losers' | 'volume'): Promise<StockQuote[]> {
    try {
      const overview = await this.getMarketOverview();
      if (overview.success && overview.data) {
        if (type === 'gainers' && overview.data.topGainers?.length > 0) {
          return overview.data.topGainers.map(this.mapQuoteToLegacy);
        }
        if (type === 'losers' && overview.data.topLosers?.length > 0) {
          return overview.data.topLosers.map(this.mapQuoteToLegacy);
        }
        if (type === 'volume' && overview.data.mostActive?.length > 0) {
          return overview.data.mostActive.map(this.mapQuoteToLegacy);
        }
      }
    } catch {
      // fallback
    }
    const stocks = [...FIXTURE_STOCKS];
    if (type === 'gainers') return stocks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    if (type === 'losers') return stocks.sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
    return stocks.sort((a, b) => b.volume - a.volume).slice(0, 5);
  }

  private mapQuoteToLegacy(q: MarketQuoteItem): StockQuote {
    return {
      symbol: q.symbol,
      name: q.companyName,
      sector: q.sector,
      ltpPaise: q.ltpPaise,
      changePercent: q.changePercent,
      volume: q.volume,
      highPaise: q.highPaise,
      lowPaise: q.lowPaise,
      openPaise: q.openPaise,
      prevClosePaise: q.previousClosePaise,
      marketCapCr: Math.round((q.ltpPaise * 1000) / 100),
      peRatio: 28.5,
      week52HighPaise: q.week52HighPaise,
      week52LowPaise: q.week52LowPaise,
      depth: {
        bids: [],
        asks: [],
      },
    };
  }
}

export const marketService = new BackendMarketService();
