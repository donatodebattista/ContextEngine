import { Chunk, DocumentSummary } from '../entities/document.entity.js';

export interface ScoredChunk extends Chunk {
  score: number;
}

export interface IVectorRepository {
  /**
   * Initializes the vector collection (creates it if it doesn't exist, ensures index settings).
   */
  initialize(): Promise<void>;

  /**
   * Upserts chunks with their vector embeddings and metadata payloads.
   */
  upsertChunks(chunks: Chunk[]): Promise<void>;

  /**
   * Searches for chunks most similar to the provided embedding vector.
   */
  searchSimilar(
    queryEmbedding: number[],
    topK: number,
    scoreThreshold?: number,
    documentIdFilter?: string
  ): Promise<ScoredChunk[]>;

  /**
   * Deletes all chunks associated with a specific document ID.
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * Lists all indexed documents with aggregate chunk statistics.
   */
  listDocuments(): Promise<DocumentSummary[]>;

  /**
   * Checks the health and connection status of the vector repository.
   */
  healthCheck(): Promise<{ status: 'ok' | 'unhealthy'; details?: Record<string, unknown> }>;
}
