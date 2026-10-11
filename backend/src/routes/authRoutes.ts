import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter.middleware(), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter.middleware(), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

router.post('/logout', (req, res, next) => authController.logout(req, res, next));

router.post('/forgot-password', passwordResetRateLimiter.middleware(), (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

router.post('/reset-password', passwordResetRateLimiter.middleware(), (req, res, next) =>
  authController.resetPassword(req, res, next)
);

router.get('/me', authenticateToken, (req, res, next) =>
  authController.getProfile(req, res, next)
);

router.put('/me', authenticateToken, (req, res, next) =>
  authController.updateProfile(req, res, next)
);

export default router;
