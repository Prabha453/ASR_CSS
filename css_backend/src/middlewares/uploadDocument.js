// backend/middlewares/uploadMiddleware.js
const multer = require('multer');
const { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } = require('../config/documentStorage');

/**
 * Use memory storage so we can:
 *  1. Compute SHA-256 hash before writing
 *  2. Route to local disk OR S3 from the same code path
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${file.mimetype}" not allowed. ` +
          `Permitted: ${ALLOWED_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// ─── Single file upload ────────────────────────────────────────────────────────
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('file');

// ─── Multiple files upload (up to 10) ─────────────────────────────────────────
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).array('files', 10);

// ─── Promise wrappers ──────────────────────────────────────────────────────────
const handleSingleUpload = (req, res) =>
  new Promise((resolve, reject) => {
    uploadSingle(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

const handleMultipleUpload = (req, res) =>
  new Promise((resolve, reject) => {
    uploadMultiple(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// single or multiple any field names
const uploadAny = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).any();

const handleAnyUpload = (req, res) =>
  new Promise((resolve, reject) => {

    uploadAny(req, res, (err) => {

      if (err) reject(err);
      else resolve();

    });

  });


// ─── Error handling wrapper ────────────────────────────────────────────────────
const multerErrorHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${
          MAX_FILE_SIZE_BYTES / 1024 / 1024
        } MB`,
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = {
  handleSingleUpload,
  handleMultipleUpload,
  multerErrorHandler,
  handleAnyUpload,
};