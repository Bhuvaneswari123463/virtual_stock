import {
  NormalizedQuote,
  NormalizedCandle,
  CandleResolution,
  NormalizedMarketOverview,
  SymbolSearchResult,
} from './types';

export interface IMarketDataProvider {
  readonly name: string;
  readonly isMock: boolean;
  readonly isDelayed: boolean;

  getQuote(symbol: string): Promise<NormalizedQuote | null>;
  getQuotes(symbols: string[]): Promise<NormalizedQuote[]>;
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  getCandles(
    symbol: string,
    resolution: CandleResolution,
    from: Date,
    to: Date
  ): Promise<NormalizedCandle[]>;
  getMarketOverview(): Promise<NormalizedMarketOverview>;
}
