import { z } from 'zod';

export const createWatchlistSchema = z.object({
  name: z.string().trim().min(1, 'Watchlist name is required').max(64, 'Name too long'),
  isDefault: z.boolean().optional(),
});

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;

export const addSymbolSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, 'Symbol is required')
    .max(20)
    .regex(/^[A-Za-z0-9&_.-]+$/, 'Invalid stock symbol format')
    .transform((val) => val.toUpperCase()),
  exchange: z.enum(['NSE', 'BSE']).default('NSE'),
});

export type AddSymbolInput = z.infer<typeof addSymbolSchema>;

export const reorderWatchlistSchema = z.object({
  symbols: z.array(
    z
      .string()
      .trim()
      .min(1)
      .max(20)
      .transform((val) => val.toUpperCase())
  ).min(1, 'At least one symbol is required'),
});

export type ReorderWatchlistInput = z.infer<typeof reorderWatchlistSchema>;

export const watchlistIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid watchlist ID format'),
});

export const watchlistSymbolParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid watchlist ID format'),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((val) => val.toUpperCase()),
});
