import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Shield, ArrowRight } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-base/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center">
            <Logo size="md" showTagline={true} />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">
              Platform Features
            </a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">
              How It Works
            </a>
            <a href="#academy" className="hover:text-text-primary transition-colors">
              Trading Academy
            </a>
            <Link to="/app" className="hover:text-text-primary transition-colors">
              Live Terminal Demo
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconButton>

            <Link to="/login" className="text-xs font-semibold text-text-secondary hover:text-text-primary px-2">
              Sign In
            </Link>

            <Link to="/register">
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Start Paper Trading
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border-subtle bg-bg-surface py-10 px-4 text-xs text-text-secondary">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Logo size="sm" showTagline={true} />
            <div className="flex flex-wrap gap-6 text-xs text-text-muted">
              <Link to="/app" className="hover:text-text-primary">Terminal</Link>
              <Link to="/app/markets" className="hover:text-text-primary">Markets</Link>
              <Link to="/app/learn" className="hover:text-text-primary">Academy</Link>
              <Link to="/app/competitions" className="hover:text-text-primary">Competitions</Link>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-bg-elevated border border-border-subtle text-[11px] text-text-muted leading-relaxed">
            <Shield className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <span>
              <strong>Regulatory Notice:</strong> VirtualTrade is an educational paper-trading simulator and algorithmic modeling environment for Indian equities. VirtualTrade is not a registered SEBI broker, depository participant, or financial advisor. All virtual balances, quotes, and executions are strictly simulated and incur zero financial risk or monetary liabilities.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted border-t border-border-subtle/50 pt-4">
            <span>&copy; {new Date().getFullYear()} VirtualTrade. All rights reserved.</span>
            <span>Trade the market. Master the strategy. Risk nothing.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
