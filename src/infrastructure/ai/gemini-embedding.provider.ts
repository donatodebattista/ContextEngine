import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { IEmbeddingProvider } from '../../domain/ports/embedding-provider.port.js';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';

export class GeminiEmbeddingProvider implements IEmbeddingProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || env.GEMINI_API_KEY);
    this.modelName = modelName || env.EMBEDDING_MODEL;
  }

  async generateQueryEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.embedContent({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_QUERY,
      });

      return result.embedding.values;
    } catch (error) {
      logger.error({ error, textLength: text.length }, 'Failed to generate query embedding');
      throw new Error(`Error generating query embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const model = this.genAI.getGenerativeModel({ model: this.modelName });
    const batchSize = 20; // Maximum items per batchEmbedContents request
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const chunkBatch = texts.slice(i, i + batchSize);
      try {
        const requests = chunkBatch.map((text) => ({
          content: { role: 'user', parts: [{ text }] },
          taskType: TaskType.RETRIEVAL_DOCUMENT,
          title: 'Document chunk',
        }));

        const result = await model.batchEmbedContents({ requests });
        const embeddings = result.embeddings.map((item) => item.values);
        allEmbeddings.push(...embeddings);
        
        logger.debug(
          { processed: allEmbeddings.length, total: texts.length },
          'Batch embeddings progress'
        );
      } catch (error) {
        logger.error(
          { error, batchIndex: i / batchSize, batchCount: chunkBatch.length },
          'Failed generating batch embeddings with Gemini'
        );
        throw new Error(
          `Failed generating batch embeddings: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return allEmbeddings;
  }
}
