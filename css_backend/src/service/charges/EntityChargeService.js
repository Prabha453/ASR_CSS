'use strict';

const httpStatus = require('http-status');
const { Op }     = require('sequelize');

const responseHandler    = require('../../helper/responseHandler');
const logger             = require('../../config/logger');
const { uploadDocument } = require('../../helper/documentHelper');
const { getSequelizeForDb } = require('../../models');
const config             = require('../../config/config');

const EntityChargeDao        = require('../../dao/charges/EntityChargeDao');
const EntityChargeChargeeDao = require('../../dao/charges/EntityChargeChargeeDao');
const DocumentStoreDao       = require('../../dao/DocumentStoreDao');
const EntityDao              = require('../../dao/individual/EntityDao');

// ─────────────────────────────────────────────────────────────────────────────
// Record builders
// ─────────────────────────────────────────────────────────────────────────────

const buildChargeRecord = (body, userId) => ({
    company_id:                   body.company_id                   || null,
    charge_number:                body.charge_number                || null,
    registration_date:            body.registration_date            || null,
    lodgement_type:               body.lodgement_type               || null,
    instrument_executed_location: body.instrument_executed_location || null,
    charge_creation_date:         body.charge_creation_date         || null,
    instrument_option:            body.instrument_option            || null,
    instrument_description:       body.instrument_description       || null,
    instrument_date:              body.instrument_date              || null,
    instrument_executed_presence: body.instrument_executed_presence || null,
    property_description:         body.property_description         || null,
    restrictions_prohibitions:    body.restrictions_prohibitions    || null,
    salient_covenants:            body.salient_covenants            || null,
    statement_lodged_behalf_of:   body.statement_lodged_behalf_of   || null,
    type_of_charge:               body.type_of_charge               || null,
    satisfaction_date:            body.satisfaction_date            || null,
    nature_of_satisfaction:       body.nature_of_satisfaction       || null,
    remarks:                      body.remarks                      || null,
    updated_by:                   userId                            || null,
    updated_date:                 new Date(),
});

const buildChargeeRecord = (c) => ({
    chargee_type:                   c.chargee_type                   || null,
    chargee_company_entity_id:      c.chargee_company_entity_id      || null,
    chargee_individual_entity_id:   c.chargee_individual_entity_id   || null,
    chargee_secures_all_monies:     c.chargee_secures_all_monies     || null,
    chargee_currency:               c.chargee_currency               || null,
    chargee_amount_secured:         c.chargee_amount_secured         || null,
    is_deleted:                     false,
});

const toChargeResponse = (d, companyName = '') => ({
    charge_id:                    d.charge_id,
    company_id:                   String(d.company_id || ''),
    company_name:                 companyName || d.company_name || '',
    charge_number:                d.charge_number                || '',
    registration_date:            d.registration_date            || '',
    lodgement_type:               d.lodgement_type               || '',
    instrument_executed_location: d.instrument_executed_location || '',
    charge_creation_date:         d.charge_creation_date         || '',
    instrument_option:            d.instrument_option            || '',
    instrument_description:       d.instrument_description       || '',
    instrument_date:              d.instrument_date              || '',
    instrument_executed_presence: d.instrument_executed_presence || '',
    property_description:         d.property_description         || '',
    restrictions_prohibitions:    d.restrictions_prohibitions    || '',
    salient_covenants:            d.salient_covenants            || '',
    statement_lodged_behalf_of:   d.statement_lodged_behalf_of   || '',
    type_of_charge:               d.type_of_charge               || '',
    satisfaction_date:            d.satisfaction_date            || '',
    nature_of_satisfaction:       d.nature_of_satisfaction       || '',
    remarks:                      d.remarks                      || '',
    is_deleted:                   d.is_deleted,
    created_date:                 d.created_date,
    created_by:                   d.created_by,
    updated_date:                 d.updated_date,
    updated_by:                   d.updated_by,
});

