import React from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'Virtual Capital Provisioned',
      message: '₹10,00,000 virtual cash has been credited to your paper-trading wallet.',
      time: 'Just now',
      type: 'account',
      icon: CheckCircle2,
      unread: true,
    },
    {
      id: '2',
      title: 'Market Hours Active',
      message: 'NSE & BSE simulated market data engine is running normal tick intervals.',
      time: '15m ago',
      type: 'market',
      icon: TrendingUp,
      unread: true,
    },
    {
      id: '3',
      title: 'Academy Module Available',
      message: 'New course available: "Introduction to Technical Charting & Price Action".',
      time: '1h ago',
      type: 'education',
      icon: BookOpen,
      unread: false,
    },
    {
      id: '4',
      title: 'Simulation Notice',
      message: 'VirtualTrade operates in simulation mode. No actual broker routing or capital is engaged.',
      time: '2h ago',
      type: 'system',
      icon: AlertCircle,
      unread: false,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      title={
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent-primary" />
          <span>Notifications</span>
          <Badge variant="accent" size="sm">
            {notifications.filter((n) => n.unread).length} New
          </Badge>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/70">
          <button
            onClick={markAllAsRead}
            className="text-xs text-text-secondary hover:text-accent-primary transition-colors"
          >
            Mark all as read
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-text-muted hover:text-trade-loss transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 pt-2">
          {notifications.length > 0 ? (
            notifications.map((n) => {
              const Icon = n.icon;
              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-md transition-colors ${
                    n.unread ? 'bg-bg-elevated/40' : 'hover:bg-bg-hover/30'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-bg-surface flex items-center justify-center text-accent-secondary border border-border-subtle shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-text-primary leading-tight">
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-text-muted">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 leading-normal">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-text-muted">
              No active notifications.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border-subtle mt-auto space-y-2">
          <button
            onClick={() => {
              window.location.href = '/app/notifications';
              onClose();
            }}
            className="text-xs text-accent-primary hover:underline text-center w-full block"
          >
            Open Full Notifications Center &rarr;
          </button>
          <Button variant="secondary" size="sm" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
