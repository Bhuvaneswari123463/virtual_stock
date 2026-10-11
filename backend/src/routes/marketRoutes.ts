import { Router } from 'express';
import { marketController } from '../controllers/marketController';

const router = Router();

// Specific routes before parametric :symbol
router.get('/', (req, res, next) => marketController.getMarkets(req, res, next));
router.get('/overview', (req, res, next) => marketController.getMarketOverview(req, res, next));
router.get('/search', (req, res, next) => marketController.searchSymbols(req, res, next));

// Parametric symbol routes
router.get('/:symbol', (req, res, next) => marketController.getStockDetail(req, res, next));
router.get('/:symbol/candles', (req, res, next) => marketController.getCandles(req, res, next));

export default router;
