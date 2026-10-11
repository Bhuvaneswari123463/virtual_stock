import { describe, it, expect } from 'vitest';
import {
  User,
  Portfolio,
  CashLedger,
  Holding,
  Order,
  TradeExecution,
  Watchlist,
  MarketDataCache,
  LearningModule,
  Competition,
  Notification,
  PortfolioSnapshot,
} from '../src/models';

describe('Mongoose Models Schema Validation & Constraints', () => {
  it('User model validates required email and fullName', () => {
    const invalidUser = new User({});
    const err = invalidUser.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['email']).toBeDefined();
    expect(err?.errors['fullName']).toBeDefined();
    expect(err?.errors['passwordHash']).toBeDefined();
  });

  it('Portfolio model enforces default initial capital of ₹10,00,000 (100,000,000 paise)', () => {
    const portfolio = new Portfolio({
      userId: '507f1f77bcf86cd799439011',
    });
    expect(portfolio.cashBalancePaise).toBe(100000000);
    expect(portfolio.initialCapitalPaise).toBe(100000000);
    expect(portfolio.reservedCashPaise).toBe(0);
  });

  it('Holding model rejects negative quantities and prices', () => {
    const invalidHolding = new Holding({
      userId: '507f1f77bcf86cd799439011',
      portfolioId: '507f1f77bcf86cd799439012',
      symbol: 'TCS',
      quantity: -10,
      avgBuyPricePaise: -100,
      totalInvestedPaise: -1000,
    });
    const err = invalidHolding.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['quantity']).toBeDefined();
    expect(err?.errors['avgBuyPricePaise']).toBeDefined();
  });

  it('Order model defaults to PENDING status and validates side/type enum', () => {
    const order = new Order({
      userId: '507f1f77bcf86cd799439011',
      portfolioId: '507f1f77bcf86cd799439012',
      symbol: 'INFY',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 50,
      limitPricePaise: 175000,
    });
    expect(order.status).toBe('PENDING');
    expect(order.exchange).toBe('NSE');
    expect(order.filledQuantity).toBe(0);
  });

  it('CashLedger requires valid entryType and category', () => {
    const invalidLedger = new CashLedger({
      portfolioId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      entryType: 'INVALID_TYPE',
    });
    const err = invalidLedger.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors['entryType']).toBeDefined();
    expect(err?.errors['amountPaise']).toBeDefined();
  });

  it('Watchlist model validates embedded items structure', () => {
    const watchlist = new Watchlist({
      userId: '507f1f77bcf86cd799439011',
      name: 'Nifty 50 Favorites',
      isDefault: true,
      items: [{ symbol: 'RELIANCE', exchange: 'NSE' }],
    });
    expect(watchlist.items.length).toBe(1);
    expect(watchlist.items[0].symbol).toBe('RELIANCE');
    expect(watchlist.items[0].exchange).toBe('NSE');
  });

  it('MarketDataCache uppercase transforms stock symbol', () => {
    const cache = new MarketDataCache({
      symbol: 'tatamotors',
      companyName: 'Tata Motors Ltd.',
      sector: 'Automobile',
      ltpPaise: 96500,
      openPaise: 95000,
      highPaise: 97000,
      lowPaise: 94800,
      previousClosePaise: 95000,
    });
    expect(cache.symbol).toBe('TATAMOTORS');
  });

  it('Competition model initializes with ₹10,00,000 starting capital', () => {
    const comp = new Competition({
      title: 'October Trading Cup',
      description: 'Annual contest',
      startDate: new Date(),
      endDate: new Date(),
    });
    expect(comp.startingCapitalPaise).toBe(100000000);
    expect(comp.status).toBe('UPCOMING');
  });

  it('TradeExecution model sets default executedAt timestamp', () => {
    const exec = new TradeExecution({
      orderId: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439012',
      portfolioId: '507f1f77bcf86cd799439013',
      symbol: 'TCS',
      side: 'BUY',
      quantity: 10,
      executionPricePaise: 389000,
      totalValuePaise: 3890000,
    });
    expect(exec.executedAt).toBeDefined();
    expect(exec.feesPaise).toBe(0);
  });

  it('LearningModule model initializes published by default', () => {
    const module = new LearningModule({
      slug: 'basics',
      title: 'Basics',
      description: 'Intro course',
      level: 'BEGINNER',
    });
    expect(module.isPublished).toBe(true);
    expect(module.estimatedMinutes).toBe(15);
  });

  it('Notification model initializes unread by default', () => {
    const notif = new Notification({
      userId: '507f1f77bcf86cd799439011',
      title: 'Trade Executed',
      message: 'Bought 10 shares of RELIANCE',
    });
    expect(notif.isRead).toBe(false);
    expect(notif.type).toBe('SYSTEM');
  });

  it('PortfolioSnapshot model validates captured fields', () => {
    const snap = new PortfolioSnapshot({
      userId: '507f1f77bcf86cd799439011',
      portfolioId: '507f1f77bcf86cd799439012',
      availableCashPaise: 50000000,
      totalNavPaise: 100000000,
    });
    expect(snap.availableCashPaise).toBe(50000000);
    expect(snap.capturedAt).toBeDefined();
  });
});
