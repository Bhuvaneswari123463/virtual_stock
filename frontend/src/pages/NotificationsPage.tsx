import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/context/ToastContext';
import { Bell, CheckCircle2, TrendingUp, BookOpen, AlertCircle, Trash2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('all');

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Order Executed: BUY 25 RELIANCE',
      desc: 'Market order ORD-10928 for 25 shares of RELIANCE was executed at ₹2,950.50.',
      time: '14:32:10 IST',
      category: 'fills',
      icon: CheckCircle2,
      unread: true,
    },
    {
      id: '2',
      title: 'Virtual Capital Initialized',
      desc: '₹10,00,000 in virtual funds credited to your paper-trading wallet.',
      time: '12:00:00 IST',
      category: 'system',
      icon: TrendingUp,
      unread: true,
    },
    {
      id: '3',
      title: 'Academy Milestone Unlocked',
      desc: 'Congratulations! You completed Module 1: Foundations of Indian Equities.',
      time: 'Yesterday',
      category: 'academy',
      icon: BookOpen,
      unread: false,
    },
    {
      id: '4',
      title: 'Regulatory & Educational Notice',
      desc: 'VirtualTrade is an educational paper-trading simulator. No real money transactions take place.',
      time: '2 days ago',
      category: 'system',
      icon: AlertCircle,
      unread: false,
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success('Marked all notifications as read.');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.info('Cleared notification history.');
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return n.unread;
    if (activeTab === 'fills') return n.category === 'fills';
    if (activeTab === 'system') return n.category === 'system';
    return true;
  });

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent-primary" />
            Notifications & Platform Alerts
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Audit log of order fills, margin locks, security notices, and course updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={markAllRead}>
            Mark All Read
          </Button>
          <Button size="sm" variant="outline" onClick={clearAll} leftIcon={<Trash2 className="h-3.5 w-3.5" />}>
            Clear
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-bg-surface border-border-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
          <Tabs
            tabs={[
              { id: 'all', label: 'All Alerts', count: notifications.length },
              { id: 'unread', label: 'Unread', count: notifications.filter((n) => n.unread).length },
              { id: 'fills', label: 'Order Fills' },
              { id: 'system', label: 'System' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pill"
          />
        </div>

        <div className="divide-y divide-border-subtle/50">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-lg transition-colors flex items-start gap-3 ${
                    item.unread ? 'bg-bg-elevated/50' : 'hover:bg-bg-hover/30'
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-bg-surface flex items-center justify-center text-accent-primary border border-border-subtle shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-text-primary">{item.title}</h4>
                      <span className="text-[10px] text-text-muted font-mono">{item.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                  {item.unread && (
                    <span className="h-2 w-2 rounded-full bg-accent-primary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-text-muted">
              No notifications to display in this view.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
