import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utilities/errors';
import { logger } from '../utilities/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.id;

  // Handle known operational AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { requestId, stack: err.stack, details: err.details });
    } else {
      logger.warn(err.message, { requestId, code: err.errorCode, details: err.details });
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || null,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    logger.warn('Validation error', { requestId, issues: err.issues });
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or query parameters',
        details: err.format(),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Malformed JSON Payload error from body-parser
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'The request body contains invalid JSON',
        details: null,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Handle Mongoose / Mongo errors
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IDENTIFIER',
        message: 'Invalid resource identifier format',
        details: null,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (err.name === 'ValidationError') {
    const mongoValidationErrors = (err as any).errors;
    const formattedErrors: Record<string, string> = {};
    if (mongoValidationErrors) {
      for (const key of Object.keys(mongoValidationErrors)) {
        formattedErrors[key] = mongoValidationErrors[key].message;
      }
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        details: formattedErrors,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with this key already exists',
        details: null,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Unhandled / Unexpected Errors - stack traces and internal Mongo details never exposed publicly
  logger.error(`Unhandled error: ${err.message}`, {
    requestId,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred. Please try again later.',
      details: null,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};
