import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { portfolioRepository } from '../repositories/portfolioRepository';
import { TokenUtility, AccessTokenPayload } from '../utilities/tokens';
import { withTransaction } from '../utilities/transaction';
import { Money, STARTING_VIRTUAL_CAPITAL_PAISE } from '../utilities/money';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../utilities/errors';
import { logger } from '../utilities/logger';
import { config } from '../config';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../schemas/authSchemas';

export interface AuthSuccessResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'trader' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
  portfolio: {
    cashBalancePaise: number;
    cashBalanceFormatted: string;
  };
}

export class AuthService {
  /**
   * Register a new user and safely initialize their ₹10,00,000 virtual trading account
   */
  async register(
    input: RegisterInput,
    userAgent = 'Unknown',
    ipAddress = '127.0.0.1'
  ): Promise<AuthSuccessResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    let createdUser: any;
    let portfolio: any;

    try {
      await withTransaction(async (session) => {
        createdUser = await userRepository.create(
          {
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            role: 'trader',
          },
          session
        );

        const userId = String(createdUser._id || createdUser.id);
        portfolio = await portfolioRepository.findOrCreate(
          userId,
          STARTING_VIRTUAL_CAPITAL_PAISE,
          session
        );
      });
    } catch (err: any) {
      if (err.code === 11000) {
        throw new ConflictError('An account with this email address already exists');
      }
      throw err;
    }

    const userId = String(createdUser._id || createdUser.id);

