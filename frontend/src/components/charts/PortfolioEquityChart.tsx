import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { FIXTURE_EQUITY_CURVE, EquityPoint } from '@/fixtures/portfolio';
import { formatINR } from '@/lib/formatters';

export interface PortfolioEquityChartProps {
  data?: EquityPoint[];
  height?: number;
}

export const PortfolioEquityChart: React.FC<PortfolioEquityChartProps> = ({
  data = FIXTURE_EQUITY_CURVE,
  height = 280,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#42DDA2" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#42DDA2" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6CA9FF" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6CA9FF" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#1E2C3D' : '#E2E8F0'}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            stroke={isDark ? '#8E9CAE' : '#64748B'}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke={isDark ? '#8E9CAE' : '#64748B'}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={['dataMin - 10000', 'dataMax + 10000']}
            tickFormatter={(val: number) => `₹${(val / 100000).toFixed(1)}L`}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const pVal = payload[0].value as number;
                const bVal = payload[1]?.value as number;
                const pnl = pVal - 1000000;
                const pnlPct = (pnl / 1000000) * 100;

                return (
                  <div className="rounded-lg border border-border-medium bg-bg-elevated p-3 text-xs shadow-dropdown font-mono">
                    <div className="text-text-secondary font-sans text-[11px] mb-1.5">{label}</div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-accent-primary font-bold">Portfolio:</span>
                      <span className="font-bold text-text-primary">{formatINR(pVal * 100)}</span>
                    </div>
                    {bVal && (
                      <div className="flex items-center justify-between gap-4 mt-1 text-text-secondary">
                        <span className="text-accent-secondary">NIFTY 50:</span>
                        <span>{formatINR(bVal * 100)}</span>
                      </div>
                    )}
                    <div className="mt-1.5 pt-1.5 border-t border-border-subtle flex justify-between text-trade-profit">
                      <span>Total Gain:</span>
                      <span>+{pnlPct.toFixed(2)}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="portfolioValue"
            stroke="#42DDA2"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#portfolioGradient)"
            name="Portfolio Value"
          />

          <Area
            type="monotone"
            dataKey="benchmarkValue"
            stroke="#6CA9FF"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#benchmarkGradient)"
            name="NIFTY 50"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
