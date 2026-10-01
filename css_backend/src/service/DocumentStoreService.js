'use strict';

const httpStatus = require('http-status');
const { Op } = require('sequelize');

const responseHandler = require('../helper/responseHandler');
const logger = require('../config/logger');
const config = require('../config/config');
const { getCurrentModels, getSequelizeForDb } = require('../models');
const DocumentStoreDao = require('../dao/DocumentStoreDao');
const { uploadDocument, removeDocument } = require('../helper/documentHelper');
const {
    handleSingleUpload,
    handleMultipleUpload,
} = require('../middlewares/uploadDocument');

const toInt = (value, fallback = null) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const clean = (value) => (
    value === undefined || value === null ? '' : String(value).trim()
);

class DocumentStoreService {

    constructor() {
        this.documentStoreDao = new DocumentStoreDao();
    }

    _userId(req = {}) {
        return req.user?.user_id || req.user?.id || req.body?.user_id || null;
    }

    _portName(req = {}) {
        return clean(
            req.body?.port_name ||
            req.query?.port_name ||
            req.user?.portName ||
            req.user?.port_name
        ) || null;
    }

    _portNumber(req = {}) {
        return toInt(
            req.body?.port_number ||
            req.query?.port_number ||
            req.user?.port_number,
            null
        );
    }

    async _resolvePort(req = {}) {
        const directPortNumber = this._portNumber(req);
        const directPortName = this._portName(req);

        if (directPortNumber && directPortName) {
            return { port_number: directPortNumber, port_name: directPortName };
        }

        if (!directPortName) {
            return { port_number: directPortNumber, port_name: directPortName };
        }

        const db = await getSequelizeForDb(config.portDbName);
        const [rows] = await db.sequelize.query(
            'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
            { replacements: [directPortName] }
        );

        if (!rows || !rows.length) {
            throw new Error(`Port not found for port_name "${directPortName}"`);
        }

        return {
            port_number: rows[0].port_number,
            port_name: rows[0].port_db,
        };
    }

    async _portScopedWhere(req = {}) {
        const resolved = await this._resolvePort(req);
        if (!resolved.port_number) {
            throw new Error('port_name or port_number is required for document access');
        }
        return { port_number: resolved.port_number };
    }

    _documentPayload(req = {}, file = null) {
        const body = req.body || {};
        const entityId = toInt(body.entity_id || body.module_record_id, 0);
        const entityType = clean(body.entity_type) || 'company';
        const moduleName = clean(body.module_name) || null;
        const subModuleName = clean(body.sub_module_name) || null;
        const moduleRecordId = toInt(body.module_record_id, entityId || null);
        const docCategory = clean(body.doc_category) || clean(body.doc_type) || 'general';

        return {
            entity_id: entityId,
            entity_type: entityType,
            module_name: moduleName,
            sub_module_name: subModuleName,
            module_record_id: moduleRecordId,
            company_event_id: toInt(body.company_event_id, null),
            doc_category: docCategory,
            doc_name: clean(body.doc_name) || file?.originalname || 'Document',
            sub_folder: clean(body.sub_folder) ||
                [moduleName || 'documents', docCategory].filter(Boolean).join('/'),
            replace_existing: ['1', 'true', true].includes(body.replace_existing),
            delete_old_file: ['1', 'true', true].includes(body.delete_old_file),
            description: clean(body.description) || null,
            remarks: clean(body.remarks) || null,
        };
    }

    _serialize(doc) {
        const row = doc?.toJSON ? doc.toJSON() : doc;
        if (!row) return null;
        return {
            ...row,
            url: row.cdn_url || row.file_path || '',
        };
    }

    async _nextDocumentForSameSlot(doc) {
        const row = doc?.toJSON ? doc.toJSON() : doc;
        if (!row) return null;

        return this.documentStoreDao.findOneByWhere(
            {
                doc_id: { [Op.ne]: row.doc_id },
                is_deleted: false,
                ...(row.port_number ? { port_number: row.port_number } : {}),
                entity_id: row.entity_id,
                entity_type: row.entity_type,
                module_name: row.module_name,
                sub_module_name: row.sub_module_name,
                module_record_id: row.module_record_id,
                doc_category: row.doc_category,
            },
            null,
            ['doc_id', 'DESC']
        );
    }

