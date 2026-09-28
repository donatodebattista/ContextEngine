import { env } from '../../config/env.js';
export class HealthController {
    vectorRepository;
    constructor(vectorRepository) {
        this.vectorRepository = vectorRepository;
    }
    check = async (_req, res) => {
        const qdrantHealth = await this.vectorRepository.healthCheck();
        const isHealthy = qdrantHealth.status === 'ok';
        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                api: 'ok',
                qdrant: qdrantHealth,
                gemini: {
                    status: env.GEMINI_API_KEY ? 'configured' : 'missing_api_key',
                    model: env.LLM_MODEL,
                    embeddingModel: env.EMBEDDING_MODEL,
                },
            },
        });
    };
}
//# sourceMappingURL=health.controller.js.map