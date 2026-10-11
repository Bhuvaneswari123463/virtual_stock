import { Router } from 'express';
import { tradingController } from '../controllers/tradingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Portfolio routes require authentication
router.use(authenticateToken);

router.get('/', (req, res, next) => tradingController.getPortfolio(req, res, next));
router.get('/holdings', (req, res, next) => tradingController.getHoldings(req, res, next));
router.get('/ledger', (req, res, next) => tradingController.getCashLedger(req, res, next));
router.get('/executions', (req, res, next) => tradingController.getExecutions(req, res, next));

export default router;
