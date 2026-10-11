import { Router } from 'express';
import { competitionController } from '../controllers/competitionController';

const router = Router();

router.get('/', (req, res, next) =>
  competitionController.getCompetitions(req, res, next)
);
router.get('/:id/leaderboard', (req, res, next) =>
  competitionController.getLeaderboard(req, res, next)
);

export default router;
