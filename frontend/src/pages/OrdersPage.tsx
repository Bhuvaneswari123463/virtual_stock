import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatINR } from '@/lib/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  tradingService,
  OrderItem,
} from '@/services/tradingService';
import {
  ListOrdered,
  XCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();
  const { refreshProfile } = useAuth();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tradingService.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch orders');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error fetching orders from server'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (id: string, symbol: string) => {
    setCancellingId(id);
    try {
      const res = await tradingService.cancelOrder(id);
      if (res.success && res.data) {
        toast.success(
          res.data.message || `Order for ${symbol} cancelled. Reserved margin/shares released.`,
          'Order Cancelled'
        );
        // Refresh local orders and global user balance
        await fetchOrders();
        await refreshProfile();
      } else {
        toast.error(res.error?.message || 'Unable to cancel order.', 'Cancellation Failed');
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Network error while cancelling order.'
      );
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'open') return o.status === 'OPEN' || o.status === 'PENDING';
    if (activeTab === 'filled') return o.status === 'FILLED';
    if (activeTab === 'cancelled') return o.status === 'CANCELLED';
    if (activeTab === 'rejected') return o.status === 'REJECTED';
    return true;
  });

  const openCount = orders.filter((o) => o.status === 'OPEN' || o.status === 'PENDING').length;
  const filledCount = orders.filter((o) => o.status === 'FILLED').length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;
  const rejectedCount = orders.filter((o) => o.status === 'REJECTED').length;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-accent-primary" />
            Orders & Execution History
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Server-authoritative simulated executions, margin reservations, and immutable trade records.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-4 bg-bg-surface border-border-subtle">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'open', label: 'Open Orders', count: openCount },
              { id: 'filled', label: 'Executed', count: filledCount },
              { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pill"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-accent-primary" />
            <span>Loading orders from trading engine...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2">
            <ListOrdered className="h-8 w-8 text-text-secondary/40" />
            <span className="font-semibold text-text-secondary">No orders found in this view</span>
            <span className="text-[11px]">
              Use the Stock Explorer or detail pages to place market and limit paper trades.
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID & Placed</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Type & Product</TableHead>
                <TableHead align="right">Qty / Filled</TableHead>
                <TableHead align="right">Price (₹)</TableHead>
                <TableHead align="right">Trade Value (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const orderId = order.id || order._id || 'ORD-0';
                const effectivePricePaise =
                  order.status === 'FILLED'
                    ? order.avgExecutionPricePaise
                    : order.limitPricePaise || 0;
                const totalValue =
                  order.status === 'FILLED'
                    ? (order.avgExecutionPricePaise * (order.filledQuantity || order.quantity))
                    : ((order.limitPricePaise || 0) * order.quantity);

                const isOpen = order.status === 'OPEN' || order.status === 'PENDING';
                const isCancelling = cancellingId === orderId;

                const formattedTime = new Date(order.createdAt).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <TableRow key={orderId}>
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-text-primary">
                        {orderId.substring(orderId.length - 8).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-text-muted">{formattedTime}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-text-primary">{order.symbol}</span>
                      <span className="text-[10px] text-text-muted ml-1.5">{order.exchange || 'NSE'}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold text-xs ${
                          order.side === 'BUY' ? 'text-trade-profit' : 'text-trade-loss'
                        }`}
                      >
                        {order.side}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" size="sm">
                          {order.type}
                        </Badge>
                        <span className="text-[10px] text-text-muted font-mono">
                          {order.productType || 'CNC'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="right" numeric>
                      <span className="font-bold text-text-primary">{order.quantity}</span>
                      {order.filledQuantity > 0 && order.filledQuantity !== order.quantity && (
                        <span className="text-[10px] text-accent-primary ml-1 font-mono">
                          ({order.filledQuantity})
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="right" numeric>
                      {effectivePricePaise > 0 ? formatINR(effectivePricePaise) : 'MKT'}
                    </TableCell>
                    <TableCell align="right" numeric className="font-bold">
                      {totalValue > 0 ? formatINR(totalValue) : '-'}
                    </TableCell>
                    <TableCell>
                      {order.status === 'FILLED' && (
                        <Badge variant="profit" size="sm" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          FILLED
                        </Badge>
                      )}
                      {(order.status === 'OPEN' || order.status === 'PENDING') && (
                        <Badge variant="warning" size="sm" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          OPEN
                        </Badge>
                      )}
                      {order.status === 'CANCELLED' && (
                        <Badge variant="outline" size="sm" className="flex items-center gap-1 text-text-muted">
                          <XCircle className="h-3 w-3" />
                          CANCELLED
                        </Badge>
                      )}
                      {order.status === 'REJECTED' && (
                        <Badge variant="loss" size="sm" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          REJECTED
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {isOpen ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isCancelling}
                          onClick={() => handleCancelOrder(orderId, order.symbol)}
                          className="text-[11px] h-7 px-2.5 text-rose-400 hover:text-rose-300 hover:border-rose-500/50"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-text-muted">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
