import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { marketService, MarketQuoteItem } from '@/services/marketService';

export type FeedConnectionStatus =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'FALLBACK_POLLING';

interface MarketFeedContextType {
  connectionStatus: FeedConnectionStatus;
  lastHeartbeat: Date | null;
  quotes: Record<string, MarketQuoteItem>;
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  subscribeMany: (symbols: string[]) => void;
  unsubscribeMany: (symbols: string[]) => void;
  getLiveQuote: (symbol: string) => MarketQuoteItem | undefined;
}

const MarketFeedContext = createContext<MarketFeedContextType | undefined>(undefined);

export const MarketFeedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<FeedConnectionStatus>('CONNECTING');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [quotes, setQuotes] = useState<Record<string, MarketQuoteItem>>({});

  const socketRef = useRef<Socket | null>(null);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback Polling Handler
  const startFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setConnectionStatus('FALLBACK_POLLING');

    pollingIntervalRef.current = setInterval(async () => {
      const symbols = Array.from(subscribedSymbolsRef.current);
      if (symbols.length === 0) return;

      for (const sym of symbols) {
        try {
          const detail = await marketService.getStockDetail(sym);
          if (detail.success && detail.data?.quote) {
            setQuotes((prev) => ({
              ...prev,
              [sym.toUpperCase()]: detail.data!.quote,
            }));
            setLastHeartbeat(new Date());
          }
        } catch {}
      }
    }, 5000);
  }, []);

  const stopFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Try connecting to backend port or relative path
    const socketUrl = window.location.port === '5173' ? 'http://localhost:5000' : '/';

    const socket = io(socketUrl, {
      reconnectionAttempts: 4,
      reconnectionDelay: 2000,
      timeout: 5000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('CONNECTED');
      setLastHeartbeat(new Date());
      stopFallbackPolling();

      // Resubscribe to any active symbols upon reconnection
      const symbols = Array.from(subscribedSymbolsRef.current);
      if (symbols.length > 0) {
        socket.emit('subscribe:symbols', { symbols });
      }
    });

    socket.on('quote:update', (quote: MarketQuoteItem) => {
      if (!quote?.symbol) return;
      const upper = quote.symbol.toUpperCase();
      setQuotes((prev) => ({
        ...prev,
        [upper]: quote,
      }));
      setLastHeartbeat(new Date());
    });

    socket.on('disconnect', () => {
      setConnectionStatus('DISCONNECTED');
      startFallbackPolling();
    });

    socket.on('connect_error', () => {
      setConnectionStatus('FALLBACK_POLLING');
      startFallbackPolling();
    });

    return () => {
      stopFallbackPolling();
      socket.disconnect();
    };
  }, [startFallbackPolling, stopFallbackPolling]);

  // Subscription methods
  const subscribe = useCallback((symbol: string) => {
    const upper = symbol.trim().toUpperCase();
    subscribedSymbolsRef.current.add(upper);

    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:symbol', { symbol: upper });
    }
  }, []);

  const unsubscribe = useCallback((symbol: string) => {
    const upper = symbol.trim().toUpperCase();
    subscribedSymbolsRef.current.delete(upper);

    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe:symbol', { symbol: upper });
    }
  }, []);

  const subscribeMany = useCallback((symbols: string[]) => {
    const upperList = symbols.map((s) => s.trim().toUpperCase());
    upperList.forEach((s) => subscribedSymbolsRef.current.add(s));

    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe:symbols', { symbols: upperList });
    }
  }, []);

  const unsubscribeMany = useCallback((symbols: string[]) => {
    const upperList = symbols.map((s) => s.trim().toUpperCase());
    upperList.forEach((s) => {
      subscribedSymbolsRef.current.delete(s);
      if (socketRef.current?.connected) {
        socketRef.current.emit('unsubscribe:symbol', { symbol: s });
      }
    });
  }, []);

  const getLiveQuote = useCallback(
    (symbol: string): MarketQuoteItem | undefined => {
      return quotes[symbol.toUpperCase()];
    },
    [quotes]
  );

  return (
    <MarketFeedContext.Provider
      value={{
        connectionStatus,
        lastHeartbeat,
        quotes,
        subscribe,
        unsubscribe,
        subscribeMany,
        unsubscribeMany,
        getLiveQuote,
      }}
    >
      {children}
    </MarketFeedContext.Provider>
  );
};

export const useMarketFeed = (): MarketFeedContextType => {
  const context = useContext(MarketFeedContext);
  if (!context) {
    throw new Error('useMarketFeed must be used within a MarketFeedProvider');
  }
  return context;
};
