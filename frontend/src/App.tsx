import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { MarketFeedProvider } from '@/context/MarketFeedContext';
import { WatchlistProvider } from '@/context/WatchlistContext';
import { AppRoutes } from './router';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MarketFeedProvider>
            <WatchlistProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </WatchlistProvider>
          </MarketFeedProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
