import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import {
  LayoutDashboard,
  TrendingUp,
  Eye,
  PieChart,
  ListOrdered,
  GraduationCap,
  Trophy,
  Newspaper,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/formatters';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { label: 'Markets', path: '/app/markets', icon: TrendingUp },
  { label: 'Watchlist', path: '/app/watchlist', icon: Eye },
  { label: 'Portfolio', path: '/app/portfolio', icon: PieChart },
  { label: 'Orders', path: '/app/orders', icon: ListOrdered },
  { label: 'Learn', path: '/app/learn', icon: GraduationCap },
  { label: 'Competitions', path: '/app/competitions', icon: Trophy },
  { label: 'News', path: '/app/news', icon: Newspaper },
  { label: 'Settings', path: '/app/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  className,
}) => {
  const virtualBalancePaise = 100000000; // ₹10,00,000.00

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border-subtle bg-bg-surface transition-all duration-200 select-none z-20',
        isCollapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-border-subtle">
        <NavLink to="/app" className="flex items-center overflow-hidden">
          {isCollapsed ? (
            <Logo size="sm" showTagline={false} />
          ) : (
            <Logo size="md" showTagline={true} />
          )}
        </NavLink>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-bg-elevated text-accent-primary font-semibold border border-border-subtle shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/60',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  'text-current'
                )}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Virtual Capital Footer Card */}
      <div className="p-2 border-t border-border-subtle">
        {isCollapsed ? (
          <div
            title={`Virtual Capital: ${formatINR(virtualBalancePaise)}`}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-md bg-bg-elevated text-accent-primary border border-border-subtle"
          >
            <ShieldCheck className="h-4 w-4" />
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-bg-elevated/70 p-3">
            <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
                Virtual Capital
              </span>
              <span className="text-[10px] text-accent-primary font-semibold font-mono">100% RISK-FREE</span>
            </div>
            <div className="text-sm font-bold font-mono text-text-primary tabular-nums">
              {formatINR(virtualBalancePaise)}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
