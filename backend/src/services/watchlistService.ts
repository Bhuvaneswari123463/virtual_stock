import { Types } from 'mongoose';
import { Watchlist, IWatchlist } from '../models/Watchlist';
import { dbManager } from '../config/database';
import { marketService } from './marketService';
import {
  CreateWatchlistInput,
  AddSymbolInput,
} from '../schemas/watchlistSchemas';
import { NotFoundError, ConflictError, BadRequestError } from '../utilities/errors';
import { logger } from '../utilities/logger';

export interface WatchlistItemEnriched {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  ltpPaise: number;
  ltpFormatted: string;
  changePaise: number;
  changePercent: number;
  changeFormatted: string;
  highFormatted: string;
  lowFormatted: string;
  volume: number;
  dataSource: string;
  isDelayed: boolean;
  isMock: boolean;
  isStale: boolean;
  lastUpdated: string;
  addedAt: string;
}

export interface WatchlistEnriched {
  id: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItemEnriched[];
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback repository for disconnected dev/test environments
interface InMemoryWatchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  items: Array<{ symbol: string; exchange: 'NSE' | 'BSE'; addedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

export class WatchlistService {
  private inMemoryStore: Map<string, InMemoryWatchlist[]> = new Map();

  async getWatchlists(userId: string): Promise<WatchlistEnriched[]> {
    if (dbManager.isConnected()) {
      let lists = await Watchlist.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: 1 });

      // If user has no default watchlist, auto-initialize default watchlist
      if (!lists.some((l) => l.isDefault)) {
        const defaultList = await Watchlist.create({
          userId: new Types.ObjectId(userId),
          name: 'My Watchlist',
          isDefault: true,
          items: [
            { symbol: 'RELIANCE', exchange: 'NSE', addedAt: new Date() },
            { symbol: 'TCS', exchange: 'NSE', addedAt: new Date() },
            { symbol: 'HDFCBANK', exchange: 'NSE', addedAt: new Date() },
            { symbol: 'INFY', exchange: 'NSE', addedAt: new Date() },
          ],
        });
        lists.unshift(defaultList);
      }

      return await Promise.all(lists.map((l) => this.enrichWatchlist(l)));
    }

