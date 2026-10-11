import { IMarketDataProvider } from './provider.interface';
import {
  NormalizedQuote,
  NormalizedCandle,
  CandleResolution,
  NormalizedMarketOverview,
  SymbolSearchResult,
  getIndianMarketSessionStatus,
} from './types';

export const INDIAN_EQUITIES_MOCK_CATALOG: Omit<NormalizedQuote, 'lastUpdated' | 'isStale'>[] = [
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd.',
    sector: 'Energy & Petrochemicals',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 298540,
    openPaise: 294000,
    highPaise: 301200,
    lowPaise: 293500,
    previousClosePaise: 294500,
    volume: 8450200,
    changePaise: 4040,
    changePercent: 1.37,
    week52HighPaise: 321790,
    week52LowPaise: 222030,
    marketCapCrores: 2020450,
    peRatio: 28.4,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services',
    sector: 'Information Technology',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 389210,
    openPaise: 391000,
    highPaise: 392500,
    lowPaise: 387800,
    previousClosePaise: 391500,
    volume: 2310400,
    changePaise: -2290,
    changePercent: -0.59,
    week52HighPaise: 458590,
    week52LowPaise: 331300,
    marketCapCrores: 1408120,
    peRatio: 30.2,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd.',
    sector: 'Financial Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 164280,
    openPaise: 163000,
    highPaise: 165500,
    lowPaise: 162800,
    previousClosePaise: 163250,
    volume: 14200500,
    changePaise: 1030,
    changePercent: 0.63,
    week52HighPaise: 179400,
    week52LowPaise: 136355,
    marketCapCrores: 1251300,
    peRatio: 18.9,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Ltd.',
    sector: 'Information Technology',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 178550,
    openPaise: 175000,
    highPaise: 180200,
    lowPaise: 174800,
    previousClosePaise: 174800,
    volume: 6720000,
    changePaise: 3750,
    changePercent: 2.15,
    week52HighPaise: 199145,
    week52LowPaise: 135835,
    marketCapCrores: 741200,
    peRatio: 27.6,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'ICICIBANK',
    companyName: 'ICICI Bank Ltd.',
    sector: 'Financial Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 121560,
    openPaise: 120500,
    highPaise: 122400,
    lowPaise: 120100,
    previousClosePaise: 120800,
    volume: 9812000,
    changePaise: 760,
    changePercent: 0.63,
    week52HighPaise: 133490,
    week52LowPaise: 91500,
    marketCapCrores: 854600,
    peRatio: 17.8,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'TATAMOTORS',
    companyName: 'Tata Motors Ltd.',
    sector: 'Automobile',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 96525,
    openPaise: 94500,
    highPaise: 97800,
    lowPaise: 94200,
    previousClosePaise: 94800,
    volume: 12840000,
    changePaise: 1725,
    changePercent: 1.82,
    week52HighPaise: 117905,
    week52LowPaise: 62200,
    marketCapCrores: 355000,
    peRatio: 10.4,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'BHARTIARTL',
    companyName: 'Bharti Airtel Ltd.',
    sector: 'Telecommunications',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 168400,
    openPaise: 167000,
    highPaise: 169500,
    lowPaise: 166800,
    previousClosePaise: 167200,
    volume: 4560000,
    changePaise: 1200,
    changePercent: 0.72,
    week52HighPaise: 177900,
    week52LowPaise: 90200,
    marketCapCrores: 958000,
    peRatio: 65.4,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'ITC',
    companyName: 'ITC Ltd.',
    sector: 'Consumer Goods',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 49215,
    openPaise: 49400,
    highPaise: 49600,
    lowPaise: 48950,
    previousClosePaise: 49500,
    volume: 8120000,
    changePaise: -285,
    changePercent: -0.58,
    week52HighPaise: 52855,
    week52LowPaise: 39930,
    marketCapCrores: 614000,
    peRatio: 29.8,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'LT',
    companyName: 'Larsen & Toubro Ltd.',
    sector: 'Construction & Engineering',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 354000,
    openPaise: 351000,
    highPaise: 356800,
    lowPaise: 350500,
    previousClosePaise: 352200,
    volume: 2450000,
    changePaise: 1800,
    changePercent: 0.51,
    week52HighPaise: 391990,
    week52LowPaise: 286500,
    marketCapCrores: 486700,
    peRatio: 37.1,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'SBIN',
    companyName: 'State Bank of India',
    sector: 'Financial Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 82540,
    openPaise: 81800,
    highPaise: 83200,
    lowPaise: 81500,
    previousClosePaise: 82000,
    volume: 16300000,
    changePaise: 540,
    changePercent: 0.66,
    week52HighPaise: 91210,
    week52LowPaise: 55530,
    marketCapCrores: 736000,
    peRatio: 10.9,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'KOTAKBANK',
    companyName: 'Kotak Mahindra Bank',
    sector: 'Financial Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 174500,
    openPaise: 175200,
    highPaise: 176000,
    lowPaise: 173800,
    previousClosePaise: 175600,
    volume: 3890000,
    changePaise: -1100,
    changePercent: -0.63,
    week52HighPaise: 193200,
    week52LowPaise: 154385,
    marketCapCrores: 346900,
    peRatio: 21.2,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'HINDUNILVR',
    companyName: 'Hindustan Unilever Ltd.',
    sector: 'Consumer Goods',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 268000,
    openPaise: 266500,
    highPaise: 269800,
    lowPaise: 266000,
    previousClosePaise: 267200,
    volume: 1850000,
    changePaise: 800,
    changePercent: 0.30,
    week52HighPaise: 303450,
    week52LowPaise: 217205,
    marketCapCrores: 629700,
    peRatio: 58.6,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'MARUTI',
    companyName: 'Maruti Suzuki India Ltd.',
    sector: 'Automobile',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 1245000,
    openPaise: 1238000,
    highPaise: 1255000,
    lowPaise: 1232000,
    previousClosePaise: 1241000,
    volume: 480000,
    changePaise: 4000,
    changePercent: 0.32,
    week52HighPaise: 1368000,
    week52LowPaise: 925000,
    marketCapCrores: 391400,
    peRatio: 28.1,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'BAJFINANCE',
    companyName: 'Bajaj Finance Ltd.',
    sector: 'Financial Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 712000,
    openPaise: 708000,
    highPaise: 721000,
    lowPaise: 705000,
    previousClosePaise: 706500,
    volume: 1240000,
    changePaise: 5500,
    changePercent: 0.78,
    week52HighPaise: 819200,
    week52LowPaise: 618780,
    marketCapCrores: 440200,
    peRatio: 27.5,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'SUNPHARMA',
    companyName: 'Sun Pharmaceutical Industries',
    sector: 'Healthcare & Pharma',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 184500,
    openPaise: 182000,
    highPaise: 185800,
    lowPaise: 181500,
    previousClosePaise: 182500,
    volume: 2950000,
    changePaise: 2000,
    changePercent: 1.10,
    week52HighPaise: 196000,
    week52LowPaise: 109200,
    marketCapCrores: 442600,
    peRatio: 39.4,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'TITAN',
    companyName: 'Titan Company Ltd.',
    sector: 'Consumer Goods',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 348000,
    openPaise: 351000,
    highPaise: 352500,
    lowPaise: 346000,
    previousClosePaise: 352000,
    volume: 1120000,
    changePaise: -4000,
    changePercent: -1.14,
    week52HighPaise: 388695,
    week52LowPaise: 305565,
    marketCapCrores: 308900,
    peRatio: 88.2,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'WIPRO',
    companyName: 'Wipro Ltd.',
    sector: 'Information Technology',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 54200,
    openPaise: 53800,
    highPaise: 54600,
    lowPaise: 53500,
    previousClosePaise: 53900,
    volume: 5420000,
    changePaise: 300,
    changePercent: 0.56,
    week52HighPaise: 57980,
    week52LowPaise: 37500,
    marketCapCrores: 283500,
    peRatio: 23.4,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'TATASTEEL',
    companyName: 'Tata Steel Ltd.',
    sector: 'Metals & Mining',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 15640,
    openPaise: 15400,
    highPaise: 15820,
    lowPaise: 15350,
    previousClosePaise: 15480,
    volume: 34200000,
    changePaise: 160,
    changePercent: 1.03,
    week52HighPaise: 18460,
    week52LowPaise: 11840,
    marketCapCrores: 195200,
    peRatio: 42.1,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'POWERGRID',
    companyName: 'Power Grid Corporation of India',
    sector: 'Utilities & Power',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 33850,
    openPaise: 33500,
    highPaise: 34100,
    lowPaise: 33400,
    previousClosePaise: 33600,
    volume: 11200000,
    changePaise: 250,
    changePercent: 0.74,
    week52HighPaise: 36625,
    week52LowPaise: 19680,
    marketCapCrores: 314800,
    peRatio: 19.8,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
  {
    symbol: 'ZOMATO',
    companyName: 'Zomato Ltd.',
    sector: 'Consumer Services',
    exchange: 'NSE',
    currency: 'INR',
    ltpPaise: 27850,
    openPaise: 27100,
    highPaise: 28240,
    lowPaise: 26900,
    previousClosePaise: 27150,
    volume: 48900000,
    changePaise: 700,
    changePercent: 2.58,
    week52HighPaise: 29825,
    week52LowPaise: 9800,
    marketCapCrores: 245800,
    peRatio: 120.5,
    dataSource: 'MOCK_SIMULATED',
    isDelayed: false,
    isMock: true,
  },
];

