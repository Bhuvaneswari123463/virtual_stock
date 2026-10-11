import { Request, Response, NextFunction } from 'express';
import { marketService } from '../services/marketService';
import {
  marketFilterQuerySchema,
  marketSymbolParamSchema,
  candleQuerySchema,
  marketSearchQuerySchema,
} from '../schemas/marketSchemas';

export class MarketController {
  async getMarkets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = marketFilterQuerySchema.parse(req.query);
      const result = await marketService.getMarkets(validatedQuery);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getMarketOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await marketService.getMarketOverview();

      res.status(200).json({
        success: true,
        data: overview,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async searchSymbols(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = marketSearchQuerySchema.parse(req.query);
      const results = await marketService.searchSymbols(q);

      res.status(200).json({
        success: true,
        data: results,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getStockDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = marketSymbolParamSchema.parse(req.params);
      const stockDetail = await marketService.getStockDetail(symbol);

      res.status(200).json({
        success: true,
        data: stockDetail,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCandles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = marketSymbolParamSchema.parse(req.params);
      const query = candleQuerySchema.parse(req.query);
      const candles = await marketService.getCandles(symbol, query);

      res.status(200).json({
        success: true,
        data: candles,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const marketController = new MarketController();
