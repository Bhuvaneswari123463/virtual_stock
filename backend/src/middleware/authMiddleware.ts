import { Request, Response, NextFunction } from 'express';
import { TokenUtility, AccessTokenPayload } from '../utilities/tokens';
import { UnauthorizedError, ForbiddenError } from '../utilities/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError('Authentication token required'));
  }

  try {
    const payload = TokenUtility.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      const expiredError = new UnauthorizedError('Access token has expired');
      (expiredError as any).errorCode = 'TOKEN_EXPIRED';
      return next(expiredError);
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
};

export const requireRole = (allowedRoles: Array<'trader' | 'admin'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have sufficient permissions to access this resource')
      );
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
