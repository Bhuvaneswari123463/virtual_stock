import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// Protected admin-only diagnostic and management endpoint
router.get('/metrics', authenticateToken, requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      adminUser: req.user?.email,
      platformStatus: 'OPERATIONAL',
      activeTradingSessions: 1,
      simulatedMatchingEngine: 'ONLINE',
      timestamp: new Date().toISOString(),
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
