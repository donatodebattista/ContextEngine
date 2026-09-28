import { IVectorRepository } from '../../domain/ports/vector-repository.port.js';
import { DocumentSummary } from '../../domain/entities/document.entity.js';
import { logger } from '../../infrastructure/logging/logger.js';

export class ManageDocumentsUseCase {
  constructor(private vectorRepository: IVectorRepository) {}

  async listDocuments(): Promise<DocumentSummary[]> {
    logger.debug('Listing all indexed documents from vector store');
    return this.vectorRepository.listDocuments();
  }

  async deleteDocument(documentId: string): Promise<void> {
    logger.info({ documentId }, 'Deleting document and associated chunks from vector store');
    await this.vectorRepository.deleteByDocumentId(documentId);
  }
}