    // In-memory fallback
    let userLists = this.inMemoryStore.get(userId) || [];
    if (!userLists.some((l) => l.isDefault)) {
      const defaultId = new Types.ObjectId().toHexString();
      const defaultList: InMemoryWatchlist = {
        id: defaultId,
        userId,
        name: 'My Watchlist',
        isDefault: true,
        items: [
          { symbol: 'RELIANCE', exchange: 'NSE', addedAt: new Date() },
          { symbol: 'TCS', exchange: 'NSE', addedAt: new Date() },
          { symbol: 'HDFCBANK', exchange: 'NSE', addedAt: new Date() },
          { symbol: 'INFY', exchange: 'NSE', addedAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userLists.unshift(defaultList);
      this.inMemoryStore.set(userId, userLists);
    }

    return await Promise.all(
      userLists.map((l) =>
        this.enrichWatchlist({
          _id: l.id,
          name: l.name,
          isDefault: l.isDefault,
          items: l.items,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        } as any)
      )
    );
  }

  async getWatchlistById(userId: string, watchlistId: string): Promise<WatchlistEnriched> {
    if (dbManager.isConnected()) {
      const list = await Watchlist.findOne({
        _id: new Types.ObjectId(watchlistId),
        userId: new Types.ObjectId(userId),
      });

      if (!list) {
        throw new NotFoundError('Watchlist not found');
      }

      return await this.enrichWatchlist(list);
    }

    const userLists = this.inMemoryStore.get(userId) || [];
    const found = userLists.find((l) => l.id === watchlistId);
    if (!found) {
      throw new NotFoundError('Watchlist not found');
    }

    return await this.enrichWatchlist({
      _id: found.id,
      name: found.name,
      isDefault: found.isDefault,
      items: found.items,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    } as any);
  }

  async createWatchlist(userId: string, input: CreateWatchlistInput): Promise<WatchlistEnriched> {
    const trimmedName = input.name.trim();

    if (dbManager.isConnected()) {
      const existing = await Watchlist.findOne({
        userId: new Types.ObjectId(userId),
        name: trimmedName,
      });

      if (existing) {
        throw new ConflictError(`Watchlist '${trimmedName}' already exists`);
      }

      const created = await Watchlist.create({
        userId: new Types.ObjectId(userId),
        name: trimmedName,
        isDefault: input.isDefault ?? false,
        items: [],
      });

      return await this.enrichWatchlist(created);
    }

    // In-memory fallback
    const userLists = this.inMemoryStore.get(userId) || [];
    if (userLists.some((l) => l.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new ConflictError(`Watchlist '${trimmedName}' already exists`);
    }

    const newId = new Types.ObjectId().toHexString();
    const created: InMemoryWatchlist = {
      id: newId,
      userId,
      name: trimmedName,
      isDefault: input.isDefault ?? false,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userLists.push(created);
    this.inMemoryStore.set(userId, userLists);

    return await this.enrichWatchlist({
      _id: created.id,
      name: created.name,
      isDefault: created.isDefault,
      items: created.items,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    } as any);
  }

  async addSymbol(
    userId: string,
    watchlistId: string,
    input: AddSymbolInput
  ): Promise<WatchlistEnriched> {
    const symbol = input.symbol.trim().toUpperCase();
    const exchange = input.exchange || 'NSE';

    // 1. Validate that the stock symbol exists in the market
    try {
      await marketService.getStockDetail(symbol);
    } catch {
      throw new NotFoundError(`Stock with symbol '${symbol}' does not exist in the market feed`);
    }

    if (dbManager.isConnected()) {
      const list = await Watchlist.findOne({
        _id: new Types.ObjectId(watchlistId),
        userId: new Types.ObjectId(userId),
      });

      if (!list) {
        throw new NotFoundError('Watchlist not found');
      }

      // 2. Prevent duplicate entries
      const alreadyExists = list.items.some((item) => item.symbol === symbol);
      if (alreadyExists) {
        throw new ConflictError(`Stock '${symbol}' is already in this watchlist`);
      }

      list.items.push({
        symbol,
        exchange,
        addedAt: new Date(),
      });

      await list.save();
      return await this.enrichWatchlist(list);
    }

    // In-memory fallback
    const userLists = this.inMemoryStore.get(userId) || [];
    const list = userLists.find((l) => l.id === watchlistId);
    if (!list) {
      throw new NotFoundError('Watchlist not found');
    }

    if (list.items.some((item) => item.symbol === symbol)) {
      throw new ConflictError(`Stock '${symbol}' is already in this watchlist`);
    }

    list.items.push({
      symbol,
      exchange,
      addedAt: new Date(),
    });
    list.updatedAt = new Date();

    return await this.enrichWatchlist({
      _id: list.id,
      name: list.name,
      isDefault: list.isDefault,
      items: list.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    } as any);
  }

  async removeSymbol(
    userId: string,
    watchlistId: string,
    symbol: string
  ): Promise<WatchlistEnriched> {
    const upperSymbol = symbol.trim().toUpperCase();

    if (dbManager.isConnected()) {
      const list = await Watchlist.findOne({
        _id: new Types.ObjectId(watchlistId),
        userId: new Types.ObjectId(userId),
      });

      if (!list) {
        throw new NotFoundError('Watchlist not found');
      }

      list.items = list.items.filter((item) => item.symbol !== upperSymbol) as any;
      await list.save();
      return await this.enrichWatchlist(list);
    }

    // In-memory fallback
    const userLists = this.inMemoryStore.get(userId) || [];
    const list = userLists.find((l) => l.id === watchlistId);
    if (!list) {
      throw new NotFoundError('Watchlist not found');
    }

    list.items = list.items.filter((item) => item.symbol !== upperSymbol);
    list.updatedAt = new Date();

    return await this.enrichWatchlist({
      _id: list.id,
      name: list.name,
      isDefault: list.isDefault,
      items: list.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    } as any);
  }

  async reorderWatchlist(
    userId: string,
    watchlistId: string,
    symbols: string[]
  ): Promise<WatchlistEnriched> {
    const upperSymbols = symbols.map((s) => s.trim().toUpperCase());

    if (dbManager.isConnected()) {
      const list = await Watchlist.findOne({
        _id: new Types.ObjectId(watchlistId),
        userId: new Types.ObjectId(userId),
      });

      if (!list) {
        throw new NotFoundError('Watchlist not found');
      }

      // Reorder items according to order in symbols array
      const itemMap = new Map<string, any>();
      list.items.forEach((item) => itemMap.set(item.symbol, item));

      const reordered: any[] = [];
      upperSymbols.forEach((sym) => {
        const item = itemMap.get(sym);
        if (item) {
          reordered.push(item);
          itemMap.delete(sym);
        }
      });
      // Append any remaining items that were not specified in the reorder request
      itemMap.forEach((item) => reordered.push(item));

      list.items = reordered as any;
      await list.save();
      return await this.enrichWatchlist(list);
    }

    // In-memory fallback
    const userLists = this.inMemoryStore.get(userId) || [];
    const list = userLists.find((l) => l.id === watchlistId);
    if (!list) {
      throw new NotFoundError('Watchlist not found');
    }

    const itemMap = new Map<string, any>();
    list.items.forEach((item) => itemMap.set(item.symbol, item));

    const reordered: any[] = [];
    upperSymbols.forEach((sym) => {
      const item = itemMap.get(sym);
      if (item) {
        reordered.push(item);
        itemMap.delete(sym);
      }
    });
    itemMap.forEach((item) => reordered.push(item));

    list.items = reordered;
    list.updatedAt = new Date();

    return await this.enrichWatchlist({
      _id: list.id,
      name: list.name,
      isDefault: list.isDefault,
      items: list.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    } as any);
  }

  async deleteWatchlist(userId: string, watchlistId: string): Promise<void> {
    if (dbManager.isConnected()) {
      const list = await Watchlist.findOne({
        _id: new Types.ObjectId(watchlistId),
        userId: new Types.ObjectId(userId),
      });

      if (!list) {
        throw new NotFoundError('Watchlist not found');
      }

      if (list.isDefault) {
        throw new BadRequestError('Cannot delete the default watchlist');
      }

      await Watchlist.deleteOne({ _id: list._id });
      return;
    }

    // In-memory fallback
    const userLists = this.inMemoryStore.get(userId) || [];
    const idx = userLists.findIndex((l) => l.id === watchlistId);
    if (idx === -1) {
      throw new NotFoundError('Watchlist not found');
    }

    if (userLists[idx].isDefault) {
      throw new BadRequestError('Cannot delete the default watchlist');
    }

    userLists.splice(idx, 1);
    this.inMemoryStore.set(userId, userLists);
  }

  private async enrichWatchlist(list: IWatchlist | any): Promise<WatchlistEnriched> {
    const listId = list._id ? list._id.toString() : list.id;
    const enrichedItems: WatchlistItemEnriched[] = [];

    for (const item of list.items || []) {
      try {
        const detail = await marketService.getStockDetail(item.symbol);
        const q = detail.quote;

        enrichedItems.push({
          symbol: q.symbol,
          companyName: q.companyName,
          sector: q.sector,
          exchange: q.exchange,
          ltpPaise: q.ltpPaise,
          ltpFormatted: q.ltpFormatted,
          changePaise: q.changePaise,
          changePercent: q.changePercent,
          changeFormatted: q.changeFormatted,
          highFormatted: q.highFormatted,
          lowFormatted: q.lowFormatted,
          volume: q.volume,
          dataSource: q.dataSource,
          isDelayed: q.isDelayed,
          isMock: q.isMock,
          isStale: q.isStale,
          lastUpdated: q.lastUpdated,
          addedAt: item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn(`Failed to enrich watchlist item ${item.symbol}:`, err.message);
        // Fallback item with uninitialized quote
        enrichedItems.push({
          symbol: item.symbol,
          companyName: item.symbol,
          sector: 'Equity',
          exchange: item.exchange || 'NSE',
          ltpPaise: 0,
          ltpFormatted: '₹0.00',
          changePaise: 0,
          changePercent: 0,
          changeFormatted: '0.00%',
          highFormatted: '₹0.00',
          lowFormatted: '₹0.00',
          volume: 0,
          dataSource: 'UNAVAILABLE',
          isDelayed: false,
          isMock: false,
          isStale: true,
          lastUpdated: new Date().toISOString(),
          addedAt: item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString(),
        });
      }
    }

    return {
      id: listId,
      name: list.name,
      isDefault: list.isDefault ?? false,
      items: enrichedItems,
      createdAt: list.createdAt ? new Date(list.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: list.updatedAt ? new Date(list.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}

export const watchlistService = new WatchlistService();
