import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  GraduationCap,
  CheckCircle2,
  ChevronDown,
  PieChart,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import { formatINR } from '@/lib/formatters';

const FAQS = [
  {
    q: 'How does virtual capital work on VirtualTrade?',
    a: 'Every newly created account is automatically provisioned with ₹10,00,000 in virtual funds. These funds can be allocated towards market or limit orders on simulated Indian equities with zero real monetary liability.',
  },
  {
    q: 'Are stock prices and market executions real?',
    a: 'Stock quotes are modeled directly on NSE & BSE constituents with realistic bid-ask spreads, order matching algorithms, and volume modeling. Trades are simulated without brokerage fees or taxes.',
  },
  {
    q: 'Can I reset my account if I exhaust my virtual funds?',
    a: 'Yes. At any time in your terminal settings, you can reset your simulated wallet back to the starting ₹10,00,000 balance to test a fresh trading thesis.',
  },
  {
    q: 'Is there any real-money brokerage involved?',
    a: 'No. VirtualTrade is strictly an educational platform designed to master chart analysis, risk-reward ratios, and execution discipline without financial anxiety.',
  },
];

export const LandingPage: React.FC = () => {
  const [previewTab, setPreviewTab] = useState('orders');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [previewQuantity, setPreviewQuantity] = useState(15);
  const [previewSide, setPreviewSide] = useState<'BUY' | 'SELL'>('BUY');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const stockPricePaise = 295050; // RELIANCE: ₹2,950.50
  const estimatedMarginPaise = stockPricePaise * previewQuantity;

  const features = [
    {
      title: 'Virtual Paper Trading',
      desc: 'Route simulated buy and sell orders on NSE & BSE stocks with realistic bid-ask depth and execution modeling.',
      icon: TrendingUp,
      badge: 'Zero Risk',
    },
    {
      title: 'Portfolio Analytics',
      desc: 'Track weighted average buy prices, unrealized/realized P&L, sector allocation, and multi-day equity curves.',
      icon: PieChart,
      badge: 'Analytics',
    },
    {
      title: 'Market Exploration',
      desc: 'Comprehensive stock screener covering large-cap, mid-cap, top gainers, losers, and 52-week price extremes.',
      icon: Search,
      badge: 'Screener',
    },
    {
      title: 'Trading Academy & Quizzes',
      desc: 'Interactive lessons on technical analysis, chart patterns, risk-reward ratios, and options fundamentals.',
      icon: GraduationCap,
      badge: 'Academy',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Claim ₹10,00,000 Virtual Capital',
      desc: 'Create your account and instantly receive ₹10,00,000 in simulated trading capital. No credit card, deposit, or brokerage paperwork.',
    },
    {
      step: '02',
      title: 'Execute Market & Limit Orders',
      desc: 'Trade live simulated Indian equities with real-time margin calculations, order reservations, and execution logs.',
    },
    {
      step: '03',
      title: 'Track Performance & Climb Ranks',
      desc: 'Analyze your equity curves, refine position sizing rules, and benchmark your strategy against top community traders.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border-subtle bg-gradient-to-b from-bg-base via-bg-surface/60 to-bg-base">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="accent" size="md" className="gap-1.5 font-mono uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
              <span>Simulated Indian Stock Terminal · ₹10,00,000 Virtual Capital</span>
            </Badge>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-tight">
              Your first trade starts with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                zero risk.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed">
              VirtualTrade provides an institutional trading terminal engineered for Indian equities.
              Practice intraday and swing trading strategies with real-time simulated market data and
              complete financial peace of mind.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Start Paper Trading
                </Button>
              </Link>
              <Link to="/app" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Explore the Platform
                </Button>
              </Link>
            </div>

            {/* Credibility Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent-primary" /> ₹10,00,000 Starting Cash
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent-primary" /> NSE & BSE Constituents
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent-primary" /> Paise-Accurate Ledger
              </span>
            </div>
          </div>

          {/* Interactive Live Product Preview Component */}
          <div id="preview" className="mt-14 max-w-5xl mx-auto rounded-xl border border-border-medium bg-bg-surface p-3 sm:p-5 shadow-elevated">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-3 w-3 rounded-full bg-trade-loss" />
                <div className="flex h-3 w-3 rounded-full bg-warning" />
                <div className="flex h-3 w-3 rounded-full bg-trade-profit" />
                <span className="ml-2 font-mono text-xs font-bold text-text-primary">RELIANCE · NSE TERMINAL PREVIEW</span>
                <Badge variant="profit" size="sm">LTP ₹2,950.50 (+1.45%)</Badge>
              </div>

              <div className="flex items-center gap-2">
                <TimeframeSelector
                  active={selectedTimeframe}
                  onChange={setSelectedTimeframe}
                />
              </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard
                title="Virtual Cash"
                value={formatINR(100000000)}
                subtitle="Unallocated funds"
              />
              <StatCard
                title="Portfolio Value"
                value="₹10,54,320.00"
                change={5.43}
                changeLabel="total return"
              />
              <StatCard
                title="Day Realized P&L"
                value="+₹5,420.00"
                change={0.52}
                changeLabel="today"
              />
              <StatCard
                title="Active Positions"
                value="4 Tickers"
                subtitle="RELIANCE, TCS, INFY, HDFC"
              />
            </div>

            {/* Interactive Preview Tabs */}
            <Tabs
              tabs={[
                { id: 'orders', label: 'Interactive Order Ticket' },
                { id: 'holdings', label: 'Current Holdings' },
                { id: 'ledger', label: 'Double-Entry Ledger' },
              ]}
              activeTab={previewTab}
              onChange={setPreviewTab}
              variant="pill"
              className="mb-4"
            />

            {/* Tab 1: Order Ticket */}
            {previewTab === 'orders' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-lg bg-bg-elevated p-4 border border-border-subtle">
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Simulated Order Parameters</h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Adjust shares to test real-time client margin calculations.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase">Order Action</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button
                          size="sm"
                          variant={previewSide === 'BUY' ? 'buy' : 'outline'}
                          onClick={() => setPreviewSide('BUY')}
                        >
                          BUY
                        </Button>
                        <Button
                          size="sm"
                          variant={previewSide === 'SELL' ? 'sell' : 'outline'}
                          onClick={() => setPreviewSide('SELL')}
                        >
                          SELL
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-text-secondary uppercase">Quantity (Shares)</label>
                      <div className="flex items-center gap-2 mt-1">
                        {[10, 25, 50].map((qty) => (
                          <button
                            key={qty}
                            onClick={() => setPreviewQuantity(qty)}
                            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                              previewQuantity === qty
                                ? 'bg-accent-primary text-text-inverse font-bold'
                                : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-border-subtle'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-bg-surface border border-border-subtle space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span>Order Price:</span>
                      <span className="text-text-primary">₹2,950.50 (Market)</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Required Cash Margin:</span>
                      <span className="text-text-primary font-bold">{formatINR(estimatedMarginPaise)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Available Virtual Capital:</span>
                      <span className="text-accent-primary font-bold">{formatINR(100000000)}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 md:pl-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-text-primary">Safety & Integrity Checks</div>
                    <div className="space-y-1.5 text-[11px] text-text-secondary">
                      <div className="flex items-center gap-1.5 text-trade-profit">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Sufficient virtual cash margin verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-trade-profit">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>NSE tick provider active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-trade-profit">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Integer paise financial precision</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/app" className="mt-4">
                    <Button variant={previewSide === 'BUY' ? 'buy' : 'sell'} size="md" className="w-full">
                      Launch Full Terminal
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 2: Holdings */}
            {previewTab === 'holdings' && (
              <div className="p-4 rounded-lg bg-bg-elevated border border-border-subtle text-xs space-y-3">
                <div className="flex justify-between text-text-secondary font-mono text-[11px] pb-1 border-b border-border-subtle">
                  <span>SYMBOL / SHARES</span>
                  <span>AVG. BUY / LTP</span>
                  <span>UNREALIZED P&L</span>
                </div>
                {[
                  { symbol: 'RELIANCE', qty: 25, avg: 291000, ltp: 295050, pnl: '+₹1,012.50 (+1.39%)', pos: true },
                  { symbol: 'TCS', qty: 15, avg: 385000, ltp: 389020, pnl: '+₹603.00 (+1.04%)', pos: true },
                  { symbol: 'INFY', qty: 45, avg: 172000, ltp: 178550, pnl: '+₹2,947.50 (+3.81%)', pos: true },
                  { symbol: 'HDFCBANK', qty: 20, avg: 165000, ltp: 168000, pnl: '+₹600.00 (+1.82%)', pos: true },
                ].map((item) => (
                  <div key={item.symbol} className="flex justify-between items-center py-1.5 border-b border-border-subtle/50 font-mono">
                    <div>
                      <div className="font-bold text-text-primary">{item.symbol}</div>
                      <div className="text-[10px] text-text-muted">{item.qty} shares</div>
                    </div>
                    <div className="text-right">
                      <div>{formatINR(item.ltp)}</div>
                      <div className="text-[10px] text-text-muted">Avg {formatINR(item.avg)}</div>
                    </div>
                    <div className={`font-semibold ${item.pos ? 'text-trade-profit' : 'text-trade-loss'}`}>
                      {item.pnl}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Ledger */}
            {previewTab === 'ledger' && (
              <div className="p-4 rounded-lg bg-bg-elevated border border-border-subtle text-xs space-y-2">
                <p className="text-text-secondary text-[11px]">
                  All mutations enforce double-entry audit journals:
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle flex justify-between">
                    <span className="text-trade-profit font-semibold">[CREDIT] Account Creation Allocation</span>
                    <span className="text-text-primary font-bold">+₹10,00,000.00</span>
                  </div>
                  <div className="p-2 rounded bg-bg-surface border border-border-subtle flex justify-between">
                    <span className="text-text-secondary">[RESERVATION] BUY 25 RELIANCE</span>
                    <span className="text-trade-loss font-semibold">-₹73,762.50</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-20 px-4 sm:px-6 mx-auto max-w-7xl w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="accent" size="sm" className="mb-2">CORE CAPABILITIES</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Engineered for Precision & Learning
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-2">
            The power of professional trading terminals combined with risk-free education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="flex flex-col justify-between hover:border-border-medium transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-bg-elevated flex items-center justify-center text-accent-primary border border-border-subtle">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{item.badge}</Badge>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.desc}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 bg-bg-surface border-y border-border-subtle">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Three Steps to Master Market Strategy</h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Start trading Indian equities in under sixty seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-lg bg-bg-elevated border border-border-subtle flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl font-black font-mono text-accent-primary mb-3">
                    {s.step}
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2">{s.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Positioning */}
      <section id="academy" className="py-20 px-4 sm:px-6 mx-auto max-w-7xl w-full">
        <div className="rounded-2xl border border-border-medium bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <Badge variant="accent" size="sm">VIRTUALTRADE ACADEMY</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
              Learn Strategy Execution Before Risking Hard-Earned Capital
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Don&apos;t learn expensive lessons with real money. Master technical analysis, trend identification, risk-to-reward ratios, and stop-loss placement in guided simulations.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs text-text-secondary">
                Price Action Patterns
              </span>
              <span className="px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs text-text-secondary">
                Risk Management
              </span>
              <span className="px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs text-text-secondary">
                NSE NIFTY 50 Analysis
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Link to="/app/learn">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Academy Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-text-primary">Frequently Asked Questions</h2>
          <p className="text-xs text-text-secondary mt-1">Everything you need to know about paper trading on VirtualTrade.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={faq.q}
              className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${openFaq === idx ? 'rotate-180 text-accent-primary' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-text-secondary leading-relaxed border-t border-border-subtle/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-16 px-4 sm:px-6 text-center border-t border-border-subtle bg-bg-surface">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary">
            Your journey starts with zero financial risk.
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Join thousands of traders mastering Indian equities with ₹10,00,000 in virtual capital.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Paper Trading
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
