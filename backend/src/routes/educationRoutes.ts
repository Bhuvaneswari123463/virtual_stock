import { Router } from 'express';
import { educationController } from '../controllers/educationController';

const router = Router();

router.get('/modules', (req, res, next) => educationController.getModules(req, res, next));
router.get('/modules/:slug', (req, res, next) =>
  educationController.getModuleBySlug(req, res, next)
);

export default router;
