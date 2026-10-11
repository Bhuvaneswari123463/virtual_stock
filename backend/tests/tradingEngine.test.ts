import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import { STARTING_VIRTUAL_CAPITAL_PAISE } from '../src/utilities/money';

describe('Phase 7 Server-Authoritative Virtual Trading Engine Tests', () => {
  const app = createApp();

  const traderA = {
    id: '6acbbc603127975f94d569f1',
    email: 'trader.a@virtualtrade.in',
    role: 'TRADER',
  };

  const traderB = {
    id: '6acbbc603127975f94d569f2',
    email: 'trader.b@virtualtrade.in',
    role: 'TRADER',
  };

  const tokenA = jwt.sign(traderA, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const tokenB = jwt.sign(traderB, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });

  describe('1. Virtual Account Initialization & Balance Retrieval', () => {
    it('initializes portfolio with exactly ₹10,00,000 and zero reservations', async () => {
      const res = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.cashBalancePaise).toBe(STARTING_VIRTUAL_CAPITAL_PAISE);
      expect(res.body.data.summary.reservedCashPaise).toBe(0);
      expect(res.body.data.summary.initialCapitalPaise).toBe(STARTING_VIRTUAL_CAPITAL_PAISE);
      expect(res.body.data.holdings).toEqual([]);
    });

    it('records INITIAL_ALLOCATION in immutable cash ledger', async () => {
      const res = await request(app)
        .get('/api/v1/portfolio/ledger')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const initEntry = res.body.data.find((l: any) => l.reason === 'INITIAL_ALLOCATION');
      expect(initEntry).toBeDefined();
      expect(initEntry.amountPaise).toBe(STARTING_VIRTUAL_CAPITAL_PAISE);
      expect(initEntry.entryType).toBe('CREDIT');
    });
  });

  describe('2. Market Buy & Market Sell Accounting', () => {
    it('executes market buy, deducts cash + statutory fees, and updates holding with cost basis', async () => {
      const buyRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'RELIANCE',
          exchange: 'NSE',
          side: 'BUY',
          type: 'MARKET',
          productType: 'CNC',
          quantity: 10,
        });

      expect(buyRes.status).toBe(201);
      expect(buyRes.body.success).toBe(true);
      expect(buyRes.body.data.order.status).toBe('FILLED');
      expect(buyRes.body.data.execution).toBeDefined();
      expect(buyRes.body.data.cashAfterPaise).toBeLessThan(buyRes.body.data.cashBeforePaise);

      // Verify Holding Created
      const portfolioRes = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);

      const relHolding = portfolioRes.body.data.holdings.find((h: any) => h.symbol === 'RELIANCE');
      expect(relHolding).toBeDefined();
      expect(relHolding.quantity).toBe(10);
      expect(relHolding.avgBuyPricePaise).toBeGreaterThan(0);
      expect(relHolding.totalInvestedPaise).toBe(relHolding.avgBuyPricePaise * 10);
    });

    it('executes market sell, credits net proceeds to cash ledger, and reduces holding quantity', async () => {
      const portBefore = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);
      const cashBefore = portBefore.body.data.summary.cashBalancePaise;

      const sellRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'RELIANCE',
          exchange: 'NSE',
          side: 'SELL',
          type: 'MARKET',
          productType: 'CNC',
          quantity: 4,
        });

      expect(sellRes.status).toBe(201);
      expect(sellRes.body.success).toBe(true);
      expect(sellRes.body.data.order.status).toBe('FILLED');
      expect(sellRes.body.data.cashAfterPaise).toBeGreaterThan(cashBefore);

      // Verify Holding reduced from 10 to 6
      const portAfter = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);
      const relHolding = portAfter.body.data.holdings.find((h: any) => h.symbol === 'RELIANCE');
      expect(relHolding.quantity).toBe(6);
    });

    it('rejects market sell when user owns zero or insufficient shares', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'RELIANCE',
          exchange: 'NSE',
          side: 'SELL',
          type: 'MARKET',
          quantity: 100, // Owns only 6 shares!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/insufficient shares to sell/i);
    });

    it('rejects market buy when required margin exceeds available virtual funds', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'TCS',
          exchange: 'NSE',
          side: 'BUY',
          type: 'MARKET',
          quantity: 50000, // Requires ₹19+ Crores! Available is ~₹10 Lakhs
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/insufficient virtual funds/i);
    });
  });

  describe('3. Limit Orders & Asset Reservation Logic', () => {
    it('creates OPEN limit buy order and reserves sufficient cash when out-of-the-money', async () => {
      const portBefore = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);
      const cashBefore = portBefore.body.data.summary.cashBalancePaise;
      const reservedBefore = portBefore.body.data.summary.reservedCashPaise;

      // Current INFYS is ~₹1,785 (178550 paise). Place out-of-the-money Limit Buy at ₹1,500 (150000 paise)
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'INFY',
          exchange: 'NSE',
          side: 'BUY',
          type: 'LIMIT',
          quantity: 20,
          limitPricePaise: 150000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('OPEN');
      expect(res.body.data.order.reservedMarginPaise).toBeGreaterThan(0);

      const portAfter = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(portAfter.body.data.summary.reservedCashPaise).toBeGreaterThan(reservedBefore);
      expect(portAfter.body.data.summary.cashBalancePaise).toBeLessThan(cashBefore);
      expect(portAfter.body.data.summary.totalCashPaise).toBe(
        portAfter.body.data.summary.cashBalancePaise + portAfter.body.data.summary.reservedCashPaise
      );
    });

    it('cancels open limit buy order and releases reserved cash back to available balance', async () => {
      // Find open order
      const ordersRes = await request(app)
        .get('/api/v1/orders?status=OPEN&symbol=INFY')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(ordersRes.body.data.length).toBeGreaterThan(0);
      const openOrder = ordersRes.body.data[0];

      const cancelRes = await request(app)
        .post(`/api/v1/orders/${openOrder._id || openOrder.id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Verify reserved cash is refunded
      const portAfter = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(portAfter.body.data.summary.reservedCashPaise).toBe(0);
    });

    it('creates OPEN limit sell order and reserves shares on holding', async () => {
      // User owns 6 RELIANCE. Place out-of-the-money Limit Sell at ₹4,000 (400000 paise)
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'RELIANCE',
          exchange: 'NSE',
          side: 'SELL',
          type: 'LIMIT',
          quantity: 5,
          limitPricePaise: 400000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('OPEN');

      const holdingsRes = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${tokenA}`);
      const rel = holdingsRes.body.data.find((h: any) => h.symbol === 'RELIANCE');
      expect(rel.lockedQuantity).toBe(5);
      expect(rel.availableQuantity).toBe(1); // 6 total - 5 locked = 1 available

      // Attempting to sell 2 shares now should fail because only 1 available!
      const overSellRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'RELIANCE',
          exchange: 'NSE',
          side: 'SELL',
          type: 'MARKET',
          quantity: 2,
        });

      expect(overSellRes.status).toBe(400);
      expect(overSellRes.body.error.message).toMatch(/insufficient shares to sell/i);
    });

    it('cancels open limit sell order and unlocks reserved shares', async () => {
      const ordersRes = await request(app)
        .get('/api/v1/orders?status=OPEN&symbol=RELIANCE')
        .set('Authorization', `Bearer ${tokenA}`);

      const openOrder = ordersRes.body.data[0];

      const cancelRes = await request(app)
        .post(`/api/v1/orders/${openOrder._id || openOrder.id}/cancel`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      const holdingsRes = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${tokenA}`);
      const rel = holdingsRes.body.data.find((h: any) => h.symbol === 'RELIANCE');
      expect(rel.lockedQuantity).toBe(0);
      expect(rel.availableQuantity).toBe(6);
    });
  });

  describe('4. Idempotency & Duplicate Prevention', () => {
    it('returns identical order and prevents duplicate execution on repeated request with same idempotencyKey', async () => {
      const key = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      const firstRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          symbol: 'HDFCBANK',
          exchange: 'NSE',
          side: 'BUY',
          type: 'MARKET',
          quantity: 5,
          idempotencyKey: key,
        });

      expect(firstRes.status).toBe(201);
      const firstOrderId = firstRes.body.data.order._id || firstRes.body.data.order.id;

      // Duplicate call with exact same idempotency key
      const duplicateRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          symbol: 'HDFCBANK',
          exchange: 'NSE',
          side: 'BUY',
          type: 'MARKET',
          quantity: 5,
          idempotencyKey: key,
        });

      expect(duplicateRes.status).toBe(201);
      const duplicateOrderId = duplicateRes.body.data.order._id || duplicateRes.body.data.order.id;
      expect(duplicateOrderId).toBe(firstOrderId);
      expect(duplicateRes.body.data.message).toMatch(/idempotent request/i);

      // Verify trader B owns exactly 5 shares, not 10!
      const holdingsRes = await request(app)
        .get('/api/v1/portfolio/holdings')
        .set('Authorization', `Bearer ${tokenB}`);
      const hdfc = holdingsRes.body.data.find((h: any) => h.symbol === 'HDFCBANK');
      expect(hdfc.quantity).toBe(5);
    });
  });

  describe('5. Authorization & Portfolio Isolation', () => {
    it('prevents Trader B from cancelling an order owned by Trader A', async () => {
      // Place an order as Trader A
      const orderA = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          symbol: 'TCS',
          exchange: 'NSE',
          side: 'BUY',
          type: 'LIMIT',
          quantity: 2,
          limitPricePaise: 300000,
        });

      const orderId = orderA.body.data.order._id || orderA.body.data.order.id;

      // Trader B attempts to cancel Trader A's order
      const hackRes = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(hackRes.status).toBe(403);
      expect(hackRes.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents Trader B from viewing order details owned by Trader A', async () => {
      const orderA = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`);
      const orderId = orderA.body.data[0]._id || orderA.body.data[0].id;

      const viewRes = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(viewRes.status).toBe(403);
    });
  });

  describe('6. Ledger Reconciliation Invariant', () => {
    it('verifies that current cash balance reconciles with immutable ledger credits and debits', async () => {
      const portRes = await request(app)
        .get('/api/v1/portfolio')
        .set('Authorization', `Bearer ${tokenA}`);

      const currentCash = portRes.body.data.summary.cashBalancePaise;

      const ledgerRes = await request(app)
        .get('/api/v1/portfolio/ledger')
        .set('Authorization', `Bearer ${tokenA}`);

      let computedBalance = 0;
      for (const entry of ledgerRes.body.data) {
        if (entry.entryType === 'CREDIT') {
          computedBalance += entry.amountPaise;
        } else if (entry.entryType === 'DEBIT') {
          computedBalance -= entry.amountPaise;
        }
      }

      expect(computedBalance).toBe(currentCash);
    });
  });
});
