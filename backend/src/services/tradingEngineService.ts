import { Types } from 'mongoose';
import { Portfolio, IPortfolio } from '../models/Portfolio';
import { Holding, IHolding } from '../models/Holding';
import { Order, IOrder, OrderSide, OrderType, OrderStatus } from '../models/Order';
import { TradeExecution, ITradeExecution } from '../models/TradeExecution';
import { CashLedger } from '../models/CashLedger';
import { dbManager } from '../config/database';
import { marketService } from './marketService';
import { CreateOrderInput, OrderQuery } from '../schemas/tradingSchemas';
import { STARTING_VIRTUAL_CAPITAL_PAISE, Money } from '../utilities/money';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utilities/errors';
import { logger } from '../utilities/logger';

export interface OrderExecutionResult {
  order: IOrder | InMemoryOrder;
  execution?: ITradeExecution | InMemoryExecution;
  cashBeforePaise: number;
  cashAfterPaise: number;
  message: string;
}

export interface PortfolioSummary {
  portfolioId: string;
  cashBalancePaise: number;
  reservedCashPaise: number;
  totalCashPaise: number;
  initialCapitalPaise: number;
  totalInvestedPaise: number;
  currentValuePaise: number;
  totalPortfolioValuePaise: number;
  unrealizedPnLPaise: number;
  unrealizedPnLPercent: number;
  holdingsCount: number;
}

export interface HoldingEnriched {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  avgBuyPricePaise: number;
  avgBuyPriceFormatted: string;
  totalInvestedPaise: number;
  totalInvestedFormatted: string;
  currentLtpPaise: number;
  currentLtpFormatted: string;
  currentValuePaise: number;
  currentValueFormatted: string;
  unrealizedPnLPaise: number;
  unrealizedPnLFormatted: string;
  unrealizedPnLPercent: number;
}

// In-Memory store for tests when MongoDB is not connected
interface InMemoryPortfolio {
  id: string;
  userId: string;
  cashBalancePaise: number;
  reservedCashPaise: number;
  initialCapitalPaise: number;
}

interface InMemoryHolding {
  id: string;
  userId: string;
  portfolioId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  lockedQuantity: number;
  avgBuyPricePaise: number;
  totalInvestedPaise: number;
}

interface InMemoryOrder {
  id: string;
  userId: string;
  portfolioId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: OrderSide;
  type: OrderType;
  productType: 'CNC' | 'MIS';
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  limitPricePaise?: number;
  avgExecutionPricePaise: number;
  reservedMarginPaise: number;
  estimatedFeesPaise: number;
  idempotencyKey?: string;
  dataSource?: string;
  quoteTimestamp?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InMemoryExecution {
  id: string;
  orderId: string;
  userId: string;
  portfolioId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: 'BUY' | 'SELL';
  quantity: number;
  executionPricePaise: number;
  totalValuePaise: number;
  feesPaise: number;
  dataSource?: string;
  quoteTimestamp?: Date;
  executedAt: Date;
}

interface InMemoryLedger {
  id: string;
  userId: string;
  portfolioId: string;
  entryType: 'CREDIT' | 'DEBIT';
  reason: string;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  createdAt: Date;
}

export class TradingEngineService {
  private memPortfolios = new Map<string, InMemoryPortfolio>();
  private memHoldings: InMemoryHolding[] = [];
  private memOrders: InMemoryOrder[] = [];
  private memExecutions: InMemoryExecution[] = [];
  private memLedger: InMemoryLedger[] = [];

  // Slippage: 5 basis points (0.05%)
  private readonly SLIPPAGE_RATE = 0.0005;

  /**
   * Calculates regulatory fees and statutory taxes per SEBI/NSE schedules
   */
  calculateCharges(tradeValuePaise: number, productType: 'CNC' | 'MIS', side: OrderSide) {
    const tradeValueRs = tradeValuePaise / 100;

    // Brokerage: ₹0
    const brokerageRs = 0;
    // STT: 0.1% for Delivery CNC buy/sell, 0.025% for Intraday MIS sell
    const sttRs =
      productType === 'CNC' ? tradeValueRs * 0.001 : side === 'SELL' ? tradeValueRs * 0.00025 : 0;
    // Exchange Turnover Fee (NSE 0.00297%)
    const exchangeTurnoverRs = tradeValueRs * 0.0000297;
    // GST: 18% on exchange turnover
    const gstRs = (brokerageRs + exchangeTurnoverRs) * 0.18;
    // Stamp duty: 0.015% on buy side only
    const stampDutyRs = side === 'BUY' ? tradeValueRs * 0.00015 : 0;
    // SEBI Turnover Fee (₹10 per crore)
    const sebiFeeRs = tradeValueRs * 0.000001;

    const totalChargesRs =
      brokerageRs + sttRs + exchangeTurnoverRs + gstRs + stampDutyRs + sebiFeeRs;

    return {
      totalChargesPaise: Math.max(1, Math.round(totalChargesRs * 100)),
      sttPaise: Math.round(sttRs * 100),
      turnoverFeePaise: Math.round(exchangeTurnoverRs * 100),
      gstPaise: Math.round(gstRs * 100),
      stampDutyPaise: Math.round(stampDutyRs * 100),
    };
  }

