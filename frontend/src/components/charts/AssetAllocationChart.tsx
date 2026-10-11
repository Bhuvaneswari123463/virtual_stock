import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { FIXTURE_ASSET_ALLOCATION, AssetAllocationItem } from '@/fixtures/portfolio';
import { formatINR } from '@/lib/formatters';

export interface AssetAllocationChartProps {
  data?: AssetAllocationItem[];
  height?: number;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data = FIXTURE_ASSET_ALLOCATION,
  height = 200,
}) => {
  return (
    <div className="w-full flex items-center justify-between" style={{ height: `${height}px` }}>
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="valueRupees"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as AssetAllocationItem;
                  return (
                    <div className="rounded border border-border-medium bg-bg-elevated p-2 text-xs shadow-dropdown font-mono">
                      <div className="font-semibold text-text-primary">{item.name}</div>
                      <div className="text-text-secondary mt-0.5">{formatINR(item.valueRupees * 100)}</div>
                      <div className="text-accent-primary font-bold">{item.percentage}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-1/2 flex flex-col justify-center gap-1.5 pl-2 text-xs font-mono">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-text-secondary text-[11px] truncate max-w-[100px]">{item.name}</span>
            </div>
            <span className="text-text-primary font-bold text-[11px] tabular-nums">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
