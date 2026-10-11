# Market Data Providers & Stock Explorer Architecture

## 1. Overview & Architectural Philosophy

VirtualTrade is built upon a **provider-independent market-data layer**. The application business logic (order routing, portfolio valuations, stock exploration, and charts) does not couple directly with any single market data vendor.

```
┌──────────────────────────────────────────────────────────────────┐
│                   Frontend Client Applications                   │
│   (Stock Explorer, Live Watchlists, Interactive TradingView)     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTP / JSON API
┌─────────────────────────────────▼────────────────────────────────┐
│               MarketService (Application Boundary)               │
│  - Integer Paise authoritativeness (₹1 = 100 paise)              │
│  - In-flight request deduplication (RequestDeduplicator)         │
│  - Two-tier caching (In-Memory Map + Mongo MarketDataCache)      │
│  - Graceful stale-while-revalidate fallback                      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ IMarketDataProvider Contract
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
   ┌───────────────────────────┐     ┌───────────────────────────┐
   │ MockMarketDataProvider    │     │ YahooFinanceProvider      │
   │ - Deterministic mock seed │     │ - Real Indian equities    │
   │ - High-performance dev/CI│     │ - NSE (.NS) & BSE (.BO)   │
   │ - Reproducible candles    │     │ - NIFTY 50 & SENSEX       │
   │ - Tag: MOCK_SIMULATED     │     │ - Tag: YAHOO_FINANCE      │
   └───────────────────────────┘     └───────────────────────────┘
```

---

## 2. Standardized Provider Contract (`IMarketDataProvider`)

Every market data provider implements the strict interface defined in `backend/src/services/market/provider.interface.ts`:

```typescript
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
```

### Normalization Standards
- **Currency**: Normalized to `INR` (Indian Rupee).
- **Price Units**: Authoritative integer paise (`100 paise = ₹1.00`). No floating-point rounding drifts.
- **Trading Session**: Computed against Indian Standard Time (IST, UTC+5:30) trading hours (09:15 - 15:30 IST, Monday-Friday).
- **Provenance Attributes**: Every quote and overview payload includes:
  - `dataSource`: e.g. `'MOCK_SIMULATED'`, `'YAHOO_FINANCE'`
  - `isDelayed`: `true` for 15-minute delayed feeds
  - `isMock`: `true` for paper trading mock feeds
  - `isStale`: `true` if serving cached fallback during upstream provider outage

---

## 3. Supported Providers

### A. Deterministic Mock Provider (`mock`)
- **Default in development and automated testing**.
- Provides realistic, high-coverage data for 20 major Nifty 50 stocks (RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, TATAMOTORS, SBIN, BHARTIARTL, ITC, LT, etc.).
- Deterministic candlestick generator seeded by symbol hash: ensures identical historical charts across page reloads without network latency.
- Simulated 5-level order book market depth (bids and asks with quantities and orders).

### B. Yahoo Finance Real Provider (`yahoo` / `delayed`)
- Live delayed (15-minute) data feed for Indian equities.
- **Symbol Resolution**: Automatically maps standard Indian tickers to Yahoo conventions:
  - NSE: `RELIANCE` $\to$ `RELIANCE.NS`
  - BSE: `TCS` $\to$ `TCS.BO`
  - Indices: `NIFTY 50` $\to$ `^NSEI`, `SENSEX` $\to$ `^BSESN`
- Historical candlestick data spanning `1m`, `5m`, `15m`, `1h`, `1D`, `1W`, `1M`.
- Free public access without sensitive keys on the client; all queries are routed through the backend adapter.

---

## 4. Server-Side Reliability & Resilience

1. **In-Flight Request Deduplication (`RequestDeduplicator`)**:
   - Multiple concurrent user requests for the same stock quote or candlestick range coalesce into a single upstream provider network request.
2. **Server-Side Caching (`MarketCache`)**:
   - Configurable TTL (default 30 seconds for quotes, 5 minutes for candles).
   - If an upstream provider suffers a timeout or rate limit (HTTP 429), `MarketService` automatically serves the cached snapshot marked with `isStale: true`.
3. **Bounded Retries with Jitter (`withRetry`)**:
   - Exponential backoff with randomized jitter prevents thundering-herd issues against provider rate limits.
   - Request timeouts handled cleanly via `AbortController` (default 5000ms).
   - Malformed provider responses (`ProviderMalformedResponseError`) fail fast without futile retries.

---

## 5. Configuration Environment Variables

Configured in `backend/.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `MARKET_DATA_PROVIDER` | Provider selector: `mock`, `yahoo`, `delayed`, `live` | `mock` |
| `MARKET_DATA_CACHE_TTL_SECONDS` | In-memory quote cache TTL in seconds | `30` |
| `MARKET_DATA_TIMEOUT_MS` | Upstream provider HTTP timeout in milliseconds | `5000` |
| `MARKET_DATA_API_KEY` | Optional API key for commercial providers | `""` |

---

## 6. Endpoints Implemented

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/markets` | Searchable, sortable, filterable stock explorer list with pagination |
| `GET` | `/api/v1/markets/overview` | Indian indices (Nifty 50, Sensex), session status, top movers, market breadth |
| `GET` | `/api/v1/markets/search?q=:query` | Stock symbol and company autocomplete search |
| `GET` | `/api/v1/markets/:symbol` | Detailed equity quote, 52-week statistics, 5-tier order book market depth |
| `GET` | `/api/v1/markets/:symbol/candles` | Historical OHLCV candles formatted for TradingView charts |
