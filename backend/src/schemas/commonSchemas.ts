import { z } from 'zod';

export const basePaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationQuerySchema = basePaginationSchema.extend({
  sortBy: z.string().trim().default('createdAt'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
