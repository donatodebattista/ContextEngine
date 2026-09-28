import express from 'express';
import cors from 'cors';
import { createApiRouter } from './presentation/routes/api.routes.js';
import { errorHandler } from './presentation/middlewares/error.middleware.js';
import { DocumentController } from './presentation/controllers/document.controller.js';
import { QueryController } from './presentation/controllers/query.controller.js';
import { HealthController } from './presentation/controllers/health.controller.js';
import { IngestDocumentUseCase } from './application/use-cases/ingest-document.use-case.js';
import { QueryRagUseCase } from './application/use-cases/query-rag.use-case.js';
import { ManageDocumentsUseCase } from './application/use-cases/manage-documents.use-case.js';
import { PdfExtractor } from './infrastructure/extractors/pdf.extractor.js';
import { RecursiveCharacterChunker } from './infrastructure/chunking/recursive-character.chunker.js';
import { GeminiEmbeddingProvider } from './infrastructure/ai/gemini-embedding.provider.js';
import { GeminiLlmProvider } from './infrastructure/ai/gemini-llm.provider.js';
import { QdrantVectorRepository } from './infrastructure/repositories/qdrant-vector.repository.js';
export function createApp() {
    const app = express();
    // 1. Dependency Injection setup
    const vectorRepository = new QdrantVectorRepository();
    const embeddingProvider = new GeminiEmbeddingProvider();
    const llmProvider = new GeminiLlmProvider();
    const pdfExtractor = new PdfExtractor();
    const chunker = new RecursiveCharacterChunker();
    const ingestDocumentUseCase = new IngestDocumentUseCase(pdfExtractor, chunker, embeddingProvider, vectorRepository);
    const queryRagUseCase = new QueryRagUseCase(embeddingProvider, vectorRepository, llmProvider);
    const manageDocumentsUseCase = new ManageDocumentsUseCase(vectorRepository);
    const documentController = new DocumentController(ingestDocumentUseCase, manageDocumentsUseCase);
    const queryController = new QueryController(queryRagUseCase);
    const healthController = new HealthController(vectorRepository);
    // 2. Global Middlewares
    app.use(cors({ origin: '*' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    // 3. API Routes
    const apiRouter = createApiRouter(documentController, queryController, healthController);
    app.use('/api', apiRouter);
    // 4. Centralized Error Handler
    app.use(errorHandler);
    return { app, vectorRepository };
}
//# sourceMappingURL=app.js.map