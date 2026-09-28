import { z } from 'zod';

export const IngestTextSchema = z.object({
  text: z.string().min(10, 'Text must have at least 10 characters for indexing'),
  filename: z.string().min(1).default('raw-text.txt'),
  metadata: z.record(z.unknown()).optional(),
});

export type IngestTextInput = z.infer<typeof IngestTextSchema>;
