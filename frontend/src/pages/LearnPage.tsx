import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/context/ToastContext';
import { GraduationCap, CheckCircle2, Play, Award, Clock } from 'lucide-react';

const MODULES = [
  {
    id: 'm1',
    title: 'Foundations of Indian Equity Markets',
    desc: 'Understand NSE & BSE mechanics, order matching algorithms, circuit breakers, and market trading hours.',
    duration: '45 mins',
    level: 'Beginner',
    completed: true,
    lessons: 4,
  },
  {
    id: 'm2',
    title: 'Technical Analysis & Candlestick Patterns',
    desc: 'Master engulfing patterns, hammers, dojis, trend lines, support-resistance zones, and moving averages.',
    duration: '60 mins',
    level: 'Intermediate',
    completed: false,
    lessons: 6,
  },
  {
    id: 'm3',
    title: 'Risk Management & Position Sizing',
    desc: 'Calculate risk-to-reward ratios, stop-loss placement, portfolio volatility, and maximum drawdown limits.',
    duration: '40 mins',
    level: 'Intermediate',
    completed: false,
    lessons: 5,
  },
  {
    id: 'm4',
    title: 'Index Trading & Derivative Fundamentals',
    desc: 'Introduction to NIFTY 50 and BANK NIFTY indices, call/put options payoff diagrams, and delta hedging.',
    duration: '75 mins',
    level: 'Advanced',
    completed: false,
    lessons: 8,
  },
];

export const LearnPage: React.FC = () => {
  const toast = useToast();

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent-primary" />
            Trading Academy & Educational Modules
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Structured courses with interactive quizzes to sharpen your technical edge.
          </p>
        </div>

        <Badge variant="accent" size="md" className="gap-1.5 font-mono">
          <Award className="h-4 w-4" />
          <span>Progress: 1 of 4 Modules Certified</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES.map((mod) => (
          <Card key={mod.id} className="flex flex-col justify-between p-5 bg-bg-surface border-border-subtle hover:border-border-medium transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={mod.completed ? 'profit' : 'outline'} size="sm">
                  {mod.completed ? 'Completed' : mod.level}
                </Badge>
                <div className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Clock className="h-3 w-3" />
                  <span>{mod.duration}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-text-primary mb-1.5">{mod.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">{mod.desc}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border-subtle/70">
              <span className="text-xs text-text-muted">{mod.lessons} Lessons & Quiz</span>
              <Button
                size="sm"
                variant={mod.completed ? 'secondary' : 'primary'}
                onClick={() => {
                  toast.success(`Started lesson: "${mod.title}"`);
                }}
                leftIcon={mod.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-trade-profit" /> : <Play className="h-3.5 w-3.5" />}
              >
                {mod.completed ? 'Review Content' : 'Start Module'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