    // Create session family & tokens
    const family = TokenUtility.generateFamilyId();
    const { token: refreshToken, hash: refreshTokenHash } =
      TokenUtility.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.JWT_REFRESH_EXPIRES_DAYS);

    await sessionRepository.create({
      userId,
      refreshTokenHash,
      family,
      userAgent,
      ipAddress,
      expiresAt,
    });

    const tokenPayload: AccessTokenPayload = {
      userId,
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role,
    };

    const accessToken = TokenUtility.signAccessToken(tokenPayload);
    const cashMoney = Money.fromPaise(portfolio.cashBalancePaise);

    logger.info('User registered successfully with initial virtual capital', {
      userId,
      email: createdUser.email,
    });

    return {
      user: {
        id: userId,
        email: createdUser.email,
        fullName: createdUser.fullName,
        role: createdUser.role,
      },
      accessToken,
      refreshToken,
      portfolio: {
        cashBalancePaise: portfolio.cashBalancePaise,
        cashBalanceFormatted: cashMoney.toINR(),
      },
    };
  }

  /**
   * Authenticate an existing user
   */
  async login(
    input: LoginInput,
    userAgent = 'Unknown',
    ipAddress = '127.0.0.1'
  ): Promise<AuthSuccessResult> {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user || user.status === 'suspended') {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userId = String(user._id || user.id);

    // Ensure portfolio is initialized
    const portfolio = await portfolioRepository.findOrCreate(
      userId,
      STARTING_VIRTUAL_CAPITAL_PAISE
    );

    // Issue tokens
    const family = TokenUtility.generateFamilyId();
    const { token: refreshToken, hash: refreshTokenHash } =
      TokenUtility.generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.JWT_REFRESH_EXPIRES_DAYS);

    await sessionRepository.create({
      userId,
      refreshTokenHash,
      family,
      userAgent,
      ipAddress,
      expiresAt,
    });

    const tokenPayload: AccessTokenPayload = {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const accessToken = TokenUtility.signAccessToken(tokenPayload);
    const cashMoney = Money.fromPaise(portfolio.cashBalancePaise);

    logger.info('User logged in successfully', { userId, email: user.email });

    return {
      user: {
        id: userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
      portfolio: {
        cashBalancePaise: portfolio.cashBalancePaise,
        cashBalanceFormatted: cashMoney.toINR(),
      },
    };
  }

  /**
   * Rotate a refresh token with automatic reuse detection
   */
  async rotateRefreshToken(
    oldRefreshToken: string,
    userAgent = 'Unknown',
    ipAddress = '127.0.0.1'
  ): Promise<{ accessToken: string; newRefreshToken: string; user: AccessTokenPayload }> {
    const oldHash = TokenUtility.hashToken(oldRefreshToken);
    const session = await sessionRepository.findByTokenHash(oldHash);

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: If an already revoked token is submitted, invalidate the whole family!
    if (session.isRevoked) {
      logger.warn('Refresh token reuse detected! Invalidating session family.', {
        family: session.family,
        userId: session.userId,
      });
      await sessionRepository.revokeFamily(session.family);
      throw new UnauthorizedError('Refresh token reuse detected. Please log in again.');
    }

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      await sessionRepository.revokeSession(String(session._id || session.id));
      throw new UnauthorizedError('Refresh token has expired. Please log in again.');
    }

    const userId = String(session.userId);
    const user = await userRepository.findById(userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User account not found or suspended');
    }

    // Generate new refresh token
    const { token: newRefreshToken, hash: newHash } = TokenUtility.generateRefreshToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + config.JWT_REFRESH_EXPIRES_DAYS);

    // Revoke old session and link to new hash
    await sessionRepository.revokeSession(String(session._id || session.id), newHash);

    // Create new session in the same family lineage
    await sessionRepository.create({
      userId,
      refreshTokenHash: newHash,
      family: session.family,
      userAgent,
      ipAddress,
      expiresAt: newExpiresAt,
    });

    const tokenPayload: AccessTokenPayload = {
      userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const accessToken = TokenUtility.signAccessToken(tokenPayload);

    return {
      accessToken,
      newRefreshToken,
      user: tokenPayload,
    };
  }

  /**
   * Logout user by revoking the specific refresh token session
   */
  async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      const hash = TokenUtility.hashToken(refreshToken);
      const session = await sessionRepository.findByTokenHash(hash);
      if (session) {
        await sessionRepository.revokeSession(String(session._id || session.id));
      }
    } else if (userId) {
      await sessionRepository.revokeAllUserSessions(userId);
    }
  }

  /**
   * Request password reset token without exposing account existence
   */
  async requestPasswordReset(
    input: ForgotPasswordInput
  ): Promise<{ message: string; devResetToken?: string }> {
    const genericMessage =
      'If an account exists with this email address, password reset instructions have been sent.';

    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      // Return identical response to avoid enumeration attacks
      return { message: genericMessage };
    }

    const { token, hash } = TokenUtility.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const userId = String(user._id || user.id);
    await userRepository.setPasswordResetToken(userId, hash, expiresAt);

    logger.info('Password reset token generated', { userId, email: input.email });

    // Include devResetToken for test verification and non-production environments
    const isDevOrTest = config.NODE_ENV !== 'production';
    return {
      message: genericMessage,
      ...(isDevOrTest ? { devResetToken: token } : {}),
    };
  }

  /**
   * Reset user password using single-use token
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const hash = TokenUtility.hashToken(input.token);
    const user = await userRepository.findByResetToken(hash);

    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired');
    }

    const userId = String(user._id || user.id);
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(input.newPassword, saltRounds);

    await userRepository.updatePassword(userId, newPasswordHash);

    // Invalidate all active sessions for security
    await sessionRepository.revokeAllUserSessions(userId);

    logger.info('Password reset completed successfully and all active sessions revoked', {
      userId,
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Get user profile and virtual portfolio summary
   */
  async getProfile(userId: string): Promise<any> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const portfolio = await portfolioRepository.findOrCreate(
      userId,
      STARTING_VIRTUAL_CAPITAL_PAISE
    );

    const cashMoney = Money.fromPaise(portfolio.cashBalancePaise);
    const reservedMoney = Money.fromPaise(portfolio.reservedCashPaise);

    return {
      id: userId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      portfolio: {
        cashBalancePaise: portfolio.cashBalancePaise,
        cashBalanceFormatted: cashMoney.toINR(),
        reservedCashPaise: portfolio.reservedCashPaise,
        reservedCashFormatted: reservedMoney.toINR(),
        initialCapitalPaise: portfolio.initialCapitalPaise,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<any> {
    const user = await userRepository.findById(userId, true);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new BadRequestError('Current password is required to set a new password');
      }
      const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestError('Current password does not match');
      }
      const saltRounds = 12;
      const newHash = await bcrypt.hash(input.newPassword, saltRounds);
      await userRepository.updatePassword(userId, newHash);
    }

    if (input.fullName) {
      await userRepository.updateProfile(userId, { fullName: input.fullName });
    }

    return this.getProfile(userId);
  }
}

export const authService = new AuthService();
