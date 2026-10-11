export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class StructuredLogger {
  private minLevel: LogLevel = 'info';

  constructor(level: LogLevel = 'info') {
    this.minLevel = level;
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  private output(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const payload = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context ? { context } : {}),
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      const color =
        level === 'error'
          ? '\x1b[31m'
          : level === 'warn'
          ? '\x1b[33m'
          : level === 'info'
          ? '\x1b[36m'
          : '\x1b[90m';
      const reset = '\x1b[0m';
      const ctxStr = context ? ` ${JSON.stringify(context)}` : '';
      console.log(`${color}[${payload.timestamp}] [${payload.level}]${reset} ${message}${ctxStr}`);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.output('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.output('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.output('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.output('error', message, context);
  }
}

export const logger = new StructuredLogger((process.env.LOG_LEVEL as LogLevel) || 'info');
