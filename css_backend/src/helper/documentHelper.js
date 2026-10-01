'use strict';

const path   = require('path');
const fs     = require('fs');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// TODO: verify these two import paths against your project — they're needed
// by _resolvePort() to look up port_number/port_name from the `ports` table
// when neither is passed explicitly to uploadDocument().
const { getSequelizeForDb } = require('../models');
const config = require('../config/config');

const DocumentStoreDao = require('../dao/DocumentStoreDao');
const documentStoreDao = new DocumentStoreDao();

// ─────────────────────────────────────────────────────────────────────────────
// Config helpers
//
// APP_BASE_URL      — public base URL  e.g. "http://localhost:5000"
// APP_UPLOAD_PREFIX — URL prefix       e.g. "/uploads"
//
// UPLOAD BASE PATH is resolved DYNAMICALLY — no UPLOAD_BASE_PATH env needed.
// ─────────────────────────────────────────────────────────────────────────────

const getBaseUrl = (req) => {
    let url = ('http://localhost:5000').replace(/\/$/, '');
        if(req){
            url = `${req.protocol}://${req.get('host')}`;
        }
    return  url;
};

const getUploadDir = () => ('/uploads').replace(/\/$/, '');

// ─────────────────────────────────────────────────────────────────────────────
// _resolveUploadBase
//
// Walks candidate paths relative to __dirname and returns the first that
// already exists on disk.
//
// ✅ If NO candidate exists, the default path is CREATED automatically.
//
// Priority:
//   1. <project>/public/uploads   ← standard Express static
//   2. <project>/uploads          ← flat layout
//   3. <cwd>/public/uploads
//   4. <cwd>/uploads              ← auto-created if nothing else found
// ─────────────────────────────────────────────────────────────────────────────
const _resolveUploadBase = () => {
    const candidates = [
        path.resolve(__dirname, '..', '..', 'public', 'uploads'),
        path.resolve(__dirname, '..', 'public', 'uploads'),
        path.resolve(__dirname, '..', '..', 'uploads'),
        path.resolve(__dirname, '..', 'uploads'),
        path.join(process.cwd(), 'public', 'uploads'),
        path.join(process.cwd(), 'uploads'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            logger.info(`[documentHelper] Upload base resolved → ${candidate}`);
            return candidate;
        }
    }

    // ✅ Nothing found — create <cwd>/uploads automatically
    const defaultBase = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(defaultBase, { recursive: true });
    logger.info(`[documentHelper] Upload base created  → ${defaultBase}`);
    return defaultBase;
};

// Resolved once per process lifetime
let _uploadBaseCache = null;
const getUploadBase = () => {
    if (!_uploadBaseCache) _uploadBaseCache = _resolveUploadBase();
    return _uploadBaseCache;
};

