import { Request, Response } from 'express';
import { healthService } from '../services/healthService';

export class HealthController {
  getHealth(_req: Request, res: Response): void {
    const health = healthService.getSystemHealth();
    res.status(200).json({
      success: true,
      data: health,
    });
  }

  getReadiness(_req: Request, res: Response): void {
    const readiness = healthService.getDatabaseReadiness();
    res.status(200).json({
      success: true,
      data: readiness,
    });
  }
}

export const healthController = new HealthController();
