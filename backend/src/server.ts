import http from 'http';
import { app } from './app';
import { config } from './config';
import { logger } from './utilities/logger';
import { dbManager } from './config/database';
import { initSocketGateway, stopTickerBroadcaster } from './realtime/socketGateway';

// Initiate database connection pool
dbManager.connect().catch((err) => {
  logger.warn('Non-fatal: initial database connection attempt failed', { error: String(err) });
});

const server = http.createServer(app);

// Initialize real-time Socket.IO gateway
initSocketGateway(server);

server.listen(config.PORT, () => {
  logger.info(`VirtualTrade API & WebSocket server running on port ${config.PORT}`, {
    port: config.PORT,
    env: config.NODE_ENV,
    apiPrefix: config.API_PREFIX,
  });
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Close HTTP server first to reject new requests
  server.close(async (err) => {
    if (err) {
      logger.error('Error occurred during server close', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server closed successfully.');
    stopTickerBroadcaster();

    // Disconnect MongoDB connection pools
    try {
      await dbManager.disconnect();
      logger.info('Database connections closed cleanly.');
    } catch (dbErr) {
      logger.error('Error closing database connections', { error: String(dbErr) });
    }

    process.exit(0);
  });

  // Force shutdown after timeout if connections remain hung
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout (10s)');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
