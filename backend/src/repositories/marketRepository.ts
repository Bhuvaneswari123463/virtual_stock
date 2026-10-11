import { MarketDataCache } from '../models';
import { dbManager } from '../config/database';
import { MarketFilterQuery } from '../schemas/marketSchemas';
import { PaginatedResult } from '../schemas/commonSchemas';

export interface MarketQuoteDTO {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  ltpPaise: number;
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  previousClosePaise: number;
  volume: number;
  changePaise: number;
  changePercent: number;
  lastUpdated: string;
}

export const INITIAL_EQUITIES_SEED = [
  {
    symbol: 'RELIANCE',
    exchange: 'NSE' as const,
    companyName: 'Reliance Industries Ltd.',
    sector: 'Energy & Petrochemicals',
    ltpPaise: 298540, // ₹2,985.40
    openPaise: 294000,
    highPaise: 301200,
    lowPaise: 293500,
    previousClosePaise: 294500,
    volume: 8450200,
    changePaise: 4040,
    changePercent: 1.37,
    lastUpdated: new Date(),
  },
  {
    symbol: 'TCS',
    exchange: 'NSE' as const,
    companyName: 'Tata Consultancy Services',
    sector: 'Information Technology',
    ltpPaise: 389210, // ₹3,892.10
    openPaise: 391000,
    highPaise: 392500,
    lowPaise: 387800,
    previousClosePaise: 391500,
    volume: 2310400,
    changePaise: -2290,
    changePercent: -0.59,
    lastUpdated: new Date(),
  },
  {
    symbol: 'HDFCBANK',
    exchange: 'NSE' as const,
    companyName: 'HDFC Bank Ltd.',
    sector: 'Financial Services',
    ltpPaise: 164280, // ₹1,642.80
    openPaise: 163000,
    highPaise: 165500,
    lowPaise: 162800,
    previousClosePaise: 163250,
    volume: 14200500,
    changePaise: 1030,
    changePercent: 0.63,
    lastUpdated: new Date(),
  },
  {
    symbol: 'INFY',
    exchange: 'NSE' as const,
    companyName: 'Infosys Ltd.',
    sector: 'Information Technology',
    ltpPaise: 178550, // ₹1,785.50
    openPaise: 175000,
    highPaise: 180200,
    lowPaise: 174800,
    previousClosePaise: 174800,
    volume: 6720000,
    changePaise: 3750,
    changePercent: 2.15,
    lastUpdated: new Date(),
  },
  {
    symbol: 'ICICIBANK',
    exchange: 'NSE' as const,
    companyName: 'ICICI Bank Ltd.',
    sector: 'Financial Services',
    ltpPaise: 121560, // ₹1,215.60
    openPaise: 120500,
    highPaise: 122400,
    lowPaise: 120100,
    previousClosePaise: 120800,
    volume: 9812000,
    changePaise: 760,
    changePercent: 0.63,
    lastUpdated: new Date(),
  },
  {
    symbol: 'TATAMOTORS',
    exchange: 'NSE' as const,
    companyName: 'Tata Motors Ltd.',
    sector: 'Automobile',
    ltpPaise: 96525, // ₹965.25
    openPaise: 94500,
    highPaise: 97800,
    lowPaise: 94200,
    previousClosePaise: 94800,
    volume: 12840000,
    changePaise: 1725,
    changePercent: 1.82,
    lastUpdated: new Date(),
  },
  {
    symbol: 'BHARTIARTL',
    exchange: 'NSE' as const,
    companyName: 'Bharti Airtel Ltd.',
    sector: 'Telecommunications',
    ltpPaise: 168400, // ₹1,684.00
    openPaise: 167000,
    highPaise: 169500,
    lowPaise: 166800,
    previousClosePaise: 167200,
    volume: 4560000,
    changePaise: 1200,
    changePercent: 0.72,
    lastUpdated: new Date(),
  },
  {
    symbol: 'ITC',
    exchange: 'NSE' as const,
    companyName: 'ITC Ltd.',
    sector: 'Consumer Goods',
    ltpPaise: 49215, // ₹492.15
    openPaise: 49400,
    highPaise: 49600,
    lowPaise: 48950,
    previousClosePaise: 49500,
    volume: 8120000,
    changePaise: -285,
    changePercent: -0.58,
    lastUpdated: new Date(),
  },
  {
    symbol: 'LT',
    exchange: 'NSE' as const,
    companyName: 'Larsen & Toubro Ltd.',
    sector: 'Construction & Engineering',
    ltpPaise: 354000, // ₹3,540.00
    openPaise: 351000,
    highPaise: 356800,
    lowPaise: 350500,
    previousClosePaise: 352200,
    volume: 2450000,
    changePaise: 1800,
    changePercent: 0.51,
    lastUpdated: new Date(),
  },
  {
    symbol: 'SBIN',
    exchange: 'NSE' as const,
    companyName: 'State Bank of India',
    sector: 'Financial Services',
    ltpPaise: 82540, // ₹825.40
    openPaise: 81800,
    highPaise: 83200,
    lowPaise: 81500,
    previousClosePaise: 82000,
    volume: 16300000,
    changePaise: 540,
    changePercent: 0.66,
    lastUpdated: new Date(),
  },
];

