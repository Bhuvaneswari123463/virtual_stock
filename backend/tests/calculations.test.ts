import { describe, it, expect } from 'vitest';
import { FinancialEngine } from '../src/utilities/calculations';

describe('FinancialEngine Calculations', () => {
  it('correctly calculates weighted average buy price when accumulating positions', () => {
    // Current: 100 shares @ ₹2,500 (250,000 paise) = total invested 25,000,000 paise
    // New buy: 50 shares @ ₹2,800 (280,000 paise) = total 14,000,000 paise
    // Combined: 150 shares, total invested 39,000,000 paise
    // Avg price: 39,000,000 / 150 = 260,000 paise (₹2,600.00)
    const result = FinancialEngine.calculateNewAvgBuyPrice(100, 250000, 50, 280000);

    expect(result.newQuantity).toBe(150);
    expect(result.newAvgPricePaise).toBe(260000);
    expect(result.newTotalInvestedPaise).toBe(39000000);
  });

  it('correctly calculates mark-to-market position P&L', () => {
    // 50 shares @ ₹1,000 avg buy price (100,000 paise) -> Total Invested: ₹50,000 (5,000,000 paise)
    // Current market price: ₹1,200 (120,000 paise) -> Current Value: ₹60,000 (6,000,000 paise)
    // Unrealized P&L: +₹10,000 (+1,000,000 paise), +20%
    const pnl = FinancialEngine.calculatePositionPnl(50, 100000, 120000);

    expect(pnl.currentValuePaise).toBe(6000000);
    expect(pnl.investedValuePaise).toBe(5000000);
    expect(pnl.unrealizedPnlPaise).toBe(1000000);
    expect(pnl.unrealizedPnlPercent).toBe(20);
  });

  it('correctly calculates total portfolio NAV and returns', () => {
    const cashPaise = 50000000; // ₹5,00,000
    const holdings = [
      { quantity: 100, avgBuyPricePaise: 200000, currentPricePaise: 250000 }, // Invested 2L, Current 2.5L
      { quantity: 50, avgBuyPricePaise: 400000, currentPricePaise: 380000 },  // Invested 2L, Current 1.9L
    ];
    const startingCapitalPaise = 90000000; // ₹9,00,000

    const nav = FinancialEngine.calculatePortfolioNav(cashPaise, holdings, startingCapitalPaise);

    expect(nav.totalInvestedPaise).toBe(40000000); // 4 Lakhs
    expect(nav.currentHoldingsValuePaise).toBe(44000000); // 2.5L + 1.9L = 4.4 Lakhs
    expect(nav.totalNavPaise).toBe(94000000); // 5L cash + 4.4L holdings = 9.4 Lakhs
    expect(nav.totalPnlPaise).toBe(4000000); // 9.4L - 9.0L = +40,000
    expect(nav.totalReturnPercent).toBeCloseTo(4.44, 1);
  });
});
