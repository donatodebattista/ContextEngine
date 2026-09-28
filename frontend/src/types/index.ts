export interface DocumentSummary {
  documentId: string;
  filename: string;
  mimeType: string;
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  topScore?: number;
  timestamp: string;
  isStreaming?: boolean;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    api: string;
    qdrant: {
      status: string;
      details?: {
        connected?: boolean;
        collectionExists?: boolean;
        collectionName?: string;
      };
    };
    gemini: {
      status: string;
      model: string;
      embeddingModel: string;
    };
  };
}