  /**
   * Retrieves or initializes default virtual portfolio for user
   */
  async getOrCreatePortfolio(userId: string): Promise<IPortfolio | InMemoryPortfolio> {
    if (dbManager.isConnected()) {
      let p = await Portfolio.findOne({ userId: new Types.ObjectId(userId) });
      if (!p) {
        p = await Portfolio.create({
          userId: new Types.ObjectId(userId),
          cashBalancePaise: STARTING_VIRTUAL_CAPITAL_PAISE,
          reservedCashPaise: 0,
          initialCapitalPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
        });

        await CashLedger.create({
          userId: new Types.ObjectId(userId),
          portfolioId: p._id,
          entryType: 'CREDIT',
          reason: 'INITIAL_ALLOCATION',
          amountPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
          balanceBeforePaise: 0,
          balanceAfterPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
          description: 'Virtual account initialized with ₹10,00,000 capital',
        });
      }
      return p;
    }

    // In-memory fallback
    let p = this.memPortfolios.get(userId);
    if (!p) {
      const pId = new Types.ObjectId().toHexString();
      p = {
        id: pId,
        userId,
        cashBalancePaise: STARTING_VIRTUAL_CAPITAL_PAISE,
        reservedCashPaise: 0,
        initialCapitalPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
      };
      this.memPortfolios.set(userId, p);

      this.memLedger.push({
        id: new Types.ObjectId().toHexString(),
        userId,
        portfolioId: pId,
        entryType: 'CREDIT',
        reason: 'INITIAL_ALLOCATION',
        amountPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
        balanceBeforePaise: 0,
        balanceAfterPaise: STARTING_VIRTUAL_CAPITAL_PAISE,
        description: 'Virtual account initialized with ₹10,00,000 capital',
        createdAt: new Date(),
      });
    }
    return p;
  }

  /**
   * Core order placement and execution engine
   */
  async placeOrder(userId: string, input: CreateOrderInput): Promise<OrderExecutionResult> {
    const symbol = input.symbol.trim().toUpperCase();
    const side = input.side;
    const type = input.type;
    const productType = input.productType || 'CNC';
    const quantity = input.quantity;

    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await this.findOrderByIdempotency(userId, input.idempotencyKey);
      if (existing) {
        logger.info(`Idempotent order placement matched: ${existing.id}`);
        const p = await this.getOrCreatePortfolio(userId);
        return {
          order: existing,
          cashBeforePaise: p.cashBalancePaise,
          cashAfterPaise: p.cashBalancePaise,
          message: 'Order was already placed (idempotent request)',
        };
      }
    }

    // 2. Fetch server-authoritative stock quote (never trust client price!)
    const stockDetail = await marketService.getStockDetail(symbol);
    const quote = stockDetail.quote;
    const ltpPaise = quote.ltpPaise;
    const quoteTimestamp = new Date(quote.lastUpdated);
    const dataSource = quote.dataSource || 'MOCK_SIMULATED';

    const portfolio = await this.getOrCreatePortfolio(userId);
    const portfolioId = '_id' in portfolio ? String(portfolio._id) : portfolio.id;
    const cashBeforePaise = portfolio.cashBalancePaise;

    // 3. Handle BUY Order
    if (side === 'BUY') {
      if (type === 'MARKET') {
        // Market Buy Execution
        const executionPricePaise = Math.round(ltpPaise * (1 + this.SLIPPAGE_RATE));
        const tradeValuePaise = executionPricePaise * quantity;
        const charges = this.calculateCharges(tradeValuePaise, productType, 'BUY');
        const totalDebitPaise = tradeValuePaise + charges.totalChargesPaise;

        if (portfolio.cashBalancePaise < totalDebitPaise) {
          throw new BadRequestError(
            `Insufficient virtual funds. Required: ${Money.fromPaise(totalDebitPaise).toINR()}, Available: ${Money.fromPaise(portfolio.cashBalancePaise).toINR()}`
          );
        }

        // Execute immediately
        const cashAfterPaise = portfolio.cashBalancePaise - totalDebitPaise;

        const { order, execution } = await this.recordBuyExecution({
          userId,
          portfolioId,
          symbol,
          exchange: input.exchange,
          side: 'BUY',
          type: 'MARKET',
          productType,
          quantity,
          executionPricePaise,
          tradeValuePaise,
          feesPaise: charges.totalChargesPaise,
          cashBeforePaise,
          cashAfterPaise,
          dataSource,
          quoteTimestamp,
          idempotencyKey: input.idempotencyKey,
        });

        return {
          order,
          execution,
          cashBeforePaise,
          cashAfterPaise,
          message: `Market buy executed for ${quantity} shares of ${symbol} at ${Money.fromPaise(executionPricePaise).toINR()}`,
        };
      } else {
        // Limit Buy Order
        const limitPricePaise = input.limitPricePaise!;
        const estimatedTradeValuePaise = limitPricePaise * quantity;
        const charges = this.calculateCharges(estimatedTradeValuePaise, productType, 'BUY');
        const requiredMarginPaise = estimatedTradeValuePaise + charges.totalChargesPaise;

        if (portfolio.cashBalancePaise < requiredMarginPaise) {
          throw new BadRequestError(
            `Insufficient virtual funds to place limit order. Required: ${Money.fromPaise(requiredMarginPaise).toINR()}, Available: ${Money.fromPaise(portfolio.cashBalancePaise).toINR()}`
          );
        }

        // Check if market price satisfies limit condition immediately (price improvement!)
        if (ltpPaise <= limitPricePaise) {
          const executionPricePaise = Math.min(ltpPaise, limitPricePaise);
          const tradeValuePaise = executionPricePaise * quantity;
          const actualCharges = this.calculateCharges(tradeValuePaise, productType, 'BUY');
          const totalDebitPaise = tradeValuePaise + actualCharges.totalChargesPaise;

          const cashAfterPaise = portfolio.cashBalancePaise - totalDebitPaise;

          const { order, execution } = await this.recordBuyExecution({
            userId,
            portfolioId,
            symbol,
            exchange: input.exchange,
            side: 'BUY',
            type: 'LIMIT',
            productType,
            quantity,
            executionPricePaise,
            tradeValuePaise,
            feesPaise: actualCharges.totalChargesPaise,
            cashBeforePaise,
            cashAfterPaise,
            limitPricePaise,
            dataSource,
            quoteTimestamp,
            idempotencyKey: input.idempotencyKey,
          });

          return {
            order,
            execution,
            cashBeforePaise,
            cashAfterPaise,
            message: `Limit buy executed immediately with price improvement at ${Money.fromPaise(executionPricePaise).toINR()}`,
          };
        }

        // Out of the money: Reserve funds and create OPEN limit order
        const cashAfterPaise = portfolio.cashBalancePaise - requiredMarginPaise;
        const reservedAfterPaise = portfolio.reservedCashPaise + requiredMarginPaise;

        const order = await this.recordOpenLimitBuyOrder({
          userId,
          portfolioId,
          symbol,
          exchange: input.exchange,
          productType,
          quantity,
          limitPricePaise,
          reservedMarginPaise: requiredMarginPaise,
          estimatedFeesPaise: charges.totalChargesPaise,
          cashAfterPaise,
          reservedAfterPaise,
          dataSource,
          quoteTimestamp,
          idempotencyKey: input.idempotencyKey,
        });

        return {
          order,
          cashBeforePaise,
          cashAfterPaise,
          message: `Limit buy order placed and funds reserved at ${Money.fromPaise(limitPricePaise).toINR()}`,
        };
      }
    }

