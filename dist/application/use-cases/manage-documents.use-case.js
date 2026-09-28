import { logger } from '../../infrastructure/logging/logger.js';
export class ManageDocumentsUseCase {
    vectorRepository;
    constructor(vectorRepository) {
        this.vectorRepository = vectorRepository;
    }
    async listDocuments() {
        logger.debug('Listing all indexed documents from vector store');
        return this.vectorRepository.listDocuments();
    }
    async deleteDocument(documentId) {
        logger.info({ documentId }, 'Deleting document and associated chunks from vector store');
        await this.vectorRepository.deleteByDocumentId(documentId);
    }
}
//# sourceMappingURL=manage-documents.use-case.js.map