export class MarketRepository {
  private inMemoryQuotes = [...INITIAL_EQUITIES_SEED];

  async ensureSeeded(): Promise<void> {
    if (!dbManager.isConnected()) return;
    try {
      const count = await MarketDataCache.countDocuments();
      if (count === 0) {
        await MarketDataCache.insertMany(INITIAL_EQUITIES_SEED);
      }
    } catch {
      // Continue gracefully
    }
  }

  async findMany(query: MarketFilterQuery): Promise<PaginatedResult<MarketQuoteDTO>> {
    const { page, limit, search, sector, exchange, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    if (dbManager.isConnected()) {
      await this.ensureSeeded();

      const filter: Record<string, any> = {};
      if (exchange) filter.exchange = exchange;
      if (sector) filter.sector = sector;
      if (search) {
        filter.$or = [
          { symbol: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
        ];
      }

      const sortDir = sortOrder === 'asc' ? 1 : -1;
      const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortDir };

      const [docs, total] = await Promise.all([
        MarketDataCache.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
        MarketDataCache.countDocuments(filter),
      ]);

      const items = docs.map(this.mapDocToDTO);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        items,
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

    // In-memory fallback
    let filtered = [...this.inMemoryQuotes];
    if (exchange) filtered = filtered.filter((q) => q.exchange === exchange);
    if (sector) filtered = filtered.filter((q) => q.sector.toLowerCase() === sector.toLowerCase());
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (q) => q.symbol.toLowerCase().includes(s) || q.companyName.toLowerCase().includes(s)
      );
    }

    filtered.sort((a, b) => {
      const valA = (a as any)[sortBy] ?? 0;
      const valB = (b as any)[sortBy] ?? 0;
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: paginated.map(this.mapDocToDTO),
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

  async findBySymbol(symbol: string): Promise<MarketQuoteDTO | null> {
    const upperSymbol = symbol.toUpperCase();

    if (dbManager.isConnected()) {
      await this.ensureSeeded();
      const doc = await MarketDataCache.findOne({ symbol: upperSymbol }).lean();
      return doc ? this.mapDocToDTO(doc) : null;
    }

    const item = this.inMemoryQuotes.find((q) => q.symbol === upperSymbol);
    return item ? this.mapDocToDTO(item) : null;
  }

  private mapDocToDTO(doc: any): MarketQuoteDTO {
    return {
      symbol: doc.symbol,
      companyName: doc.companyName,
      sector: doc.sector,
      exchange: doc.exchange,
      ltpPaise: doc.ltpPaise,
      openPaise: doc.openPaise,
      highPaise: doc.highPaise,
      lowPaise: doc.lowPaise,
      previousClosePaise: doc.previousClosePaise,
      volume: doc.volume,
      changePaise: doc.changePaise,
      changePercent: doc.changePercent,
      lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated).toISOString() : new Date().toISOString(),
    };
  }
}

export const marketRepository = new MarketRepository();