    // 4. Handle SELL Order
    else {
      // Validate share ownership
      const holding = await this.findHolding(userId, symbol);
      const availableShares = holding ? holding.quantity - holding.lockedQuantity : 0;

      if (!holding || availableShares < quantity) {
        throw new BadRequestError(
          `Insufficient shares to sell. Available: ${availableShares}, Requested: ${quantity}`
        );
      }

      if (type === 'MARKET') {
        // Market Sell Execution
        const executionPricePaise = Math.round(ltpPaise * (1 - this.SLIPPAGE_RATE));
        const tradeValuePaise = executionPricePaise * quantity;
        const charges = this.calculateCharges(tradeValuePaise, productType, 'SELL');
        const netCreditPaise = tradeValuePaise - charges.totalChargesPaise;

        const cashAfterPaise = portfolio.cashBalancePaise + netCreditPaise;

        const { order, execution } = await this.recordSellExecution({
          userId,
          portfolioId,
          symbol,
          exchange: input.exchange,
          side: 'SELL',
          type: 'MARKET',
          productType,
          quantity,
          executionPricePaise,
          tradeValuePaise,
          feesPaise: charges.totalChargesPaise,
          netCreditPaise,
          cashBeforePaise,
          cashAfterPaise,
          holding,
          dataSource,
          quoteTimestamp,
          idempotencyKey: input.idempotencyKey,
        });

        return {
          order,
          execution,
          cashBeforePaise,
          cashAfterPaise,
          message: `Market sell executed for ${quantity} shares of ${symbol} at ${Money.fromPaise(executionPricePaise).toINR()}`,
        };
      } else {
        // Limit Sell Order
        const limitPricePaise = input.limitPricePaise!;

        // Check if market price meets limit price immediately
        if (ltpPaise >= limitPricePaise) {
          const executionPricePaise = Math.max(ltpPaise, limitPricePaise);
          const tradeValuePaise = executionPricePaise * quantity;
          const charges = this.calculateCharges(tradeValuePaise, productType, 'SELL');
          const netCreditPaise = tradeValuePaise - charges.totalChargesPaise;

          const cashAfterPaise = portfolio.cashBalancePaise + netCreditPaise;

          const { order, execution } = await this.recordSellExecution({
            userId,
            portfolioId,
            symbol,
            exchange: input.exchange,
            side: 'SELL',
            type: 'LIMIT',
            productType,
            quantity,
            executionPricePaise,
            tradeValuePaise,
            feesPaise: charges.totalChargesPaise,
            netCreditPaise,
            cashBeforePaise,
            cashAfterPaise,
            limitPricePaise,
            holding,
            dataSource,
            quoteTimestamp,
            idempotencyKey: input.idempotencyKey,
          });

          return {
            order,
            execution,
            cashBeforePaise,
            cashAfterPaise,
            message: `Limit sell executed immediately at ${Money.fromPaise(executionPricePaise).toINR()}`,
          };
        }

        // Out of the money: Lock shares and place OPEN limit order
        const order = await this.recordOpenLimitSellOrder({
          userId,
          portfolioId,
          symbol,
          exchange: input.exchange,
          productType,
          quantity,
          limitPricePaise,
          holding,
          dataSource,
          quoteTimestamp,
          idempotencyKey: input.idempotencyKey,
        });

        return {
          order,
          cashBeforePaise,
          cashAfterPaise: portfolio.cashBalancePaise,
          message: `Limit sell order placed and ${quantity} shares reserved at ${Money.fromPaise(limitPricePaise).toINR()}`,
        };
      }
    }
  }