const toChargeeResponse = (c, entityMap = {}) => {
    let entityId = null;
    if (c.chargee_type === '1') {
        entityId = c.chargee_company_entity_id;
    } else if (c.chargee_type === '2') {
        entityId = c.chargee_individual_entity_id;
    }
    
    const entityName = entityId && entityMap[entityId] 
        ? entityMap[entityId] 
        : c.chargee_name || '';
    
    return {
        chargee_id:                     c.chargee_id,
        chargee_type:                   c.chargee_type                   || '',
        chargee_company_entity_id:      c.chargee_company_entity_id      || '',
        chargee_individual_entity_id:   c.chargee_individual_entity_id   || '',
        chargee_secures_all_monies:     c.chargee_secures_all_monies     || '',
        chargee_currency:               c.chargee_currency               || '',
        chargee_amount_secured:         c.chargee_amount_secured != null ? String(c.chargee_amount_secured) : '',
        chargee_name:                   entityName,
    };
};

const toDocResponse = (d) => ({
    doc_id:          d.doc_id,
    sub_module_name: d.sub_module_name,
    doc_name:        d.doc_name,
    file_name:       d.doc_name,
    file_path:       d.cdn_url || d.file_path || null,
    document_url:    d.cdn_url || d.file_path || null,
    document_size:   d.file_size || null,
    created_at:      d.created_at,
});

// ─────────────────────────────────────────────────────────────────────────────

class EntityChargeService {

    constructor() {
        this.chargeDao   = new EntityChargeDao();
        this.chargeeDao  = new EntityChargeChargeeDao();
        this.documentDao = new DocumentStoreDao();
        this.entityDao   = new EntityDao();
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    _row = (instance) => (instance?.toJSON ? instance.toJSON() : instance);

    async _checkExists(id) {
        return this.chargeDao.findOneByWhere({ charge_id: id, is_deleted: false });
    }

    async _resolvePort(portName) {
        if (!portName) throw new Error('portName is required');
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
            logger.error(`[EntityChargeService._resolvePort] portName="${portName}":`, err.message);
            throw err;
        }
    }

    async _getDocs(chargeId) {
        try {
            const docs = await this.documentDao.findByWhere({
                module_record_id: chargeId,
                entity_type:      'charge',
                module_name:      'entity_charges',
                sub_module_name:  'charge_document',
                is_deleted:       false,
            });
            return (docs || []).map(d => toDocResponse(this._row(d)));
        } catch (err) {
            logger.error(`[EntityChargeService._getDocs] charge_id=${chargeId}:`, err.message);
            return [];
        }
    }

    async _getEntityNames(entityIds) {
        if (!entityIds || !entityIds.length) return {};
        try {
            const entities = await this.entityDao.findByWhere({
                entity_id: { [Op.in]: entityIds },
                is_deleted: false,
            });
            const map = {};
            (entities || []).forEach(e => {
                const row = this._row(e);
                map[row.entity_id] = row.name || `Entity ${row.entity_id}`;
            });
            return map;
        } catch (err) {
            logger.error('[EntityChargeService._getEntityNames]', err.message);
            return {};
        }
    }

    async _uploadChargeDocument(file, chargeId, userId, portId, portName, req = null) {
        try {
            const doc = await uploadDocument({
                file,
                userId,
                port_number:      portId   || null,
                port_name:        portName || null,
                entity_id:        chargeId,
                entity_type:      'charge',
                module_name:      'entity_charges',
                sub_module_name:  'charge_document',
                module_record_id: chargeId,
                doc_category:     'charge_document',
                doc_name:         file.originalname || file.fieldname,
                sub_folder:       `entity_charges/charge_document/${chargeId}`,
                replace_existing: false,
                delete_old_file:  false,
                req,
            });
            return doc || null;
        } catch (err) {
            logger.error(`[EntityChargeService._uploadChargeDocument] charge_id=${chargeId} file=${file.originalname}:`, err.message);
            return null;
        }
    }