    async _cleanupModuleMirrorFields(doc) {
        const row = doc?.toJSON ? doc.toJSON() : doc;
        if (!row) return;

        const models = getCurrentModels();
        const nextDoc = await this._nextDocumentForSameSlot(row);
        const nextUrl = nextDoc?.file_path || nextDoc?.cdn_url || null;
        const nextName = nextDoc?.doc_name || nextDoc?.original_file_name || null;

        if (
            row.entity_type === 'individual' &&
            row.module_name === 'individual' &&
            row.sub_module_name === 'id_document' &&
            row.module_record_id &&
            models.entity_identification
        ) {
            await models.entity_identification.update(
                {
                    document_url: nextUrl,
                    document_name: nextName,
                    updated_date: new Date(),
                },
                {
                    where: {
                        identification_id: row.module_record_id,
                        entity_id: row.entity_id,
                        is_deleted: false,
                    },
                }
            );
        }

        if (
            row.entity_type === 'company' &&
            row.module_name === 'company' &&
            row.sub_module_name &&
            row.sub_module_name.startsWith('proof_') &&
            row.module_record_id &&
            models.entity_address
        ) {
            await models.entity_address.update(
                {
                    proof_of_address_url: nextUrl,
                    proof_of_address_name: nextName,
                    updated_date: new Date(),
                },
                {
                    where: {
                        address_id: row.module_record_id,
                        entity_id: row.entity_id,
                        is_deleted: false,
                    },
                }
            );
        }

        const companyProfileImageMap = {
            cp_company_logo: 'cp_company_logo_url',
            cp_port_logo: 'cp_port_logo_url',
            cp_port_fav_icon: 'cp_port_fav_icon_url',
            cp_login_bg_image: 'cp_login_bg_image_url',
        };

        const profileColumn = companyProfileImageMap[row.sub_module_name];
        if (
            row.module_name === 'company_profile' &&
            profileColumn &&
            row.module_record_id &&
            models.company_profile
        ) {
            await models.company_profile.update(
                { [profileColumn]: nextUrl || '', updated_date: new Date() },
                { where: { cp_id: row.module_record_id } }
            );
        }
    }

    uploadDocument = async (req) => {
        try {
            await handleSingleUpload(req);

            if (!req.file) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'No file uploaded');
            }

