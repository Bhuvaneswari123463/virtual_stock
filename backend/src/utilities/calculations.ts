
export interface HoldingValueInput {
  quantity: number;
  ltpPaise?: number;
  currentPricePaise?: number;
  avgBuyPricePaise?: number;
}

export interface PnLResult {
  pnlPaise: number;
  pnlPercent: number;
  isProfit: boolean;
}

export interface PositionPnlDetail {
  currentValuePaise: number;
  investedValuePaise: number;
  unrealizedPnlPaise: number;
  unrealizedPnlPercent: number;
  isProfit: boolean;
}

export interface PortfolioNavDetail {
  totalNavPaise: number;
  cashBalancePaise: number;
  currentHoldingsValuePaise: number;
  totalInvestedPaise: number;
  totalPnlPaise: number;
  totalReturnPercent: number;
}

/**
 * Single source of truth for financial accounting calculations across VirtualTrade
 */
export class FinancialEngine {
  /**
   * Calculate new weighted average buy price when increasing a holding position
   */
  static calculateWeightedAverageBuyPrice(
    existingQty: number,
    existingAvgPaise: number,
    addedQty: number,
    addedPricePaise: number
  ): number {
    if (existingQty <= 0) return Math.round(addedPricePaise);
    if (addedQty <= 0) return Math.round(existingAvgPaise);

    const totalQty = existingQty + addedQty;
    const existingTotalPaise = BigInt(existingQty) * BigInt(existingAvgPaise);
    const addedTotalPaise = BigInt(addedQty) * BigInt(addedPricePaise);

    const newAvgBigInt = (existingTotalPaise + addedTotalPaise) / BigInt(totalQty);
    return Number(newAvgBigInt);
  }

  /**
   * Detailed accumulator helper
   */
  static calculateNewAvgBuyPrice(
    existingQty: number,
    existingAvgPaise: number,
    addedQty: number,
    addedPricePaise: number
  ): { newQuantity: number; newAvgPricePaise: number; newTotalInvestedPaise: number } {
    const newQuantity = existingQty + addedQty;
    const newAvgPricePaise = this.calculateWeightedAverageBuyPrice(
      existingQty,
      existingAvgPaise,
      addedQty,
      addedPricePaise
    );
    const newTotalInvestedPaise = Math.round(newQuantity * newAvgPricePaise);
    return {
      newQuantity,
      newAvgPricePaise,
      newTotalInvestedPaise,
    };
  }

  /**
   * Calculate mark-to-market unrealized P&L in integer paise and percentage
   */
  static calculateUnrealizedPnl(
    quantity: number,
    avgBuyPricePaise: number,
    currentLtpPaise: number
  ): PnLResult {
    if (quantity <= 0) {
      return { pnlPaise: 0, pnlPercent: 0, isProfit: true };
    }

    const totalCostPaise = BigInt(quantity) * BigInt(avgBuyPricePaise);
    const currentValuePaise = BigInt(quantity) * BigInt(currentLtpPaise);
    const diffPaise = currentValuePaise - totalCostPaise;

    const pnlPaise = Number(diffPaise);
    const pnlPercent =
      totalCostPaise > BigInt(0)
        ? Number((diffPaise * BigInt(10000)) / totalCostPaise) / 100
        : 0;

    return {
      pnlPaise,
      pnlPercent,
      isProfit: pnlPaise >= 0,
    };
  }

  /**
   * Position P&L with full invested & current value breakdown
   */
  static calculatePositionPnl(
    quantity: number,
    avgBuyPricePaise: number,
    currentPricePaise: number
  ): PositionPnlDetail {
    const pnl = this.calculateUnrealizedPnl(quantity, avgBuyPricePaise, currentPricePaise);
    const investedValuePaise = Math.round(quantity * avgBuyPricePaise);
    const currentValuePaise = Math.round(quantity * currentPricePaise);

    return {
      currentValuePaise,
      investedValuePaise,
      unrealizedPnlPaise: pnl.pnlPaise,
      unrealizedPnlPercent: pnl.pnlPercent,
      isProfit: pnl.isProfit,
    };
  }

  /**
   * Calculate total portfolio Net Asset Value (NAV) in paise
   */
  static calculatePortfolioNav(
    cashBalancePaise: number,
    holdings: HoldingValueInput[],
    startingCapitalPaise?: number
  ): PortfolioNavDetail {
    let totalHoldingsValue = BigInt(0);
    let totalInvestedValue = BigInt(0);

    for (const h of holdings) {
      const price = h.currentPricePaise ?? h.ltpPaise ?? 0;
      const avgBuy = h.avgBuyPricePaise ?? price;
      if (h.quantity > 0 && price > 0) {
        totalHoldingsValue += BigInt(h.quantity) * BigInt(price);
        totalInvestedValue += BigInt(h.quantity) * BigInt(avgBuy);
      }
    }

    const currentHoldingsValuePaise = Number(totalHoldingsValue);
    const totalInvestedPaise = Number(totalInvestedValue);
    const totalNavPaise = Number(BigInt(cashBalancePaise) + totalHoldingsValue);

    const baseCapital = startingCapitalPaise ?? totalInvestedPaise + cashBalancePaise;
    const totalPnlPaise = totalNavPaise - baseCapital;
    const totalReturnPercent =
      baseCapital > 0 ? (totalPnlPaise / baseCapital) * 100 : 0;

    return {
      totalNavPaise,
      cashBalancePaise,
      currentHoldingsValuePaise,
      totalInvestedPaise,
      totalPnlPaise,
      totalReturnPercent,
    };
  }

  /**
   * Calculate required margin collateral in paise for an order
   */
  static calculateOrderMarginRequirement(
    pricePaise: number,
    quantity: number,
    estimatedFeePaise = 0
  ): number {
    const grossPaise = BigInt(pricePaise) * BigInt(quantity);
    const totalPaise = grossPaise + BigInt(estimatedFeePaise);
    return Number(totalPaise);
  }

  /**
   * Validate whether a wallet has sufficient unreserved cash for an order
   */
  static hasSufficientMargin(
    availableCashPaise: number,
    requiredMarginPaise: number
  ): boolean {
    return availableCashPaise >= requiredMarginPaise;
  }
}
