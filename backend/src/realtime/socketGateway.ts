import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utilities/logger';
import { marketService, MarketQuoteFormatted } from '../services/marketService';

let ioInstance: SocketIOServer | null = null;
let broadcastIntervalId: NodeJS.Timeout | null = null;

// Track active symbol subscriptions (symbol -> set of socket IDs)
const activeSubscriptions = new Map<string, Set<string>>();

export function initSocketGateway(httpServer: http.Server): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  ioInstance = io;

  // Optional authentication middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        socket.data.user = decoded;
      } catch {
        // Token invalid, allow anonymous connection for public market data
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`, {
      userId: socket.data?.user?.id || 'anonymous',
    });

    // Subscribe to a single symbol
    socket.on('subscribe:symbol', async (data: { symbol: string }) => {
      if (!data?.symbol) return;
      const symbol = data.symbol.trim().toUpperCase();
      const room = `symbol:${symbol}`;

      socket.join(room);

      if (!activeSubscriptions.has(symbol)) {
        activeSubscriptions.set(symbol, new Set());
      }
      activeSubscriptions.get(symbol)!.add(socket.id);

      // Immediately emit current quote
      try {
        const detail = await marketService.getStockDetail(symbol);
        socket.emit('quote:update', detail.quote);
      } catch (err: any) {
        logger.warn(`Could not emit initial quote for ${symbol}:`, err.message);
      }
    });

    // Unsubscribe from a symbol
    socket.on('unsubscribe:symbol', (data: { symbol: string }) => {
      if (!data?.symbol) return;
      const symbol = data.symbol.trim().toUpperCase();
      const room = `symbol:${symbol}`;

      socket.leave(room);

      const subs = activeSubscriptions.get(symbol);
      if (subs) {
        subs.delete(socket.id);
        if (subs.size === 0) {
          activeSubscriptions.delete(symbol);
        }
      }
    });

    // Batch subscribe (for watchlists)
    socket.on('subscribe:symbols', async (data: { symbols: string[] }) => {
      if (!Array.isArray(data?.symbols)) return;

      for (const rawSymbol of data.symbols) {
        const symbol = rawSymbol.trim().toUpperCase();
        const room = `symbol:${symbol}`;
        socket.join(room);

        if (!activeSubscriptions.has(symbol)) {
          activeSubscriptions.set(symbol, new Set());
        }
        activeSubscriptions.get(symbol)!.add(socket.id);

        try {
          const detail = await marketService.getStockDetail(symbol);
          socket.emit('quote:update', detail.quote);
        } catch (error) {
          logger.debug(`Failed to fetch initial quote for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      // Clean up all socket subscriptions
      for (const [symbol, socketIds] of activeSubscriptions.entries()) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          activeSubscriptions.delete(symbol);
        }
      }
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  // Start background ticker for active rooms (every 2.5 seconds)
  startTickerBroadcaster(io);

  return io;
}

export function getSocketGateway(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastQuoteUpdate(symbol: string, quote: MarketQuoteFormatted): void {
  if (ioInstance) {
    const room = `symbol:${symbol.toUpperCase()}`;
    ioInstance.to(room).emit('quote:update', quote);
  }
}

function startTickerBroadcaster(io: SocketIOServer): void {
  if (broadcastIntervalId) {
    clearInterval(broadcastIntervalId);
  }

  broadcastIntervalId = setInterval(async () => {
    if (activeSubscriptions.size === 0) return;

    for (const symbol of activeSubscriptions.keys()) {
      try {
        const detail = await marketService.getStockDetail(symbol);
        const room = `symbol:${symbol}`;

        // Broadcast to clients in this symbol's room
        io.to(room).emit('quote:update', detail.quote);
      } catch (error) {
        logger.debug(`Failed to broadcast quote for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }, 2500);

  // Do not block node event loop
  broadcastIntervalId.unref();
}

export function stopTickerBroadcaster(): void {
  if (broadcastIntervalId) {
    clearInterval(broadcastIntervalId);
    broadcastIntervalId = null;
  }
}
