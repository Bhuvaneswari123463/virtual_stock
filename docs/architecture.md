# VirtualTrade Architecture Specification

VirtualTrade is an institutional-grade, educational virtual stock-trading platform focused on Indian equities (NSE & BSE), built with a provider-independent architecture designed to support global exchanges seamlessly.

## 1. System Topology

```
+-------------------------------------------------------------+
|                   Frontend (Client App)                     |
|  - React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui      |
|  - TradingView Lightweight Charts & Recharts                |
|  - Realtime Socket.IO client & React Query state caching    |
+------------------------------+------------------------------+
                               |
                   HTTP (REST) | Socket.IO (Ticks & Fills)
                               |
+------------------------------v------------------------------+
|                   Backend API & Engine                      |
|  - Express, TypeScript, Node.js                             |
|  - Zod Request Validation & Structured Logging (UUID trace) |
|  - Centralized Operational Error Architecture               |
|  - Concurrency-safe Order Matching & Cash Ledger Engine     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 MongoDB Persistence Layer                   |
|  - Users, Wallets, Ledgers, Orders, Positions, Competitions |
|  - ACID Multi-Document Transactions                         |
+-------------------------------------------------------------+
```

## 2. Core Architectural Guarantees

### 2.1 Server-Authoritative Financial Engine & Absolute Integer Precision
* **Zero Binary Floating-Point Arithmetic for Money:** Every rupee balance is authoritatively stored as an integer in **paise** ($1\text{ INR} = 100\text{ paise}$).
* **Double-Entry Cash Ledger:** Every modification to a user's wallet is paired with an immutable double-entry ledger record (`DEBIT` or `CREDIT`).
* **Initial Capital Guarantee:** Every new account is provisioned with exactly ₹10,00,000 (100,000,000 paise) exactly once upon wallet initialization.
* **Order Collateral Reservations:**
  * **BUY Limit Orders:** Required cash amount (`limit_price * quantity + estimated_brokerage`) is locked in reserve upon placement.
  * **SELL Orders:** Required share quantity is locked from available holdings to avoid overselling.

### 2.2 Provider-Independent Market Data Engine
Market data is decoupled behind an `IMarketDataProvider` interface:
* `getQuote(symbol)`
* `getCandles(symbol, timeframe, from, to)`
* `searchSymbols(query)`
* `subscribeTicker(symbols, callback)`

Implementations:
1. `MockMarketDataProvider` (Phase 3 default): Deterministic simulated feed modeling Indian equities (NIFTY 50, BANK NIFTY constituents) with Geometric Brownian Motion and realistic order book depth.
2. `LiveMarketDataProvider` (Future phase): Real-time websocket and REST integration for live feeds.

### 2.3 Authentication and Session Architecture
* **Access Tokens:** Short-lived JWTs (15 minutes expiry) passed in the `Authorization: Bearer <token>` header or authenticated socket handshake.
* **Refresh Tokens:** Long-lived (7 days), stored in secure `HttpOnly`, `SameSite=Strict` cookies with single-use rotation and revocation on reuse detection.

---
