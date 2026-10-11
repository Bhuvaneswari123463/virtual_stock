import { Request, Response, NextFunction } from 'express';
import { educationService } from '../services/educationService';
import { educationFilterQuerySchema, educationSlugParamSchema } from '../schemas/educationSchemas';

export class EducationController {
  async getModules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = educationFilterQuerySchema.parse(req.query);
      const result = await educationService.getModules(validatedQuery);

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

  async getModuleBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = educationSlugParamSchema.parse(req.params);
      const moduleDetail = await educationService.getModuleBySlug(slug);

      res.status(200).json({
        success: true,
        data: moduleDetail,
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

export const educationController = new EducationController();
