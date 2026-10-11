import { Request, Response, NextFunction } from 'express';
import { logger } from '../utilities/logger';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;
  const requestId = req.id;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    logger.info(`HTTP ${method} ${originalUrl} ${statusCode} [${durationMs}ms]`, {
      requestId,
      method,
      path: originalUrl,
      statusCode,
      durationMs,
      ip,
    });
  });

  next();
};
