import { Router } from 'express';
import { tradingController } from '../controllers/tradingController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Orders require authenticated trader session
router.use(authenticateToken);

router.post('/', (req, res, next) => tradingController.placeOrder(req, res, next));
router.get('/', (req, res, next) => tradingController.getOrders(req, res, next));
router.get('/:id', (req, res, next) => tradingController.getOrderById(req, res, next));
router.post('/:id/cancel', (req, res, next) => tradingController.cancelOrder(req, res, next));

export default router;
