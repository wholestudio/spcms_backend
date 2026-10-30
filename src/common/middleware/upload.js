import multer from 'multer';
import { BadRequestError } from '../errors/app-error.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(
      new BadRequestError(
        `Unsupported file type "${file.mimetype}". Only JPEG, PNG, and WebP images are allowed.`,
      ),
    );
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

/**
 * Run multer and map Multer-specific errors to BadRequestError.
 * @param {import('multer').Multer} middleware
 */
function wrapMulter(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof BadRequestError) {
        next(err);
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new BadRequestError('File too large. Maximum size is 10MB.'));
          return;
        }

        next(new BadRequestError(`Upload failed: ${err.message}`));
        return;
      }

      next(err);
    });
  };
}

export const uploadSingle = wrapMulter(upload.single('file'));

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES };
export default upload;
