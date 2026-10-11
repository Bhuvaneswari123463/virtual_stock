import { z } from 'zod';
import { basePaginationSchema } from './commonSchemas';

export const marketFilterQuerySchema = basePaginationSchema.extend({
  search: z.string().trim().optional(),
  sector: z.string().trim().optional(),
  exchange: z.enum(['NSE', 'BSE']).default('NSE'),
  sortBy: z.enum(['symbol', 'ltpPaise', 'changePercent', 'volume']).default('volume'),
  minPricePaise: z.coerce.number().int().nonnegative().optional(),
  maxPricePaise: z.coerce.number().int().positive().optional(),
});

export type MarketFilterQuery = z.infer<typeof marketFilterQuerySchema>;

export const marketSymbolParamSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9&_.-]+$/, 'Invalid stock symbol format')
    .transform((val) => val.toUpperCase()),
});

export type MarketSymbolParam = z.infer<typeof marketSymbolParamSchema>;

export const candleQuerySchema = z.object({
  resolution: z
    .enum(['1m', '5m', '15m', '1h', '1D', '1W', '1M'])
    .default('1D'),
  from: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) {
        // Default 90 days ago
        return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      }
      const num = Number(val);
      if (!isNaN(num)) {
        return num > 1e11 ? new Date(num) : new Date(num * 1000);
      }
      return new Date(val);
    }),
  to: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) {
        return new Date();
      }
      const num = Number(val);
      if (!isNaN(num)) {
        return num > 1e11 ? new Date(num) : new Date(num * 1000);
      }
      return new Date(val);
    }),
});

export type CandleQuery = z.infer<typeof candleQuerySchema>;

export const marketSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(50),
});

export type MarketSearchQuery = z.infer<typeof marketSearchQuerySchema>;
