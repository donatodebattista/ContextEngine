import { env } from '../../config/env.js';
import { logger } from '../../infrastructure/logging/logger.js';
export class QueryRagUseCase {
    embeddingProvider;
    vectorRepository;
    llmProvider;
    constructor(embeddingProvider, vectorRepository, llmProvider) {
        this.embeddingProvider = embeddingProvider;
        this.vectorRepository = vectorRepository;
        this.llmProvider = llmProvider;
    }
    async retrieveContext(input) {
        const topK = input.topK ?? env.TOP_K_CHUNKS;
        const threshold = input.similarityThreshold ?? env.SIMILARITY_THRESHOLD;
        logger.debug({ question: input.question, topK, threshold }, 'Retrieving context for query');
        // 1. Generate embedding for query
        const queryEmbedding = await this.embeddingProvider.generateQueryEmbedding(input.question);
        // 2. Search similar vectors in Qdrant
        const scoredChunks = await this.vectorRepository.searchSimilar(queryEmbedding, topK, threshold, input.documentId);
        if (scoredChunks.length === 0) {
            logger.info({ question: input.question }, 'No chunks matched similarity threshold in vector store');
            return {
                contextText: '',
                citations: [],
                topScore: 0,
            };
        }
        const citations = scoredChunks.map((chunk, index) => ({
            documentId: chunk.metadata.documentId,
            filename: chunk.metadata.filename,
            pageNumber: chunk.metadata.pageNumber,
            chunkIndex: chunk.metadata.chunkIndex,
            similarityScore: Math.round(chunk.score * 1000) / 1000,
            snippet: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        }));
        const contextText = scoredChunks
            .map((c, i) => `[Fuente ${i + 1}] (${c.metadata.filename}${c.metadata.pageNumber ? `, Pág. ${c.metadata.pageNumber}` : ''}):\n${c.text}`)
            .join('\n\n');
        return {
            contextText,
            citations,
            topScore: scoredChunks[0]?.score ?? 0,
        };
    }
    async executeSync(input) {
        const { contextText, citations, topScore } = await this.retrieveContext(input);
        if (citations.length === 0) {
            return {
                question: input.question,
                answer: 'No encontré información relevante en los documentos indexados para responder a tu pregunta con suficiente certeza.',
                citations: [],
                topScore: 0,
            };
        }
        const answer = await this.llmProvider.generateAnswer(input.question, contextText);
        return {
            question: input.question,
            answer,
            citations,
            topScore,
        };
    }
    async executeStream(input) {
        const { contextText, citations, topScore } = await this.retrieveContext(input);
        if (citations.length === 0) {
            async function* emptyStream() {
                yield 'No encontré información relevante en los documentos indexados para responder a tu pregunta con certeza.';
            }
            return {
                stream: emptyStream(),
                citations: [],
                topScore: 0,
            };
        }
        const stream = this.llmProvider.generateAnswerStream(input.question, contextText);
        return {
            stream,
            citations,
            topScore,
        };
    }
}
//# sourceMappingURL=query-rag.use-case.js.map