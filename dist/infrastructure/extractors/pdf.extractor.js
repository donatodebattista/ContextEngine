import pdf from 'pdf-parse';
import { logger } from '../logging/logger.js';
export class PdfExtractor {
    supports(mimeType) {
        return (mimeType === 'application/pdf' ||
            mimeType === 'text/plain' ||
            mimeType === 'text/markdown' ||
            mimeType === 'application/json' ||
            mimeType === 'text/csv');
    }
    async extract(buffer, filename) {
        const isPdf = filename.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            // Handle plain text / markdown / JSON files
            const text = buffer.toString('utf-8').trim();
            return {
                text,
                pages: [{ pageNumber: 1, text }],
                metadata: {
                    title: filename,
                    totalPages: 1,
                },
            };
        }
        try {
            // In PDF extraction, capture per-page content
            const pages = [];
            let currentPage = 1;
            const options = {
                pagerender: (pageData) => {
                    return pageData.getTextContent().then((textContent) => {
                        let lastY;
                        let pageText = '';
                        for (const item of textContent.items) {
                            if (lastY === item.transform[5] || !lastY) {
                                pageText += item.str + ' ';
                            }
                            else {
                                pageText += '\n' + item.str + ' ';
                            }
                            lastY = item.transform[5];
                        }
                        const cleanText = pageText.replace(/\s+/g, ' ').trim();
                        if (cleanText.length > 0) {
                            pages.push({
                                pageNumber: currentPage,
                                text: cleanText,
                            });
                        }
                        currentPage++;
                        return cleanText;
                    });
                },
            };
            const parsed = await pdf(buffer, options);
            // Clean redundant whitespace and control characters
            const cleanFullText = parsed.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
            logger.info({ filename, totalPages: parsed.numpages, charCount: cleanFullText.length }, 'PDF document text extracted successfully');
            return {
                text: cleanFullText,
                pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleanFullText }],
                metadata: {
                    title: parsed.info?.Title || filename,
                    author: parsed.info?.Author,
                    totalPages: parsed.numpages,
                },
            };
        }
        catch (error) {
            logger.error({ error, filename }, 'Failed to extract text from PDF file');
            throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=pdf.extractor.js.map