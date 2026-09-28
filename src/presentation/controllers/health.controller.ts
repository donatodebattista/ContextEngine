import { Request, Response } from 'express';
import { IVectorRepository } from '../../domain/ports/vector-repository.port.js';
import { env } from '../../config/env.js';

export class HealthController {
  constructor(private vectorRepository: IVectorRepository) {}

  check = async (_req: Request, res: Response): Promise<void> => {
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
