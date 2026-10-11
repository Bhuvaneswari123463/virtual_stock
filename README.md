# VirtualTrade

> **Trade the market. Master the strategy. Risk nothing.**

VirtualTrade is an institutional-grade, educational virtual stock-trading platform focused on Indian equities (NSE & BSE). It provides an ultra-responsive, fintech terminal experience combined with a server-authoritative, concurrency-safe financial engine, realistic order matching, and a comprehensive educational academy.

Starting virtual capital: **₹10,00,000 (100,000,000 paise)** per eligible account.

---

## 🛠 Tech Stack

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, TradingView Lightweight Charts, Recharts.
* **Backend:** Node.js, Express, TypeScript, Zod, Helmet, CORS, Socket.IO.
* **Database:** MongoDB Atlas / Local MongoDB via Mongoose (configured for Phase 1).
* **Testing:** Vitest, Supertest, React Testing Library.
* **CI/CD:** GitHub Actions.

---

## 📁 Repository Structure

```
stock_app/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI (lint, typecheck, test, build)
├── apps / workspaces:
│   ├── frontend/                # React 18 + Vite + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/      # UI primitives (Button, Card, Badge) & Layout (Navbar, Footer)
│   │   │   ├── pages/           # Landing, Terminal, 404
│   │   │   ├── lib/             # Formatters (INR, percent), utils (cn)
│   │   │   ├── router.tsx       # Route definitions
│   │   │   ├── App.tsx          # Root shell
│   │   │   └── main.tsx         # Entry point
│   │   ├── .env.example
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   └── backend/                 # Node.js + Express + TypeScript
│       ├── src/
│       │   ├── config/          # Zod-validated environment config
│       │   ├── controllers/     # Route controllers (Health)
│       │   ├── middleware/      # RequestId, RequestLogger, NotFound, Centralized ErrorHandler
│       │   ├── models/          # Mongoose model registry
│       │   ├── routes/          # API v1 routes & health endpoints
│       │   ├── schemas/         # Zod API validation schemas
│       │   ├── services/        # Business logic & diagnostics
│       │   ├── utilities/       # Structured logger, AppError hierarchy
│       │   ├── app.ts           # Express application factory
│       │   └── server.ts        # Server entry with graceful shutdown
│       ├── tests/               # Integration tests (Supertest + Vitest)
│       ├── .env.example
│       └── tsconfig.json
│
├── docs/                        # Architecture, API specifications, and local setup
├── .gitignore
├── package.json                 # Monorepo root workspace configuration
└── README.md
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
* **Node.js** `>= 20.x` (Recommended: `v22.x`)
* **npm** `>= 10.x`

### 2. Installation
Install all dependencies across the monorepo:
```bash
npm install
```

### 3. Environment Configuration
Copy sample environment files:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 4. Running the Applications
* **Run Frontend Only:**
  ```bash
  npm run dev:frontend
  ```
  Access via: `http://localhost:5173`

* **Run Backend Only:**
  ```bash
  npm run dev:backend
  ```
  Access via: `http://localhost:5000`

---

## 🧪 Verification & Quality Commands

Run project-wide commands from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run typecheck` | Run strict TypeScript checks across frontend & backend |
| `npm run lint` | Run ESLint across frontend & backend workspaces |
| `npm run test` | Run Vitest automated test suites |
| `npm run build` | Compile production bundles for both frontend and backend |

---

## 🛡️ Financial Precision Architecture

1. **Paise-Accurate Accounting:**
   Floating-point arithmetic is strictly prohibited for monetary balances. All prices and cash amounts are represented in integer minor units (1 Rupee = 100 Paise).
2. **Double-Entry Ledger:**
   Every balance change is backed by paired credit/debit audit logs.
3. **Simulation Disclaimer:**
   VirtualTrade is solely for educational and simulation purposes. No real money or actual brokerage transactions take place.

---

## 📄 License
Private & Confidential — VirtualTrade Platform.
