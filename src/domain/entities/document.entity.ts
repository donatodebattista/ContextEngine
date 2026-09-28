export interface ChunkMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  pageNumber?: number;
  tokenCount?: number;
  hash?: string;
  createdAt: string;
}

export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface DocumentSummary {
  documentId: string;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  totalChunks: number;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  filename: string;
  pageNumber?: number;
  chunkIndex: number;
  similarityScore: number;
  snippet: string;
}

export interface QueryResult {
  question: string;
  answer: string;
  citations: Citation[];
  topScore: number;
}
