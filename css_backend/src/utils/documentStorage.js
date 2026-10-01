// backend/utils/storageUtil.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const {
  STORAGE_TYPE,
  getS3Client,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  PRESIGNED_URL_EXPIRY,
  AWS_BUCKET,
  AWS_REGION,
  CDN_URL,
  LOCAL_UPLOAD_DIR,
  LOCAL_BASE_URL,
} = require('../config/documentStorage');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a buffer
 */
const computeHash = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * Derive doc_type from extension
 */
const getDocType = (filename) => {
  const ext = path.extname(filename).slice(1).toLowerCase();
  return ext || null;
};

/**
 * Generate a UUID-based stored filename preserving the original extension
 */
const buildStoredFilename = (originalName) => {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
};

/**
 * Ensure local upload directory exists
 */
const ensureLocalDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// ─── Validation ────────────────────────────────────────────────────────────────

const validateFile = (file) => {
  const errors = [];

  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(
      `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds limit of ${
        MAX_FILE_SIZE_BYTES / 1024 / 1024
      } MB`
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(
      `File type "${file.mimetype}" is not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  return errors;
};

// ─── Local Storage Operations ──────────────────────────────────────────────────

/**
 * Save file buffer to local disk
 * Returns { filePath, storedFileName }
 */
const saveToLocal = async (file, subFolder = 'upload') => {
  const uploadDir = path.join(process.cwd(), LOCAL_UPLOAD_DIR, subFolder);
  ensureLocalDir(uploadDir);

  const storedFileName = buildStoredFilename(file.originalname);
  const absolutePath = path.join(uploadDir, storedFileName);
  const relativePath = path.join(LOCAL_UPLOAD_DIR, subFolder, storedFileName);

  await fs.promises.writeFile(absolutePath, file.buffer);

  return {
    storedFileName,
    filePath: getLocalFileUrl(relativePath), // stored in DB
    absolutePath,
  };
};

/**
 * Delete a file from local disk
 */

const deleteFromLocal = async (filePath) => {

  if (!filePath) return;

  // convert url to relative path
  let relativePath = filePath;

  if (filePath.startsWith('http')) {
    const url = new URL(filePath);
    relativePath = url.pathname; 
    // /uploads/company_logo/file.png
  }

  // remove starting slash
  relativePath = relativePath.replace(/^\/+/, '');
  // build absolute path
  const absolutePath = path.join(process.cwd(), relativePath);
  console.log('Deleting file:', absolutePath);
  if (fs.existsSync(absolutePath)) {
    await fs.promises.unlink(absolutePath);
    console.log('File deleted successfully');
  } else {
    console.log('File not found');
  }
};

/**
 * Build a public URL for a local file
 */
const getLocalFileUrl = (filePath) =>
  `${LOCAL_BASE_URL}/${filePath.replace(/\\/g, '/')}`;

// ─── S3 Operations ─────────────────────────────────────────────────────────────

/**
 * Upload file buffer to S3
 * Returns { storedFileName, filePath (S3 key), cdnUrl }
 */
const saveToS3 = async (file, clientFolder = 'default', subFolder = 'upload') => {
  const s3 = getS3Client();
  const storedFileName = buildStoredFilename(file.originalname);
  const s3Key = `${clientFolder}/${subFolder}/${storedFileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      StorageClass: 'STANDARD',
      // ACL: 'public-read',  // uncomment if bucket allows public-read
    })
  );

  const cdnUrl = CDN_URL
    ? `${CDN_URL}/${s3Key}`
    : `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

  return {
    storedFileName,
    filePath: s3Key, // stored in DB as S3 object key
    cdnUrl,
  };
};

/**
 * Delete an S3 object
 */
const deleteFromS3 = async (s3Key) => {
  const s3 = getS3Client();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: AWS_BUCKET,
      Key: s3Key,
    })
  );
};

/**
 * Generate a presigned GET URL for a private S3 object
 */
const getPresignedUrl = async (s3Key, expiresIn = PRESIGNED_URL_EXPIRY) => {
  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: AWS_BUCKET,
    Key: s3Key,
  });
  return getSignedUrl(s3, command, { expiresIn });
};

/**
 * Check if an S3 object exists
 */
const s3ObjectExists = async (s3Key) => {
  const s3 = getS3Client();
  try {
    await s3.send(new HeadObjectCommand({ Bucket: AWS_BUCKET, Key: s3Key }));
    return true;
  } catch {
    return false;
  }
};

// ─── Unified Upload ────────────────────────────────────────────────────────────

/**
 * Upload a multer memory-storage file to the configured storage backend.
 *
 * @param {Express.Multer.File} file  - multer file object (buffer storage)
 * @param {object}              opts
 * @param {string}  opts.clientFolder - S3 client namespace (ignored for local)
 * @param {string}  opts.subFolder    - sub-directory / S3 prefix  (default: 'upload')
 * @param {number}  [opts.storageTypeOverride] - force 0 or 1 regardless of env
 *
 * @returns {object} metadata ready to insert into document_store
 */
const uploadFile = async (file, opts = {}) => {
  const validationErrors = validateFile(file);
  if (validationErrors.length) {
    const err = new Error(validationErrors.join('; '));
    err.statusCode = 400;
    throw err;
  }

  const storageType =
    opts.storageTypeOverride !== undefined
      ? opts.storageTypeOverride
      : STORAGE_TYPE;

  const subFolder = opts.subFolder || 'upload';
  const hash = computeHash(file.buffer);
  const fileSizeKb = Math.ceil(file.size / 1024);
  const docType = getDocType(file.originalname);

  let storedFileName, filePath, bucketName, s3Region, cdnUrl;

  if (storageType === 1) {
    // ── S3 ──────────────────────────────────────────────────────────────────
    const clientFolder = opts.clientFolder || 'default';
    const result = await saveToS3(file, clientFolder, subFolder);
    storedFileName = result.storedFileName;
    filePath = result.filePath;
    bucketName = AWS_BUCKET;
    s3Region = AWS_REGION;
    cdnUrl = result.cdnUrl;
  } else {
    // ── Local ────────────────────────────────────────────────────────────────
    const result = await saveToLocal(file, subFolder);
    storedFileName = result.storedFileName;
    filePath = result.filePath;
    bucketName = null;
    s3Region = null;
    cdnUrl = null;
  }

  return {
    original_file_name: file.originalname,
    stored_file_name: storedFileName,
    doc_name: opts.docName || file.originalname,
    doc_type: docType,
    mime_type: file.mimetype,
    file_size_kb: fileSizeKb,
    file_hash: hash,
    storage_type: storageType,
    file_path: filePath,
    bucket_name: bucketName,
    s3_region: s3Region,
    cdn_url: cdnUrl,
    upload_status: 'completed',
  };
};

// ─── Unified Delete ────────────────────────────────────────────────────────────

/**
 * Delete the physical file from whichever storage backend it lives on.
 */
const deleteFile = async (doc) => {
  if (doc.storage_type === 1) {
    await deleteFromS3(doc.file_path);
  } else {
    await deleteFromLocal(doc.file_path);
  }
};

// ─── Unified Access URL ────────────────────────────────────────────────────────

/**
 * Get a usable URL for a document.
 * - Local:  permanent public URL
 * - S3 CDN: permanent CDN URL (if configured)
 * - S3 no CDN: fresh presigned URL
 *
 * Returns { url, presigned_expires_at }
 */
const getFileAccessUrl = async (doc) => {
  if (doc.storage_type === 0) {
    return {
      url: getLocalFileUrl(doc.file_path),
      presigned_expires_at: null,
    };
  }

  // S3 with CDN → permanent URL
  if (doc.cdn_url && CDN_URL) {
    return {
      url: doc.cdn_url,
      presigned_expires_at: null,
    };
  }

  // S3 without CDN → presigned
  const url = await getPresignedUrl(doc.file_path);
  const presigned_expires_at = new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000);
  return { url, presigned_expires_at };
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileAccessUrl,
  validateFile,
  computeHash,
  getDocType,
  buildStoredFilename,
  // expose individual backends for direct use if needed
  saveToLocal,
  saveToS3,
  deleteFromLocal,
  deleteFromS3,
  getPresignedUrl,
  s3ObjectExists,
};