// ─────────────────────────────────────────────────────────────────────────────
// _ensureDir
//
// ✅ Creates a directory (and all parents) if it does not exist.
// Called before every file write so uploads never fail due to missing folders.
// ─────────────────────────────────────────────────────────────────────────────
const _ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`[documentHelper] Created dir: ${dirPath}`);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// _moveFile
//
// Replaces bare fs.renameSync.
// On Windows, multer temp dir and project dir can be on different logical
// devices → renameSync throws EXDEV.  Fall back to copy + delete.
// ─────────────────────────────────────────────────────────────────────────────
const _moveFile = (src, dest) => {
    try {
        fs.renameSync(src, dest);
    } catch (err) {
        if (err.code === 'EXDEV' || err.code === 'EPERM') {
            fs.copyFileSync(src, dest);
            try { fs.unlinkSync(src); } catch (_) { /* best-effort temp cleanup */ }
        } else {
            throw err;
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// _sanitizeFileName
//
// Handles the case where the browser sends the current image URL as the
// filename (e.g. "http://localhost:3000/settings" or the multer-encoded
// form "localhost_3000_settings_1780461294307").
//
// Steps:
//   1. Strip query string
//   2. If URL-like or path-like → extract the last path segment
//   3. Remove extension
//   4. Strip trailing numeric timestamp  (_1780461294307)
//   5. Replace unsafe chars, collapse underscores, trim, cap at 60 chars
//
// Returns ONLY the clean base name — WITHOUT extension.
// ─────────────────────────────────────────────────────────────────────────────
const _sanitizeFileName = (originalname, fieldname = 'file') => {
    if (!originalname || !originalname.trim()) return fieldname;

    let name = originalname.trim();

    // 1. Strip query string
    if (name.includes('?')) name = name.split('?')[0];

    // 2. Extract last segment from URL-like or path-like strings
    if (
        name.startsWith('http://') ||
        name.startsWith('https://') ||
        name.includes('/') ||
        name.includes('\\')
    ) {
        try {
            const url = new URL(name.startsWith('http') ? name : `http://x/${name}`);
            const seg = url.pathname.split('/').filter(Boolean).pop();
            if (seg) name = decodeURIComponent(seg);
        } catch {
            const parts = name.split(/[/\\]/).filter(Boolean);
            name = parts[parts.length - 1] || fieldname;
        }
    }

    // 3. Separate extension from base
    const ext      = path.extname(name).toLowerCase();
    const basePart = path.basename(name, ext);

    // 4. Strip trailing numeric timestamp e.g. "_1780461294307" (10+ digits)
    const deTimestamped = basePart.replace(/_\d{10,}$/, '');

    // 5. Sanitize
    const clean = deTimestamped
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 60);

    return clean || fieldname;
};

// ─────────────────────────────────────────────────────────────────────────────
// buildFileUrl
//
// "asr_css/company_profile/company_logo/logo.png"
// → "http://localhost:5000/uploads/asr_css/company_profile/company_logo/logo.png"
// ─────────────────────────────────────────────────────────────────────────────
const buildFileUrl = (relativePath, req) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }
    const rel = relativePath.replace(/^\//, '').replace(/\\/g, '/');
    return `${getBaseUrl(req)}${getUploadDir()}/${rel}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// extractRelativePath
//
// "http://localhost:5000/uploads/asr_css/company_profile/logo.png"
// → "asr_css/company_profile/logo.png"
// ─────────────────────────────────────────────────────────────────────────────
const extractRelativePath = (filePathOrUrl) => {
    if (!filePathOrUrl) return '';
    const uploadPrefix = getUploadDir();
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        try {
            const pathname = new URL(filePathOrUrl).pathname;
            return pathname.replace(uploadPrefix, '').replace(/^\//, '');
        } catch {
            return filePathOrUrl;
        }
    }
    return filePathOrUrl.replace(uploadPrefix, '').replace(/^\//, '');
};

// ─────────────────────────────────────────────────────────────────────────────
// _deletePhysicalFile — best-effort, never throws
// ─────────────────────────────────────────────────────────────────────────────
const _deletePhysicalFile = (filePathOrUrl, uploadBase) => {
    try {
        const relative = extractRelativePath(filePathOrUrl);
        if (!relative) return;
        const diskPath = path.join(uploadBase, relative);
        if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
            logger.info(`[documentHelper] Deleted physical file: ${diskPath}`);
        } else {
            logger.warn(`[documentHelper] Physical file not on disk: ${diskPath}`);
        }
    } catch (err) {
        logger.warn(`[documentHelper] Could not delete physical file: ${err.message}`);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// getPortFolder — validates portName and returns it as the folder name
// ─────────────────────────────────────────────────────────────────────────────
const getPortFolder = (portName) => {
    if (!portName) throw new Error('documentHelper: portName is required');
    return portName;
};

// ─────────────────────────────────────────────────────────────────────────────
// _resolvePort
//
// Looks up { port_number, port_name } from the `ports` table by port_db
// (i.e. by port_name) when the caller didn't supply port_number/port_name
// directly. Used as the fallback path in uploadDocument() below.
// ─────────────────────────────────────────────────────────────────────────────
const _resolvePort = async (portName) => {
    if (!portName) throw new Error('_resolvePort: portName is required');
    try {
        const db = await getSequelizeForDb(config.portDbName);
        const [results] = await db.sequelize.query(
            'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
            { replacements: [portName] }
        );
        if (!results || results.length === 0) {
            throw new Error(`Port not found for portName: "${portName}"`);
        }
        return { port_number: results[0].port_number, port_name: results[0].port_db };
    } catch (err) {
        logger.error(`[_resolvePort] portName="${portName}":`, err.message);
        throw err;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// uploadDocument
//
// Required params:
//   file          — multer file object (.path from diskStorage or .buffer from memoryStorage)
//   port_number   — number — stored in document_store.port_number for scoped queries
//   port_name     — string — used as top-level folder name  e.g. "asr_css_new"
//
// ✅ If BOTH port_number and port_name are omitted, and a `req` is passed,
//    the port is resolved from `req.body.port_name` via _resolvePort().
//
// ✅ Any missing sub-folder in the path is created automatically.
//
// Disk path:
//   <uploadBase> / asr_css_new / company_profile / company_logo / logo_1234567890.png
//
// Stored URL:
//   http://localhost:5000/uploads/asr_css_new/company_profile/company_logo/logo_1234567890.png
// ─────────────────────────────────────────────────────────────────────────────
const uploadDocument = async ({
    file,
    userId           = null,
    port_number      = null,
    port_name        = null,
    entity_id        = 0,
    entity_type      = 'company',
    module_name,
    sub_module_name,
    module_record_id,
    company_event_id = null,
    doc_category,
    doc_name,
    sub_folder       = '',
    replace_existing = false,
    delete_old_file  = false,
    existing_where   = {},
    req = null
}) => {
    try {
        let resolvedPortNumber = port_number;
        let resolvedPortName   = port_name;

        // ── Fallback: neither port_number nor port_name was passed explicitly —
        //    look up req.body.port_name and resolve both from the `ports` table ──
        if (!resolvedPortNumber && !resolvedPortName && req) {
            const bodyPortName = req?.body?.port_name || '';
            if (bodyPortName) {
                const resolved = await _resolvePort(bodyPortName);
                resolvedPortNumber = resolved.port_number;
                resolvedPortName   = resolved.port_name;
            }
        }

        // ── Validate ──────────────────────────────────────────────────────
        if (!resolvedPortNumber) throw new Error('uploadDocument: port_number is required');
        if (!resolvedPortName)   throw new Error('uploadDocument: port_name is required');
        if (!file)               throw new Error('uploadDocument: file object is required');

        const portFolder = getPortFolder(resolvedPortName);
        const uploadBase = getUploadBase();

        // ── 1. Build port-scoped target directory ─────────────────────────
        // ✅ _ensureDir creates every level of the path if it doesn't exist
        const targetDir = sub_folder
            ? path.join(uploadBase, portFolder, sub_folder)
            : path.join(uploadBase, portFolder);

        _ensureDir(targetDir);  // ✅ always called — handles first-time and missing sub-folders

        // ── 2. Build clean unique filename ────────────────────────────────
        const ext        = path.extname(file.originalname || '').toLowerCase() || '.bin';
        const cleanBase  = _sanitizeFileName(file.originalname, sub_module_name || 'file');
        const timestamp  = Date.now();
        const storedName = `${cleanBase}_${timestamp}${ext}`;
        const destPath   = path.join(targetDir, storedName);

        logger.info(
            `[uploadDocument] originalname="${file.originalname}" ` +
            `→ cleanBase="${cleanBase}" → storedName="${storedName}"`
        );

        // ── 3. Write file to disk ─────────────────────────────────────────
        if (file.path) {
            if (!fs.existsSync(file.path)) {
                throw new Error(
                    `uploadDocument: multer temp file not found at "${file.path}"`
                );
            }
            _moveFile(file.path, destPath);
            logger.info(`[uploadDocument] Moved: "${file.path}" → "${destPath}"`);

        } else if (file.buffer) {
            fs.writeFileSync(destPath, file.buffer);
            logger.info(`[uploadDocument] Written buffer → "${destPath}"`);

        } else {
            throw new Error(
                'uploadDocument: file has neither .path nor .buffer. ' +
                'Configure multer with diskStorage or memoryStorage.'
            );
        }

        // ── Post-write sanity check ───────────────────────────────────────
        if (!fs.existsSync(destPath)) {
            throw new Error(
                `uploadDocument: file missing after write — expected at "${destPath}"`
            );
        }

        // ── 4. Build full public URL ──────────────────────────────────────
        const relativePath = sub_folder
            ? `${portFolder}/${sub_folder}/${storedName}`
            : `${portFolder}/${storedName}`;

        const fullUrl = buildFileUrl(relativePath.replace(/\\/g, '/'), req);

        // ── 5. Create new document_store row FIRST ─────────────────────────
        // The old record/file (step 6) is only touched once this succeeds,
        // so a failed insert here never leaves the slot with no active file.
        const docRow = await documentStoreDao.create({
            port_number:        resolvedPortNumber,
            entity_id,
            entity_type,
            module_name,
            sub_module_name,
            module_record_id,
            company_event_id,
            doc_category,
            original_file_name: file.originalname || storedName,
            stored_file_name:   storedName,
            doc_name:           doc_name || storedName,
            doc_type:           ext.replace('.', '').toUpperCase() || 'FILE',
            mime_type:          file.mimetype || null,
            file_size_kb:       file.size ? Math.ceil(file.size / 1024) : null,
            storage_type:       0,
            file_path:          fullUrl,
            cdn_url:            fullUrl,
            upload_status:      'completed',
            is_deleted:         false,
            created_by:         userId,
            updated_by:         userId,
        });

        logger.info(
            `[uploadDocument] ✅ port=${resolvedPortName}(${resolvedPortNumber}) ` +
            `"${sub_module_name}" → ${fullUrl} (doc_id=${docRow.doc_id})`
        );

        // ── 6. New row confirmed saved — now retire the old one ────────────
        if (replace_existing && Object.keys(existing_where).length > 0) {
            try {
                const oldDoc = await documentStoreDao.findOneByWhere({
                    ...existing_where,
                    port_number: resolvedPortNumber,
                    is_deleted: false,
                    doc_id: { [Op.ne]: docRow.doc_id },
                });

                if (oldDoc) {
                    if (delete_old_file && oldDoc.file_path) {
                        _deletePhysicalFile(oldDoc.file_path, uploadBase);
                    }
                    await documentStoreDao.updateWhere(
                        { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
                        { doc_id: oldDoc.doc_id }
                    );
                    logger.info(`[uploadDocument] Soft-deleted old doc_id=${oldDoc.doc_id}`);
                }
            } catch (err) {
                // The new file is already live — losing the old one is a
                // non-fatal cleanup failure, not an upload failure.
                logger.warn(`[uploadDocument] Could not retire old document: ${err.message}`);
            }
        }

        return docRow;

    } catch (err) {
        logger.error(`[uploadDocument] ❌ ${err.message}`);
        // Cleanup orphaned temp file on any failure
        if (file && file.path) {
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
        }
        throw err;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// removeDocument
//
// ✅ Always hard-deletes both the physical file AND the document_store row.
//
// Behaviour:
//   hard_delete: true  — delete physical file + destroyWhere (default for media)
//   hard_delete: false — soft-delete only (set is_deleted = true, keep file)
//
// Port ownership is verified before any delete is performed.
// ─────────────────────────────────────────────────────────────────────────────
const removeDocument = async ({
    doc_id,
    userId      = null,
    port_number     = null,
    hard_delete = true,   // ✅ default changed to true — always clean up media fully
}) => {
    try {
        const doc = await documentStoreDao.findOneByWhere({
            doc_id,
            is_deleted: false,
            ...(port_number ? { port_number } : {}),   // ✅ port ownership check
        });

        if (!doc) {
            logger.warn(
                `[removeDocument] doc_id=${doc_id} not found` +
                (port_number ? ` for port_number=${port_number}` : '')
            );
            return false;
        }

        if (hard_delete) {
            // ✅ Step 1 — delete physical file from disk
            _deletePhysicalFile(doc.file_path, getUploadBase());

            // ✅ Step 2 — hard-delete the document_store row (destroyWhere)
            await documentStoreDao.destroyWhere({ doc_id });

            logger.info(
                `[removeDocument] ✅ Hard-deleted: ` +
                `doc_id=${doc_id} port_number=${doc.port_number} file="${doc.file_path}"`
            );
        } else {
            // Soft-delete only — physical file kept, row marked deleted
            await documentStoreDao.updateWhere(
                { is_deleted: true, deleted_at: new Date(), deleted_by: userId },
                { doc_id }
            );
            logger.info(`[removeDocument] Soft-deleted doc_id=${doc_id}`);
        }

        return true;

    } catch (err) {
        logger.error(`[removeDocument] ❌ doc_id=${doc_id}: ${err.message}`);
        throw err;
    }
};

module.exports = {
    uploadDocument,
    removeDocument,
    buildFileUrl,
    extractRelativePath,
    getPortFolder,
    getUploadBase,
};