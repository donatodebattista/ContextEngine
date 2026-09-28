import { Router } from 'express';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';
export function createApiRouter(documentController, queryController, healthController) {
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
//# sourceMappingURL=api.routes.js.map