            const resolvedPort = await this._resolvePort(req);
            if (!resolvedPort.port_number || !resolvedPort.port_name) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'port_name or port_number is required'
                );
            }

            const payload = this._documentPayload(req, req.file);
            const doc = await uploadDocument({
                file: req.file,
                userId: this._userId(req),
                port_number: resolvedPort.port_number,
                port_name: resolvedPort.port_name,
                ...payload,
                existing_where: {
                    entity_id: payload.entity_id,
                    entity_type: payload.entity_type,
                    module_name: payload.module_name,
                    sub_module_name: payload.sub_module_name,
                    module_record_id: payload.module_record_id,
                    doc_category: payload.doc_category,
                },
                req,
            });

            if (payload.description || payload.remarks) {
                await this.documentStoreDao.updateWhere(
                    { description: payload.description, remarks: payload.remarks },
                    { doc_id: doc.doc_id }
                );
            }

            const freshDoc = await this.documentStoreDao.findById(doc.doc_id, 'doc_id');

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Document uploaded successfully',
                this._serialize(freshDoc || doc)
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error uploading document'
            );
        }
    };

    uploadMultipleDocuments = async (req) => {
        try {
            await handleMultipleUpload(req);

            if (!Array.isArray(req.files) || req.files.length === 0) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'No files uploaded');
            }

            const resolvedPort = await this._resolvePort(req);
            if (!resolvedPort.port_number || !resolvedPort.port_name) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'port_name or port_number is required'
                );
            }

            const uploaded = [];
            for (const file of req.files) {
                const payload = this._documentPayload(req, file);
                const doc = await uploadDocument({
                    file,
                    userId: this._userId(req),
                    port_number: resolvedPort.port_number,
                    port_name: resolvedPort.port_name,
                    ...payload,
                    req,
                });

                if (payload.description || payload.remarks) {
                    await this.documentStoreDao.updateWhere(
                        { description: payload.description, remarks: payload.remarks },
                        { doc_id: doc.doc_id }
                    );
                }

                uploaded.push(this._serialize(doc));
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Documents uploaded successfully',
                uploaded
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error uploading documents'
            );
        }
    };

    documentList = async (req) => {
        try {
            const query = req.query || {};
            const where = {
                ...(await this._portScopedWhere(req)),
                is_deleted: false,
            };

            [
                'entity_id',
                'entity_type',
                'module_name',
                'sub_module_name',
                'module_record_id',
                'doc_category',
                'company_event_id',
                'template_category_id',
            ].forEach((field) => {
                if (query[field] !== undefined && query[field] !== '') where[field] = query[field];
            });

            if (query.search) {
                where[Op.or] = [
                    { doc_name: { [Op.like]: `%${query.search}%` } },
                    { original_file_name: { [Op.like]: `%${query.search}%` } },
                    { doc_category: { [Op.like]: `%${query.search}%` } },
                ];
            }

            const page = Math.max(toInt(query.page, 1), 1);
            const limit = Math.min(Math.max(toInt(query.limit, 25), 1), 200);
            const offset = (page - 1) * limit;
            const rows = await this.documentStoreDao.Model.findAndCountAll({
                where,
                limit,
                offset,
                order: [['doc_id', 'DESC']],
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Documents fetched successfully', {
                totalItems: rows.count,
                data: rows.rows.map(row => this._serialize(row)),
                totalPages: Math.ceil(rows.count / limit),
                currentPage: page,
            });
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching documents'
            );
        }
    };

    getDocument = async (id, req) => {
        try {
            const doc = await this.documentStoreDao.findOneByWhere({
                doc_id: id,
                is_deleted: false,
                ...(await this._portScopedWhere(req)),
            });

            if (!doc) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Document not found');
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Document fetched successfully',
                this._serialize(doc)
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching document'
            );
        }
    };

    getDocumentUrl = async (id, req) => {
        const response = await this.getDocument(id, req);
        if (!response.response.status) return response;
        return responseHandler.returnSuccess(httpStatus.OK, 'Document URL fetched successfully', {
            doc_id: response.response.data.doc_id,
            url: response.response.data.url,
        });
    };

    updateDocument = async (id, data, user, req = {}) => {
        try {
            const fakeReq = { ...req, query: req.query || {}, body: data || {}, user };
            const where = {
                doc_id: id,
                is_deleted: false,
                ...(await this._portScopedWhere(fakeReq)),
            };

            const doc = await this.documentStoreDao.findOneByWhere(where);
            if (!doc) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Document not found');
            }

            const allowed = {};
            ['doc_name', 'doc_category', 'description', 'remarks', 'doc_date', 'expiry_date', 'tags', 'is_confidential', 'access_level']
                .forEach((field) => {
                    if (data[field] !== undefined) allowed[field] = data[field];
                });

            allowed.updated_by = user?.user_id || user?.id || null;
            await this.documentStoreDao.updateWhere(allowed, { doc_id: id });

            const updated = await this.documentStoreDao.findById(id, 'doc_id');
            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Document updated successfully',
                this._serialize(updated)
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating document'
            );
        }
    };

    deleteDocument = async (id, query = {}, user = {}, req = {}) => {
        try {
            const fakeReq = { ...req, query, body: {}, user };
            const where = {
                doc_id: id,
                is_deleted: false,
                ...(await this._portScopedWhere(fakeReq)),
            };

            const doc = await this.documentStoreDao.findOneByWhere(where);
            if (!doc) {
                return responseHandler.returnError(
                    httpStatus.NOT_FOUND,
                    'Document not found or does not belong to this port'
                );
            }

            const hardDelete = !['0', 'false', false].includes(query.hard_delete);
            await this._cleanupModuleMirrorFields(doc);
            await removeDocument({
                doc_id: id,
                userId: user?.user_id || user?.id || null,
                port_number: doc.port_number,
                hard_delete: hardDelete,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Document deleted successfully',
                { doc_id: id }
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting document'
            );
        }
    };

    bulkDeleteDocuments = async (body = {}, user = {}, req = {}) => {
        try {
            const ids = Array.isArray(body.doc_ids) ? body.doc_ids : [];
            if (!ids.length) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'doc_ids is required');
            }

            const fakeReq = { ...req, query: {}, body, user };
            const where = {
                doc_id: { [Op.in]: ids },
                is_deleted: false,
                ...(await this._portScopedWhere(fakeReq)),
            };

            const docs = await this.documentStoreDao.findByWhere(where);
            for (const doc of docs) {
                await this._cleanupModuleMirrorFields(doc);
                await removeDocument({
                    doc_id: doc.doc_id,
                    userId: user?.user_id || user?.id || null,
                    port_number: doc.port_number,
                    hard_delete: !['0', 'false', false].includes(body.hard_delete),
                });
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Documents deleted successfully',
                { deleted_count: docs.length }
            );
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting documents'
            );
        }
    };

    getStorageStats = async (req) => {
        try {
            const where = {
                ...(await this._portScopedWhere(req)),
                is_deleted: false,
            };

            const rows = await this.documentStoreDao.findByWhere(where);
            const totalSizeKb = rows.reduce((sum, row) => sum + (Number(row.file_size_kb) || 0), 0);
            const byCategory = rows.reduce((acc, row) => {
                const key = row.doc_category || 'general';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            return responseHandler.returnSuccess(httpStatus.OK, 'Document stats fetched successfully', {
                total_documents: rows.length,
                total_size_kb: totalSizeKb,
                by_category: byCategory,
            });
        } catch (err) {
            logger.error(err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching document stats'
            );
        }
    };

}

module.exports = DocumentStoreService;
