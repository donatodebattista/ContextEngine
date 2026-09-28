import multer from 'multer';
// Keep uploaded files in memory buffers to avoid disk residue and race conditions
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/json',
        ];
        const isExtensionAllowed = file.originalname.match(/\.(pdf|txt|md|json)$/i);
        if (allowedMimeTypes.includes(file.mimetype) || isExtensionAllowed) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file format (${file.mimetype}). Only PDF, TXT, MD and JSON are supported.`));
        }
    },
});
//# sourceMappingURL=upload.middleware.js.map