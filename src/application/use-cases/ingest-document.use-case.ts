import crypto from 'node:crypto';
import { IDocumentExtractor } from '../../domain/ports/document-extractor.port.js';
import { IChunkingStrategy } from '../../domain/ports/chunking-strategy.port.js';
import { IEmbeddingProvider } from '../../domain/ports/embedding-provider.port.js';
import { IVectorRepository } from '../../domain/ports/vector-repository.port.js';
import { Chunk } from '../../domain/entities/document.entity.js';
import { logger } from '../../infrastructure/logging/logger.js';

export interface IngestDocumentInput {
  buffer?: Buffer;
  text?: string;
  filename: string;
  mimeType?: string;
}

export interface IngestDocumentResult {
  documentId: string;
  filename: string;
  totalChunks: number;
  extractedPages: number;
}

export class IngestDocumentUseCase {
  constructor(
    private extractor: IDocumentExtractor,
    private chunker: IChunkingStrategy,
    private embeddingProvider: IEmbeddingProvider,
    private vectorRepository: IVectorRepository
  ) {}

  async execute(input: IngestDocumentInput): Promise<IngestDocumentResult> {
    const documentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    logger.info({ documentId, filename: input.filename }, 'Starting document ingestion pipeline');

    let pages: Array<{ pageNumber: number; text: string }> = [];

    if (input.buffer) {
      const extracted = await this.extractor.extract(input.buffer, input.filename);
      pages = extracted.pages.length > 0 ? extracted.pages : [{ pageNumber: 1, text: extracted.text }];
    } else if (input.text) {
      pages = [{ pageNumber: 1, text: input.text }];
    } else {
      throw new Error('Ingestion requires either a file buffer or a text string');
    }

    // Generate chunks preserving page metadata
    const rawChunks: Array<{ text: string; pageNumber: number }> = [];

    for (const page of pages) {
      const pageChunks = this.chunker.split(page.text);
      for (const chunkText of pageChunks) {
        if (chunkText.trim().length > 0) {
          rawChunks.push({
            text: chunkText,
            pageNumber: page.pageNumber,
          });
        }
      }
    }

    if (rawChunks.length === 0) {
      throw new Error(`Document ${input.filename} did not yield any indexable text chunks`);
    }

    logger.info(
      { documentId, totalChunks: rawChunks.length },
      'Generating batch embeddings for document chunks'
    );

    const chunkTexts = rawChunks.map((c) => c.text);
    const embeddings = await this.embeddingProvider.generateBatchEmbeddings(chunkTexts);

    const domainChunks: Chunk[] = rawChunks.map((raw, index) => {
      const chunkId = crypto.randomUUID();
      return {
        id: chunkId,
        text: raw.text,
        embedding: embeddings[index],
        metadata: {
          documentId,
          filename: input.filename,
          chunkIndex: index,
          totalChunks: rawChunks.length,
          pageNumber: raw.pageNumber,
          createdAt,
        },
      };
    });

    await this.vectorRepository.upsertChunks(domainChunks);

    logger.info(
      { documentId, filename: input.filename, totalChunks: domainChunks.length },
      'Ingestion pipeline completed successfully'
    );

    return {
      documentId,
      filename: input.filename,
      totalChunks: domainChunks.length,
      extractedPages: pages.length,
    };
  }
}
