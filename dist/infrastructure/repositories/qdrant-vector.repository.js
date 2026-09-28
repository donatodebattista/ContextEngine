import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';
export class QdrantVectorRepository {
    client;
    collectionName;
    vectorSize;
    constructor(options) {
        this.client = new QdrantClient({
            url: options?.url || env.QDRANT_URL,
            apiKey: options?.apiKey || env.QDRANT_API_KEY,
            checkCompatibility: false,
        });
        this.collectionName = options?.collectionName || env.QDRANT_COLLECTION_NAME;
        this.vectorSize = options?.vectorSize || env.VECTOR_DIMENSION;
    }
    async initialize() {
        try {
            const { exists } = await this.client.collectionExists(this.collectionName);
            if (!exists) {
                logger.info({ collection: this.collectionName }, 'Creating Qdrant vector collection');
                await this.client.createCollection(this.collectionName, {
                    vectors: {
                        size: this.vectorSize,
                        distance: 'Cosine',
                    },
                    optimizers_config: {
                        default_segment_number: 2,
                    },
                    replication_factor: 1,
                });
                // Create index on documentId for fast payload filtering
                await this.client.createPayloadIndex(this.collectionName, {
                    field_name: 'documentId',
                    field_schema: 'keyword',
                    wait: true,
                });
                logger.info({ collection: this.collectionName }, 'Qdrant collection and payload index ready');
            }
            else {
                logger.info({ collection: this.collectionName }, 'Qdrant collection already initialized');
            }
        }
        catch (error) {
            logger.error({ error }, 'Failed to initialize Qdrant collection');
            throw error;
        }
    }
    async upsertChunks(chunks) {
        if (chunks.length === 0)
            return;
        const points = chunks.map((chunk) => {
            if (!chunk.embedding || chunk.embedding.length === 0) {
                throw new Error(`Chunk ${chunk.id} is missing an embedding vector`);
            }
            return {
                id: chunk.id,
                vector: chunk.embedding,
                payload: {
                    id: chunk.id,
                    text: chunk.text,
                    documentId: chunk.metadata.documentId,
                    filename: chunk.metadata.filename,
                    chunkIndex: chunk.metadata.chunkIndex,
                    totalChunks: chunk.metadata.totalChunks,
                    pageNumber: chunk.metadata.pageNumber ?? null,
                    tokenCount: chunk.metadata.tokenCount ?? null,
                    hash: chunk.metadata.hash ?? null,
                    createdAt: chunk.metadata.createdAt,
                },
            };
        });
        try {
            await this.client.upsert(this.collectionName, {
                wait: true,
                points,
            });
            logger.info({ count: chunks.length, collection: this.collectionName }, 'Successfully indexed chunks in Qdrant');
        }
        catch (error) {
            logger.error({ error, count: chunks.length }, 'Failed to upsert chunks in Qdrant');
            throw error;
        }
    }
    async searchSimilar(queryEmbedding, topK = env.TOP_K_CHUNKS, scoreThreshold = env.SIMILARITY_THRESHOLD, documentIdFilter) {
        try {
            const filter = documentIdFilter
                ? {
                    must: [
                        {
                            key: 'documentId',
                            match: {
                                value: documentIdFilter,
                            },
                        },
                    ],
                }
                : undefined;
            const response = await this.client.query(this.collectionName, {
                query: queryEmbedding,
                limit: topK,
                score_threshold: scoreThreshold,
                with_payload: true,
                with_vector: false,
                filter,
            });
            return response.points.map((match) => {
                const payload = (match.payload || {});
                return {
                    id: String(match.id),
                    text: String(payload.text || ''),
                    score: match.score ?? 0,
                    metadata: {
                        documentId: String(payload.documentId || ''),
                        filename: String(payload.filename || 'unknown'),
                        chunkIndex: Number(payload.chunkIndex || 0),
                        totalChunks: Number(payload.totalChunks || 1),
                        pageNumber: payload.pageNumber ? Number(payload.pageNumber) : undefined,
                        tokenCount: payload.tokenCount ? Number(payload.tokenCount) : undefined,
                        hash: payload.hash ? String(payload.hash) : undefined,
                        createdAt: String(payload.createdAt || new Date().toISOString()),
                    },
                };
            });
        }
        catch (error) {
            logger.error({ error, queryDimension: queryEmbedding.length }, 'Failed to execute vector search in Qdrant');
            throw error;
        }
    }
    async deleteByDocumentId(documentId) {
        try {
            await this.client.delete(this.collectionName, {
                wait: true,
                filter: {
                    must: [
                        {
                            key: 'documentId',
                            match: {
                                value: documentId,
                            },
                        },
                    ],
                },
            });
            logger.info({ documentId }, 'Deleted document and associated chunks from Qdrant');
        }
        catch (error) {
            logger.error({ error, documentId }, 'Failed to delete chunks from Qdrant');
            throw error;
        }
    }
    async listDocuments() {
        try {
            const docsMap = new Map();
            let nextOffset = undefined;
            // Scroll through points in batches
            do {
                const scrollResult = await this.client.scroll(this.collectionName, {
                    limit: 100,
                    with_payload: true,
                    with_vector: false,
                    offset: nextOffset,
                });
                for (const point of scrollResult.points) {
                    const payload = (point.payload || {});
                    const docId = String(payload.documentId || '');
                    if (!docId)
                        continue;
                    const existing = docsMap.get(docId);
                    if (!existing) {
                        docsMap.set(docId, {
                            documentId: docId,
                            filename: String(payload.filename || 'unknown'),
                            mimeType: String(payload.filename || '').endsWith('.pdf') ? 'application/pdf' : 'text/plain',
                            totalChunks: 1,
                            createdAt: String(payload.createdAt || new Date().toISOString()),
                        });
                    }
                    else {
                        existing.totalChunks += 1;
                    }
                }
                nextOffset = scrollResult.next_page_offset ?? undefined;
            } while (nextOffset);
            return Array.from(docsMap.values());
        }
        catch (error) {
            logger.error({ error }, 'Failed to list documents from Qdrant');
            return [];
        }
    }
    async healthCheck() {
        try {
            const { exists } = await this.client.collectionExists(this.collectionName);
            return {
                status: exists ? 'ok' : 'unhealthy',
                details: {
                    connected: true,
                    collectionExists: exists,
                    collectionName: this.collectionName,
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    connected: false,
                    error: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
}
//# sourceMappingURL=qdrant-vector.repository.js.map