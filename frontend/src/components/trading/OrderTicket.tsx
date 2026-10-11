import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  tradingService,
  PlacedOrderResult,
} from '@/services/tradingService';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'SL_M';
export type ProductType = 'CNC' | 'MIS'; // CNC = Delivery (1x), MIS = Intraday (5x)

export interface OrderTicketProps {
  symbol: string;
  companyName: string;
  ltpPaise: number;
  virtualCashPaise?: number;
  onOrderPlaced?: () => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  symbol,
  companyName,
  ltpPaise,
  virtualCashPaise: propCashPaise,
  onOrderPlaced,
}) => {
  const toast = useToast();
  const { portfolio, refreshProfile } = useAuth();

  // Use auth portfolio cash if available, fallback to prop or default 10L
  const virtualCashPaise =
    portfolio?.cashBalancePaise ?? propCashPaise ?? 100000000;

  // Form State
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [productType, setProductType] = useState<ProductType>('CNC');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(
    Number((ltpPaise / 100).toFixed(2))
  );

  // Modal & Async states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastExecutionResult, setLastExecutionResult] =
    useState<PlacedOrderResult | null>(null);

  // Price calculation
  const currentPriceRupees = ltpPaise / 100;
  const executionPriceRupees =
    orderType === 'MARKET' || orderType === 'SL_M' ? currentPriceRupees : limitPrice;
  const executionPricePaise = Math.round(executionPriceRupees * 100);

  // Trade value
  const tradeValuePaise = executionPricePaise * quantity;

  // Realistic Indian Brokerage & Statutory Taxes preview
  const estimatedCharges = useMemo(() => {
    const tradeValueRs = tradeValuePaise / 100;

    const brokerageRs = 0; // ₹0 virtual brokerage
    const sttRs =
      productType === 'CNC'
        ? tradeValueRs * 0.001
        : side === 'SELL'
        ? tradeValueRs * 0.00025
        : 0;
    const exchangeTurnoverRs = tradeValueRs * 0.0000297;
    const gstRs = (brokerageRs + exchangeTurnoverRs) * 0.18;
    const stampDutyRs = side === 'BUY' ? tradeValueRs * 0.00015 : 0;
    const sebiFeeRs = tradeValueRs * 0.000001;

    const totalChargesRs =
      brokerageRs + sttRs + exchangeTurnoverRs + gstRs + stampDutyRs + sebiFeeRs;

    return {
      brokerageRs: Math.round(brokerageRs * 100) / 100,
      sttRs: Math.round(sttRs * 100) / 100,
      exchangeTurnoverRs: Math.round(exchangeTurnoverRs * 100) / 100,
      gstRs: Math.round(gstRs * 100) / 100,
      stampDutyRs: Math.round(stampDutyRs * 100) / 100,
      sebiFeeRs: Math.round(sebiFeeRs * 100) / 100,
      totalChargesPaise: Math.max(1, Math.round(totalChargesRs * 100)),
    };
  }, [tradeValuePaise, productType, side]);

  // Margin required (5x leverage for MIS Intraday, 1x for CNC Delivery)
  const leverageMultiplier = productType === 'MIS' ? 0.2 : 1.0;
  const marginRequiredPaise =
    Math.round(tradeValuePaise * leverageMultiplier) +
    estimatedCharges.totalChargesPaise;
  const isCapitalSufficient = virtualCashPaise >= marginRequiredPaise;

  // Form Validation
  const handleValidateAndPreview = () => {
    setValidationError(null);
    setLastExecutionResult(null);

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      setValidationError('Quantity must be an integer greater than 0.');
      return;
    }

    if (orderType === 'LIMIT' || orderType === 'STOP_LOSS') {
      if (!limitPrice || limitPrice <= 0) {
        setValidationError('Limit price must be greater than ₹0.00.');
        return;
      }
      const tickRemainder = Math.round((limitPrice * 100) % 5);
      if (tickRemainder !== 0) {
        setValidationError('Price must be a valid multiple of tick size ₹0.05.');
        return;
      }
    }


    if (!isCapitalSufficient && side === 'BUY') {
      setValidationError(
        `Insufficient virtual funds. Required: ${formatINR(
          marginRequiredPaise
        )}, Available: ${formatINR(virtualCashPaise)}.`
      );
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit Order to Server-Authoritative Trading Engine
  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setValidationError(null);

    try {
      const type = orderType === 'LIMIT' ? 'LIMIT' : 'MARKET';
      const limitPricePaise =
        type === 'LIMIT' ? Math.round(limitPrice * 100) : undefined;

      const res = await tradingService.placeOrder({
        symbol,
        exchange: 'NSE',
        side,
        type,
        productType,
        quantity,
        limitPricePaise,
      });

      if (res.success && res.data) {
        setLastExecutionResult(res.data);
        setShowConfirmModal(false);

        const status = res.data.order.status;
        if (status === 'FILLED') {
          toast.success(
            res.data.message ||
              `Order filled: ${quantity} shares of ${symbol} at ${formatINR(
                res.data.execution?.executionPricePaise || executionPricePaise
              )}`,
            'Order Filled'
          );
        } else if (status === 'OPEN') {
          toast.info(
            `Limit ${side} order for ${quantity} ${symbol} placed at ${formatINR(
              limitPricePaise || 0
            )}. Margin reserved.`,
            'Order Accepted'
          );
        }

        // Trigger portfolio & auth state refresh
        await refreshProfile?.();
        onOrderPlaced?.();
      } else {
        const errorMsg =
          res.error?.message || 'Failed to place order on trading engine.';
        setValidationError(errorMsg);
        toast.error(errorMsg, 'Order Rejected');
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error while placing order.';
      setValidationError(errorMsg);
      toast.error(errorMsg, 'Order Placement Failed');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-4 bg-bg-surface border-border-subtle flex flex-col gap-3">
        {/* Header & Simulated Badge */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Order Ticket</h3>
            <span className="text-[11px] text-text-muted">
              Server-Authoritative Paper Engine
            </span>
          </div>
          <Badge
            variant="accent"
            size="sm"
            className="text-[10px] uppercase tracking-wider font-semibold"
          >
            Virtual ₹10L
          </Badge>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-bg-elevated border border-border-subtle">
          <button
            type="button"
            id="order-side-buy"
            onClick={() => {
              setSide('BUY');
              setValidationError(null);
              setLastExecutionResult(null);
            }}
            className={`py-2 rounded-md text-xs font-bold transition-all ${
              side === 'BUY'
                ? 'bg-emerald-500 text-bg-surface shadow-sm font-extrabold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            id="order-side-sell"
            onClick={() => {
              setSide('SELL');
              setValidationError(null);
              setLastExecutionResult(null);
            }}
            className={`py-2 rounded-md text-xs font-bold transition-all ${
              side === 'SELL'
                ? 'bg-rose-500 text-bg-surface shadow-sm font-extrabold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Product Type (Delivery CNC vs Intraday MIS) */}
        <div>
          <label className="block text-[11px] text-text-secondary mb-1 font-medium">
            Product Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="order-product-cnc"
              onClick={() => setProductType('CNC')}
              className={`p-2 rounded-md text-xs border text-left transition-colors ${
                productType === 'CNC'
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary font-semibold'
                  : 'border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="font-bold">Delivery (CNC)</div>
              <div className="text-[10px] text-text-muted">1x Capital · Hold Positions</div>
            </button>
            <button
              type="button"
              id="order-product-mis"
              onClick={() => setProductType('MIS')}
              className={`p-2 rounded-md text-xs border text-left transition-colors ${
                productType === 'MIS'
                  ? 'border-accent-primary bg-accent-primary/10 text-text-primary font-semibold'
                  : 'border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="font-bold">Intraday (MIS)</div>
              <div className="text-[10px] text-text-muted">5x Leverage · Margin Req.</div>
            </button>
          </div>
        </div>

        {/* Order Types */}
        <div>
          <label className="block text-[11px] text-text-secondary mb-1 font-medium">
            Order Type
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {(['MARKET', 'LIMIT'] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                id={`order-type-${t.toLowerCase()}`}
                onClick={() => {
                  setOrderType(t);
                  setValidationError(null);
                  setLastExecutionResult(null);
                }}
                className={`py-1.5 px-1 rounded-md text-xs font-medium border text-center transition-colors truncate ${
                  orderType === t
                    ? 'border-accent-primary bg-accent-primary/15 text-accent-primary font-bold'
                    : 'border-border-subtle bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        <div>
          <div className="flex justify-between items-center text-[11px] text-text-secondary mb-1">
            <span>Quantity (Shares)</span>
            <span className="text-[10px] text-text-muted">Min 1 Share</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="order-quantity"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="flex-1 bg-bg-elevated border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            />
            <div className="flex gap-1">
              {[10, 25, 50, 100].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className="px-2 py-1 text-[10px] rounded bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary hover:border-text-secondary"
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Limit Price Input (Only for LIMIT orders) */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="flex justify-between items-center text-[11px] text-text-secondary mb-1">
              <span>Limit Price (₹)</span>
              <span className="text-[10px] text-text-muted">Tick ₹0.05</span>
            </div>
            <input
              type="number"
              id="order-limit-price"
              min="0.05"
              step="0.05"
              value={limitPrice}
              onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary font-mono"
            />
          </div>
        )}

        {/* Available Virtual Capital Bar */}
        <div className="p-2.5 rounded-lg bg-bg-elevated border border-border-subtle text-xs space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Available Cash:</span>
            <span className="font-mono font-bold text-text-primary">
              {formatINR(virtualCashPaise)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-secondary">Required Margin:</span>
            <span
              className={`font-mono font-bold ${
                isCapitalSufficient || side === 'SELL'
                  ? 'text-accent-primary'
                  : 'text-trade-loss'
              }`}
            >
              {formatINR(marginRequiredPaise)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border-subtle/50 pt-1">
            <span>Estimated Taxes & SEBI Fees:</span>
            <span className="font-mono">
              ₹{(estimatedCharges.totalChargesPaise / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Validation Error Feedback */}
        {validationError && (
          <div
            id="order-ticket-error"
            className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-tight">{validationError}</p>
          </div>
        )}

        {/* Last Execution Feedback Card */}
        {lastExecutionResult && (
          <div
            id="order-ticket-success"
            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1.5"
          >
            <div className="flex items-center justify-between font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {lastExecutionResult.order.status === 'FILLED'
                  ? 'Order Executed Successfully'
                  : 'Limit Order Accepted & Open'}
              </span>
              <Badge
                variant={
                  lastExecutionResult.order.status === 'FILLED'
                    ? 'profit'
                    : 'warning'
                }
                size="sm"
              >
                {lastExecutionResult.order.status}
              </Badge>
            </div>
            <div className="text-[11px] font-mono space-y-0.5 text-text-secondary pt-1 border-t border-emerald-500/20">
              <div className="flex justify-between">
                <span>Cash Before:</span>
                <span className="text-text-primary">
                  {formatINR(lastExecutionResult.cashBeforePaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash After:</span>
                <span className="text-emerald-400 font-bold">
                  {formatINR(lastExecutionResult.cashAfterPaise)}
                </span>
              </div>
              {lastExecutionResult.execution && (
                <div className="flex justify-between">
                  <span>Exec Price:</span>
                  <span className="text-text-primary">
                    {formatINR(lastExecutionResult.execution.executionPricePaise)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          id="order-submit-button"
          type="button"
          variant={side === 'BUY' ? 'primary' : 'danger'}
          onClick={handleValidateAndPreview}
          className="w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-1"
        >
          {side === 'BUY' ? `Buy ${quantity} ${symbol}` : `Sell ${quantity} ${symbol}`}
        </Button>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md p-5 bg-bg-surface border-border-subtle shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1.5 rounded-md ${
                    side === 'BUY'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Confirm Virtual Order Placement
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    Server Authoritative Simulation
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="order-modal-close"
                onClick={() => setShowConfirmModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Stock:</span>
                <span className="text-text-primary font-bold">
                  {symbol} ({companyName})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Action & Type:</span>
                <span
                  className={`font-bold ${
                    side === 'BUY' ? 'text-trade-profit' : 'text-trade-loss'
                  }`}
                >
                  {side} · {productType} · {orderType}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Quantity:</span>
                <span className="text-text-primary font-bold">
                  {quantity} Shares
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Eligible Price:</span>
                <span className="text-text-primary font-bold">
                  ₹{(executionPricePaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Gross Trade Value:</span>
                <span className="text-text-primary">
                  {formatINR(tradeValuePaise)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle">
                <span className="font-sans text-text-secondary">Statutory Taxes & Fees:</span>
                <span className="text-text-muted">
                  ₹{(estimatedCharges.totalChargesPaise / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 text-sm font-bold text-accent-primary border-t border-border-subtle">
                <span className="font-sans">Required Virtual Capital:</span>
                <span>{formatINR(marginRequiredPaise)}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-text-muted">
                <span className="font-sans">Current Cash Available:</span>
                <span>{formatINR(virtualCashPaise)}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] font-semibold text-text-primary">
                <span className="font-sans">Estimated Cash After Fill:</span>
                <span>
                  {formatINR(
                    side === 'BUY'
                      ? Math.max(0, virtualCashPaise - marginRequiredPaise)
                      : virtualCashPaise + tradeValuePaise - estimatedCharges.totalChargesPaise
                  )}
                </span>
              </div>
            </div>

            {/* Dialog Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                id="order-modal-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 text-xs"
              >
                Modify Order
              </Button>
              <Button
                id="order-modal-confirm"
                variant={side === 'BUY' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="flex-1 text-xs flex items-center justify-center gap-1.5 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm {side} Order
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
