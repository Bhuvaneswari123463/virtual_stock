# VirtualTrade: Simulation Execution, Slippage & Fee Policy

This document formally defines the server-authoritative execution policy for VirtualTrade's simulated paper-trading engine.

---

## 1. Principles of Server Authority
1. **Zero Client Trust**: All validation of available balances, ownership, market prices, and order quantities occurs exclusively on the backend server. The client cannot dictate execution price, fills, or balances.
2. **Deterministic Integer Math**: All calculations are performed in authoritative integer minor units (`paise`, where `₹1 = 100 paise`). No floating-point financial drift is permitted.
3. **Data Provenance Tracking**: Every trade execution immutably stores the `dataSource` (e.g., `'MOCK_SIMULATED'`, `'YAHOO_FINANCE'`) and the exact `quoteTimestamp` used to calculate execution.

---

## 2. Order Execution Policy

### A. Market Orders
- **Market Buy**:
  - Eligible immediately against the current live/cached quote.
  - Execution price includes realistic market impact / bid-ask spread slippage:
    $$\text{executionPricePaise} = \text{Math.round}(\text{quote.ltpPaise} \times (1 + \text{SLIPPAGE\_RATE}))$$
  - Standard slippage: **0.05%** (5 basis points).
- **Market Sell**:
  - Eligible immediately against the current quote.
  - Execution price includes spread slippage:
    $$\text{executionPricePaise} = \text{Math.round}(\text{quote.ltpPaise} \times (1 - \text{SLIPPAGE\_RATE}))$$

### B. Limit Orders
- **Limit Buy**:
  - Eligible for fill only when market price satisfies:
    $$\text{quote.ltpPaise} \le \text{order.limitPricePaise}$$
  - If placed when market price already meets or beats limit price: executes immediately with **price improvement** at $\min(\text{quote.ltpPaise}, \text{order.limitPricePaise})$.
  - If placed when market price exceeds limit price: placed into `OPEN` status.
  - **Reservation Rule**: Exactly $\text{order.quantity} \times \text{order.limitPricePaise} + \text{estimatedFeesPaise}$ is atomically transferred from `cashBalancePaise` to `reservedCashPaise`.
- **Limit Sell**:
  - Eligible for fill only when market price satisfies:
    $$\text{quote.ltpPaise} \ge \text{order.limitPricePaise}$$
  - If placed when market price already meets or beats limit price: executes immediately at $\max(\text{quote.ltpPaise}, \text{order.limitPricePaise})$.
  - If placed when market price is below limit price: placed into `OPEN` status.
  - **Reservation Rule**: Exactly $\text{order.quantity}$ shares are atomically transferred from holding `quantity` to `lockedQuantity`.

### C. Cancellation & Release Rules
- An order in `OPEN` status can be cancelled by the owner.
- **Limit Buy Cancellation**: Releases all `reservedMarginPaise` back into available `cashBalancePaise`.
- **Limit Sell Cancellation**: Releases all reserved shares from `lockedQuantity` back into available holding `quantity`.
- **Race Condition Prevention**: Status transitions from `OPEN` to `CANCELLED` or `FILLED` are atomic. A cancellation cannot succeed if the order is already filled, and a fill cannot execute if the order has been cancelled.

---

## 3. Statutory Regulatory Taxes & Charges Schedule

In accordance with Indian capital markets (NSE & SEBI) standards:

| Fee Component | Rate (Delivery / CNC) | Rate (Intraday / MIS) | Side |
| :--- | :--- | :--- | :--- |
| **Virtual Brokerage** | ₹0.00 (Zero brokerage) | ₹0.00 | Buy & Sell |
| **Securities Transaction Tax (STT)** | 0.10% of trade value | 0.025% of trade value | Buy & Sell (CNC); Sell only (MIS) |
| **Exchange Turnover Fee (NSE)** | 0.00297% of trade value | 0.00297% of trade value | Buy & Sell |
| **Goods & Services Tax (GST)** | 18% on (Brokerage + Exchange fee) | 18% on (Brokerage + Exchange fee) | Buy & Sell |
| **Stamp Duty** | 0.015% of trade value | 0.003% of trade value | Buy side only |
| **SEBI Turnover Charges** | ₹10 per crore (0.0001%) | ₹10 per crore (0.0001%) | Buy & Sell |

All fees are rounded to the nearest integer paise (`Math.round`).

---

## 4. Cost Basis & Accounting Rules
1. **Holdings Cost Basis**:
   - On Buy: Weighted Average Cost:
     $$\text{newAvgPricePaise} = \text{Math.round}\left(\frac{(\text{oldQty} \times \text{oldAvgPrice}) + (\text{buyQty} \times \text{buyPrice})}{\text{oldQty} + \text{buyQty}}\right)$$
   - On Sell: Cost basis remains unchanged; realized P&L is credited or debited to the cash ledger:
     $$\text{realizedPnLPaise} = (\text{sellPricePaise} - \text{avgPricePaise}) \times \text{sellQty} - \text{taxesPaise}$$
2. **Immutable Cash Ledger**:
   - Every cash movement records an immutable entry in `CashLedger` with `balanceBeforePaise`, `amountPaise`, `balanceAfterPaise`, `entryType` (`CREDIT`/`DEBIT`), `reason`, and `referenceId`.
   - Reconciliation invariant:
     $$\text{cashBalancePaise} = \text{initialCapitalPaise} + \sum \text{CREDITs} - \sum \text{DEBITs}$$
