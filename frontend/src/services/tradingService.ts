import { apiRequest, ApiResponse } from '@/lib/apiClient';

export interface PlaceOrderPayload {
  symbol: string;
  exchange?: 'NSE' | 'BSE';
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  productType?: 'CNC' | 'MIS';
  quantity: number;
  limitPricePaise?: number;
  idempotencyKey?: string;
}

export interface PlacedOrderResult {
  order: {
    id: string;
    _id?: string;
    userId: string;
    symbol: string;
    exchange: 'NSE' | 'BSE';
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    productType: 'CNC' | 'MIS';
    status: 'OPEN' | 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
    quantity: number;
    filledQuantity: number;
    limitPricePaise?: number;
    avgExecutionPricePaise: number;
    reservedMarginPaise: number;
    estimatedFeesPaise: number;
    dataSource?: string;
    quoteTimestamp?: string;
    createdAt: string;
  };
  execution?: {
    id: string;
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    executionPricePaise: number;
    totalValuePaise: number;
    feesPaise: number;
    dataSource?: string;
    quoteTimestamp?: string;
    executedAt: string;
  };
  cashBeforePaise: number;
  cashAfterPaise: number;
  message: string;
}

export interface OrderItem {
  id: string;
  _id?: string;
  userId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  productType: 'CNC' | 'MIS';
  status: 'OPEN' | 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  quantity: number;
  filledQuantity: number;
  limitPricePaise?: number;
  avgExecutionPricePaise: number;
  reservedMarginPaise: number;
  estimatedFeesPaise: number;
  dataSource?: string;
  quoteTimestamp?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HoldingItem {
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

export interface PortfolioSummaryData {
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

export interface PortfolioResponseData {
  summary: PortfolioSummaryData;
  holdings: HoldingItem[];
}

export interface CashLedgerItem {
  id: string;
  _id?: string;
  entryType: 'CREDIT' | 'DEBIT';
  reason: string;
  amountPaise: number;
  balanceBeforePaise: number;
  balanceAfterPaise: number;
  referenceId?: string;
  idempotencyKey?: string;
  description: string;
  createdAt: string;
}

class TradingService {
  async placeOrder(payload: PlaceOrderPayload): Promise<ApiResponse<PlacedOrderResult>> {
    // Generate UUID idempotency key if not provided
    const idempotencyKey = payload.idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

    return await apiRequest<PlacedOrderResult>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        idempotencyKey,
      }),
    });
  }

  async getOrders(params?: {
    status?: string;
    symbol?: string;
    side?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<OrderItem[]>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.symbol) query.set('symbol', params.symbol);
    if (params?.side) query.set('side', params.side);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const qs = query.toString();
    return await apiRequest<OrderItem[]>(`/orders${qs ? `?${qs}` : ''}`);
  }

  async getOrderById(orderId: string): Promise<ApiResponse<{ order: OrderItem; executions: any[] }>> {
    return await apiRequest<{ order: OrderItem; executions: any[] }>(`/orders/${orderId}`);
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<{ order: OrderItem; refundPaise: number; unlockedShares: number; message: string }>> {
    return await apiRequest<{ order: OrderItem; refundPaise: number; unlockedShares: number; message: string }>(
      `/orders/${orderId}/cancel`,
      { method: 'POST' }
    );
  }

  async getPortfolio(): Promise<ApiResponse<PortfolioResponseData>> {
    return await apiRequest<PortfolioResponseData>('/portfolio');
  }

  async getCashLedger(): Promise<ApiResponse<CashLedgerItem[]>> {
    return await apiRequest<CashLedgerItem[]>('/portfolio/ledger');
  }

  async getExecutions(): Promise<ApiResponse<any[]>> {
    return await apiRequest<any[]>('/portfolio/executions');
  }
}

export const tradingService = new TradingService();
