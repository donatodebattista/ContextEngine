import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { QdrantVectorRepository } from '../infrastructure/repositories/qdrant-vector.repository.js';
import { Chunk } from '../domain/entities/document.entity.js';
import { logger } from '../infrastructure/logging/logger.js';

interface LegacyDocument {
  id?: string;
  text?: string;
  content?: string;
  embedding?: number[];
  filename?: string;
  metadata?: Record<string, unknown>;
}

async function migrate() {
  const jsonPath = path.resolve(process.cwd(), 'data', 'documents.json');

  try {
    const fileExists = await fs
      .access(jsonPath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      logger.info({ path: jsonPath }, 'No legacy data/documents.json file found to migrate. Skipping.');
      return;
    }

    const rawData = await fs.readFile(jsonPath, 'utf-8');
    const legacyDocs: LegacyDocument[] = JSON.parse(rawData);

    if (!Array.isArray(legacyDocs) || legacyDocs.length === 0) {
      logger.info('Legacy data/documents.json is empty. No documents to migrate.');
      return;
    }

    logger.info({ count: legacyDocs.length }, 'Found legacy chunks in data/documents.json. Starting migration...');

    const vectorRepo = new QdrantVectorRepository();
    await vectorRepo.initialize();

    const domainChunks: Chunk[] = legacyDocs
      .filter((doc) => doc.text || doc.content)
      .map((doc, index) => {
        const text = (doc.text || doc.content || '').trim();
        const documentId = (doc.metadata?.documentId as string) || crypto.randomUUID();
        const filename = (doc.metadata?.filename as string) || doc.filename || 'migrated-document.txt';

        return {
          id: doc.id || crypto.randomUUID(),
          text,
          embedding: doc.embedding,
          metadata: {
            documentId,
            filename,
            chunkIndex: index,
            totalChunks: legacyDocs.length,
            createdAt: new Date().toISOString(),
          },
        };
      })
      .filter((chunk): chunk is Chunk & { embedding: number[] } => Array.isArray(chunk.embedding) && chunk.embedding.length > 0);

    if (domainChunks.length > 0) {
      await vectorRepo.upsertChunks(domainChunks);
      logger.info({ migratedCount: domainChunks.length }, 'Migration to Qdrant completed successfully!');
    } else {
      logger.warn('Legacy documents did not contain valid embedding vectors. Re-ingest documents to populate vectors.');
    }
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  }
}

migrate();
