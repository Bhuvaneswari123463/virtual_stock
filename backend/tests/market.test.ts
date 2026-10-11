import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { MarketService } from '../src/services/marketService';
import { MockMarketDataProvider } from '../src/services/market/mockProvider';
import { IMarketDataProvider } from '../src/services/market/provider.interface';
import {
  ProviderTimeoutError,
  ProviderMalformedResponseError,
  withRetry,
} from '../src/services/market/retry';
import { RequestDeduplicator } from '../src/services/market/deduplicator';
import { MarketCache } from '../src/services/market/cache';
import { getIndianMarketSessionStatus } from '../src/services/market/types';

describe('Phase 5 Market Data Integration & Service Tests', () => {
  const app = createApp();

  describe('Deterministic Mock Provider Contract', () => {
    const mockProvider = new MockMarketDataProvider();

    it('returns normalized quote with Indian equities attributes and explicit mock tagging', async () => {
      const quote = await mockProvider.getQuote('RELIANCE');
      expect(quote).not.toBeNull();
      expect(quote?.symbol).toBe('RELIANCE');
      expect(quote?.exchange).toBe('NSE');
      expect(quote?.currency).toBe('INR');
      expect(quote?.ltpPaise).toBeGreaterThan(0);
      expect(quote?.dataSource).toBe('MOCK_SIMULATED');
      expect(quote?.isMock).toBe(true);
      expect(quote?.isDelayed).toBe(false);
      expect(quote?.week52HighPaise).toBeGreaterThan(quote!.week52LowPaise);
    });

    it('generates reproducible deterministic OHLCV candles', async () => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date();
      const candles = await mockProvider.getCandles('TCS', '1D', from, to);

      expect(Array.isArray(candles)).toBe(true);
      expect(candles.length).toBeGreaterThan(0);
      const c = candles[0];
      expect(c).toHaveProperty('timestamp');
      expect(c).toHaveProperty('openPaise');
      expect(c).toHaveProperty('highPaise');
      expect(c).toHaveProperty('lowPaise');
      expect(c).toHaveProperty('closePaise');
      expect(c).toHaveProperty('volume');
      expect(c.highPaise).toBeGreaterThanOrEqual(c.lowPaise);
    });

    it('performs symbol search returning matching Indian equities', async () => {
      const results = await mockProvider.searchSymbols('tata');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.symbol === 'TATAMOTORS')).toBe(true);
    });

    it('returns empty array when search query finds no match', async () => {
      const results = await mockProvider.searchSymbols('nonexistentxyz123');
      expect(results).toEqual([]);
    });

    it('computes market overview with Indian indices, session info, and movers', async () => {
      const overview = await mockProvider.getMarketOverview();
      expect(overview.indices.length).toBeGreaterThanOrEqual(2);
      expect(overview.indices.some((idx) => idx.name.includes('NIFTY'))).toBe(true);
      expect(overview.session).toBeDefined();
      expect(['OPEN', 'CLOSED', 'PRE_MARKET', 'POST_MARKET']).toContain(overview.session.status);
      expect(overview.topGainers.length).toBeGreaterThan(0);
      expect(overview.topLosers.length).toBeGreaterThan(0);
      expect(overview.mostActive.length).toBeGreaterThan(0);
      expect(overview.advancesCount + overview.declinesCount).toBeGreaterThan(0);
    });
  });

  describe('Indian Standard Time (IST) Session Normalization', () => {
    it('accurately normalizes session status and trading day', () => {
      const session = getIndianMarketSessionStatus();
      expect(session.exchange).toBe('NSE');
      expect(typeof session.isTradingDay).toBe('boolean');
      expect(session.currentTimeIST).toMatch(/\d{2}:\d{2} IST/);
      expect(session.statusLabel).toBeDefined();
    });
  });

  describe('Server-Side Caching & Stale-Data Recovery', () => {
    it('caches quotes and returns stale data when provider fails', async () => {
      const cache = new MarketCache(60);
      const testQuote = {
        symbol: 'TESTSTOCK',
        companyName: 'Test Stock Ltd.',
        sector: 'Technology',
        exchange: 'NSE' as const,
        currency: 'INR' as const,
        ltpPaise: 100000,
        openPaise: 99000,
        highPaise: 101000,
        lowPaise: 98000,
        previousClosePaise: 99000,
        volume: 50000,
        changePaise: 1000,
        changePercent: 1.01,
        week52HighPaise: 120000,
        week52LowPaise: 80000,
        dataSource: 'MOCK_SIMULATED',
        isDelayed: false,
        isMock: true,
        isStale: false,
        lastUpdated: new Date().toISOString(),
      };

      cache.setQuote(testQuote);

      const cached = cache.getQuote('TESTSTOCK');
      expect(cached.quote).not.toBeNull();
      expect(cached.isStale).toBe(false);

      // Create a failing provider
      const failingProvider: IMarketDataProvider = {
        name: 'FailingProvider',
        isMock: true,
        isDelayed: false,
        getQuote: vi.fn().mockRejectedValue(new Error('Network failure')),
        getQuotes: vi.fn().mockRejectedValue(new Error('Network failure')),
        searchSymbols: vi.fn().mockResolvedValue([]),
        getCandles: vi.fn().mockResolvedValue([]),
        getMarketOverview: vi.fn().mockRejectedValue(new Error('Network failure')),
      };

      const marketService = new MarketService(failingProvider, 0); // 0s TTL = immediately stale
      marketService.getCache().setQuote(testQuote, -1000); // Set as already expired

      const response = await marketService.getStockDetail('TESTSTOCK');
      expect(response.quote.symbol).toBe('TESTSTOCK');
      expect(response.quote.isStale).toBe(true);
    });
  });

  describe('In-Flight Request Deduplication', () => {
    it('deduplicates simultaneous in-flight provider requests', async () => {
      const deduplicator = new RequestDeduplicator();
      let callCount = 0;

      const expensiveFetch = () =>
        new Promise<string>((resolve) => {
          callCount++;
          setTimeout(() => resolve('data'), 50);
        });

      // Fire 5 concurrent requests with identical key
      const [res1, res2, res3, res4, res5] = await Promise.all([
        deduplicator.execute('quote:RELIANCE', expensiveFetch),
        deduplicator.execute('quote:RELIANCE', expensiveFetch),
        deduplicator.execute('quote:RELIANCE', expensiveFetch),
        deduplicator.execute('quote:RELIANCE', expensiveFetch),
        deduplicator.execute('quote:RELIANCE', expensiveFetch),
      ]);

      expect(res1).toBe('data');
      expect(res2).toBe('data');
      expect(res3).toBe('data');
      expect(res4).toBe('data');
      expect(res5).toBe('data');
      // Coalesced into exactly 1 provider execution!
      expect(callCount).toBe(1);
    });
  });

  describe('Retry & Provider Error Resilience', () => {
    it('retries transient failures with exponential backoff up to maxRetries', async () => {
      let attempts = 0;

      const failingCall = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary glitch');
        }
        return 'success';
      };

      const result = await withRetry(failingCall, {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('aborts and throws ProviderTimeoutError when call exceeds timeoutMs', async () => {
      const slowCall = (signal: AbortSignal) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            const err = new Error('AbortError');
            err.name = 'AbortError';
            reject(err);
          });
        });

      await expect(
        withRetry(slowCall, {
          maxRetries: 0,
          timeoutMs: 50,
        })
      ).rejects.toThrow(ProviderTimeoutError);
    });

    it('does not retry non-transient ProviderMalformedResponseError', async () => {
      let attempts = 0;
      const malformedCall = async () => {
        attempts++;
        throw new ProviderMalformedResponseError('Corrupted JSON from provider');
      };

      await expect(
        withRetry(malformedCall, { maxRetries: 3, initialDelayMs: 10 })
      ).rejects.toThrow(ProviderMalformedResponseError);

      expect(attempts).toBe(1); // Fails fast without redundant retries
    });
  });

  describe('HTTP Endpoints & Stock Explorer API Contracts', () => {
    it('GET /api/v1/markets returns sorted, paginated stock list with indicators', async () => {
      const res = await request(app).get('/api/v1/markets?page=1&limit=5&sortBy=ltpPaise&sortOrder=desc');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);

      const stock = res.body.data[0];
      expect(stock).toHaveProperty('symbol');
      expect(stock).toHaveProperty('companyName');
      expect(stock).toHaveProperty('ltpFormatted');
      expect(stock).toHaveProperty('changeFormatted');
      expect(stock).toHaveProperty('dataSource');
      expect(stock).toHaveProperty('isDelayed');
      expect(stock).toHaveProperty('isMock');
      expect(stock).toHaveProperty('isStale');
      expect(res.body.pagination).toBeDefined();
    });

    it('GET /api/v1/markets filters by search query and sector', async () => {
      const res = await request(app).get('/api/v1/markets?search=tata');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        res.body.data.every(
          (s: any) =>
            s.symbol.toLowerCase().includes('tata') || s.companyName.toLowerCase().includes('tata')
        )
      ).toBe(true);
    });

    it('GET /api/v1/markets/overview returns live Indian market indices and session status', async () => {
      const res = await request(app).get('/api/v1/markets/overview');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('indices');
      expect(res.body.data).toHaveProperty('session');
      expect(res.body.data).toHaveProperty('topGainers');
      expect(res.body.data).toHaveProperty('topLosers');
      expect(res.body.data).toHaveProperty('mostActive');
      expect(res.body.data).toHaveProperty('advancesCount');
      expect(res.body.data).toHaveProperty('declinesCount');
    });

    it('GET /api/v1/markets/search returns symbol autocomplete results', async () => {
      const res = await request(app).get('/api/v1/markets/search?q=infy');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.some((s: any) => s.symbol === 'INFY')).toBe(true);
    });

    it('GET /api/v1/markets/:symbol returns stock detail with order depth book', async () => {
      const res = await request(app).get('/api/v1/markets/INFY');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote.symbol).toBe('INFY');
      expect(res.body.data.marketDepth.bids.length).toBe(5);
      expect(res.body.data.marketDepth.asks.length).toBe(5);
      expect(res.body.data.marketDepth.totalBidQuantity).toBeGreaterThan(0);
      expect(res.body.data.marketDepth.totalAskQuantity).toBeGreaterThan(0);
    });

    it('GET /api/v1/markets/:symbol/candles returns historical OHLCV candles', async () => {
      const res = await request(app).get('/api/v1/markets/RELIANCE/candles?resolution=1D');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const candle = res.body.data[0];
      expect(candle).toHaveProperty('timestamp');
      expect(candle).toHaveProperty('openPaise');
      expect(candle).toHaveProperty('highPaise');
      expect(candle).toHaveProperty('lowPaise');
      expect(candle).toHaveProperty('closePaise');
      expect(candle).toHaveProperty('volume');
    });

    it('GET /api/v1/markets/:symbol returns 404 for unknown stock', async () => {
      const res = await request(app).get('/api/v1/markets/NOTREALXYZ');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