export class MockMarketDataProvider implements IMarketDataProvider {
  readonly name = 'MOCK_SIMULATED';
  readonly isMock = true;
  readonly isDelayed = false;

  private quotes: Map<string, NormalizedQuote>;

  constructor() {
    this.quotes = new Map();
    for (const q of INDIAN_EQUITIES_MOCK_CATALOG) {
      this.quotes.set(q.symbol, {
        ...q,
        isStale: false,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  async getQuote(symbol: string): Promise<NormalizedQuote | null> {
    const q = this.quotes.get(symbol.toUpperCase());
    if (!q) return null;
    return {
      ...q,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getQuotes(symbols: string[]): Promise<NormalizedQuote[]> {
    const results: NormalizedQuote[] = [];
    for (const sym of symbols) {
      const q = await this.getQuote(sym);
      if (q) results.push(q);
    }
    return results;
  }

  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      return Array.from(this.quotes.values()).slice(0, 10).map(this.mapToSearchResult);
    }

    const matches: SymbolSearchResult[] = [];
    for (const q of this.quotes.values()) {
      if (
        q.symbol.toLowerCase().includes(cleanQuery) ||
        q.companyName.toLowerCase().includes(cleanQuery) ||
        q.sector.toLowerCase().includes(cleanQuery)
      ) {
        matches.push(this.mapToSearchResult(q));
      }
    }
    return matches;
  }

  async getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: Date,
    to: Date
  ): Promise<NormalizedCandle[]> {
    const quote = await this.getQuote(symbol);
    const basePrice = quote ? quote.ltpPaise : 250000;

    return this.generateDeterministicCandles(symbol, basePrice, resolution, from, to);
  }

  async getMarketOverview(): Promise<NormalizedMarketOverview> {
    const allQuotes = Array.from(this.quotes.values());

    const sortedByChange = [...allQuotes].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedByChange.slice(0, 5);
    const topLosers = [...sortedByChange].reverse().slice(0, 5);
    const mostActive = [...allQuotes].sort((a, b) => b.volume - a.volume).slice(0, 5);

    const advances = allQuotes.filter((q) => q.changePercent > 0).length;
    const declines = allQuotes.filter((q) => q.changePercent < 0).length;

    const indices = [
      {
        symbol: 'NIFTY50',
        name: 'NIFTY 50',
        value: 24964.25,
        change: 142.8,
        changePercent: 0.58,
        isPositive: true,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'SENSEX',
        name: 'BSE SENSEX',
        value: 81611.41,
        change: 438.25,
        changePercent: 0.54,
        isPositive: true,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'BANKNIFTY',
        name: 'NIFTY BANK',
        value: 51532.7,
        change: -112.4,
        changePercent: -0.22,
        isPositive: false,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'NIFTYIT',
        name: 'NIFTY IT',
        value: 42180.95,
        change: 495.6,
        changePercent: 1.19,
        isPositive: true,
        lastUpdated: new Date().toISOString(),
      },
    ];

    return {
      indices,
      session: getIndianMarketSessionStatus(),
      topGainers,
      topLosers,
      mostActive,
      advancesCount: advances,
      declinesCount: declines,
      dataSource: this.name,
      isDelayed: this.isDelayed,
      isMock: this.isMock,
      lastUpdated: new Date().toISOString(),
    };
  }

  private mapToSearchResult(q: NormalizedQuote): SymbolSearchResult {
    return {
      symbol: q.symbol,
      companyName: q.companyName,
      exchange: q.exchange,
      sector: q.sector,
      ltpPaise: q.ltpPaise,
      changePercent: q.changePercent,
    };
  }

  /**
   * Generates realistic, reproducible historical OHLCV candlesticks based on a seed hash
   */
  private generateDeterministicCandles(
    symbol: string,
    currentPricePaise: number,
    resolution: CandleResolution,
    from: Date,
    to: Date
  ): NormalizedCandle[] {
    const candles: NormalizedCandle[] = [];

    // Calculate step seconds based on resolution
    let stepSeconds = 86400; // 1D
    if (resolution === '1m') stepSeconds = 60;
    else if (resolution === '5m') stepSeconds = 300;
    else if (resolution === '15m') stepSeconds = 900;
    else if (resolution === '1h') stepSeconds = 3600;
    else if (resolution === '1W') stepSeconds = 604800;
    else if (resolution === '1M') stepSeconds = 2592000;

    const fromSec = Math.floor(from.getTime() / 1000);
    const toSec = Math.floor(to.getTime() / 1000);

    // Limit candle points to a healthy window (max 300 candles)
    const points = Math.min(300, Math.max(10, Math.floor((toSec - fromSec) / stepSeconds)));
    const startSec = toSec - points * stepSeconds;

    // Simple deterministic PRNG seeded by symbol string
    let seed = 0;
    for (let i = 0; i < symbol.length; i++) {
      seed = (seed * 31 + symbol.charCodeAt(i)) & 0xffffffff;
    }
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 4294967296;
    };

    let price = currentPricePaise * (0.85 + rand() * 0.1);

    for (let i = 0; i < points; i++) {
      const ts = startSec + i * stepSeconds;

      const volatility = 0.015;
      const changeRatio = (rand() - 0.49) * volatility;
      const open = Math.round(price);
      const close = Math.round(price * (1 + changeRatio));
      const high = Math.round(Math.max(open, close) * (1 + rand() * 0.008));
      const low = Math.round(Math.min(open, close) * (1 - rand() * 0.008));
      const volume = Math.round(50000 + rand() * 500000);

      candles.push({
        timestamp: ts,
        openPaise: open,
        highPaise: high,
        lowPaise: low,
        closePaise: close,
        volume,
      });

      price = close;
    }

    // Anchor last candle close to currentPricePaise
    if (candles.length > 0) {
      candles[candles.length - 1].closePaise = currentPricePaise;
    }

    return candles;
  }
}

export const mockMarketDataProvider = new MockMarketDataProvider();
