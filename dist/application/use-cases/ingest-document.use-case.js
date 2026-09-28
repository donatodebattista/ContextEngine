import crypto from 'node:crypto';
import { logger } from '../../infrastructure/logging/logger.js';
export class IngestDocumentUseCase {
    extractor;
    chunker;
    embeddingProvider;
    vectorRepository;
    constructor(extractor, chunker, embeddingProvider, vectorRepository) {
        this.extractor = extractor;
        this.chunker = chunker;
        this.embeddingProvider = embeddingProvider;
        this.vectorRepository = vectorRepository;
    }
    async execute(input) {
        const documentId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        logger.info({ documentId, filename: input.filename }, 'Starting document ingestion pipeline');
        let pages = [];
        if (input.buffer) {
            const extracted = await this.extractor.extract(input.buffer, input.filename);
            pages = extracted.pages.length > 0 ? extracted.pages : [{ pageNumber: 1, text: extracted.text }];
        }
        else if (input.text) {
            pages = [{ pageNumber: 1, text: input.text }];
        }
        else {
            throw new Error('Ingestion requires either a file buffer or a text string');
        }
        // Generate chunks preserving page metadata
        const rawChunks = [];
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
        logger.info({ documentId, totalChunks: rawChunks.length }, 'Generating batch embeddings for document chunks');
        const chunkTexts = rawChunks.map((c) => c.text);
        const embeddings = await this.embeddingProvider.generateBatchEmbeddings(chunkTexts);
        const domainChunks = rawChunks.map((raw, index) => {
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
        logger.info({ documentId, filename: input.filename, totalChunks: domainChunks.length }, 'Ingestion pipeline completed successfully');
        return {
            documentId,
            filename: input.filename,
            totalChunks: domainChunks.length,
            extractedPages: pages.length,
        };
    }
}
//# sourceMappingURL=ingest-document.use-case.js.map