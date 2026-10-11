import { Request, Response, NextFunction } from 'express';
import { watchlistService } from '../services/watchlistService';
import {
  createWatchlistSchema,
  addSymbolSchema,
  reorderWatchlistSchema,
  watchlistIdParamSchema,
  watchlistSymbolParamSchema,
} from '../schemas/watchlistSchemas';

export class WatchlistController {
  async getWatchlists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const watchlists = await watchlistService.getWatchlists(userId);

      res.status(200).json({
        success: true,
        data: watchlists,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getWatchlistById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = watchlistIdParamSchema.parse(req.params);
      const watchlist = await watchlistService.getWatchlistById(userId, id);

      res.status(200).json({
        success: true,
        data: watchlist,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const input = createWatchlistSchema.parse(req.body);
      const watchlist = await watchlistService.createWatchlist(userId, input);

      res.status(201).json({
        success: true,
        data: watchlist,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async addSymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = watchlistIdParamSchema.parse(req.params);
      const input = addSymbolSchema.parse(req.body);
      const updated = await watchlistService.addSymbol(userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async removeSymbol(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id, symbol } = watchlistSymbolParamSchema.parse(req.params);
      const updated = await watchlistService.removeSymbol(userId, id, symbol);

      res.status(200).json({
        success: true,
        data: updated,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async reorderWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = watchlistIdParamSchema.parse(req.params);
      const { symbols } = reorderWatchlistSchema.parse(req.body);
      const updated = await watchlistService.reorderWatchlist(userId, id, symbols);

      res.status(200).json({
        success: true,
        data: updated,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = watchlistIdParamSchema.parse(req.params);
      await watchlistService.deleteWatchlist(userId, id);

      res.status(200).json({
        success: true,
        data: { message: 'Watchlist deleted successfully' },
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

export const watchlistController = new WatchlistController();
