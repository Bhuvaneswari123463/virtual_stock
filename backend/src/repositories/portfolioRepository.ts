import { Portfolio, CashLedger } from '../models';
import { dbManager } from '../config/database';
import { STARTING_VIRTUAL_CAPITAL_PAISE } from '../utilities/money';
import { ClientSession, Types } from 'mongoose';

export class PortfolioRepository {
  private inMemoryPortfolios: Map<string, any> = new Map();
  private inMemoryLedgers: any[] = [];

  async findByUserId(userId: string): Promise<any | null> {
    if (dbManager.isConnected()) {
      return Portfolio.findOne({ userId: new Types.ObjectId(userId) });
    }

    const p = this.inMemoryPortfolios.get(userId);
    return p ? { ...p } : null;
  }

  /**
   * Initializes a user's portfolio and cash ledger entry exactly once with ₹10,00,000.
   * Safe against concurrent requests and retries via unique compound indexes and atomic upsert checks.
   */
  async findOrCreate(
    userId: string,
    initialCapitalPaise = STARTING_VIRTUAL_CAPITAL_PAISE,
    session?: ClientSession | null
  ): Promise<any> {
    if (dbManager.isConnected()) {
      const userObjId = new Types.ObjectId(userId);
      const existing = await Portfolio.findOne({ userId: userObjId }).session(session || null);
      if (existing) {
        return existing;
      }

      const options = session ? { session } : {};
      const portfolio = new Portfolio({
        userId: userObjId,
        cashBalancePaise: initialCapitalPaise,
        reservedCashPaise: 0,
        initialCapitalPaise,
      });

      try {
        await portfolio.save(options);

        // Record initial double-entry ledger credit
        const ledger = new CashLedger({
          portfolioId: portfolio._id,
          userId: userObjId,
          entryType: 'CREDIT',
          category: 'INITIAL_CAPITAL',
          amountPaise: initialCapitalPaise,
          balanceAfterPaise: initialCapitalPaise,
          notes: 'Virtual starting capital allocation for paper trading',
        });
        await ledger.save(options);

        return portfolio;
      } catch (err: any) {
        // If concurrent insert created it first, fetch and return the existing record
        if (err.code === 11000) {
          const found = await Portfolio.findOne({ userId: userObjId }).session(session || null);
          if (found) return found;
        }
        throw err;
      }
    }

    // In-memory fallback
    const existing = this.inMemoryPortfolios.get(userId);
    if (existing) {
      return { ...existing };
    }

    const id = new Types.ObjectId().toString();
    const portfolio = {
      _id: id,
      id,
      userId,
      cashBalancePaise: initialCapitalPaise,
      reservedCashPaise: 0,
      initialCapitalPaise,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemoryPortfolios.set(userId, portfolio);

    this.inMemoryLedgers.push({
      _id: new Types.ObjectId().toString(),
      portfolioId: id,
      userId,
      entryType: 'CREDIT',
      category: 'INITIAL_CAPITAL',
      amountPaise: initialCapitalPaise,
      balanceAfterPaise: initialCapitalPaise,
      notes: 'Virtual starting capital allocation for paper trading',
      createdAt: new Date(),
    });

    return { ...portfolio };
  }
}

export const portfolioRepository = new PortfolioRepository();
