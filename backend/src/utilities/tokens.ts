import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: 'trader' | 'admin';
  fullName: string;
}

export class TokenUtility {
  /**
   * Signs a short-lived access JWT (e.g. 15 minutes)
   */
  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verifies and decodes an access JWT
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  /**
   * Generates a cryptographically secure random refresh token and its SHA-256 hash
   */
  static generateRefreshToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(40).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }

  /**
   * Generates a cryptographically secure password reset token and its SHA-256 hash
   */
  static generateResetToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.hashToken(token);
    return { token, hash };
  }

  /**
   * Computes a deterministic SHA-256 digest of a token for secure database storage
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a unique family ID for tracking refresh token rotation lineages
   */
  static generateFamilyId(): string {
    return crypto.randomUUID();
  }
}
