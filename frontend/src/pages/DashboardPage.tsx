import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PortfolioEquityChart } from '@/components/charts/PortfolioEquityChart';
import { AssetAllocationChart } from '@/components/charts/AssetAllocationChart';
import { formatINR } from '@/lib/formatters';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  ShieldCheck,
  Wallet,
  Activity,
  Layers,
  GraduationCap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface RecentOrderItem {
  id: string;
  symbol: string;
  side: string;
  type: string;
  qty: number;
  pricePaise: number;
  status: string;
  time: string;
}

export const DashboardPage: React.FC = () => {
  const toast = useToast();
  const { user, portfolio } = useAuth();
  const [marketMoverTab, setMarketMoverTab] = useState('gainers');
  const [selectedOrder, setSelectedOrder] = useState<RecentOrderItem | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [modalSymbol, setModalSymbol] = useState('RELIANCE');
  const [modalQuantity, setModalQuantity] = useState(10);
  const [modalSide, setModalSide] = useState<'BUY' | 'SELL'>('BUY');

  const virtualCashPaise = portfolio?.cashBalancePaise ?? 100000000; // ₹10,00,000.00
  const portfolioValuationPaise = 105432000; // ₹10,54,320.00
  const dayPnlPaise = 542000; // +₹5,420.00

  const watchlist = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 295050, change: 1.45 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 389020, change: -0.62 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 168000, change: 0.85 },
    { symbol: 'INFY', name: 'Infosys Ltd.', ltp: 178550, change: 2.15 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 124500, change: -0.35 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', ltp: 96000, change: 1.90 },
  ];

  const marketMovers = {
    gainers: [
      { symbol: 'INFY', ltp: 178550, change: 2.15, volume: '5.1M' },
      { symbol: 'TATAMOTORS', ltp: 96000, change: 1.90, volume: '7.2M' },
      { symbol: 'RELIANCE', ltp: 295050, change: 1.45, volume: '3.8M' },
      { symbol: 'HDFCBANK', ltp: 168000, change: 0.85, volume: '6.8M' },
    ],
    losers: [
      { symbol: 'SBIN', ltp: 81050, change: -1.10, volume: '8.4M' },
      { symbol: 'TCS', ltp: 389020, change: -0.62, volume: '1.4M' },
      { symbol: 'ICICIBANK', ltp: 124500, change: -0.35, volume: '4.8M' },
    ],
    volume: [
      { symbol: 'SBIN', ltp: 81050, change: -1.10, volume: '8.4M' },
      { symbol: 'TATAMOTORS', ltp: 96000, change: 1.90, volume: '7.2M' },
      { symbol: 'HDFCBANK', ltp: 168000, change: 0.85, volume: '6.8M' },
      { symbol: 'INFY', ltp: 178550, change: 2.15, volume: '5.1M' },
    ],
  }[marketMoverTab as 'gainers' | 'losers' | 'volume'] || [];

  const recentOrders = [
    { id: 'ORD-10928', symbol: 'RELIANCE', side: 'BUY', type: 'MARKET', qty: 25, pricePaise: 295050, status: 'FILLED', time: '14:32:10 IST' },
    { id: 'ORD-10927', symbol: 'TCS', side: 'BUY', type: 'LIMIT', qty: 10, pricePaise: 388000, status: 'OPEN', time: '14:15:02 IST' },
    { id: 'ORD-10926', symbol: 'INFY', side: 'BUY', type: 'MARKET', qty: 40, pricePaise: 178550, status: 'FILLED', time: '13:45:22 IST' },
  ];

  const handlePlaceQuickOrder = () => {
    toast.success(`Executed ${modalSide} order for ${modalQuantity} shares of ${modalSymbol}.`, 'Order Placed');
    setIsNewOrderModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 p-3 sm:p-5">
      {/* 1. Welcome Header and Simulated-Market Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              Welcome back, {user?.fullName || 'Trader'}
            </h1>
            <Badge variant="accent" size="sm" className="font-mono">PRO SIMULATOR</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            NSE & BSE Equities Session · Real-time simulated execution engine active.
          </p>
        </div>

        {/* Market Status and Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trade-profit opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-trade-profit" />
            </span>
            <span className="font-semibold text-text-primary">NSE Live</span>
            <span className="text-text-muted">|</span>
            <span className="text-[11px] text-accent-primary">Latency: 12ms</span>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsNewOrderModalOpen(true)}
            leftIcon={<PlusCircle className="h-3.5 w-3.5" />}
          >
            New Order
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.success('Virtual capital refreshed to ₹10,00,000.')}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Reset Capital
          </Button>
        </div>
      </div>

      {/* 2, 3, 4. KPI Summary Cards: Cash, Portfolio Value, Day P&L, Overall Return */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Virtual Cash Available"
          value={formatINR(virtualCashPaise)}
          subtitle="Ready for order reservations"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Total Portfolio Value"
          value={formatINR(portfolioValuationPaise)}
          change={5.43}
          changeLabel="overall return"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Today's Realized P&L"
          value={formatINR(dayPnlPaise, { showSign: true })}
          change={0.52}
          changeLabel="today"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Active Allocations"
          value="4 Stocks"
          subtitle="Energy, IT, Banking"
          icon={<Layers className="h-4 w-4" />}
        />
      </div>

      {/* 5. Interactive Portfolio Performance Chart + Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8 p-4 bg-bg-surface border-border-subtle flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3 mb-2">
            <div>
              <CardTitle className="text-xs uppercase tracking-wider font-bold">
                Portfolio Performance Curve (Equity vs. NIFTY 50)
              </CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">
                Mark-to-market NAV progression compared to benchmark index.
              </p>
            </div>
            <Badge variant="profit" size="sm">+5.43% Total Gain</Badge>
          </div>

          <PortfolioEquityChart height={260} />
        </Card>

        {/* Asset Allocation Donut Chart */}
        <Card className="lg:col-span-4 p-4 bg-bg-surface border-border-subtle flex flex-col justify-between">
          <div className="border-b border-border-subtle pb-3 mb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold">
              Capital Allocation
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-0.5">
              Portfolio cash vs. active sector weights.
            </p>
          </div>
          <AssetAllocationChart height={220} />
          <div className="text-[11px] text-text-muted pt-2 border-t border-border-subtle text-center">
            Target cash reserve: 25% minimum margin safety buffer.
          </div>
        </Card>
      </div>

      {/* 6 & 7. Watchlist & Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Watchlist Section */}
        <Card className="lg:col-span-6 p-4 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-primary" />
              <CardTitle className="text-xs uppercase tracking-wider font-bold">
                Watchlist Symbols
              </CardTitle>
            </div>
            <Link to="/app/watchlist" className="text-xs text-accent-secondary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead align="right">LTP (₹)</TableHead>
                <TableHead align="right">24h Change</TableHead>
                <TableHead align="center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <TableRow key={item.symbol}>
                    <TableCell>
                      <div className="font-bold text-text-primary">{item.symbol}</div>
                      <div className="text-[10px] text-text-muted">{item.name}</div>
                    </TableCell>
                    <TableCell align="right" numeric className="font-bold">
                      {formatINR(item.ltp)}
                    </TableCell>
                    <TableCell align="right" numeric>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isPositive ? 'text-trade-profit' : 'text-trade-loss'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {isPositive ? `+${item.change}%` : `${item.change}%`}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="sm"
                        variant="buy"
                        onClick={() => {
                          setModalSymbol(item.symbol);
                          setIsNewOrderModalOpen(true);
                        }}
                      >
                        Trade
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Market Movers Section */}
        <Card className="lg:col-span-6 p-4 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold">
              Market Movers (NSE)
            </CardTitle>
            <Tabs
              tabs={[
                { id: 'gainers', label: 'Top Gainers' },
                { id: 'losers', label: 'Top Losers' },
                { id: 'volume', label: 'Volume Leaders' },
              ]}
              activeTab={marketMoverTab}
              onChange={setMarketMoverTab}
              variant="pill"
              size="sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead align="right">LTP (₹)</TableHead>
                <TableHead align="right">Change %</TableHead>
                <TableHead align="right">24h Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketMovers.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <TableRow key={item.symbol}>
                    <TableCell className="font-bold text-text-primary">{item.symbol}</TableCell>
                    <TableCell align="right" numeric className="font-bold">
                      {formatINR(item.ltp)}
                    </TableCell>
                    <TableCell align="right" numeric>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isPositive ? 'text-trade-profit' : 'text-trade-loss'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {isPositive ? `+${item.change}%` : `${item.change}%`}
                      </span>
                    </TableCell>
                    <TableCell align="right" numeric className="text-text-secondary">
                      {item.volume}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 8, 10. Recent Orders + Learning Progress & Competition Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Orders Table (7 cols) */}
        <Card className="lg:col-span-7 p-4 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold">
              Recent Order Executions
            </CardTitle>
            <Link to="/app/orders" className="text-xs text-accent-secondary hover:underline flex items-center gap-1">
              <span>All Orders</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID & Time</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead align="right">Shares</TableHead>
                <TableHead align="right">Price (₹)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((ord) => (
                <TableRow
                  key={ord.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedOrder(ord)}
                >
                  <TableCell>
                    <div className="font-mono text-xs font-semibold">{ord.id}</div>
                    <div className="text-[10px] text-text-muted">{ord.time}</div>
                  </TableCell>
                  <TableCell className="font-bold">{ord.symbol}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${ord.side === 'BUY' ? 'text-trade-profit' : 'text-trade-loss'}`}>
                      {ord.side}
                    </span>
                  </TableCell>
                  <TableCell align="right" numeric>{ord.qty}</TableCell>
                  <TableCell align="right" numeric>{formatINR(ord.pricePaise)}</TableCell>
                  <TableCell>
                    <Badge variant={ord.status === 'FILLED' ? 'profit' : 'accent'} size="sm">
                      {ord.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Learning Progress & Competition Widgets (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Academy Widget */}
          <Card className="p-4 bg-bg-surface border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-accent-primary" />
                <span className="text-xs font-bold text-text-primary">Academy Progress</span>
              </div>
              <Badge variant="accent" size="sm">1/4 Completed</Badge>
            </div>
            <h4 className="text-xs font-semibold text-text-primary">Next Lesson: Candlestick Price Action</h4>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Learn engulfing patterns and trend continuations.
            </p>
            <Link to="/app/learn" className="mt-3 block">
              <Button size="sm" variant="secondary" className="w-full">
                Resume Course
              </Button>
            </Link>
          </Card>

          {/* Active Competition Widget */}
          <Card className="p-4 bg-bg-surface border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-warning" />
                <span className="text-xs font-bold text-text-primary">National Trading League</span>
              </div>
              <Badge variant="profit" size="sm">Rank #4</Badge>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-text-secondary">Your Net Return:</span>
              <span className="text-trade-profit font-bold">+5.24%</span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono mt-1">
              <span className="text-text-secondary">Tournament Ends:</span>
              <span className="text-text-primary">4 Days remaining</span>
            </div>
            <Link to="/app/competitions" className="mt-3 block">
              <Button size="sm" variant="outline" className="w-full">
                View Tournament Leaderboard
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Quick Order Dialog */}
      <Dialog
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title={`Execute Simulated Order: ${modalSymbol}`}
        description="Choose order side and quantity. Paper-trading margin will be reserved."
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={modalSide === 'BUY' ? 'buy' : 'outline'}
              onClick={() => setModalSide('BUY')}
            >
              BUY
            </Button>
            <Button
              variant={modalSide === 'SELL' ? 'sell' : 'outline'}
              onClick={() => setModalSide('SELL')}
            >
              SELL
            </Button>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary">Shares Quantity</label>
            <input
              type="number"
              min={1}
              value={modalQuantity}
              onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1 w-full rounded bg-bg-elevated border border-border-subtle px-3 py-2 text-xs font-mono text-text-primary focus:outline-none"
            />
          </div>

          <div className="p-3 rounded bg-bg-elevated border border-border-subtle text-xs font-mono space-y-1">
            <div className="flex justify-between text-text-secondary">
              <span>Estimated Margin:</span>
              <span className="text-text-primary font-bold">
                {formatINR(modalQuantity * 295050)}
              </span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Available Cash:</span>
              <span className="text-accent-primary font-bold">{formatINR(virtualCashPaise)}</span>
            </div>
          </div>

          <Button
            variant={modalSide === 'BUY' ? 'buy' : 'sell'}
            className="w-full mt-2"
            onClick={handlePlaceQuickOrder}
          >
            Confirm {modalSide} Order
          </Button>
        </div>
      </Dialog>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.id}`}
        >
          <div className="space-y-2 text-xs font-mono pt-2">
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Symbol:</span>
              <span className="font-bold text-text-primary">{selectedOrder.symbol}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Action:</span>
              <span className={`font-bold ${selectedOrder.side === 'BUY' ? 'text-trade-profit' : 'text-trade-loss'}`}>
                {selectedOrder.side} ({selectedOrder.type})
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Executed Shares:</span>
              <span className="text-text-primary">{selectedOrder.qty}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Execution Price:</span>
              <span className="text-text-primary">{formatINR(selectedOrder.pricePaise)}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Total Value:</span>
              <span className="font-bold text-text-primary">
                {formatINR(selectedOrder.pricePaise * selectedOrder.qty)}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded bg-bg-elevated">
              <span className="text-text-secondary">Status:</span>
              <Badge variant="profit" size="sm">{selectedOrder.status}</Badge>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
