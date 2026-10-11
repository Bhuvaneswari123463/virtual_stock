import { config } from '../../config';
import { IMarketDataProvider } from './provider.interface';
import { mockMarketDataProvider } from './mockProvider';
import { YahooFinanceProvider } from './yahooProvider';
import { logger } from '../../utilities/logger';

export class MarketProviderFactory {
  private static instance: IMarketDataProvider | null = null;

  static getProvider(overrideType?: string): IMarketDataProvider {
    const providerType = (overrideType || config.MARKET_DATA_PROVIDER || 'mock').toLowerCase();

    switch (providerType) {
      case 'yahoo':
      case 'delayed':
      case 'live':
        logger.info('Initializing Yahoo Finance market data provider (Indian equities - 15m delayed)');
        return new YahooFinanceProvider();

      case 'mock':
      default:
        logger.info('Initializing Deterministic Mock market data provider (Educational simulation)');
        return mockMarketDataProvider;
    }
  }

  static getDefault(): IMarketDataProvider {
    if (!this.instance) {
      this.instance = this.getProvider();
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}
