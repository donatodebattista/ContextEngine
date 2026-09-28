export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  pages: ExtractedPage[];
  metadata?: {
    title?: string;
    author?: string;
    totalPages?: number;
  };
}

export interface IDocumentExtractor {
  /**
   * Checks whether this extractor handles the specified MIME type.
   */
  supports(mimeType: string): boolean;

  /**
   * Extracts clean text and page-level information from a file buffer.
   */
  extract(buffer: Buffer, filename: string): Promise<ExtractedDocument>;
}
