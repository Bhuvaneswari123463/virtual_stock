import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Phase 3 Read Endpoints & API Contract', () => {
  const app = createApp();

  describe('GET /api/v1/markets', () => {
    it('returns a paginated list of equities with formatted currency fields', async () => {
      const res = await request(app).get('/api/v1/markets?page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(5);

      const firstStock = res.body.data[0];
      expect(firstStock).toHaveProperty('symbol');
      expect(firstStock).toHaveProperty('ltpPaise');
      expect(firstStock).toHaveProperty('ltpFormatted');
      expect(firstStock).toHaveProperty('changePercent');
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it('filters equities by sector', async () => {
      const res = await request(app).get('/api/v1/markets?sector=Information Technology');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((item: any) => item.sector === 'Information Technology')).toBe(true);
    });

    it('rejects invalid pagination query with 400 and validation error envelope', async () => {
      const res = await request(app).get('/api/v1/markets?page=-5&limit=500');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('GET /api/v1/markets/:symbol', () => {
    it('returns detailed quote and simulated order book depth for valid symbol', async () => {
      const res = await request(app).get('/api/v1/markets/RELIANCE');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote.symbol).toBe('RELIANCE');
      expect(res.body.data.marketDepth).toBeDefined();
      expect(res.body.data.marketDepth.bids.length).toBeGreaterThan(0);
      expect(res.body.data.marketDepth.asks.length).toBeGreaterThan(0);
      expect(res.body.data.marketDepth.bids[0]).toHaveProperty('priceFormatted');
    });

    it('returns 404 for non-existent stock symbol', async () => {
      const res = await request(app).get('/api/v1/markets/NONEXISTENT');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/education/modules', () => {
    it('returns educational modules with lesson counts', async () => {
      const res = await request(app).get('/api/v1/education/modules');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('slug');
      expect(res.body.data[0]).toHaveProperty('lessonCount');
    });

    it('returns detailed module with lessons and quiz for a valid slug', async () => {
      const res = await request(app).get('/api/v1/education/modules/stock-market-foundations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('stock-market-foundations');
      expect(res.body.data.lessons.length).toBeGreaterThan(0);
      expect(res.body.data.quiz.length).toBeGreaterThan(0);
    });

    it('returns 404 for non-existent module slug', async () => {
      const res = await request(app).get('/api/v1/education/modules/non-existent-module-xyz');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/competitions', () => {
    it('returns list of trading competitions', async () => {
      const res = await request(app).get('/api/v1/competitions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('startingCapitalFormatted');
      expect(res.body.data[0]).toHaveProperty('rules');
    });

    it('returns competition leaderboard rankings', async () => {
      const res = await request(app).get('/api/v1/competitions/507f1f77bcf86cd799439011/leaderboard');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('rank');
      expect(res.body.data[0]).toHaveProperty('userName');
      expect(res.body.data[0]).toHaveProperty('currentNavFormatted');
    });
  });
});