    async _processFiles(files = [], chargeId, userId, portId, portName, req) {
        const chargeFiles = files.filter(f =>
            (f.fieldname || '').replace(/\[\]$/, '') === 'charge_document'
        );
        for (const file of chargeFiles) {
            await this._uploadChargeDocument(file, chargeId, userId, portId, portName, req);
        }
    }

    /**
 * Replace chargees for a charge - update existing ones, soft-delete removed ones,
 * and create new ones.
 * 
 * This method handles:
 * 1. Existing chargees (with chargee_id) - UPDATE them
 * 2. New chargees (without chargee_id) - CREATE them
 * 3. Removed chargees - SOFT DELETE them
 */
    async _replaceChargees(chargeId, chargeesPayload = []) {
        // 1. Get existing chargees
        const existingChargees = await this.chargeeDao.findByWhere({
            charge_id: chargeId,
            is_deleted: false
        });
        
        // 2. Create maps for easy lookup
        const existingMap = {};
        existingChargees.forEach(c => {
            const row = this._row(c);
            existingMap[row.chargee_id] = row;
        });
        
        // 3. Track which existing chargee IDs are still present in the payload
        const keptChargeeIds = new Set();
        const now = new Date();
        const newChargees = [];
        
        // 4. Process each chargee from the payload
        for (const payload of chargeesPayload) {
            // Check if this chargee has an ID (existing record)
            if (payload.chargee_id) {
                // This is an existing chargee - update it
                const existing = existingMap[payload.chargee_id];
                if (existing) {
                    // Update the existing record
                    await this.chargeeDao.updateWhere(
                        {
                            ...buildChargeeRecord(payload),
                            updated_date: now,
                            is_deleted: false,
                        },
                        { chargee_id: payload.chargee_id }
                    );
                    keptChargeeIds.add(payload.chargee_id);
                } else {
                    // ID exists but not found - create as new (should not happen normally)
                    // But we'll still create it with a new ID
                    newChargees.push({
                        ...buildChargeeRecord(payload),
                        charge_id: chargeId,
                        created_date: now,
                        updated_date: now,
                        // Remove chargee_id so it gets a new one
                        chargee_id: undefined,
                    });
                }
            } else {
                // This is a new chargee (no ID) - create it
                newChargees.push({
                    ...buildChargeeRecord(payload),
                    charge_id: chargeId,
                    created_date: now,
                    updated_date: now,
                });
            }
        }
        
        // 5. Soft-delete chargees that are no longer in the payload
        const deletedChargeeIds = [];
        for (const [id, existing] of Object.entries(existingMap)) {
            if (!keptChargeeIds.has(Number(id))) {
                deletedChargeeIds.push(Number(id));
            }
        }
        
        if (deletedChargeeIds.length > 0) {
            await this.chargeeDao.updateWhere(
                { is_deleted: true, updated_date: now },
                { chargee_id: { [Op.in]: deletedChargeeIds } }
            );
        }
        
        // 6. Bulk create new chargees
        if (newChargees.length > 0) {
            await this.chargeeDao.bulkCreate(newChargees);
        }
        
        logger.info(`[_replaceChargees] Charge ${chargeId}: ${existingChargees.length} existing, ${keptChargeeIds.size} kept, ${deletedChargeeIds.length} deleted, ${newChargees.length} created`);
    }

    /** Fetch charge + chargees + docs and return a shaped success response */
    _buildDetailResponse = async (chargeId, message) => {
        const [data, chargees, documents] = await Promise.all([
            this._checkExists(chargeId),
            this.chargeeDao.findByWhere({ charge_id: chargeId, is_deleted: false }),
            this._getDocs(chargeId),
        ]);

        // Get company name
        const companyId = data?.company_id;
        let companyName = '';
        if (companyId) {
            const entityMap = await this._getEntityNames([companyId]);
            companyName = entityMap[companyId] || '';
        }

        // Get chargee entity names
        const entityIds = [];
        (chargees || []).forEach(c => {
            if (c.chargee_type === '1' && c.chargee_company_entity_id) {
                entityIds.push(c.chargee_company_entity_id);
            } else if (c.chargee_type === '2' && c.chargee_individual_entity_id) {
                entityIds.push(c.chargee_individual_entity_id);
            }
        });
        const entityMap = await this._getEntityNames(entityIds);

        return responseHandler.returnSuccess(httpStatus.OK, message, {
            ...toChargeResponse(this._row(data), companyName),
            chargees:  (chargees || []).map(c => toChargeeResponse(this._row(c), entityMap)),
            documents,
        });
    };

