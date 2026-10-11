import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

describe('Phase 6 Watchlist API & Validation Tests', () => {
  const app = createApp();

  const testUser1 = {
    id: '6acbba8ddb02ee04aa080e71',
    email: 'trader1@virtualtrade.in',
    role: 'TRADER',
  };

  const testUser2 = {
    id: '6acbba8ddb02ee04aa080e72',
    email: 'trader2@virtualtrade.in',
    role: 'TRADER',
  };

  const token1 = jwt.sign(testUser1, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const token2 = jwt.sign(testUser2, config.JWT_ACCESS_SECRET, { expiresIn: '15m' });

  describe('Authorization & Access Control', () => {
    it('rejects unauthenticated GET /api/v1/watchlists with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/watchlists');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects unauthenticated POST /api/v1/watchlists with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/watchlists')
        .send({ name: 'Tech Stocks' });
      expect(res.status).toBe(401);
    });
  });

  describe('Default Watchlist Initialization & Retrieval', () => {
    it('returns auto-initialized default watchlist with enriched quotes for new user', async () => {
      const res = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const defaultList = res.body.data[0];
      expect(defaultList.name).toBe('My Watchlist');
      expect(defaultList.isDefault).toBe(true);
      expect(defaultList.items.length).toBeGreaterThanOrEqual(1);

      // Verify enriched quote fields
      const firstItem = defaultList.items[0];
      expect(firstItem).toHaveProperty('symbol');
      expect(firstItem).toHaveProperty('ltpPaise');
      expect(firstItem).toHaveProperty('ltpFormatted');
      expect(firstItem).toHaveProperty('changePercent');
      expect(firstItem).toHaveProperty('dataSource');
    });
  });

  describe('Adding Symbols & Validation', () => {
    let watchlistId: string;

    beforeEach(async () => {
      const res = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token1}`);
      watchlistId = res.body.data[0].id;
    });

    it('successfully adds valid Indian equity symbol to watchlist', async () => {
      const res = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/symbols`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbol: 'TATAMOTORS', exchange: 'NSE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.some((i: any) => i.symbol === 'TATAMOTORS')).toBe(true);
    });

    it('prevents duplicate symbol entries with 409 Conflict', async () => {
      // First attempt: ensure RELIANCE is in watchlist
      await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/symbols`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbol: 'RELIANCE', exchange: 'NSE' });

      // Second attempt to add duplicate RELIANCE
      const duplicateRes = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/symbols`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbol: 'RELIANCE', exchange: 'NSE' });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.code).toBe('CONFLICT');
      expect(duplicateRes.body.error.message).toMatch(/already in this watchlist/i);
    });

    it('rejects non-existent stock symbol with 404 Not Found', async () => {
      const res = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/symbols`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbol: 'FAKEUNKNOWN123', exchange: 'NSE' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects invalid symbol format with 400 Validation Error', async () => {
      const res = await request(app)
        .post(`/api/v1/watchlists/${watchlistId}/symbols`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbol: 'INVALID$$SYMBOL%%', exchange: 'NSE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Removing Symbols & Empty Watchlist Handling', () => {
    it('removes symbol from watchlist successfully', async () => {
      const listsRes = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token1}`);
      const watchlistId = listsRes.body.data[0].id;

      const removeRes = await request(app)
        .delete(`/api/v1/watchlists/${watchlistId}/symbols/TCS`)
        .set('Authorization', `Bearer ${token1}`);

      expect(removeRes.status).toBe(200);
      expect(removeRes.body.success).toBe(true);
      expect(removeRes.body.data.items.every((i: any) => i.symbol !== 'TCS')).toBe(true);
    });

    it('handles empty watchlist gracefully when all symbols are removed', async () => {
      const createRes = await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Empty Test List' });

      expect(createRes.status).toBe(201);
      const listId = createRes.body.data.id;
      expect(createRes.body.data.items).toEqual([]);

      const getRes = await request(app)
        .get(`/api/v1/watchlists/${listId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.items).toEqual([]);
    });
  });

  describe('Reordering & User Preferences Persistence', () => {
    it('persists custom ordering of watchlist symbols', async () => {
      const listsRes = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token1}`);
      const watchlistId = listsRes.body.data[0].id;

      // Reorder items
      const newOrder = ['INFY', 'HDFCBANK', 'RELIANCE'];
      const reorderRes = await request(app)
        .put(`/api/v1/watchlists/${watchlistId}/reorder`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ symbols: newOrder });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.success).toBe(true);
      const items = reorderRes.body.data.items;
      expect(items[0].symbol).toBe('INFY');
      expect(items[1].symbol).toBe('HDFCBANK');
      expect(items[2].symbol).toBe('RELIANCE');
    });
  });

  describe('Multi-Watchlist Management & Name Uniqueness', () => {
    it('creates a custom watchlist and prevents duplicate watchlist name for same user', async () => {
      const createRes = await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Banking Sector' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.name).toBe('Banking Sector');

      // Duplicate attempt
      const duplicateRes = await request(app)
        .post('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Banking Sector' });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('CONFLICT');
    });

    it('rejects deletion of default watchlist with 400 Bad Request', async () => {
      const listsRes = await request(app)
        .get('/api/v1/watchlists')
        .set('Authorization', `Bearer ${token2}`);
      const defaultList = listsRes.body.data.find((l: any) => l.isDefault);

      const deleteRes = await request(app)
        .delete(`/api/v1/watchlists/${defaultList.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.error.code).toBe('BAD_REQUEST');
      expect(deleteRes.body.error.message).toMatch(/cannot delete the default watchlist/i);
    });
  });
});
