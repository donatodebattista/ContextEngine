import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../infrastructure/logging/logger.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  logger.error(
    {
      method: req.method,
      url: req.originalUrl,
      error: errorMessage,
      stack: errorStack,
    },
    'Unhandled request exception'
  );

  res.status(500).json({
    success: false,
    error: errorMessage || 'Internal Server Error',
  });
}
