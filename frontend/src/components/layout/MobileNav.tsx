import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer } from '@/components/ui/drawer';
import { Logo } from '@/components/brand/Logo';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  ListOrdered,
  Eye,
  GraduationCap,
  Trophy,
  Newspaper,
  Settings,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/formatters';

interface MobileNavProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onOpenDrawer: () => void;
}

const BOTTOM_NAV_ITEMS = [
  { label: 'Home', path: '/app', icon: LayoutDashboard },
  { label: 'Markets', path: '/app/markets', icon: TrendingUp },
  { label: 'Portfolio', path: '/app/portfolio', icon: PieChart },
  { label: 'Orders', path: '/app/orders', icon: ListOrdered },
];

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { label: 'Markets', path: '/app/markets', icon: TrendingUp },
  { label: 'Watchlist', path: '/app/watchlist', icon: Eye },
  { label: 'Portfolio', path: '/app/portfolio', icon: PieChart },
  { label: 'Orders', path: '/app/orders', icon: ListOrdered },
  { label: 'Learn Academy', path: '/app/learn', icon: GraduationCap },
  { label: 'Competitions', path: '/app/competitions', icon: Trophy },
  { label: 'Market News', path: '/app/news', icon: Newspaper },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

export const MobileNav: React.FC<MobileNavProps> = ({
  isDrawerOpen,
  onCloseDrawer,
  onOpenDrawer,
}) => {
  const virtualCashPaise = 100000000;

  return (
    <>
      {/* Compact Bottom Navigation Bar (Mobile Viewports Only) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-border-subtle bg-bg-surface/95 px-2 backdrop-blur-md md:hidden"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent-primary font-semibold' : 'text-text-muted hover:text-text-primary'
                )
              }
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center py-1 text-[10px] font-medium text-text-muted hover:text-text-primary transition-colors"
          aria-label="Open full navigation menu"
        >
          <Menu className="h-4 w-4 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Slide-out Mobile Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        position="left"
        title={<Logo size="sm" showTagline={true} />}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-1">
            {ALL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app'}
                  onClick={onCloseDrawer}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-bg-elevated text-accent-primary font-semibold border border-border-subtle'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )
                  }
                >
                  <Icon className="h-4 w-4 text-current" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4">
            <div className="rounded-lg border border-border-subtle bg-bg-elevated/70 p-3">
              <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
                  Virtual Capital
                </span>
                <span className="text-[10px] text-accent-primary font-semibold font-mono">SAFE</span>
              </div>
              <div className="text-sm font-bold font-mono text-text-primary tabular-nums">
                {formatINR(virtualCashPaise)}
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};
