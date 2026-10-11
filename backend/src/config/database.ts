import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utilities/logger';

export interface DatabaseStatus {
  connected: boolean;
  readyState: number;
  host?: string;
  name?: string;
  isReplicaSet: boolean;
}

class DatabaseManager {
  private isConnecting = false;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection successfully established', {
        host: mongoose.connection.host,
        db: mongoose.connection.name,
      });
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error encountered', {
        error: err.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB connection re-established');
    });
  }

  async connect(): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      logger.info('Attempting MongoDB connection...', { uri: config.MONGODB_URI });

      await mongoose.connect(config.MONGODB_URI, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 3000, // Fast failover in local dev/tests without hang
        socketTimeoutMS: 45000,
        autoIndex: config.NODE_ENV !== 'production',
      });

      this.isConnecting = false;
      return true;
    } catch (err) {
      this.isConnecting = false;
      logger.warn('MongoDB connection attempt unsuccessful. Service running in standalone/unconnected mode.', {
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      logger.info('Closing MongoDB connection pools...');
      await mongoose.disconnect();
      logger.info('MongoDB connection pools closed.');
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  getStatus(): DatabaseStatus {
    const isConn = mongoose.connection.readyState === 1;
    const client = (mongoose.connection as any).client;
    return {
      connected: isConn,
      readyState: mongoose.connection.readyState,
      host: isConn ? mongoose.connection.host : undefined,
      name: isConn ? mongoose.connection.name : undefined,
      isReplicaSet: Boolean(client?.options?.replicaSet),
    };
  }

  /**
   * Check if the database topology supports multi-document ACID transactions
   */
  async supportsTransactions(): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      const client = (mongoose.connection as any).client;
      return Boolean(client?.options?.replicaSet);
    } catch {
      return false;
    }
  }
}

export const dbManager = new DatabaseManager();
