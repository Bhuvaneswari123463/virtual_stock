# Phase 6 Implementation: Stock-Detail Pages, Watchlists & Order-Ticket UI

## 1. Overview
Phase 6 establishes complete interactive stock inspection, personalized multi-watchlist tracking with server-side persistence, real-time WebSocket tick streaming with provider-compliant fallback polling, and an order-ticket interface with margin preview and statutory charges calculation.

---

## 2. Stock Detail Page
- **Route**: `/app/markets/:symbol`
- **Header**:
  - Company name, ticker symbol, exchange (NSE/BSE), currency (`INR`).
  - Market data source indicator (`Simulated Paper Feed` / `15m Delayed Real Feed`).
  - Stale snapshot indicator (`Cached / Stale`) when upstream feed is disconnected.
  - Connection mode indicator (`Live WebSocket` / `Polling Fallback`).
  - Quick Watchlist Bookmark button (`Add to Watchlist` / `In Watchlist` with instant state toggle and toast notifications).
- **Interactive Candlestick Chart**:
  - Built with **TradingView Lightweight Charts**.
  - Dynamic timeframe selector (`1m`, `5m`, `15m`, `1h`, `1D`, `1W`).
  - Real-time hover crosshair tooltip overlay displaying Open, High, Low, Close, and Volume for the hovered candle.
  - Color-synchronized volume histogram bars matching candlestick direction.
- **Price Statistics & Fundamentals**:
  - Day High / Low, Open, Previous Close, Volume, and 52-Week High / Low.
- **Simulated Order Book (Market Depth)**:
  - 5-tier bid and ask levels with tick size ₹0.05, cumulative quantities, and order counts.
- **Order Ticket Panel**:
  - Integrated into desktop layout with full input validation and preview.

---

## 3. Watchlists & User Preferences
- **Backend Endpoints**:
  - `GET /api/v1/watchlists`: Retrieves user watchlists enriched with current quote data. Automatically initializes a default "My Watchlist" for new accounts.
  - `POST /api/v1/watchlists`: Creates new custom watchlists (prevents duplicate names per user with HTTP 409).
  - `POST /api/v1/watchlists/:id/symbols`: Adds a symbol after validating existence in market feed; **strictly prevents duplicate entries** (HTTP 409).
  - `DELETE /api/v1/watchlists/:id/symbols/:symbol`: Removes symbol from watchlist.
  - `PUT /api/v1/watchlists/:id/reorder`: Persists custom user ordering.
  - `DELETE /api/v1/watchlists/:id`: Deletes custom watchlists (protects default watchlist with HTTP 400).
- **Frontend Watchlist Terminal (`/app/watchlist`)**:
  - Tabbed multi-watchlist navigation.
  - Search filter within saved stock baskets.
  - Reorder up/down controls.
  - Responsive table layout with LTP, daily % change, Day High/Low, volume, and direct links to `/app/markets/:symbol`.
  - Empty state with one-click popular equity additions (RELIANCE, TCS, HDFCBANK, INFY, TATAMOTORS).

---

## 4. Real-Time Behavior & Fallback Polling
- **Socket.IO Gateway (`backend/src/realtime/socketGateway.ts`)**:
  - Authenticated via JWT token with support for public quote rooms.
  - Efficient room-based subscriptions (`subscribe:symbol`, `subscribe:symbols`, `unsubscribe:symbol`).
  - Active symbol background broadcaster emitting `quote:update` events every 2.5 seconds.
  - Clean subscription teardown on socket disconnect.
- **Frontend MarketFeedContext (`frontend/src/context/MarketFeedContext.tsx`)**:
  - Auto-connects to Socket.IO.
  - **Graceful Fallback Polling**: If the socket connection drops or fails, automatically transitions to provider-compliant HTTP polling (every 5 seconds) for all subscribed symbols.
  - Automatically merges live price and change ticks into both active stock detail and watchlist rows.

---

## 5. Order Ticket UI (Preview Mode)
- **Component**: `frontend/src/components/trading/OrderTicket.tsx`
- **Features**:
  - Buy (Emerald) vs Sell (Rose) tabs.
  - Product types: Delivery (`CNC` - 1x capital) vs Intraday (`MIS` - 5x virtual leverage preview with auto square-off explanation).
  - Order types: Market, Limit, Stop-Loss (`SL`), Stop-Loss Market (`SL-M`).
  - Input validation:
    - Quantity $\ge 1$ integer.
    - Limit price $> 0$ adhering to NSE tick size (₹0.05).
    - Trigger price validation relative to LTP for stop-loss orders.
    - Capital sufficiency check against available virtual cash.
  - Realistic Statutory Charges Breakdown:
    - STT (Securities Transaction Tax)
    - Exchange turnover fee
    - GST (18%)
    - Stamp duty and SEBI turnover fees
  - **Simulated Order Preview Dialog**:
    - Validates order and displays detailed summary of trade value, required margin, and regulatory charges.
    - Explicit notification: "Simulated Paper Trading Order Preview — Order execution will be enabled in Phase 7."
    - **Trade execution is strictly deferred until Phase 7** per requirements.

---

## 6. Verification & Test Suite
- **Vitest Test Suite**: **80 / 80 tests passing** across 8 test suites:
  - `auth.test.ts` (17 tests)
  - `market.test.ts` (15 tests)
  - `watchlist.test.ts` (9 tests)
  - `models.test.ts` (18 tests)
  - `api.test.ts` (9 tests)
  - `money.test.ts` (5 tests)
  - `calculations.test.ts` (5 tests)
  - `health.test.ts` (2 tests)
- **Typecheck**: Backend `tsc --noEmit` passed with 0 errors.
- **Frontend Build**: `tsc -b && vite build` bundled cleanly with 0 errors.
