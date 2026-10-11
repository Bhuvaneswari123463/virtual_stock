import mongoose, { ClientSession } from 'mongoose';
import { dbManager } from '../config/database';
import { logger } from './logger';

export interface TransactionOptions {
  /**
   * If true, throws an error if transactions are not supported by the deployment topology
   * Default: false (will execute callback without a transaction session if standalone)
   */
  requireReplicaSet?: boolean;
}

/**
 * Executes a callback within a MongoDB multi-document ACID transaction if supported
 * by the current deployment topology (Replica Set / MongoDB Atlas).
 *
 * Requirements for MongoDB ACID transactions:
 * 1. MongoDB Replica Set (or MongoDB Atlas cluster).
 * 2. Standalone mongod instances do NOT support multi-document transactions.
 *    For local development, initiate a single-node replica set (`mongod --replSet rs0`).
 */
export async function withTransaction<T>(
  operation: (session: ClientSession | null) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const supportsTxn = await dbManager.supportsTransactions();

  if (!supportsTxn) {
    if (options.requireReplicaSet) {
      throw new Error(
        'Multi-document ACID transactions require a MongoDB Replica Set or MongoDB Atlas deployment.'
      );
    }
    logger.debug('Executing operation without transaction session (standalone MongoDB topology)');
    return operation(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
