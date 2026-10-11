export type Exchange = 'NSE' | 'BSE';

export type MarketSessionStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';

export type CandleResolution = '1m' | '5m' | '15m' | '1h' | '1D' | '1W' | '1M';

export interface NormalizedQuote {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: Exchange;
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
  marketCapCrores?: number;
  peRatio?: number;
  dataSource: string;
  isDelayed: boolean;
  isMock: boolean;
  isStale: boolean;
  lastUpdated: string;
}

export interface NormalizedCandle {
  timestamp: number; // Unix seconds
  openPaise: number;
  highPaise: number;
  lowPaise: number;
  closePaise: number;
  volume: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
  lastUpdated: string;
}

export interface MarketSessionInfo {
  status: MarketSessionStatus;
  statusLabel: string;
  exchange: 'NSE' | 'BSE';
  currentTimeIST: string;
  nextOpenIST: string;
  isTradingDay: boolean;
}

export interface NormalizedMarketOverview {
  indices: MarketIndex[];
  session: MarketSessionInfo;
  topGainers: NormalizedQuote[];
  topLosers: NormalizedQuote[];
  mostActive: NormalizedQuote[];
  advancesCount: number;
  declinesCount: number;
  dataSource: string;
  isDelayed: boolean;
  isMock: boolean;
  isStale?: boolean;
  lastUpdated: string;
}

export interface SymbolSearchResult {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  sector: string;
  ltpPaise?: number;
  changePercent?: number;
}

/**
 * Normalizes Indian Standard Time (UTC+5:30) trading session status
 * Standard normal equity trading hours on NSE/BSE: 09:15 to 15:30 IST, Monday through Friday
 */
export function getIndianMarketSessionStatus(): MarketSessionInfo {
  const now = new Date();
  // Compute current IST time
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffsetMs);

  const dayOfWeek = istDate.getUTCDay(); // 0 = Sun, 6 = Sat
  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();
  const totalMinutes = hour * 60 + minute;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  let status: MarketSessionStatus = 'CLOSED';
  let statusLabel = 'Market Closed';

  if (!isWeekend) {
    if (totalMinutes >= 540 && totalMinutes < 555) {
      // 09:00 - 09:15 IST
      status = 'PRE_MARKET';
      statusLabel = 'Pre-Market Open (09:00 - 09:15 IST)';
    } else if (totalMinutes >= 555 && totalMinutes <= 930) {
      // 09:15 - 15:30 IST
      status = 'OPEN';
      statusLabel = 'Live Market Session (09:15 - 15:30 IST)';
    } else if (totalMinutes > 930 && totalMinutes <= 960) {
      // 15:30 - 16:00 IST
      status = 'POST_MARKET';
      statusLabel = 'Post-Market Closing (15:30 - 16:00 IST)';
    } else {
      status = 'CLOSED';
      statusLabel = 'Closed (Opens 09:15 IST)';
    }
  } else {
    statusLabel = 'Weekend Closed (Opens Monday 09:15 IST)';
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const currentTimeIST = `${pad(hour)}:${pad(minute)} IST`;

  return {
    status,
    statusLabel,
    exchange: 'NSE',
    currentTimeIST,
    nextOpenIST: isWeekend
      ? 'Monday 09:15 IST'
      : totalMinutes > 930
      ? 'Tomorrow 09:15 IST'
      : '09:15 IST',
    isTradingDay: !isWeekend,
  };
}
