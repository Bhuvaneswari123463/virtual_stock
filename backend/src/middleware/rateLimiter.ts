import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipInTests?: boolean;
}

export class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;
  private readonly skipInTests: boolean;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.message = options.message || 'Too many requests. Please try again later.';
    this.skipInTests = options.skipInTests ?? false;

    // Periodically prune stale entries every 5 minutes
    setInterval(() => this.prune(), 5 * 60 * 1000).unref();
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  reset(): void {
    this.records.clear();
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (this.skipInTests && process.env.NODE_ENV === 'test') {
        return next();
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${ip}:${req.baseUrl}${req.path}`;
      const now = Date.now();

      let record = this.records.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.records.set(key, record);
      }

      // Filter out timestamps outside window
      record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

      const count = record.timestamps.length;
      const remaining = Math.max(0, this.maxRequests - count);
      const resetTime = Math.ceil(
        (record.timestamps.length > 0 ? record.timestamps[0] + this.windowMs - now : this.windowMs) / 1000
      );

      res.setHeader('RateLimit-Limit', this.maxRequests);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetTime);

      if (count >= this.maxRequests) {
        res.setHeader('Retry-After', resetTime);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.message,
            details: { retryAfterSeconds: resetTime },
          },
          meta: {
            requestId: req.id,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      record.timestamps.push(now);
      next();
    };
  }
}

// Configured limiters
export const authRateLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 requests per 15 mins for login / register
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
  skipInTests: true,
});

export const passwordResetRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: 'Too many password reset requests. Please wait an hour before requesting again.',
  skipInTests: true,
});
