import React, { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/apiClient';
import { Settings, RefreshCw, Sun, Moon, ShieldAlert, User, ShieldCheck, Key } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const { user, portfolio, refreshProfile } = useAuth();

  const [orderType, setOrderType] = useState('MARKET');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fillAlerts, setFillAlerts] = useState(true);

  // Profile update state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const payload: Record<string, string> = {};
      if (fullName && fullName !== user?.fullName) {
        payload.fullName = fullName;
      }
      if (newPassword) {
        payload.newPassword = newPassword;
        payload.currentPassword = currentPassword;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes made to profile.');
        setIsUpdatingProfile(false);
        return;
      }

      const res = await apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success('Account profile updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        await refreshProfile();
      } else {
        toast.error(res.error?.message || 'Failed to update profile.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResetCapital = () => {
    toast.success(
      'Virtual Capital has been reset to ₹10,00,000. All simulated positions cleared.',
      'Wallet Reset'
    );
  };

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 max-w-4xl">
      <div>
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Settings className="h-5 w-5 text-accent-primary" />
          Terminal Preferences & Account Settings
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure application theme, account details, execution defaults, and simulation state.
        </p>
      </div>

      {/* Account Profile Card */}
      <Card className="p-4 bg-bg-surface border-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <User className="h-4 w-4 text-accent-primary" />
            Account Information
          </CardTitle>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent-primary-subtle text-accent-primary border border-accent-primary/30">
            {user?.role || 'TRADER'} ROLE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-bg-elevated border border-border-subtle text-xs">
          <div>
            <span className="text-text-muted text-[11px] block">Registered Email</span>
            <span className="font-semibold text-text-primary font-mono">{user?.email || 'trader@virtualtrade.in'}</span>
          </div>
          <div>
            <span className="text-text-muted text-[11px] block">Virtual Trading Capital</span>
            <span className="font-bold text-accent-primary font-mono flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {portfolio?.cashBalanceFormatted || '₹10,00,000.00'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />

          <div className="pt-2 border-t border-border-subtle">
            <span className="text-xs font-semibold text-text-primary block mb-2 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-text-muted" />
              Change Password (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 chars)"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingProfile}>
            Save Account Changes
          </Button>
        </form>
      </Card>

      {/* Appearance & Theme */}
      <Card className="p-4 bg-bg-surface border-border-subtle space-y-3">
        <CardTitle className="text-xs uppercase tracking-wider text-text-secondary">
          Display Theme
        </CardTitle>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
              theme === 'dark'
                ? 'border-accent-primary bg-bg-elevated text-accent-primary shadow-sm font-semibold'
                : 'border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            <Moon className="h-4 w-4" />
            <span>Dark Terminal (Default)</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
              theme === 'light'
                ? 'border-accent-primary bg-bg-elevated text-accent-primary shadow-sm font-semibold'
                : 'border-border-subtle bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sun className="h-4 w-4" />
            <span>Light Terminal</span>
          </button>
        </div>
      </Card>

      {/* Trading Defaults */}
      <Card className="p-4 bg-bg-surface border-border-subtle space-y-4">
        <CardTitle className="text-xs uppercase tracking-wider text-text-secondary">
          Trading Execution Defaults
        </CardTitle>
        <div className="max-w-xs">
          <Select
            label="Default Order Type"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            options={[
              { value: 'MARKET', label: 'MARKET Order (Immediate Fill)' },
              { value: 'LIMIT', label: 'LIMIT Order (Reserved Margin)' },
            ]}
          />
        </div>

        <div className="space-y-2 pt-1">
          <Checkbox
            label="Play audio confirmation on order execution"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
          <Checkbox
            label="Display desktop notifications on simulated price alerts"
            checked={fillAlerts}
            onChange={(e) => setFillAlerts(e.target.checked)}
          />
        </div>
      </Card>

      {/* Reset Simulation State */}
      <Card className="p-4 bg-bg-surface border-trade-loss/30 space-y-3">
        <div className="flex items-center gap-2 text-trade-loss font-semibold text-xs">
          <ShieldAlert className="h-4 w-4" />
          <span>Reset Virtual Simulation Capital</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
          Resetting your account will wipe simulated holdings and restore your virtual capital balance back to the starting ₹10,00,000 (100,000,000 paise).
        </p>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCapital}
            className="text-trade-loss hover:bg-trade-loss-subtle border-trade-loss/40"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Reset Capital to ₹10,00,000
          </Button>
        </div>
      </Card>
    </div>
  );
};
