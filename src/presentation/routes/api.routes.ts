import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller.js';
import { QueryController } from '../controllers/query.controller.js';
import { HealthController } from '../controllers/health.controller.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';

export function createApiRouter(
  documentController: DocumentController,
  queryController: QueryController,
  healthController: HealthController
): Router {
  const router = Router();

  // Health
  router.get('/health', healthController.check);

  // Documents
  router.post('/documents/upload', uploadMiddleware.single('file'), documentController.uploadFile);
  router.post('/documents/text', documentController.ingestText);
  router.get('/documents', documentController.listDocuments);
  router.delete('/documents/:id', documentController.deleteDocument);

  // Queries
  router.post('/query', queryController.querySync);
  router.post('/query/stream', queryController.queryStream);

  return router;
}