    // ── CHECK DUPLICATE CHARGE NUMBER ────────────────────────────────────────

    checkChargeNumber = async (query) => {
        try {
            const { company_id, charge_number, exclude_id } = query;

            if (!company_id || !charge_number) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'company_id and charge_number are required'
                );
            }

            const where = { company_id, charge_number, is_deleted: false };

            if (exclude_id) {
                where.charge_id = { [Op.ne]: Number(exclude_id) };
            }

            const existing = await this.chargeDao.findOneByWhere(where);

            return responseHandler.returnSuccess(httpStatus.OK, 'Check complete', {
                exists:     !!existing,
                result_val: existing ? 'YES' : 'NO',
            });
        } catch (err) {
            logger.error('[EntityChargeService.checkChargeNumber]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error checking charge number'
            );
        }
    };

    // ── CREATE ───────────────────────────────────────────────────────────────

    create = async (body = {}, files = [], userId = null, req = null) => {
        try {
            const portName = body.port_name || null;
            let   portId   = null;
            if (portName) {
                try {
                    const r = await this._resolvePort(portName);
                    portId  = r.port_number;
                } catch (e) {
                    logger.warn(`[EntityChargeService.create] port "${portName}": ${e.message}`);
                }
            }

            const record = {
                ...buildChargeRecord(body, userId),
                created_by:   userId || body.created_by || null,
                created_date: new Date(),
                is_deleted:   false,
            };

            const created  = await this.chargeDao.create(record);
            const chargeId = created.charge_id;

            let chargees = [];
            if (body.chargees) {
                try {
                    chargees = typeof body.chargees === 'string'
                        ? JSON.parse(body.chargees)
                        : body.chargees;
                } catch (e) {
                    logger.warn('[EntityChargeService.create] chargees JSON parse failed:', e.message);
                }
            }

            await this._replaceChargees(chargeId, chargees);

            if (files?.length > 0) {
                await this._processFiles(files, chargeId, userId, portId, portName, req);
            }

            return this._buildDetailResponse(chargeId, 'Register charge created successfully');
        } catch (err) {
            logger.error('[EntityChargeService.create]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error creating charge'
            );
        }
    };

    // ── UPDATE ───────────────────────────────────────────────────────────────

    update = async (id, body = {}, files = [], userId = null, req = null) => {
        try {
            const existing = await this._checkExists(id);
            if (!existing) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Charge not found');
            }

            const portName = body.port_name || null;
            let   portId   = null;
            if (portName) {
                try {
                    const r = await this._resolvePort(portName);
                    portId  = r.port_number;
                } catch (e) {
                    logger.warn(`[EntityChargeService.update] port "${portName}": ${e.message}`);
                }
            }

            await this.chargeDao.updateWhere(buildChargeRecord(body, userId), { charge_id: id });

            let chargees = [];
            if (body.chargees) {
                try {
                    chargees = typeof body.chargees === 'string'
                        ? JSON.parse(body.chargees)
                        : body.chargees;
                } catch (e) {
                    logger.warn('[EntityChargeService.update] chargees JSON parse failed:', e.message);
                }
            }

            await this._replaceChargees(id, chargees);

            if (files?.length > 0) {
                await this._processFiles(files, id, userId, portId, portName, req);
            }

            return this._buildDetailResponse(id, 'Register charge updated successfully');
        } catch (err) {
            logger.error('[EntityChargeService.update]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating charge'
            );
        }
    };

    // ── GET SINGLE ───────────────────────────────────────────────────────────

    get = async (id) => {
        try {
            const data = await this._checkExists(id);
            if (!data) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Charge not found');
            }
            return this._buildDetailResponse(id, 'Charge fetched successfully');
        } catch (err) {
            logger.error('[EntityChargeService.get]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching charge'
            );
        }
    };

    // ── LIST ─────────────────────────────────────────────────────────────────

    list = async (query = {}) => {
        try {
            const where = { is_deleted: false };
            if (query.company_id)        where.company_id        = query.company_id;
            if (query.charge_number)     where.charge_number     = { [Op.like]: `%${query.charge_number}%` };
            if (query.registration_date) where.registration_date = query.registration_date;

            const page   = Math.max(parseInt(query.page  || 1,  10), 1);
            const limit  = Math.max(parseInt(query.limit || 10, 10), 1);
            const offset = (page - 1) * limit;

            const result = await this.chargeDao.findAndCountAll({
                where,
                limit,
                offset,
                order: [['charge_id', 'DESC']],
            });

            // ── COLLECT ALL ENTITY IDs FOR BATCH RESOLUTION ──

            // 1. Company IDs from the charges
            const companyIds = result.rows.map(r => r.company_id).filter(Boolean);

            // 2. Get all chargees for these charges
            const chargeIds = result.rows.map(r => r.charge_id);
            let allChargees = [];
            if (chargeIds.length) {
                allChargees = await this.chargeeDao.findByWhere({
                    charge_id:  { [Op.in]: chargeIds },
                    is_deleted: false,
                });
            }

            // 3. Collect entity IDs from chargees (both corporate and individual)
            const chargeeEntityIds = [];
            (allChargees || []).forEach(c => {
                if (c.chargee_type === '1' && c.chargee_company_entity_id) {
                    chargeeEntityIds.push(c.chargee_company_entity_id);
                } else if (c.chargee_type === '2' && c.chargee_individual_entity_id) {
                    chargeeEntityIds.push(c.chargee_individual_entity_id);
                }
            });

            // 4. Fetch ALL entity names in a single batch query
            const allEntityIds = [...new Set([...companyIds, ...chargeeEntityIds])];
            const entityMap = await this._getEntityNames(allEntityIds);

            // ── Build chargee map with resolved entity names ──
            const chargeeMap = {};
            (allChargees || []).forEach(c => {
                const row = this._row(c);
                if (!chargeeMap[row.charge_id]) chargeeMap[row.charge_id] = [];
                chargeeMap[row.charge_id].push(toChargeeResponse(row, entityMap));
            });

            // ── Transform each charge row ──
            const transformedRows = result.rows.map(r => {
                const row = this._row(r);
                const companyName = entityMap[row.company_id] || '';
                return {
                    ...toChargeResponse(row, companyName),
                    chargees: chargeeMap[row.charge_id] || [],
                };
            });

            const paginationInput = {
                count: result.count,
                rows:  transformedRows,
            };

            const paginationData = responseHandler.getPaginationData(paginationInput, page, limit);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Charges fetched successfully',
                paginationData
            );
        } catch (err) {
            logger.error('[EntityChargeService.list]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching charges'
            );
        }
    };

    // ── SOFT DELETE ──────────────────────────────────────────────────────────

    delete = async (id, userId = null) => {
        try {
            const existing = await this._checkExists(id);
            if (!existing) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Charge not found');
            }
            const now = new Date();
            await Promise.all([
                this.chargeDao.updateWhere(
                    { is_deleted: true, updated_by: userId, updated_date: now },
                    { charge_id: id }
                ),
                this.chargeeDao.updateWhere(
                    { is_deleted: true, updated_date: now },
                    { charge_id: id }
                ),
            ]);
            return responseHandler.returnSuccess(httpStatus.OK, 'Charge deleted successfully');
        } catch (err) {
            logger.error('[EntityChargeService.delete]', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting charge'
            );
        }
    };

}

module.exports = EntityChargeService;