  /**
   * Cancels an eligible open order, safely releasing reserved cash or locked shares
   */
  async cancelOrder(userId: string, orderId: string): Promise<IOrder | InMemoryOrder> {
    const order = await this.findOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new ForbiddenError('You do not own this order');
    }

    if (order.status !== 'OPEN' && order.status !== 'PENDING') {
      throw new BadRequestError(`Cannot cancel order with status '${order.status}'`);
    }

    // Release reservations
    if (order.side === 'BUY') {
      // Refund reserved cash
      await this.releaseReservedCash(userId, order.portfolioId.toString(), order.reservedMarginPaise, orderId);
    } else {
      // Unlock reserved shares
      await this.releaseLockedShares(userId, order.symbol, order.quantity);
    }

    // Update order status to CANCELLED
    if (dbManager.isConnected()) {
      order.status = 'CANCELLED';
      if ('save' in order && typeof order.save === 'function') {
        await order.save();
      }
      return order;
    }

    (order as InMemoryOrder).status = 'CANCELLED';
    (order as InMemoryOrder).updatedAt = new Date();
    return order;
  }

  /**
   * Retrieves orders for a user with status filter & pagination
   */
  async getOrders(userId: string, query: OrderQuery) {
    const { page = 1, limit = 20, status = 'ALL', symbol, side } = query;
    const skip = (page - 1) * limit;

    if (dbManager.isConnected()) {
      const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
      if (status !== 'ALL') {
        if (status === 'FILLED' || status === 'EXECUTED') {
          filter.status = { $in: ['FILLED', 'EXECUTED'] };
        } else {
          filter.status = status;
        }
      }
      if (symbol) filter.symbol = symbol.toUpperCase();
      if (side) filter.side = side;

      const [docs, total] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;
      return {
        items: docs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    // In-memory filter
    let filtered = this.memOrders.filter((o) => o.userId === userId);
    if (status !== 'ALL') {
      if (status === 'FILLED' || status === 'EXECUTED') {
        filtered = filtered.filter((o) => o.status === 'FILLED' || o.status === 'EXECUTED');
      } else {
        filtered = filtered.filter((o) => o.status === status);
      }
    }
    if (symbol) filtered = filtered.filter((o) => o.symbol === symbol.toUpperCase());
    if (side) filtered = filtered.filter((o) => o.side === side);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Retrieves single order by ID with ownership verification
   */
  async getOrderById(userId: string, orderId: string) {
    const order = await this.findOrderById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.userId.toString() !== userId) throw new ForbiddenError('You do not own this order');

    const executions = await this.findExecutionsByOrderId(orderId);
    return { order, executions };
  }

  /**
   * Retrieves user portfolio summary and enriched holdings
   */
  async getPortfolioSummary(userId: string): Promise<{
    summary: PortfolioSummary;
    holdings: HoldingEnriched[];
  }> {
    const portfolio = await this.getOrCreatePortfolio(userId);
    const portfolioId = '_id' in portfolio ? String(portfolio._id) : portfolio.id;

    const rawHoldings = await this.findUserHoldings(userId);
    const holdingsEnriched: HoldingEnriched[] = [];

    let totalInvestedPaise = 0;
    let currentValuePaise = 0;

    for (const h of rawHoldings) {
      if (h.quantity <= 0) continue;

      let ltpPaise = h.avgBuyPricePaise;
      try {
        const detail = await marketService.getStockDetail(h.symbol);
        ltpPaise = detail.quote.ltpPaise;
      } catch (error) {
        // Fallback to average purchase price if current quote is temporarily unavailable
        logger.debug(`Using fallback acquisition price for ${h.symbol}: ${error instanceof Error ? error.message : String(error)}`);
      }

      const holdingCurrentValuePaise = ltpPaise * h.quantity;
      const holdingInvestedPaise = h.totalInvestedPaise;
      const unrealizedPnLPaise = holdingCurrentValuePaise - holdingInvestedPaise;
      const unrealizedPnLPercent =
        holdingInvestedPaise > 0 ? (unrealizedPnLPaise / holdingInvestedPaise) * 100 : 0;

      totalInvestedPaise += holdingInvestedPaise;
      currentValuePaise += holdingCurrentValuePaise;

      holdingsEnriched.push({
        symbol: h.symbol,
        exchange: h.exchange,
        quantity: h.quantity,
        lockedQuantity: h.lockedQuantity,
        availableQuantity: h.quantity - h.lockedQuantity,
        avgBuyPricePaise: h.avgBuyPricePaise,
        avgBuyPriceFormatted: Money.fromPaise(h.avgBuyPricePaise).toINR(),
        totalInvestedPaise: h.totalInvestedPaise,
        totalInvestedFormatted: Money.fromPaise(h.totalInvestedPaise).toINR(),
        currentLtpPaise: ltpPaise,
        currentLtpFormatted: Money.fromPaise(ltpPaise).toINR(),
        currentValuePaise: holdingCurrentValuePaise,
        currentValueFormatted: Money.fromPaise(holdingCurrentValuePaise).toINR(),
        unrealizedPnLPaise,
        unrealizedPnLFormatted: `${unrealizedPnLPaise >= 0 ? '+' : ''}${Money.fromPaise(unrealizedPnLPaise).toINR()}`,
        unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
      });
    }

    const cashBalancePaise = portfolio.cashBalancePaise;
    const reservedCashPaise = portfolio.reservedCashPaise;
    const totalCashPaise = cashBalancePaise + reservedCashPaise;
    const totalPortfolioValuePaise = totalCashPaise + currentValuePaise;
    const unrealizedPnLPaise = currentValuePaise - totalInvestedPaise;
    const unrealizedPnLPercent =
      totalInvestedPaise > 0 ? (unrealizedPnLPaise / totalInvestedPaise) * 100 : 0;

    const summary: PortfolioSummary = {
      portfolioId,
      cashBalancePaise,
      reservedCashPaise,
      totalCashPaise,
      initialCapitalPaise: portfolio.initialCapitalPaise,
      totalInvestedPaise,
      currentValuePaise,
      totalPortfolioValuePaise,
      unrealizedPnLPaise,
      unrealizedPnLPercent: Math.round(unrealizedPnLPercent * 100) / 100,
      holdingsCount: holdingsEnriched.length,
    };

    return { summary, holdings: holdingsEnriched };
  }

  /**
   * Retrieves cash ledger transaction history
   */
  async getCashLedger(userId: string) {
    if (dbManager.isConnected()) {
      return await CashLedger.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
    }
    return this.memLedger
      .filter((l) => l.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Retrieves trade executions
   */
  async getExecutions(userId: string) {
    if (dbManager.isConnected()) {
      return await TradeExecution.find({ userId: new Types.ObjectId(userId) }).sort({ executedAt: -1 });
    }
    return this.memExecutions
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  // --- Internal Execution & State Update Helpers ---

  private async recordBuyExecution(params: {
    userId: string;
    portfolioId: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    side: OrderSide;
    type: OrderType;
    productType: 'CNC' | 'MIS';
    quantity: number;
    executionPricePaise: number;
    tradeValuePaise: number;
    feesPaise: number;
    cashBeforePaise: number;
    cashAfterPaise: number;
    limitPricePaise?: number;
    dataSource: string;
    quoteTimestamp: Date;
    idempotencyKey?: string;
  }) {
    const {
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      type,
      productType,
      quantity,
      executionPricePaise,
      tradeValuePaise,
      feesPaise,
      cashBeforePaise,
      cashAfterPaise,
      limitPricePaise,
      dataSource,
      quoteTimestamp,
      idempotencyKey,
    } = params;

    const totalDebitPaise = tradeValuePaise + feesPaise;

    if (dbManager.isConnected()) {
      // 1. Update Portfolio Cash Balance
      await Portfolio.updateOne(
        { _id: new Types.ObjectId(portfolioId) },
        { $set: { cashBalancePaise: cashAfterPaise } }
      );

      // 2. Create Order Record
      const order = await Order.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side,
        type,
        productType,
        status: 'FILLED',
        quantity,
        filledQuantity: quantity,
        limitPricePaise,
        avgExecutionPricePaise: executionPricePaise,
        reservedMarginPaise: 0,
        estimatedFeesPaise: feesPaise,
        idempotencyKey,
        dataSource,
        quoteTimestamp,
      });

      // 3. Create Execution Record
      const execution = await TradeExecution.create({
        orderId: order._id,
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side,
        quantity,
        executionPricePaise,
        totalValuePaise: tradeValuePaise,
        feesPaise,
        dataSource,
        quoteTimestamp,
        executedAt: new Date(),
      });

      // 4. Update or Create Holding with Weighted Average Cost
      const holding = await Holding.findOne({
        userId: new Types.ObjectId(userId),
        symbol,
      });

      if (holding) {
        const oldQty = holding.quantity;
        const oldTotalInvested = holding.totalInvestedPaise;
        const newQty = oldQty + quantity;
        const newTotalInvested = oldTotalInvested + tradeValuePaise;
        const newAvgBuyPrice = Math.round(newTotalInvested / newQty);

        holding.quantity = newQty;
        holding.totalInvestedPaise = newTotalInvested;
        holding.avgBuyPricePaise = newAvgBuyPrice;
        await holding.save();
      } else {
        await Holding.create({
          userId: new Types.ObjectId(userId),
          portfolioId: new Types.ObjectId(portfolioId),
          symbol,
          exchange,
          quantity,
          lockedQuantity: 0,
          avgBuyPricePaise: executionPricePaise,
          totalInvestedPaise: tradeValuePaise,
        });
      }

      // 5. Create Immutable Cash Ledger Entry
      await CashLedger.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        entryType: 'DEBIT',
        reason: 'ORDER_EXECUTION',
        amountPaise: totalDebitPaise,
        balanceBeforePaise: cashBeforePaise,
        balanceAfterPaise: cashAfterPaise,
        referenceId: order._id.toString(),
        idempotencyKey,
        description: `Bought ${quantity} ${symbol} @ ₹${(executionPricePaise / 100).toFixed(2)} (Fees: ₹${(feesPaise / 100).toFixed(2)})`,
      });

      return { order, execution };
    }

    // In-memory fallback
    const p = this.memPortfolios.get(userId)!;
    p.cashBalancePaise = cashAfterPaise;

    const orderId = new Types.ObjectId().toHexString();
    const order: InMemoryOrder = {
      id: orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      type,
      productType,
      status: 'FILLED',
      quantity,
      filledQuantity: quantity,
      limitPricePaise,
      avgExecutionPricePaise: executionPricePaise,
      reservedMarginPaise: 0,
      estimatedFeesPaise: feesPaise,
      idempotencyKey,
      dataSource,
      quoteTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memOrders.push(order);

    const execId = new Types.ObjectId().toHexString();
    const execution: InMemoryExecution = {
      id: execId,
      orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      quantity,
      executionPricePaise,
      totalValuePaise: tradeValuePaise,
      feesPaise,
      dataSource,
      quoteTimestamp,
      executedAt: new Date(),
    };
    this.memExecutions.push(execution);

    let h = this.memHoldings.find((x) => x.userId === userId && x.symbol === symbol);
    if (h) {
      const oldQty = h.quantity;
      const oldTotal = h.totalInvestedPaise;
      const newQty = oldQty + quantity;
      const newTotal = oldTotal + tradeValuePaise;
      h.quantity = newQty;
      h.totalInvestedPaise = newTotal;
      h.avgBuyPricePaise = Math.round(newTotal / newQty);
    } else {
      h = {
        id: new Types.ObjectId().toHexString(),
        userId,
        portfolioId,
        symbol,
        exchange,
        quantity,
        lockedQuantity: 0,
        avgBuyPricePaise: executionPricePaise,
        totalInvestedPaise: tradeValuePaise,
      };
      this.memHoldings.push(h);
    }

    this.memLedger.push({
      id: new Types.ObjectId().toHexString(),
      userId,
      portfolioId,
      entryType: 'DEBIT',
      reason: 'ORDER_EXECUTION',
      amountPaise: totalDebitPaise,
      balanceBeforePaise: cashBeforePaise,
      balanceAfterPaise: cashAfterPaise,
      referenceId: orderId,
      idempotencyKey,
      description: `Bought ${quantity} ${symbol} @ ₹${(executionPricePaise / 100).toFixed(2)}`,
      createdAt: new Date(),
    });

    return { order, execution };
  }

  private async recordSellExecution(params: {
    userId: string;
    portfolioId: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    side: OrderSide;
    type: OrderType;
    productType: 'CNC' | 'MIS';
    quantity: number;
    executionPricePaise: number;
    tradeValuePaise: number;
    feesPaise: number;
    netCreditPaise: number;
    cashBeforePaise: number;
    cashAfterPaise: number;
    limitPricePaise?: number;
    holding: IHolding | InMemoryHolding;
    dataSource: string;
    quoteTimestamp: Date;
    idempotencyKey?: string;
  }) {
    const {
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      type,
      productType,
      quantity,
      executionPricePaise,
      tradeValuePaise,
      feesPaise,
      netCreditPaise,
      cashBeforePaise,
      cashAfterPaise,
      limitPricePaise,
      holding,
      dataSource,
      quoteTimestamp,
      idempotencyKey,
    } = params;

    if (dbManager.isConnected()) {
      // 1. Credit Cash Balance
      await Portfolio.updateOne(
        { _id: new Types.ObjectId(portfolioId) },
        { $set: { cashBalancePaise: cashAfterPaise } }
      );

      // 2. Record Order
      const order = await Order.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side,
        type,
        productType,
        status: 'FILLED',
        quantity,
        filledQuantity: quantity,
        limitPricePaise,
        avgExecutionPricePaise: executionPricePaise,
        reservedMarginPaise: 0,
        estimatedFeesPaise: feesPaise,
        idempotencyKey,
        dataSource,
        quoteTimestamp,
      });

      // 3. Record Execution
      const execution = await TradeExecution.create({
        orderId: order._id,
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side,
        quantity,
        executionPricePaise,
        totalValuePaise: tradeValuePaise,
        feesPaise,
        dataSource,
        quoteTimestamp,
        executedAt: new Date(),
      });

      // 4. Reduce Holding Quantity (pro-rate invested capital, cost basis remains invariant)
      holding.quantity -= quantity;
      if (holding.quantity <= 0) {
        holding.quantity = 0;
        holding.totalInvestedPaise = 0;
      } else {
        holding.totalInvestedPaise = holding.quantity * holding.avgBuyPricePaise;
      }
      if ('save' in holding && typeof holding.save === 'function') {
        await holding.save();
      }

      // 5. Record Cash Ledger Credit
      await CashLedger.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        entryType: 'CREDIT',
        reason: 'ORDER_EXECUTION',
        amountPaise: netCreditPaise,
        balanceBeforePaise: cashBeforePaise,
        balanceAfterPaise: cashAfterPaise,
        referenceId: order._id.toString(),
        idempotencyKey,
        description: `Sold ${quantity} ${symbol} @ ₹${(executionPricePaise / 100).toFixed(2)} (Net: ₹${(netCreditPaise / 100).toFixed(2)})`,
      });

      return { order, execution };
    }

    // In-memory fallback
    const p = this.memPortfolios.get(userId)!;
    p.cashBalancePaise = cashAfterPaise;

    const orderId = new Types.ObjectId().toHexString();
    const order: InMemoryOrder = {
      id: orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      type,
      productType,
      status: 'FILLED',
      quantity,
      filledQuantity: quantity,
      limitPricePaise,
      avgExecutionPricePaise: executionPricePaise,
      reservedMarginPaise: 0,
      estimatedFeesPaise: feesPaise,
      idempotencyKey,
      dataSource,
      quoteTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memOrders.push(order);

    const execId = new Types.ObjectId().toHexString();
    const execution: InMemoryExecution = {
      id: execId,
      orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side,
      quantity,
      executionPricePaise,
      totalValuePaise: tradeValuePaise,
      feesPaise,
      dataSource,
      quoteTimestamp,
      executedAt: new Date(),
    };
    this.memExecutions.push(execution);

    holding.quantity -= quantity;
    if (holding.quantity <= 0) {
      holding.quantity = 0;
      holding.totalInvestedPaise = 0;
    } else {
      holding.totalInvestedPaise = holding.quantity * holding.avgBuyPricePaise;
    }

    this.memLedger.push({
      id: new Types.ObjectId().toHexString(),
      userId,
      portfolioId,
      entryType: 'CREDIT',
      reason: 'ORDER_EXECUTION',
      amountPaise: netCreditPaise,
      balanceBeforePaise: cashBeforePaise,
      balanceAfterPaise: cashAfterPaise,
      referenceId: orderId,
      idempotencyKey,
      description: `Sold ${quantity} ${symbol} @ ₹${(executionPricePaise / 100).toFixed(2)}`,
      createdAt: new Date(),
    });

    return { order, execution };
  }

  private async recordOpenLimitBuyOrder(params: {
    userId: string;
    portfolioId: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    productType: 'CNC' | 'MIS';
    quantity: number;
    limitPricePaise: number;
    reservedMarginPaise: number;
    estimatedFeesPaise: number;
    cashAfterPaise: number;
    reservedAfterPaise: number;
    dataSource: string;
    quoteTimestamp: Date;
    idempotencyKey?: string;
  }) {
    const {
      userId,
      portfolioId,
      symbol,
      exchange,
      productType,
      quantity,
      limitPricePaise,
      reservedMarginPaise,
      estimatedFeesPaise,
      cashAfterPaise,
      reservedAfterPaise,
      dataSource,
      quoteTimestamp,
      idempotencyKey,
    } = params;

    if (dbManager.isConnected()) {
      // 1. Atomically transfer cash to reservedCash
      await Portfolio.updateOne(
        { _id: new Types.ObjectId(portfolioId) },
        {
          $set: {
            cashBalancePaise: cashAfterPaise,
            reservedCashPaise: reservedAfterPaise,
          },
        }
      );

      // 2. Create Order in OPEN status
      const order = await Order.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side: 'BUY',
        type: 'LIMIT',
        productType,
        status: 'OPEN',
        quantity,
        filledQuantity: 0,
        limitPricePaise,
        avgExecutionPricePaise: 0,
        reservedMarginPaise,
        estimatedFeesPaise,
        idempotencyKey,
        dataSource,
        quoteTimestamp,
      });

      // 3. Create Immutable Cash Ledger Entry for Margin Reservation
      await CashLedger.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        entryType: 'DEBIT',
        reason: 'ORDER_RESERVATION',
        amountPaise: reservedMarginPaise,
        balanceBeforePaise: cashAfterPaise + reservedMarginPaise,
        balanceAfterPaise: cashAfterPaise,
        referenceId: order._id.toString(),
        idempotencyKey,
        description: `Margin reserved for open limit buy order of ${quantity} ${symbol}`,
      });

      return order;
    }

    // In-memory fallback
    const p = this.memPortfolios.get(userId)!;
    p.cashBalancePaise = cashAfterPaise;
    p.reservedCashPaise = reservedAfterPaise;

    const orderId = new Types.ObjectId().toHexString();
    const order: InMemoryOrder = {
      id: orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side: 'BUY',
      type: 'LIMIT',
      productType,
      status: 'OPEN',
      quantity,
      filledQuantity: 0,
      limitPricePaise,
      avgExecutionPricePaise: 0,
      reservedMarginPaise,
      estimatedFeesPaise,
      idempotencyKey,
      dataSource,
      quoteTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memOrders.push(order);

    this.memLedger.push({
      id: new Types.ObjectId().toHexString(),
      userId,
      portfolioId,
      entryType: 'DEBIT',
      reason: 'ORDER_RESERVATION',
      amountPaise: reservedMarginPaise,
      balanceBeforePaise: cashAfterPaise + reservedMarginPaise,
      balanceAfterPaise: cashAfterPaise,
      referenceId: orderId,
      idempotencyKey,
      description: `Margin reserved for open limit buy order of ${quantity} ${symbol}`,
      createdAt: new Date(),
    });

    return order;
  }

  private async recordOpenLimitSellOrder(params: {
    userId: string;
    portfolioId: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    productType: 'CNC' | 'MIS';
    quantity: number;
    limitPricePaise: number;
    holding: IHolding | InMemoryHolding;
    dataSource: string;
    quoteTimestamp: Date;
    idempotencyKey?: string;
  }) {
    const {
      userId,
      portfolioId,
      symbol,
      exchange,
      productType,
      quantity,
      limitPricePaise,
      holding,
      dataSource,
      quoteTimestamp,
      idempotencyKey,
    } = params;

    if (dbManager.isConnected()) {
      // 1. Lock shares on Holding
      holding.lockedQuantity += quantity;
      if ('save' in holding && typeof holding.save === 'function') {
        await holding.save();
      }

      // 2. Create Order in OPEN status
      const order = await Order.create({
        userId: new Types.ObjectId(userId),
        portfolioId: new Types.ObjectId(portfolioId),
        symbol,
        exchange,
        side: 'SELL',
        type: 'LIMIT',
        productType,
        status: 'OPEN',
        quantity,
        filledQuantity: 0,
        limitPricePaise,
        avgExecutionPricePaise: 0,
        reservedMarginPaise: 0,
        estimatedFeesPaise: 0,
        idempotencyKey,
        dataSource,
        quoteTimestamp,
      });

      return order;
    }

    // In-memory fallback
    holding.lockedQuantity += quantity;

    const orderId = new Types.ObjectId().toHexString();
    const order: InMemoryOrder = {
      id: orderId,
      userId,
      portfolioId,
      symbol,
      exchange,
      side: 'SELL',
      type: 'LIMIT',
      productType,
      status: 'OPEN',
      quantity,
      filledQuantity: 0,
      limitPricePaise,
      avgExecutionPricePaise: 0,
      reservedMarginPaise: 0,
      estimatedFeesPaise: 0,
      idempotencyKey,
      dataSource,
      quoteTimestamp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.memOrders.push(order);
    return order;
  }

  private async releaseReservedCash(userId: string, portfolioId: string, amountPaise: number, orderId: string) {
    if (amountPaise <= 0) return;

    if (dbManager.isConnected()) {
      const p = await Portfolio.findById(portfolioId);
      if (p) {
        const cashBefore = p.cashBalancePaise;
        const actualRelease = Math.min(p.reservedCashPaise, amountPaise);
        p.reservedCashPaise -= actualRelease;
        p.cashBalancePaise += actualRelease;
        await p.save();

        await CashLedger.create({
          userId: new Types.ObjectId(userId),
          portfolioId: p._id,
          entryType: 'CREDIT',
          reason: 'ORDER_CANCELLATION_REFUND',
          amountPaise: actualRelease,
          balanceBeforePaise: cashBefore,
          balanceAfterPaise: p.cashBalancePaise,
          referenceId: orderId,
          description: `Refund of reserved margin on order cancellation`,
        });
      }
      return;
    }

    const p = this.memPortfolios.get(userId);
    if (p) {
      const cashBefore = p.cashBalancePaise;
      const actualRelease = Math.min(p.reservedCashPaise, amountPaise);
      p.reservedCashPaise -= actualRelease;
      p.cashBalancePaise += actualRelease;

      this.memLedger.push({
        id: new Types.ObjectId().toHexString(),
        userId,
        portfolioId,
        entryType: 'CREDIT',
        reason: 'ORDER_CANCELLATION_REFUND',
        amountPaise: actualRelease,
        balanceBeforePaise: cashBefore,
        balanceAfterPaise: p.cashBalancePaise,
        referenceId: orderId,
        description: `Refund of reserved margin on order cancellation`,
        createdAt: new Date(),
      });
    }
  }

  private async releaseLockedShares(userId: string, symbol: string, quantity: number) {
    if (quantity <= 0) return;

    if (dbManager.isConnected()) {
      const h = await Holding.findOne({ userId: new Types.ObjectId(userId), symbol });
      if (h) {
        h.lockedQuantity = Math.max(0, h.lockedQuantity - quantity);
        await h.save();
      }
      return;
    }

    const h = this.memHoldings.find((x) => x.userId === userId && x.symbol === symbol);
    if (h) {
      h.lockedQuantity = Math.max(0, h.lockedQuantity - quantity);
    }
  }

  private async findOrderByIdempotency(userId: string, key: string) {
    if (dbManager.isConnected()) {
      return await Order.findOne({ userId: new Types.ObjectId(userId), idempotencyKey: key });
    }
    return this.memOrders.find((o) => o.userId === userId && o.idempotencyKey === key) || null;
  }

  private async findOrderById(orderId: string) {
    if (dbManager.isConnected()) {
      return await Order.findById(orderId);
    }
    return this.memOrders.find((o) => o.id === orderId) || null;
  }

  private async findHolding(userId: string, symbol: string) {
    if (dbManager.isConnected()) {
      return await Holding.findOne({ userId: new Types.ObjectId(userId), symbol });
    }
    return this.memHoldings.find((h) => h.userId === userId && h.symbol === symbol) || null;
  }

  private async findUserHoldings(userId: string) {
    if (dbManager.isConnected()) {
      return await Holding.find({ userId: new Types.ObjectId(userId) });
    }
    return this.memHoldings.filter((h) => h.userId === userId);
  }

  private async findExecutionsByOrderId(orderId: string) {
    if (dbManager.isConnected()) {
      return await TradeExecution.find({ orderId: new Types.ObjectId(orderId) });
    }
    return this.memExecutions.filter((e) => e.orderId === orderId);
  }
}

export const tradingEngineService = new TradingEngineService();
