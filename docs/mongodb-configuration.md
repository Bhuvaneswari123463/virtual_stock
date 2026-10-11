# VirtualTrade — MongoDB Configuration & Persistence Guide

This document details database setup, deployment topology requirements, multi-document ACID transaction support, and financial data modeling for **VirtualTrade**.

---

## 1. Deployment Topology & Transaction Requirements

VirtualTrade relies on **multi-document ACID transactions** for all financial and order-settlement operations (e.g. debiting virtual cash and crediting stock holdings simultaneously, or releasing locked cash on order cancellation).

> [!IMPORTANT]
> **MongoDB requirement for transactions:**
> Multi-document ACID transactions (`session.startTransaction()`) are only supported on:
> 1. **MongoDB Atlas** (any cluster tier, including free M0).
> 2. **Local or Self-Hosted MongoDB running as a Replica Set** (`mongod --replSet rs0`).
>
> Standalone `mongod` instances do *not* support multi-document transactions. If the backend detects a standalone instance, the `withTransaction` utility logs a diagnostic warning and executes gracefully without a session in non-strict modes.

---

## 2. Option A: Connecting to MongoDB Atlas (Recommended)

1. **Create an Atlas Account**: Visit [cloud.mongodb.com](https://cloud.mongodb.com/) and create a free Shared Cluster (M0).
2. **Database Access**: Under **Security > Database Access**, add a new database user with Read and Write permissions to `virtualtrade`.
3. **Network Access**: Under **Security > Network Access**, add your current IP address (or `0.0.0.0/0` during initial prototyping).
4. **Obtain Connection String**:
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the SRV URI:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/virtualtrade?retryWrites=true&w=majority&appName=VirtualTrade
     ```
5. **Update Backend `.env`**:
   In `backend/.env`:
   ```bash
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/virtualtrade?retryWrites=true&w=majority
   ```

---

## 3. Option B: Local MongoDB with Replica Set (Local Development)

### Method 1: Using Docker Compose (Easiest)

Run a single-node replica set in Docker:

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongo:
    image: mongo:7.0
    container_name: virtualtrade-mongo
    ports:
      - "27017:27017"
    command: ["--replSet", "rs0", "--bind_ip_all"]
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

1. Start the container:
   ```bash
   docker compose up -d
   ```
2. Initialize the replica set (only needed once):
   ```bash
   docker exec -it virtualtrade-mongo mongosh --eval "rs.initiate()"
   ```
3. Set your connection URI:
   ```bash
   MONGODB_URI=mongodb://127.0.0.1:27017/virtualtrade?replicaSet=rs0
   ```

---

### Method 2: Native Windows / macOS / Linux Local `mongod`

1. Start `mongod` with the `--replSet` flag:
   ```bash
   mongod --dbpath "C:\data\db" --replSet rs0 --port 27017
   ```
2. In a separate terminal, open the MongoDB shell:
   ```bash
   mongosh --port 27017
   ```
3. Initiate the replica set:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [{ _id: 0, host: "127.0.0.1:27017" }]
   });
   ```
4. Verify replica set status:
   ```javascript
   rs.status();
   ```

---

## 4. Single Source of Truth for Financial Precision

### Integer Minor Units (Paise)
Binary floating-point types (`number` in JavaScript or standard doubles in databases) suffer from rounding inaccuracies (e.g., `0.1 + 0.2 === 0.30000000000000004`).

VirtualTrade enforces an uncompromising mathematical rule across all models:
- **All currency values are stored as integers representing paise** (`₹1.00 = 100 paise`).
- Default starting capital: `₹10,00,000` = `100,000,000 paise`.
- Minimum equity tick size on NSE: `5 paise`.

### Double-Entry Cash Ledger
Account balances are never edited directly without a corresponding immutable ledger entry:
```typescript
// CashLedger schema
{
  portfolioId: ObjectId,
  userId: ObjectId,
  entryType: 'CREDIT' | 'DEBIT',
  category: 'INITIAL_CAPITAL' | 'TRADE_BUY' | 'TRADE_SELL' | 'ORDER_LOCK' | 'ORDER_UNLOCK',
  amountPaise: 298540,
  balanceAfterPaise: 99701460,
  referenceId: 'ord_12345',
  createdAt: ISODate(...)
}
```

Every balance adjustment is paired with a verifiable audit record.

---

## 5. Persistence Models Implemented in Phase 3

| Model | Collection | Primary Responsibility & Key Indexes |
| :--- | :--- | :--- |
| `User` | `users` | User credentials, roles, settings. Unique index on `email`, `username`. |
| `Session` | `sessions` | Refresh tokens with TTL auto-expiry index on `expiresAt`. |
| `Portfolio` | `portfolios` | Virtual wallet in paise with locked-cash tracking. Unique on `userId`. |
| `CashLedger` | `cashledgers` | Immutable audit log of every balance change. Compound index on `{ portfolioId: 1, createdAt: -1 }`. |
| `Holding` | `holdings` | Open positions with average buy price. Unique compound index on `{ userId: 1, symbol: 1 }`. |
| `Order` | `orders` | Buy/Sell market & limit orders. Compound index on `{ userId: 1, createdAt: -1 }`, `{ status: 1 }`. |
| `TradeExecution` | `tradeexecutions` | Executed fill tickets. Indexes on `{ orderId: 1 }`, `{ userId: 1, executedAt: -1 }`. |
| `Watchlist` | `watchlists` | Custom user watchlists. Unique compound index on `{ userId: 1, name: 1 }`. |
| `MarketDataCache` | `marketdatacaches` | Cached live equity quotes in paise. Unique index on `symbol`, index on `sector`. |
| `LearningModule` | `learningmodules` | Educational courses and quizzes. Unique index on `slug`. |
| `QuizAttempt` | `quizattempts` | User quiz scores and completions. Index on `{ userId: 1, moduleId: 1 }`. |
| `Competition` | `competitions` | Trading contest definitions. Index on `{ status: 1, startDate: 1 }`. |
| `CompetitionParticipant` | `competitionparticipants` | User contest rankings. Unique index on `{ competitionId: 1, userId: 1 }`, index on `{ competitionId: 1, currentNavPaise: -1 }`. |
| `Notification` | `notifications` | Trade fill alerts and system announcements. Indexes on `{ userId: 1, isRead: 1 }`. |
| `PortfolioSnapshot` | `portfoliosnapshots` | Historical equity curves and day P&L. Index on `{ portfolioId: 1, capturedAt: -1 }`. |

---

## 6. Testing & Connection Health

- **Readiness check**: `GET /api/v1/health/ready` returns `status: "ready"` when connected to MongoDB, or `status: "not_ready"` with non-blocking error handling if the database is offline.
- **Fail-safe dev timeout**: `serverSelectionTimeoutMS: 3000` prevents server hangs during tests or local runs without an active database.
- **Test isolation**: Integration tests use isolated mock fixtures and in-memory fallback repositories, avoiding production database contamination.
