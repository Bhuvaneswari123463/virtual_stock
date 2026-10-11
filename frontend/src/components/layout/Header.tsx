import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Dropdown } from '@/components/ui/dropdown';
import { formatINR } from '@/lib/formatters';

import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenMobileMenu,
}) => {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const { user, portfolio, logout } = useAuth();
  const navigate = useNavigate();

  const cashFormatted = portfolio?.cashBalanceFormatted || '₹10,00,000.00';
  const cashPaise = portfolio?.cashBalancePaise || 100000000;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out of trading session.');
    navigate('/login');
  };

  // Profile Menu Dropdown Items
  const profileMenuItems = [
    {
      id: 'profile',
      label: (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-text-primary text-xs">{user?.fullName || 'Paper Trader'}</span>
          <span className="text-[11px] text-text-secondary font-mono">{user?.email || 'trader@virtualtrade.in'}</span>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-accent-primary font-mono">
            <ShieldCheck className="h-3 w-3" />
            <span>{cashFormatted}</span>
          </div>
        </div>
      ),
      onClick: () => navigate('/app/settings'),
    },
    {
      id: 'settings',
      label: 'Account & Preferences',
      icon: <Settings className="h-3.5 w-3.5" />,
      divider: true,
      onClick: () => navigate('/app/settings'),
    },
    {
      id: 'help',
      label: 'Terminal Guide & Rules',
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      onClick: () => navigate('/app/learn'),
    },
    {
      id: 'logout',
      label: 'Sign Out Session',
      icon: <LogOut className="h-3.5 w-3.5" />,
      variant: 'danger' as const,
      divider: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-bg-surface/95 px-3 sm:px-6 backdrop-blur-sm">
      {/* Left: Mobile hamburger & Global Search Button */}
      <div className="flex items-center gap-2 sm:gap-4">
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Open mobile navigation menu"
          onClick={onOpenMobileMenu}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </IconButton>

        {/* Global Search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors w-40 sm:w-64"
        >
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <span className="truncate">Search tickers (e.g. RELIANCE)...</span>
          <kbd className="hidden sm:inline-block ml-auto rounded border border-border-subtle bg-bg-surface px-1 py-0.2 font-mono text-[9px] text-text-muted">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Center: Market Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated border border-border-subtle text-xs">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-trade-profit opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-trade-profit" />
        </div>
        <span className="font-semibold text-text-primary">NSE · BSE</span>
        <span className="text-text-muted">|</span>
        <span className="text-[11px] text-text-secondary">Simulated Ticks Active</span>
      </div>

      {/* Right: Actions (Notifications, Theme Toggle, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Quick Capital Badge (tablet/desktop) */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-bg-elevated border border-border-subtle text-xs font-mono text-accent-primary">
          <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
          <span className="tabular-nums font-bold">{formatINR(cashPaise, { compact: true })}</span>
        </div>

        {/* Notifications Trigger */}
        <div className="relative">
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="View notifications"
            onClick={onOpenNotifications}
          >
            <Bell className="h-4 w-4" />
          </IconButton>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-primary" />
        </div>

        {/* Theme Toggle Button */}
        <IconButton
          size="sm"
          variant="ghost"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>

        {/* Profile Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2 p-1 rounded-md hover:bg-bg-hover transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary-subtle text-accent-primary border border-accent-primary/40 text-xs font-bold font-mono">
                VT
              </div>
            </div>
          }
          items={profileMenuItems}
        />
      </div>
    </header>
  );
};
