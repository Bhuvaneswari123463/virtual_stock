import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utilities/errors';

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};
