import { Router } from 'express';
import healthRoutes from './healthRoutes';
import marketRoutes from './marketRoutes';
import educationRoutes from './educationRoutes';
import competitionRoutes from './competitionRoutes';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import watchlistRoutes from './watchlistRoutes';
import orderRoutes from './orderRoutes';
import portfolioRoutes from './portfolioRoutes';

const router = Router();

// Mount API v1 route groups
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/markets', marketRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/education', educationRoutes);
router.use('/competitions', competitionRoutes);
router.use('/admin', adminRoutes);

export default router;
