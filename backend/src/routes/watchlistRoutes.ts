import { Router } from 'express';
import { watchlistController } from '../controllers/watchlistController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All watchlist routes require authentication
router.use(authenticateToken);

router.get('/', (req, res, next) => watchlistController.getWatchlists(req, res, next));
router.post('/', (req, res, next) => watchlistController.createWatchlist(req, res, next));
router.get('/:id', (req, res, next) => watchlistController.getWatchlistById(req, res, next));
router.delete('/:id', (req, res, next) => watchlistController.deleteWatchlist(req, res, next));
router.post('/:id/symbols', (req, res, next) => watchlistController.addSymbol(req, res, next));
router.delete('/:id/symbols/:symbol', (req, res, next) => watchlistController.removeSymbol(req, res, next));
router.put('/:id/reorder', (req, res, next) => watchlistController.reorderWatchlist(req, res, next));

export default router;
