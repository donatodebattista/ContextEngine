import { z } from 'zod';

export const QueryRequestSchema = z.object({
  question: z.string().min(2, 'Question must be at least 2 characters long'),
  topK: z.number().int().positive().max(20).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  documentId: z.string().optional(),
});

export type QueryRequestInput = z.infer<typeof QueryRequestSchema>;
