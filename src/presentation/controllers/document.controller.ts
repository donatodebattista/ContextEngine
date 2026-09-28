import { Request, Response, NextFunction } from 'express';
import { IngestDocumentUseCase } from '../../application/use-cases/ingest-document.use-case.js';
import { ManageDocumentsUseCase } from '../../application/use-cases/manage-documents.use-case.js';
import { IngestTextSchema } from '../dtos/ingest.dto.js';

export class DocumentController {
  constructor(
    private ingestDocumentUseCase: IngestDocumentUseCase,
    private manageDocumentsUseCase: ManageDocumentsUseCase
  ) {}

  uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No file uploaded in form field "file"' });
        return;
      }

      const result = await this.ingestDocumentUseCase.execute({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      res.status(201).json({
        success: true,
        message: 'Document ingested and indexed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  ingestText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = IngestTextSchema.parse(req.body);

      const result = await this.ingestDocumentUseCase.execute({
        text: validated.text,
        filename: validated.filename,
      });

      res.status(201).json({
        success: true,
        message: 'Text content ingested and indexed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listDocuments = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documents = await this.manageDocumentsUseCase.listDocuments();
      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documentId = req.params.id as string;
      if (!documentId) {
        res.status(400).json({ success: false, error: 'Missing documentId in path parameter' });
        return;
      }

      await this.manageDocumentsUseCase.deleteDocument(documentId);
      res.status(200).json({
        success: true,
        message: `Document ${documentId} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  };
}
