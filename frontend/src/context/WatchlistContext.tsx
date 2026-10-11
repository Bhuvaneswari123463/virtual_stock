import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { apiRequest } from '@/lib/apiClient';
import { useAuth } from './AuthContext';
import { useMarketFeed } from './MarketFeedContext';
import { useToast } from './ToastContext';
import { MarketQuoteItem } from '@/services/marketService';

export interface WatchlistItemEnriched extends MarketQuoteItem {
  addedAt: string;
}

export interface WatchlistEnriched {
  id: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItemEnriched[];
  createdAt: string;
  updatedAt: string;
}

interface WatchlistContextType {
  watchlists: WatchlistEnriched[];
  activeWatchlist: WatchlistEnriched | null;
  loading: boolean;
  refreshWatchlists: () => Promise<void>;
  setActiveWatchlistId: (id: string) => void;
  addSymbol: (symbol: string, watchlistId?: string) => Promise<boolean>;
  removeSymbol: (symbol: string, watchlistId?: string) => Promise<boolean>;
  reorderSymbols: (symbols: string[], watchlistId?: string) => Promise<boolean>;
  createWatchlist: (name: string) => Promise<boolean>;
  isSymbolInWatchlist: (symbol: string, watchlistId?: string) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [watchlists, setWatchlists] = useState<WatchlistEnriched[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const { subscribeMany, quotes } = useMarketFeed();
  const toast = useToast();

  // Load Watchlists from Backend
  const refreshWatchlists = useCallback(async () => {
    if (!isAuthenticated) {
      setWatchlists([]);
      setActiveWatchlistId(null);
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest<WatchlistEnriched[]>('/watchlists');
      if (res.success && res.data) {
        setWatchlists(res.data);
        if (!activeWatchlistId && res.data.length > 0) {
          const defaultList = res.data.find((w) => w.isDefault) || res.data[0];
          setActiveWatchlistId(defaultList.id);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load watchlists:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeWatchlistId]);

  useEffect(() => {
    refreshWatchlists();
  }, [refreshWatchlists]);

  // Determine active watchlist
  const activeWatchlist = useMemo(() => {
    if (!activeWatchlistId && watchlists.length > 0) {
      return watchlists[0];
    }
    return watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0] || null;
  }, [watchlists, activeWatchlistId]);

  // Subscribe active watchlist symbols to real-time feed
  useEffect(() => {
    if (activeWatchlist?.items?.length) {
      const symbols = activeWatchlist.items.map((i) => i.symbol);
      subscribeMany(symbols);
    }
  }, [activeWatchlist, subscribeMany]);

  // Merge live ticks into active watchlist items
  const enrichedActiveWatchlist = useMemo(() => {
    if (!activeWatchlist) return null;

    const mergedItems = activeWatchlist.items.map((item) => {
      const live = quotes[item.symbol.toUpperCase()];
      if (!live) return item;

      return {
        ...item,
        ltpPaise: live.ltpPaise,
        ltpFormatted: live.ltpFormatted,
        changePaise: live.changePaise,
        changePercent: live.changePercent,
        changeFormatted: live.changeFormatted,
        highFormatted: live.highFormatted,
        lowFormatted: live.lowFormatted,
        volume: live.volume,
        lastUpdated: live.lastUpdated,
      };
    });

    return {
      ...activeWatchlist,
      items: mergedItems,
    };
  }, [activeWatchlist, quotes]);

  // Check if symbol is in watchlist
  const isSymbolInWatchlist = useCallback(
    (symbol: string, targetListId?: string): boolean => {
      const targetList = targetListId
        ? watchlists.find((w) => w.id === targetListId)
        : activeWatchlist;
      if (!targetList) return false;
      const upper = symbol.trim().toUpperCase();
      return targetList.items.some((i) => i.symbol.toUpperCase() === upper);
    },
    [watchlists, activeWatchlist]
  );

  // Add symbol to watchlist
  const addSymbol = useCallback(
    async (symbol: string, targetListId?: string): Promise<boolean> => {
      const listId = targetListId || activeWatchlist?.id;
      if (!listId) {
        toast.error('No active watchlist selected.');
        return false;
      }

      const upper = symbol.trim().toUpperCase();

      if (isSymbolInWatchlist(upper, listId)) {
        toast.warning(`${upper} is already in this watchlist.`);
        return false;
      }

      try {
        const res = await apiRequest<WatchlistEnriched>(`/watchlists/${listId}/symbols`, {
          method: 'POST',
          body: JSON.stringify({ symbol: upper, exchange: 'NSE' }),
        });

        if (res.success && res.data) {
          setWatchlists((prev) =>
            prev.map((w) => (w.id === listId ? res.data! : w))
          );
          toast.success(`Added ${upper} to watchlist.`);
          return true;
        } else {
          toast.error(res.error?.message || `Failed to add ${upper} to watchlist.`);
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || `Failed to add ${upper}.`);
        return false;
      }
    },
    [activeWatchlist, isSymbolInWatchlist, toast]
  );

  // Remove symbol from watchlist
  const removeSymbol = useCallback(
    async (symbol: string, targetListId?: string): Promise<boolean> => {
      const listId = targetListId || activeWatchlist?.id;
      if (!listId) return false;

      const upper = symbol.trim().toUpperCase();

      try {
        const res = await apiRequest<WatchlistEnriched>(
          `/watchlists/${listId}/symbols/${encodeURIComponent(upper)}`,
          {
            method: 'DELETE',
          }
        );

        if (res.success && res.data) {
          setWatchlists((prev) =>
            prev.map((w) => (w.id === listId ? res.data! : w))
          );
          toast.info(`Removed ${upper} from watchlist.`);
          return true;
        } else {
          toast.error(res.error?.message || `Failed to remove ${upper}.`);
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || `Failed to remove ${upper}.`);
        return false;
      }
    },
    [activeWatchlist, toast]
  );

  // Reorder symbols
  const reorderSymbols = useCallback(
    async (symbols: string[], targetListId?: string): Promise<boolean> => {
      const listId = targetListId || activeWatchlist?.id;
      if (!listId) return false;

      try {
        const res = await apiRequest<WatchlistEnriched>(
          `/watchlists/${listId}/reorder`,
          {
            method: 'PUT',
            body: JSON.stringify({ symbols }),
          }
        );

        if (res.success && res.data) {
          setWatchlists((prev) =>
            prev.map((w) => (w.id === listId ? res.data! : w))
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [activeWatchlist]
  );

  // Create new watchlist
  const createWatchlist = useCallback(
    async (name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      try {
        const res = await apiRequest<WatchlistEnriched>('/watchlists', {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
        });

        if (res.success && res.data) {
          setWatchlists((prev) => [...prev, res.data!]);
          setActiveWatchlistId(res.data.id);
          toast.success(`Created watchlist "${trimmed}".`);
          return true;
        } else {
          toast.error(res.error?.message || 'Failed to create watchlist.');
          return false;
        }
      } catch (err: any) {
        toast.error(err.message || 'Error creating watchlist.');
        return false;
      }
    },
    [toast]
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlists,
        activeWatchlist: enrichedActiveWatchlist,
        loading,
        refreshWatchlists,
        setActiveWatchlistId,
        addSymbol,
        removeSymbol,
        reorderSymbols,
        createWatchlist,
        isSymbolInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
