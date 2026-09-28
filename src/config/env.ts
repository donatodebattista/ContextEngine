import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Google Gemini Configuration
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required in environment'),
  EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  VECTOR_DIMENSION: z.coerce.number().default(3072),
  LLM_MODEL: z.string().default('gemini-2.5-flash'),
  
  // Qdrant Configuration
  QDRANT_URL: z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION_NAME: z.string().default('context_engine'),
  
  // RAG Hyperparameters
  SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.65),
  TOP_K_CHUNKS: z.coerce.number().int().positive().default(5),
  CHUNK_SIZE: z.coerce.number().int().positive().default(500),
  CHUNK_OVERLAP: z.coerce.number().int().nonnegative().default(100),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables config:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;
