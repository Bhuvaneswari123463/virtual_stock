import React, { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/utils';
import { ShieldCheck, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export const TerminalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'holdings'>('positions');
  const virtualCashPaise = 100000000; // ₹10,00,000.00 starting capital

  const sampleWatchlist = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 295050, change: 1.45 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 389020, change: -0.62 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 168000, change: 0.85 },
    { symbol: 'INFY', name: 'Infosys Ltd.', ltp: 178550, change: 2.15 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 124500, change: -0.35 },
  ];

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground">
      {/* Terminal Top Market Ticker Bar */}
      <div className="flex items-center justify-between border-b border-border bg-background-card px-4 py-2 text-xs">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-semibold text-white">NIFTY 50</span>
            <span className="text-trade-profit font-semibold tabular-nums">24,852.15</span>
            <span className="text-trade-profit text-[11px] tabular-nums">(+0.65%)</span>
          </div>
          <div className="flex items-center gap-2 font-mono border-l border-border pl-4">
            <span className="font-semibold text-white">BANK NIFTY</span>
            <span className="text-trade-loss font-semibold tabular-nums">51,210.40</span>
            <span className="text-trade-loss text-[11px] tabular-nums">(-0.28%)</span>
          </div>
          <div className="flex items-center gap-2 font-mono border-l border-border pl-4">
            <span className="font-semibold text-white">INDIA VIX</span>
            <span className="text-amber-400 font-semibold tabular-nums">13.42</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="outline" className="text-xs font-mono gap-1 text-emerald-400 border-emerald-900/60">
            <ShieldCheck className="h-3 w-3" />
            Cash: {formatINR(virtualCashPaise)}
          </Badge>
          <div className="flex items-center gap-1 text-foreground-subtle text-[11px]">
            <Clock className="h-3 w-3" />
            <span>Simulated Engine (Phase 0)</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 p-2 min-h-0">
        {/* Left Column: Watchlist (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <Card className="flex-1 flex flex-col p-3 bg-background-card border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Watchlist (NSE)</span>
              <Badge variant="outline" className="text-[10px]">5 Tickers</Badge>
            </div>
            <div className="divide-y divide-border/50 overflow-y-auto">
              {sampleWatchlist.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-background-hover rounded cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.symbol}</div>
                      <div className="text-[10px] text-foreground-subtle truncate max-w-[120px]">{item.name}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-semibold tabular-nums">{formatINR(item.ltp)}</div>
                      <div
                        className={`text-[11px] flex items-center justify-end gap-0.5 tabular-nums ${
                          isPositive ? 'text-trade-profit' : 'text-trade-loss'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {isPositive ? `+${item.change}%` : `${item.change}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Center Column: Chart & Visuals (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-2">
          <Card className="h-[420px] flex flex-col p-4 bg-background-card border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">RELIANCE · NSE</span>
                <Badge variant="profit" className="text-[10px]">LTP ₹2,950.50</Badge>
              </div>
              <div className="flex items-center gap-1">
                {['1m', '5m', '15m', '1D'].map((tf) => (
                  <button
                    key={tf}
                    className="text-xs px-2 py-1 rounded hover:bg-background-hover text-foreground-muted hover:text-white"
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-background/50 rounded mt-3 border border-dashed border-border">
              <BarChart3 className="h-10 w-10 text-trade-accent mb-2" />
              <p className="text-sm font-semibold text-white">TradingView Candlestick Chart Engine</p>
              <p className="text-xs text-foreground-muted max-w-sm mt-1">
                Ready for Phase 3 integration with TradingView Lightweight Charts & deterministic tick feeds.
              </p>
            </div>
          </Card>

          {/* Lower Bottom Tabs: Positions, Orders */}
          <Card className="flex-1 p-3 bg-background-card border-border flex flex-col">
            <div className="flex items-center gap-3 border-b border-border pb-2">
              {(['positions', 'orders', 'holdings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs uppercase font-bold tracking-wider pb-1 transition-colors capitalize ${
                    activeTab === tab
                      ? 'text-trade-accent border-b-2 border-trade-accent'
                      : 'text-foreground-muted hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 flex items-center justify-center py-6 text-foreground-subtle text-xs">
              <Layers className="h-4 w-4 mr-2" />
              No open {activeTab} yet. Place an order to start trading.
            </div>
          </Card>
        </div>

        {/* Right Column: Order Placement Ticket (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <Card className="flex-1 p-4 bg-background-card border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <CardTitle className="text-xs uppercase tracking-wider font-bold">Order Ticket</CardTitle>
                <Badge variant="outline" className="text-[10px]">INTRADAY / CNC</Badge>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="buy" size="sm" className="w-full">
                    BUY
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-foreground-muted hover:text-white">
                    SELL
                  </Button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground-muted uppercase">Quantity</label>
                  <input
                    type="number"
                    defaultValue={10}
                    className="mt-1 w-full rounded bg-background border border-border px-3 py-1.5 text-xs text-white focus:outline-none focus:border-trade-accent font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground-muted uppercase">Order Type</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button className="py-1 px-2 rounded bg-background-hover text-xs font-medium text-white border border-border">
                      MARKET
                    </button>
                    <button className="py-1 px-2 rounded text-xs font-medium text-foreground-muted hover:text-white border border-transparent">
                      LIMIT
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-background border border-border/70 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between text-foreground-muted">
                    <span>Est. Margin Required:</span>
                    <span className="text-white">₹29,505.00</span>
                  </div>
                  <div className="flex justify-between text-foreground-muted">
                    <span>Available Cash:</span>
                    <span className="text-emerald-400">₹10,00,000.00</span>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="buy" size="md" className="w-full mt-4">
              Submit Buy Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
