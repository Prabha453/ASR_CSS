// backend/config/storage.js
require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');

// ─── Storage Type ──────────────────────────────────────────────────────────────
// 0 = local server  |  1 = AWS S3  (matches document_store.storage_type column)
const STORAGE_TYPE = parseInt(process.env.STORAGE_TYPE ?? '0', 10);

// ─── S3 Client (only initialised when needed) ──────────────────────────────────
let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

// ─── Shared Constants ──────────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES =
  parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10) * 1024 * 1024;

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES ||
  'application/pdf,image/jpeg,image/png,image/gif,image/webp,' +
  'application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
)
  .split(',')
  .map((t) => t.trim());

const PRESIGNED_URL_EXPIRY = parseInt(
  process.env.PRESIGNED_URL_EXPIRY || '3600',
  10
);

module.exports = {
  STORAGE_TYPE,
  getS3Client,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  PRESIGNED_URL_EXPIRY,
  AWS_BUCKET: process.env.AWS_BUCKET_NAME,
  AWS_REGION: process.env.AWS_REGION || 'ap-southeast-1',
  CDN_URL: process.env.AWS_CLOUDFRONT_URL || '',
  LOCAL_UPLOAD_DIR: process.env.LOCAL_UPLOAD_DIR || 'uploads',
  LOCAL_BASE_URL: process.env.LOCAL_BASE_URL || 'http://localhost:5000',
};