import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/formatters';
import {
  tradingService,
  PortfolioSummaryData,
  HoldingItem,
  CashLedgerItem,
} from '@/services/tradingService';
import {
  PieChart,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Lock,
  ArrowDownLeft,
  History,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PortfolioPage: React.FC = () => {
  const [summary, setSummary] = useState<PortfolioSummaryData | null>(null);
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [ledger, setLedger] = useState<CashLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'holdings' | 'ledger'>('holdings');

  const fetchPortfolioData = useCallback(async () => {
    setLoading(true);
    try {
      const [portRes, ledgerRes] = await Promise.all([
        tradingService.getPortfolio(),
        tradingService.getCashLedger(),
      ]);

      if (portRes.success && portRes.data) {
        setSummary(portRes.data.summary);
        setHoldings(portRes.data.holdings);
      }
      if (ledgerRes.success && ledgerRes.data) {
        setLedger(ledgerRes.data);
      }
    } catch (err) {
      console.error('Error fetching portfolio data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const virtualCashPaise = summary?.cashBalancePaise ?? 100000000;
  const reservedCashPaise = summary?.reservedCashPaise ?? 0;
  const totalStockValuePaise = summary?.currentValuePaise ?? 0;
  const totalPortfolioValuePaise = summary?.totalPortfolioValuePaise ?? (virtualCashPaise + totalStockValuePaise);
  const unrealizedPnLPaise = summary?.unrealizedPnLPaise ?? 0;
  const unrealizedPnLPercent = summary?.unrealizedPnLPercent ?? 0;

  const isProfit = unrealizedPnLPaise >= 0;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <PieChart className="h-5 w-5 text-accent-primary" />
            Portfolio & Asset Valuation
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Mark-to-market valuation, weighted average acquisition prices, reserved margins, and cash ledger.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchPortfolioData}
          disabled={loading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Net Portfolio Value"
          value={formatINR(totalPortfolioValuePaise)}
          change={unrealizedPnLPercent}
          changeLabel="overall return"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          title="Available Virtual Cash"
          value={formatINR(virtualCashPaise)}
          subtitle={
            reservedCashPaise > 0
              ? `${formatINR(reservedCashPaise)} reserved in open orders`
              : 'Unallocated funds'
          }
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Invested in Equities"
          value={formatINR(totalStockValuePaise)}
          subtitle={`${holdings.length} Active holding${holdings.length === 1 ? '' : 's'}`}
          icon={<PieChart className="h-4 w-4" />}
        />
        <StatCard
          title="Total Unrealized P&L"
          value={`${isProfit ? '+' : ''}${formatINR(unrealizedPnLPaise)}`}
          change={unrealizedPnLPercent}
          changeLabel="unrealized return"
        />
      </div>

      {/* View Switcher: Holdings vs Ledger */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('holdings')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'holdings'
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Active Holdings ({holdings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Cash Ledger Audit ({ledger.length})
        </button>
      </div>

      {/* Holdings View */}
      {activeTab === 'holdings' && (
        <Card className="p-4 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <CardTitle className="text-xs uppercase tracking-wider font-bold">
              Equities Holdings (NSE & BSE)
            </CardTitle>
            <Badge variant="accent" size="sm">
              {holdings.length} Positions Active
            </Badge>
          </div>

          {holdings.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted flex flex-col items-center gap-2">
              <PieChart className="h-8 w-8 text-text-secondary/40" />
              <span className="font-semibold text-text-secondary">No stock holdings yet</span>
              <span className="text-[11px]">
                Place your first paper trade from the Stock Explorer or detail ticket to build your virtual portfolio.
              </span>
              <Link to="/stocks" className="mt-2">
                <Button variant="primary" size="sm" className="text-xs">
                  Explore Equities
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead align="right">Qty (Total / Locked)</TableHead>
                  <TableHead align="right">Avg. Cost (₹)</TableHead>
                  <TableHead align="right">LTP (₹)</TableHead>
                  <TableHead align="right">Total Invested (₹)</TableHead>
                  <TableHead align="right">Current Value (₹)</TableHead>
                  <TableHead align="right">P&L (₹ / %)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((h) => {
                  const holdingProfit = h.unrealizedPnLPaise >= 0;
                  return (
                    <TableRow key={h.symbol}>
                      <TableCell>
                        <Link
                          to={`/stocks/${h.symbol}`}
                          className="font-bold text-text-primary hover:text-accent-primary transition-colors flex items-center gap-1"
                        >
                          {h.symbol}
                          <ArrowUpRight className="h-3 w-3 text-text-muted" />
                        </Link>
                        <div className="text-[10px] text-text-muted">{h.exchange || 'NSE'}</div>
                      </TableCell>
                      <TableCell align="right" numeric>
                        <span className="font-bold text-text-primary">{h.quantity}</span>
                        {h.lockedQuantity > 0 && (
                          <div className="text-[10px] text-amber-400 flex items-center justify-end gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            {h.lockedQuantity} locked
                          </div>
                        )}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatINR(h.avgBuyPricePaise)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatINR(h.currentLtpPaise)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatINR(h.totalInvestedPaise)}
                      </TableCell>
                      <TableCell align="right" numeric className="font-bold">
                        {formatINR(h.currentValuePaise)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        <div
                          className={`font-bold ${
                            holdingProfit ? 'text-performance-positive' : 'text-performance-negative'
                          }`}
                        >
                          {h.unrealizedPnLFormatted}
                        </div>
                        <div
                          className={`text-[10px] ${
                            holdingProfit ? 'text-performance-positive' : 'text-performance-negative'
                          }`}
                        >
                          {holdingProfit ? '+' : ''}
                          {h.unrealizedPnLPercent.toFixed(2)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Cash Ledger View */}
      {activeTab === 'ledger' && (
        <Card className="p-4 bg-bg-surface border-border-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
            <div>
              <CardTitle className="text-xs uppercase tracking-wider font-bold">
                Immutable Virtual Cash Ledger
              </CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">
                Every credit and debit is permanently logged and reconciles directly to available cash.
              </p>
            </div>
            <Badge variant="outline" size="sm">
              {ledger.length} Entries
            </Badge>
          </div>

          {ledger.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No ledger transactions found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead align="right">Amount (₹)</TableHead>
                  <TableHead align="right">Balance Before (₹)</TableHead>
                  <TableHead align="right">Balance After (₹)</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => {
                  const id = entry.id || (entry as any)._id || Math.random().toString();
                  const isCredit = entry.entryType === 'CREDIT';
                  const dateStr = new Date(entry.createdAt).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <TableRow key={id}>
                      <TableCell className="text-[11px] text-text-muted font-mono whitespace-nowrap">
                        {dateStr}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isCredit ? 'profit' : 'loss'}
                          size="sm"
                          className="font-bold flex items-center gap-1 w-fit"
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-text-primary">
                        {entry.reason}
                      </TableCell>
                      <TableCell
                        align="right"
                        numeric
                        className={`font-bold ${
                          isCredit ? 'text-performance-positive' : 'text-performance-negative'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {formatINR(entry.amountPaise)}
                      </TableCell>
                      <TableCell align="right" numeric className="text-text-muted font-mono">
                        {formatINR(entry.balanceBeforePaise)}
                      </TableCell>
                      <TableCell align="right" numeric className="font-bold text-text-primary font-mono">
                        {formatINR(entry.balanceAfterPaise)}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
};
