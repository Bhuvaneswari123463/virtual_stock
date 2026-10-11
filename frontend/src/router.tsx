import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MarketsPage } from '@/pages/MarketsPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { LearnPage } from '@/pages/LearnPage';
import { CompetitionsPage } from '@/pages/CompetitionsPage';
import { NewsPage } from '@/pages/NewsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>

      {/* Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Redirect /terminal to /app */}
      <Route path="/terminal" element={<Navigate to="/app" replace />} />

      {/* Authenticated Application Terminal Shell Guarded by ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShellLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="markets/:symbol" element={<StockDetailPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="competitions" element={<CompetitionsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
