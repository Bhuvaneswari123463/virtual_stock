import { Request, Response, NextFunction } from 'express';
import { tradingEngineService } from '../services/tradingEngineService';
import {
  createOrderSchema,
  orderQuerySchema,
  orderIdParamSchema,
} from '../schemas/tradingSchemas';

export class TradingController {
  async placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const input = createOrderSchema.parse(req.body);
      const result = await tradingEngineService.placeOrder(userId, input);

      res.status(201).json({
        success: true,
        data: result,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const query = orderQuerySchema.parse(req.query);
      const result = await tradingEngineService.getOrders(userId, query);

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

  async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = orderIdParamSchema.parse(req.params);
      const result = await tradingEngineService.getOrderById(userId, id);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = orderIdParamSchema.parse(req.params);
      const cancelled = await tradingEngineService.cancelOrder(userId, id);

      res.status(200).json({
        success: true,
        data: cancelled,
        message: 'Order cancelled successfully and reserved assets released',
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { summary, holdings } = await tradingEngineService.getPortfolioSummary(userId);

      res.status(200).json({
        success: true,
        data: {
          summary,
          holdings,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getHoldings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { holdings } = await tradingEngineService.getPortfolioSummary(userId);

      res.status(200).json({
        success: true,
        data: holdings,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCashLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const ledger = await tradingEngineService.getCashLedger(userId);

      res.status(200).json({
        success: true,
        data: ledger,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const executions = await tradingEngineService.getExecutions(userId);

      res.status(200).json({
        success: true,
        data: executions,
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

export const tradingController = new TradingController();
