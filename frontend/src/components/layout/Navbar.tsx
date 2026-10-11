import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, BarChart2, BookOpen, Trophy, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { label: 'Terminal', path: '/terminal', icon: BarChart2 },
    { label: 'Academy', path: '/learn', icon: BookOpen },
    { label: 'Competitions', path: '/competitions', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-trade-accent text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">VirtualTrade</span>
              <span className="text-[10px] tracking-wider text-emerald-400 font-mono uppercase">NSE · BSE SIMULATOR</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-background-hover text-white font-semibold'
                      : 'text-foreground-muted hover:text-white hover:bg-background-hover/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-background-panel border border-border text-xs font-mono text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Virtual Capital: ₹10,00,000</span>
          </div>

          <Link to="/terminal">
            <Button size="sm" variant="buy">
              Launch Terminal
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
