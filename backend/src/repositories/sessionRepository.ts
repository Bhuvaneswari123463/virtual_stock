import { Session } from '../models';
import { dbManager } from '../config/database';
import { Types } from 'mongoose';

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  family: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export class SessionRepository {
  private inMemorySessions: Map<string, any> = new Map();

  async create(data: CreateSessionData): Promise<any> {
    if (dbManager.isConnected()) {
      const session = new Session({
        userId: new Types.ObjectId(data.userId),
        refreshTokenHash: data.refreshTokenHash,
        family: data.family,
        userAgent: data.userAgent || 'Unknown',
        ipAddress: data.ipAddress || '127.0.0.1',
        expiresAt: data.expiresAt,
        isRevoked: false,
      });
      await session.save();
      return session;
    }

    const id = new Types.ObjectId().toString();
    const session = {
      _id: id,
      id,
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      family: data.family,
      userAgent: data.userAgent || 'Unknown',
      ipAddress: data.ipAddress || '127.0.0.1',
      expiresAt: data.expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    };
    this.inMemorySessions.set(id, session);
    return session;
  }

  async findByTokenHash(refreshTokenHash: string): Promise<any | null> {
    if (dbManager.isConnected()) {
      return Session.findOne({ refreshTokenHash });
    }

    for (const session of this.inMemorySessions.values()) {
      if (session.refreshTokenHash === refreshTokenHash) {
        return session;
      }
    }
    return null;
  }

  async revokeSession(id: string, replacedByTokenHash?: string): Promise<void> {
    if (dbManager.isConnected()) {
      await Session.findByIdAndUpdate(id, {
        isRevoked: true,
        ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
      });
      return;
    }

    const session = this.inMemorySessions.get(id);
    if (session) {
      session.isRevoked = true;
      if (replacedByTokenHash) {
        session.replacedByTokenHash = replacedByTokenHash;
      }
    }
  }

  async revokeFamily(family: string): Promise<void> {
    if (dbManager.isConnected()) {
      await Session.updateMany({ family }, { isRevoked: true });
      return;
    }

    for (const session of this.inMemorySessions.values()) {
      if (session.family === family) {
        session.isRevoked = true;
      }
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    if (dbManager.isConnected()) {
      await Session.updateMany(
        { userId: new Types.ObjectId(userId) },
        { isRevoked: true }
      );
      return;
    }

    for (const session of this.inMemorySessions.values()) {
      if (session.userId === userId) {
        session.isRevoked = true;
      }
    }
  }
}

export const sessionRepository = new SessionRepository();
