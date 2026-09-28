import { Request, Response, NextFunction } from 'express';
import { QueryRagUseCase } from '../../application/use-cases/query-rag.use-case.js';
import { QueryRequestSchema } from '../dtos/query.dto.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class QueryController {
  constructor(private queryRagUseCase: QueryRagUseCase) {}

  querySync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = QueryRequestSchema.parse(req.body);
      const result = await this.queryRagUseCase.executeSync(validated);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  queryStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = QueryRequestSchema.parse(req.body);

      // Setup Server-Sent Events (SSE) headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx)
      res.flushHeaders?.();

      const { stream, citations, topScore } = await this.queryRagUseCase.executeStream(validated);

      // Send initial metadata event
      res.write(`event: start\ndata: ${JSON.stringify({ question: validated.question })}\n\n`);

      // Stream tokens in real time
      for await (const token of stream) {
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      }

      // Stream citations and completion event
      res.write(`event: citations\ndata: ${JSON.stringify({ citations, topScore })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ status: 'completed' })}\n\n`);
      res.end();
    } catch (error) {
      logger.error({ error }, 'Error during SSE query stream');
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming error' })}\n\n`);
        res.end();
      }
    }
  };
}
