import React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from '@/context/ToastContext';
import { Trophy, Users, ShieldCheck, Flame } from 'lucide-react';

export const CompetitionsPage: React.FC = () => {
  const toast = useToast();

  const leaderboard = [
    { rank: 1, trader: 'Arjun_Alpha', returns: '+18.42%', portfolio: '₹11,84,200', badge: 'Diamond Trader' },
    { rank: 2, trader: 'QuantPriya', returns: '+14.15%', portfolio: '₹11,41,500', badge: 'Platinum Trader' },
    { rank: 3, trader: 'RohanTrades', returns: '+11.80%', portfolio: '₹11,18,000', badge: 'Gold Trader' },
    { rank: 4, trader: 'You (Trader_Demo)', returns: '+5.24%', portfolio: '₹10,52,410', badge: 'Pro Participant' },
    { rank: 5, trader: 'Vikram_BSE', returns: '+3.10%', portfolio: '₹10,31,000', badge: 'Active Participant' },
  ];

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent-primary" />
            Paper-Trading Tournaments & Leaderboards
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Test your strategies in simulated leagues against community traders with zero financial risk.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => toast.success('You are registered for the National Equities Challenge.')}
          leftIcon={<Flame className="h-3.5 w-3.5" />}
        >
          Join Active League
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-bg-surface border-border-subtle">
          <Badge variant="accent" size="sm" className="mb-2">CURRENT TOURNAMENT</Badge>
          <h3 className="text-base font-bold text-text-primary">NIFTY 50 Intraday League</h3>
          <p className="text-xs text-text-secondary mt-1">Starting capital: ₹10,00,000. 5 trading days remaining.</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 1,420 Traders</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-accent-primary" /> Fair Execution</span>
          </div>
        </Card>

        <Card className="p-4 bg-bg-surface border-border-subtle">
          <Badge variant="outline" size="sm" className="mb-2">UPCOMING</Badge>
          <h3 className="text-base font-bold text-text-primary">MidCap Swing Champions</h3>
          <p className="text-xs text-text-secondary mt-1">Starting Nov 1st. 14 days duration with sector limits.</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 680 Registered</span>
          </div>
        </Card>

        <Card className="p-4 bg-bg-surface border-border-subtle">
          <Badge variant="profit" size="sm" className="mb-2">YOUR STANDING</Badge>
          <div className="text-2xl font-bold font-mono text-text-primary mt-1">Rank #4</div>
          <p className="text-xs text-trade-profit font-semibold mt-0.5">+5.24% Net Profit</p>
          <div className="text-[11px] text-text-muted mt-2">Top 5% among all active participants</div>
        </Card>
      </div>

      <Card className="p-4 bg-bg-surface border-border-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
          <CardTitle className="text-xs uppercase tracking-wider font-bold">
            Tournament Live Leaderboard
          </CardTitle>
          <Badge variant="accent" size="sm">Realtime Rankings</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead align="right">Return %</TableHead>
              <TableHead align="right">Portfolio Valuation</TableHead>
              <TableHead>Tier Badge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((row) => (
              <TableRow key={row.rank} className={row.rank === 4 ? 'bg-bg-elevated/70' : undefined}>
                <TableCell className="font-mono font-bold text-accent-primary">#{row.rank}</TableCell>
                <TableCell className="font-semibold text-text-primary">{row.trader}</TableCell>
                <TableCell align="right" numeric className="text-trade-profit font-bold">
                  {row.returns}
                </TableCell>
                <TableCell align="right" numeric className="font-mono font-bold">
                  {row.portfolio}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">{row.badge}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
