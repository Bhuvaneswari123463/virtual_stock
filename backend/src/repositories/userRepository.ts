import { User } from '../models';
import { dbManager } from '../config/database';
import { ClientSession, Types } from 'mongoose';

export interface UserCreateData {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: 'trader' | 'admin';
}

export class UserRepository {
  // In-memory fallback for test isolation when MongoDB is offline
  private inMemoryUsers: Map<string, any> = new Map();

  async findByEmail(email: string, includePassword = false): Promise<any | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (dbManager.isConnected()) {
      const query = User.findOne({ email: normalizedEmail });
      if (includePassword) {
        query.select('+passwordHash +passwordResetTokenHash +passwordResetExpiresAt');
      }
      return query.exec();
    }

    // In-memory fallback
    for (const user of this.inMemoryUsers.values()) {
      if (user.email === normalizedEmail) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string, includePassword = false): Promise<any | null> {
    if (dbManager.isConnected()) {
      const query = User.findById(id);
      if (includePassword) {
        query.select('+passwordHash');
      }
      return query.exec();
    }

    const user = this.inMemoryUsers.get(id);
    return user ? { ...user } : null;
  }

  async create(data: UserCreateData, session?: ClientSession | null): Promise<any> {
    const normalizedEmail = data.email.toLowerCase().trim();

    if (dbManager.isConnected()) {
      const options = session ? { session } : {};
      const user = new User({
        email: normalizedEmail,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role || 'trader',
        isEmailVerified: false,
        status: 'active',
      });
      await user.save(options);
      return user;
    }

    // In-memory duplicate check
    for (const u of this.inMemoryUsers.values()) {
      if (u.email === normalizedEmail) {
        const error: any = new Error('Duplicate key');
        error.code = 11000;
        throw error;
      }
    }

    const id = new Types.ObjectId().toString();
    const newUser = {
      _id: id,
      id,
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: data.role || 'trader',
      isEmailVerified: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryUsers.set(id, newUser);
    return newUser;
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    if (dbManager.isConnected()) {
      await User.findByIdAndUpdate(userId, {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      });
      return;
    }

    const user = this.inMemoryUsers.get(userId);
    if (user) {
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
    }
  }

  async findByResetToken(tokenHash: string): Promise<any | null> {
    const now = new Date();

    if (dbManager.isConnected()) {
      return User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: now },
      }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    }

    for (const user of this.inMemoryUsers.values()) {
      if (
        user.passwordResetTokenHash === tokenHash &&
        user.passwordResetExpiresAt &&
        new Date(user.passwordResetExpiresAt) > now
      ) {
        return { ...user };
      }
    }
    return null;
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    if (dbManager.isConnected()) {
      await User.findByIdAndUpdate(userId, {
        passwordHash: newPasswordHash,
        passwordResetTokenHash: undefined,
        passwordResetExpiresAt: undefined,
      });
      return;
    }

    const user = this.inMemoryUsers.get(userId);
    if (user) {
      user.passwordHash = newPasswordHash;
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
    }
  }

  async updateProfile(userId: string, data: { fullName?: string }): Promise<any> {
    if (dbManager.isConnected()) {
      return User.findByIdAndUpdate(userId, { $set: data }, { new: true });
    }

    const user = this.inMemoryUsers.get(userId);
    if (user) {
      if (data.fullName) user.fullName = data.fullName;
      return { ...user };
    }
    return null;
  }
}

export const userRepository = new UserRepository();
