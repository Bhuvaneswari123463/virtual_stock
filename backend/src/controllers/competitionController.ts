import { Request, Response, NextFunction } from 'express';
import { competitionService } from '../services/competitionService';
import {
  competitionFilterQuerySchema,
  competitionIdParamSchema,
} from '../schemas/competitionSchemas';

export class CompetitionController {
  async getCompetitions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = competitionFilterQuerySchema.parse(req.query);
      const result = await competitionService.getCompetitions(validatedQuery);

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

  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = competitionIdParamSchema.parse(req.params);
      const leaderboard = await competitionService.getLeaderboard(id);

      res.status(200).json({
        success: true,
        data: leaderboard,
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

export const competitionController = new CompetitionController();
