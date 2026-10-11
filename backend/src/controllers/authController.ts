import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { config } from '../config';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../schemas/authSchemas';
import { UnauthorizedError } from '../utilities/errors';

const REFRESH_COOKIE_NAME = 'vt_refresh_token';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.COOKIE_SECURE ?? config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: `${config.API_PREFIX}/auth`,
  maxAge: config.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  domain: config.COOKIE_DOMAIN || undefined,
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = registerSchema.parse(req.body);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await authService.register(validatedInput, userAgent, ipAddress);

      // Set HttpOnly refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          portfolio: result.portfolio,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await authService.login(validatedInput, userAgent, ipAddress);

      // Set HttpOnly refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          portfolio: result.portfolio,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required in cookie');
      }

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';

      const result = await authService.rotateRefreshToken(
        refreshToken,
        userAgent,
        ipAddress
      );

      // Set new rotated refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, result.newRefreshToken, getCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Clear cookie on refresh failure
      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: `${config.API_PREFIX}/auth`,
        domain: config.COOKIE_DOMAIN || undefined,
      });
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(refreshToken, req.user?.userId);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        path: `${config.API_PREFIX}/auth`,
        domain: config.COOKIE_DOMAIN || undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = forgotPasswordSchema.parse(req.body);
      const result = await authService.requestPasswordReset(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = resetPasswordSchema.parse(req.body);
      const result = await authService.resetPassword(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const validatedInput = updateProfileSchema.parse(req.body);
      const updatedProfile = await authService.updateProfile(userId, validatedInput);

      res.status(200).json({
        success: true,
        data: updatedProfile,
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

export const authController = new AuthController();
