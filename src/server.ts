import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './infrastructure/logging/logger.js';

async function bootstrap() {
  try {
    const { app, vectorRepository } = createApp();

    // 1. Initialize vector collection
    logger.info('Initializing Qdrant vector database collection...');
    await vectorRepository.initialize();

    // 2. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info('====================================================');
      logger.info(`🚀 ContextEngine v2.0 API is running!`);
      logger.info(`📡 Server URL:         http://localhost:${env.PORT}`);
      logger.info(`📦 Health Endpoint:    http://localhost:${env.PORT}/api/health`);
      logger.info(`🗄️  Qdrant URL:         ${env.QDRANT_URL}`);
      logger.info(`🔍 Embedding Model:    ${env.EMBEDDING_MODEL} (${env.VECTOR_DIMENSION} dims)`);
      logger.info(`🧠 LLM Model:          ${env.LLM_MODEL}`);
      logger.info('====================================================');
    });

    // 3. Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down ContextEngine gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error({ error }, 'Fatal error during server bootstrap');
    process.exit(1);
  }
}

bootstrap();
