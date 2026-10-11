import { z } from 'zod';
import { basePaginationSchema } from './commonSchemas';

export const educationFilterQuerySchema = basePaginationSchema.extend({
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  sortBy: z.enum(['order', 'title', 'estimatedMinutes']).default('order'),
});

export type EducationFilterQuery = z.infer<typeof educationFilterQuerySchema>;

export const educationSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format')
    .toLowerCase(),
});

export type EducationSlugParam = z.infer<typeof educationSlugParamSchema>;
