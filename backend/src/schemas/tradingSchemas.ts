import { z } from 'zod';
import { basePaginationSchema } from './commonSchemas';

export const createOrderSchema = z
  .object({
    symbol: z
      .string()
      .trim()
      .min(1, 'Symbol is required')
      .max(20)
      .regex(/^[A-Za-z0-9&_.-]+$/, 'Invalid stock symbol format')
      .transform((val) => val.toUpperCase()),
    exchange: z.enum(['NSE', 'BSE']).default('NSE'),
    side: z.enum(['BUY', 'SELL']),
    type: z.enum(['MARKET', 'LIMIT']),
    productType: z.enum(['CNC', 'MIS']).default('CNC'),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1 share'),
    limitPricePaise: z.coerce.number().int().positive().optional(),
    idempotencyKey: z.string().trim().uuid().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'LIMIT' && (!data.limitPricePaise || data.limitPricePaise <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'limitPricePaise is required and must be greater than 0 for LIMIT orders',
      path: ['limitPricePaise'],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderQuerySchema = basePaginationSchema.extend({
  status: z
    .enum(['OPEN', 'FILLED', 'EXECUTED', 'CANCELLED', 'REJECTED', 'ALL'])
    .default('ALL'),
  symbol: z.string().trim().toUpperCase().optional(),
  side: z.enum(['BUY', 'SELL']).optional(),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const orderIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format'),
});
