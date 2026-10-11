import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Clock } from 'lucide-react';

const NEWS_ITEMS = [
  {
    id: '1',
    headline: 'RBI Monetary Policy Committee Maintains Repo Rate at 6.5%, Forecasts Resilient GDP Growth',
    source: 'Financial Express',
    time: '25m ago',
    tag: 'Macroeconomics',
    sentiment: 'NEUTRAL',
    summary: 'The Reserve Bank of India retained policy stance focused on withdrawal of accommodation while highlighting robust manufacturing and services PMIs.',
  },
  {
    id: '2',
    headline: 'Reliance Retail Expands Omnichannel Strategy; Reports Strong Q2 Footfall Across Tier-2 Markets',
    source: 'LiveMint',
    time: '1h ago',
    tag: 'RELIANCE',
    sentiment: 'BULLISH',
    summary: 'Reliance Industries retail arm recorded double-digit quarterly revenue expansion driven by consumer electronics and grocery distribution.',
  },
  {
    id: '3',
    headline: 'IT Sector Witnesses Resilient Deal Pipelines Amid Cloud and Enterprise Generative AI Deployments',
    source: 'Economic Times',
    time: '2h ago',
    tag: 'TCS / INFY',
    sentiment: 'BULLISH',
    summary: 'Top tier Indian IT firms report improving discretionary tech spend commitments across North American and European banking clients.',
  },
  {
    id: '4',
    headline: 'Global Crude Prices Consolidate Near $78/bbl on Balanced Supply Projections',
    source: 'Reuters',
    time: '3h ago',
    tag: 'Commodities',
    sentiment: 'NEUTRAL',
    summary: 'Brent crude prices traded within a tight band as traders assessed OPEC+ production quota compliance against refining margins.',
  },
];

export const NewsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      <div>
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent-primary" />
          Market News & Economic Intelligence
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Curated Indian financial news and sector developments impacting equity price action.
        </p>
      </div>

      <div className="space-y-3">
        {NEWS_ITEMS.map((item) => (
          <Card key={item.id} className="p-4 bg-bg-surface border-border-subtle hover:border-border-medium transition-colors">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">{item.tag}</Badge>
                <Badge variant={item.sentiment === 'BULLISH' ? 'profit' : 'subtle'} size="sm">
                  {item.sentiment}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <Clock className="h-3 w-3" />
                <span>{item.time}</span>
                <span>•</span>
                <span>{item.source}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-text-primary hover:text-accent-primary transition-colors cursor-pointer">
              {item.headline}
            </h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{item.summary}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
