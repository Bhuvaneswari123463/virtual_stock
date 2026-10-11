import { z } from 'zod';
import { basePaginationSchema } from './commonSchemas';

export const competitionFilterQuerySchema = basePaginationSchema.extend({
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED']).optional(),
  sortBy: z.enum(['startDate', 'endDate', 'participantCount']).default('startDate'),
});

export type CompetitionFilterQuery = z.infer<typeof competitionFilterQuerySchema>;

export const competitionIdParamSchema = z.object({
  id: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid competition ID format'),
});

export type CompetitionIdParam = z.infer<typeof competitionIdParamSchema>;
