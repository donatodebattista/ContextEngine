export interface IEmbeddingProvider {
  /**
   * Generates a 768-dimensional embedding vector for a single query string.
   */
  generateQueryEmbedding(text: string): Promise<number[]>;

  /**
   * Generates embedding vectors in batches for optimal performance and rate-limit prevention.
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}
