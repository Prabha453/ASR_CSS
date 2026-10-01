'use strict';

const httpStatus        = require('http-status');
const { Op, Sequelize } = require('sequelize');
const { getCurrentModels, getSequelizeForDb } = require('../../models');

const EntityDao                    = require('../../dao/individual/EntityDao');
const EntityIndividualDetailDao    = require('../../dao/individual/EntityIndividualDetailDao');
const EntityIdentificationDao      = require('../../dao/individual/EntityIdentificationDao');
const EntityAddressDao             = require('../../dao/individual/EntityAddressDao');
const EntityContactDao             = require('../../dao/individual/EntityContactDao');
const EntityRelationshipDao        = require('../../dao/individual/EntityRelationshipDao');
const EntityFieldChangeHistoryDao  = require('../../dao/individual/EntityFieldChangeHistoryDao');
const DocumentStoreDaos            = require('../../dao/DocumentStoreDao');
const UserDao                      = require('../../dao/UserDao');
const OfficialCompanyContactDao = require('../../dao/official/OfficialCompanyContactDao');

const responseHandler = require('../../helper/responseHandler');
const logger          = require('../../config/logger');
const config          = require('../../config/config');

const { uploadDocument } = require('../../helper/documentHelper');
const {
    getOfficialRoleGroupsByEntityId,
    getOfficialRoleGroupsByEntityIds,
    groupOfficialRows,
} = require('../../helper/officialRoleHelper');

const {
    buildCompleteWhere,
    getPaginationParams,
} = require('../../helper/searchHelper');

const {
    encrypt,
    decrypt,
    decryptRow,
    decryptRows,
} = require('../../utils/crypto');

// ─────────────────────────────────────────────────────────────────────────────
// IS_ENCRYPT — master switch for field-level encryption
//
// true  → name and contact_value are AES-encrypted before DB write,
//         decrypted on read, and history values are stored encrypted.
// false → plain text stored and returned as-is (original behaviour).
//
// Switch to true only after migrating existing rows to ciphertext.
// ─────────────────────────────────────────────────────────────────────────────
const IS_ENCRYPT = false;

// Helpers that respect IS_ENCRYPT
const _enc     = (val) => IS_ENCRYPT ? (encrypt(val)  ?? val) : val;
const _dec     = (val) => IS_ENCRYPT ? (decrypt(val)  ?? val) : val;
const _decRow  = (row, fields) => IS_ENCRYPT
    ? decryptRow(row, fields)
    : (row.toJSON ? row.toJSON() : { ...row });
const _decRows = (rows, fields) => IS_ENCRYPT
    ? decryptRows(rows, fields)
    : rows.map(r => r.toJSON ? r.toJSON() : { ...r });

const ENTITY_ENCRYPTED_FIELDS  = ['name'];
const CONTACT_ENCRYPTED_FIELDS = ['contact_value'];

const FILTER_FIELDS = ['status'];

// field_type_id 7 = individual_name — stored encrypted in history only when IS_ENCRYPT=true
// field_type_id 11 = email contact_value — also encrypted
const ENCRYPTED_HISTORY_FIELD_TYPE_IDS = new Set([7, 11]);

const TYPE_FIELD_KEY = {
    7:  'individual_name',
    8:  'individual_local_address',
    9:  'individual_foreign_address',
    10: 'individual_nationality',
    11: 'individual_email',
    12: 'individual_contact_num',
    13: 'individual_telephone_no',
    14: 'individual_alternate_address',
    18: 'individual_alternate_foreign_address',
    31: 'alternate_email_address',
    32: 'individual_id_number',
    33: 'individual_contact_address',
};

const PROOF_BASE_NAMES = {
    proof_contact_address: {
        sub_module_base: 'proof_contact_address',
        docCategory:     'proof_of_address',
        subFolder:       'individual/proof_of_address/contact',
        addrType:        'CONTACT',
    },
    proof_residential_address: {
        sub_module_base: 'proof_residential_address',
        docCategory:     'proof_of_address',
        subFolder:       'individual/proof_of_address/residential',
        addrType:        'RESIDENTIAL',
    },
    proof_foreign_address: {
        sub_module_base: 'proof_foreign_address',
        docCategory:     'proof_of_address',
        subFolder:       'individual/proof_of_address/foreign',
        addrType:        'FOREIGN',
    },
};

class EntityIndividualService {

    constructor() {
        this.entityDao                   = new EntityDao();
        this.detailDao                   = new EntityIndividualDetailDao();
        this.identificationDao           = new EntityIdentificationDao();
        this.addressDao                  = new EntityAddressDao();
        this.contactDao                  = new EntityContactDao();
        this.relationshipDao             = new EntityRelationshipDao();
        this.entityFieldChangeHistoryDao = new EntityFieldChangeHistoryDao();
        this.documentStoreDao            = new DocumentStoreDaos();
        this.userDao                     = new UserDao();
        this.officialCompanyContactDao                     = new OfficialCompanyContactDao();
    }

    async _checkEntity(entityId) {
        return this.entityDao.findOneByWhere({
            entity_id:   entityId,
            entity_type: 'INDIVIDUAL',
            is_deleted:  false,
        });
    }

    async _resolvePort(portName) {
        if (!portName) throw new Error('portName is required');
        try {
            const db = await getSequelizeForDb(config.portDbName);
            const [results] = await db.sequelize.query(
                'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
                { replacements: [portName] }
            );
            if (!results || results.length === 0) throw new Error(`Port not found for portName: "${portName}"`);
            return { port_number: results[0].port_number, port_name: results[0].port_db };
        } catch (err) {
            logger.error(`[_resolvePort] individual portName="${portName}":`, err.message);
            throw err;
        }
    }

    async _getDocuments(entityId, portId = null) {
        const where = {
            entity_id: entityId, entity_type: 'individual',
            module_name: 'individual', is_deleted: false,
            ...(portId ? { port_number: portId } : {}),
        };
        const rows    = await this.documentStoreDao.findByWhere(where);
        const allDocs = (rows || []).map(d => ({
            doc_id: d.doc_id, sub_module_name: d.sub_module_name,
            module_record_id: d.module_record_id, doc_category: d.doc_category,
            port_number: d.port_number, file_path: d.file_path || null, file_name: d.doc_name || null,
        }));

        const byProofType = {};
        const byIdentId   = {};

        allDocs.forEach(d => {
            if (d.doc_category === 'id_document' || d.sub_module_name === 'id_document') {
                const key = String(d.module_record_id);
                if (!byIdentId[key]) byIdentId[key] = [];
                byIdentId[key].push(d);
            } else if (d.sub_module_name && d.sub_module_name.startsWith('proof_')) {
                const key = d.sub_module_name;
                if (!byProofType[key]) byProofType[key] = [];
                byProofType[key].push(d);
            }
        });

        return { byProofType, byIdentId, allDocs };
    }

    _officialCompanyContactInclude(models, attributes = null) {
        const include = {
            model: models.official_company_contact,
            as: 'official_company_contacts',
            required: false,
            where: { deleted: 0 },
            include: [],
        };

        if (attributes) include.attributes = attributes;

        if (models.officials) {
            include.include.push({
                model: models.officials,
                as: 'officials',
                required: false,
                where: { is_deleted: 0 },
                attributes: ['official_id', 'official_master_id', 'official_master_slug', 'official_type', 'is_current'],
                include: models.official_master ? [{
                    model: models.official_master,
                    as: 'official_master',
                    required: false,
                    attributes: ['official_master_id', 'official_master_name', 'official_master_slug'],
                }] : [],
            });

            if (models.officials_date) {
                include.include[include.include.length - 1].include.push({
                    model: models.officials_date,
                    as: 'date_records',
                    required: false,
                    where: { is_deleted: 0 },
                    attributes: [
                        'official_date_id',
                        'official_id',
                        'official_master_slug',
                        'is_main_role',
                        'appointment_date',
                        'ceased_date',
                        'is_appt_proposed',
                        'is_ceased_proposed',
                        'officials_appt_from',
                        'officials_ceased_from',
                        'remarks',
                    ],
                });
            }
        }

        if (models.entities) {
            include.include.push({
                model: models.entities,
                as: 'entity',
                required: false,
                attributes: ['entity_id', 'name', 'client_no', 'entity_type'],
            });
        }

        return include;
    }

    async _formatOfficialCompanyContacts(contacts = [], models = getCurrentModels()) {
        return Promise.all((contacts || []).map(async contact => {
            const plain = contact?.toJSON ? contact.toJSON() : { ...contact };
            const groupedRoles = await groupOfficialRows(models, plain.officials || []);

            const companyName = plain.entity?.name || '';
            const { officials, entity, ...contactDetails } = plain;

            return {
                ...contactDetails,
                company_name: companyName,
                official_roles: Object.keys(groupedRoles).join(', '),
                official_role_groups: groupedRoles,
            };
        }));
    }

    _formatOfficialRoles = (officials = [], subRoleNameBySlug = {}) => {
        return (officials || []).map(row => {
            const plain = row?.toJSON ? row.toJSON() : row;
 
            const master  = plain.official_master || {};
            const company = plain.entity || {};
            const dates   = plain.date_records || plain.official_dates || [];
 
            return {
                official_id: plain.official_id,
                entity_id: plain.entity_id,
                company_name: company.name || '',
                official_entity_id: plain.official_entity_id,
 
                official_master_id: plain.official_master_id,
                official_master_slug: plain.official_master_slug,
                role_name: master.official_master_name || plain.official_master_slug,
 
                official_type: plain.official_type,
                identification_id: plain.identification_id,
                shareholder_type: plain.shareholder_type,
                shareholder_property_type: plain.shareholder_property_type,
 
                is_current: plain.is_current,
                source_from: plain.source_from,
 
                dates: dates.map(d => {
                    const isMain = String(d.is_main_role) === '1';
                    // For sub-role rows (is_main_role='0'), resolve the row's OWN
                    // official_master_slug to a name via the lookup map built from
                    // official_master. Falls back to the slug itself if not found.
                    const subRoleName = !isMain
                        ? (subRoleNameBySlug[d.official_master_slug] || d.official_master_slug || '')
                        : null;
 
                    return {
                        official_date_id: d.official_date_id,
                        is_main_role: d.is_main_role,
                        official_master_slug: d.official_master_slug,
                        sub_role_name: subRoleName,           // ← NEW: resolved sub-role name
                        appointment_date: d.appointment_date,
                        ceased_date: d.ceased_date,
                        appointment_status: d.officials_appt_from,
                        cessation_status: d.officials_ceased_from,
                        is_appt_proposed: d.is_appt_proposed,
                        is_ceased_proposed: d.is_ceased_proposed,
                        remarks: d.remarks,
                    };
                }),
            };
        });
    };

    _groupOfficialRoles = (roles = []) => {
        const grouped = {};

        (roles || []).forEach(role => {
            const roleName = role.role_name || role.official_master_slug || '';
            if (!roleName) return;

            if (!grouped[roleName]) {
                grouped[roleName] = {
                    role_name: roleName,
                    official_master_id: role.official_master_id || null,
                    official_master_slug: role.official_master_slug || null,
                    officials_count: 0,
                    official_ids: [],
                    companies: [],
                    sub_roles: [],
                };
            }

            grouped[roleName].officials_count += 1;
            if (role.official_id) grouped[roleName].official_ids.push(role.official_id);
            if (role.entity_id || role.company_name) {
                grouped[roleName].companies.push({
                    entity_id: role.entity_id || null,
                    company_name: role.company_name || '',
                });
            }

            (role.dates || [])
                .filter(date => String(date.is_main_role) !== '1' && (date.sub_role_name || date.official_master_slug))
                .forEach(date => {
                    const exists = grouped[roleName].sub_roles.some(item =>
                        item.sub_role_name === (date.sub_role_name || date.official_master_slug)
                        && item.official_master_slug === date.official_master_slug
                    );
                    if (!exists) {
                        grouped[roleName].sub_roles.push({
                            sub_role_name: date.sub_role_name || date.official_master_slug,
                            official_master_slug: date.official_master_slug || null,
                        });
                    }
                });
        });

        return Object.values(grouped);
    };
 
    _getOfficialRolesByIndividual = async (entityId) => {
        const models = getCurrentModels();
        return getOfficialRoleGroupsByEntityId(models, entityId, { entityKey: 'official_entity_id' });
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  GET FIELD HISTORY
    // ═════════════════════════════════════════════════════════════════════════
    getFieldHistory = async (entityId, query) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');

            const fieldTypeId = query.type_id;
            if (!fieldTypeId) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'type_id is required');

            const where = { entity_id: entityId, field_type_id: fieldTypeId };
            if (query.identification_id) where.identification_id = query.identification_id;
            if (query.ref_id)            where.ref_id            = query.ref_id;

            const rows = await this.entityFieldChangeHistoryDao.findByWhere(where, null, ['change_id', 'DESC'], 100);

            const userIds = [...new Set(rows.map(r => r.changed_by).filter(Boolean))];
            const users   = await this.userDao.findByWhere({ user_id: { [Op.in]: userIds } });
            const userMap = {};
            users.forEach(u => { userMap[u.user_id] = `${u.first_name} ${u.last_name}` || `User #${u.user_id}`; });

            // Decrypt history values only when IS_ENCRYPT=true and field_type_id is 7 (name) or 11 (email)
            const isEncryptedType = IS_ENCRYPT && ENCRYPTED_HISTORY_FIELD_TYPE_IDS.has(Number(fieldTypeId));

            const history = rows.map(r => ({
                change_id:      r.change_id,
                old_value:      isEncryptedType ? (_dec(r.old_value) || r.old_value || '') : (r.old_value || ''),
                new_value:      isEncryptedType ? (_dec(r.new_value) || r.new_value || '') : (r.new_value || ''),
                effective_date: r.effective_date || '',
                proposed_date:  r.proposed_date  || '',
                changed_date:   r.created_at     || '',
                changed_by:     userMap[r.changed_by] || '',
                changed_by_id:  r.changed_by,
                is_proposed:    r.is_proposed === true || r.is_proposed === 1,
                cron_status:    r.cron_status,
            }));

            return responseHandler.returnSuccess(httpStatus.OK, 'History fetched successfully', history);

        } catch (err) {
            logger.error('getFieldHistory error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching field history');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  SAVE FIELD CHANGE
    // ═════════════════════════════════════════════════════════════════════════
    saveFieldChange = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');

            const fieldTypeId = body.field_type_id;
            const isProposed  = body.is_proposed === true || body.is_proposed === 1;
            const newValue    = body.new_value  || '';
            const oldValue    = body.old_value  || '';
            const refId       = body.ref_id     || null;
            const updatedBy   = body.updated_by || null;
            const today       = new Date().toISOString().split('T')[0];

            const effectiveDate = isProposed ? '' : (body.effective_date || '');
            const proposedDate  = isProposed ? (body.effective_date || '') : '';

            // Store history encrypted only when IS_ENCRYPT=true and field is name (7) or email (11)
            const isEncryptedType = IS_ENCRYPT && ENCRYPTED_HISTORY_FIELD_TYPE_IDS.has(Number(fieldTypeId));
            let storedNewValue = isEncryptedType ? (_enc(newValue) || newValue) : newValue;
            let storedOldValue = isEncryptedType ? (_enc(oldValue) || oldValue) : oldValue;

            // passport / ID (32) — store as JSON regardless of IS_ENCRYPT
            if (body.extra && typeof body.extra === 'object' && fieldTypeId === 32) {
                storedNewValue = JSON.stringify({
                    new_name:    newValue,
                    new_country: body.extra.newCountry    || '',
                    new_issued:  body.extra.newIssuedDate || '',
                    new_expiry:  body.extra.newExpiryDate || '',
                });
                storedOldValue = JSON.stringify({
                    old_name:    oldValue,
                    old_country: body.extra.oldCountry    || '',
                    old_issued:  body.extra.oldIssuedDate || '',
                    old_expiry:  body.extra.oldExpiryDate || '',
                });
            }

            const existing = await this.entityFieldChangeHistoryDao.findOneByWhere({
                entity_id: entityId, field_type_id: fieldTypeId, cron_status: 0,
                ...(body.identification_id ? { identification_id: body.identification_id } : {}),
                ...(refId ? { ref_id: refId } : {}),
            });

            if (existing) {
                await this.entityFieldChangeHistoryDao.updateWhere({ cron_status: 2 }, { change_id: existing.change_id });
            }

            const changeRecord = await this.entityFieldChangeHistoryDao.create({
                entity_id:         entityId,
                field_key:         TYPE_FIELD_KEY[fieldTypeId] || body.field || '',
                field_type_id:     fieldTypeId,
                identification_id: body.identification_id || null,
                old_value:         storedOldValue,
                new_value:         storedNewValue,
                effective_date:    effectiveDate || null,
                proposed_date:     proposedDate  || null,
                is_proposed:       isProposed ? 1 : 0,
                ref_id:            refId,
                cron_status:       0,
                changed_by:        updatedBy,
                created_at:        new Date(),
            });

            const shouldApplyNow = !isProposed && effectiveDate && effectiveDate <= today;
            if (shouldApplyNow) {
                await this._applyFieldChangeNow({ entityId, fieldTypeId, newValue, body, changeRecord });
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Change recorded successfully',
                { change_id: changeRecord.change_id, applied: shouldApplyNow });

        } catch (err) {
            logger.error('saveFieldChange error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error saving field change');
        }
    };

    _applyFieldChangeNow = async ({ entityId, fieldTypeId, newValue, body, changeRecord }) => {
        const models    = getCurrentModels();
        const updatedBy = body.updated_by || null;

        switch (fieldTypeId) {
            case 7:
                // IS_ENCRYPT=true → encrypt before write; false → plain write
                await models.entities.update(
                    { name: _enc(newValue), updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            case 10:
                await models.entity_individual_details.update(
                    { member_nationality: newValue, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            case 11:
                // IS_ENCRYPT=true → encrypt contact_value before write
                await models.entity_contact.update(
                    { contact_value: _enc(newValue), updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId, contact_type: 'EMAIL', is_primary: true, is_deleted: false } }
                );
                break;
            case 12: {
                const parts = newValue.split('-');
                const code  = parts.length > 1 ? parts[0] : '+65';
                const num   = parts.length > 1 ? parts.slice(1).join('-') : newValue;
                await models.entity_contact.update(
                    { contact_value: num, phone_country_code: code, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId, contact_type: 'MOBILE', is_primary: true, is_deleted: false } }
                );
                break;
            }
            case 13: {
                const parts = newValue.split('-');
                const code  = parts.length > 1 ? parts[0] : '+65';
                const num   = parts.length > 1 ? parts.slice(1).join('-') : newValue;
                await models.entity_contact.update(
                    { contact_value: num, phone_country_code: code, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId, contact_type: 'OFFICE', is_deleted: false } }
                );
                break;
            }
            case 32: {
                const extra    = body.extra || {};
                const idFields = { id_number: newValue, updated_by: updatedBy, updated_date: new Date() };
                if (extra.newCountry)    idFields.id_issued_country = extra.newCountry;
                if (extra.newIssuedDate) idFields.id_issued_date    = extra.newIssuedDate;
                if (extra.newExpiryDate) idFields.id_expired_date   = extra.newExpiryDate;
                const idWhere = { entity_id: entityId, is_deleted: false };
                if (body.identification_id) idWhere.identification_id = body.identification_id;
                else                        idWhere.is_primary        = true;
                await models.entity_identification.update(idFields, { where: idWhere });
                break;
            }
            case 8: case 9: case 33: {
                const addrTypeMap = { 8: 'RESIDENTIAL', 9: 'FOREIGN', 33: 'CONTACT' };
                const extra = body.extra || {};
                await models.entity_address.update(
                    {
                        block_no: extra.houseNo || null, street_name: extra.streetName || null,
                        building_name: extra.building || null, level_no: extra.level || null,
                        unit_no: extra.unitNo || null, country: extra.country || 'Singapore',
                        state: extra.state || null, city: extra.city || null,
                        postal_code: extra.postalCode || null, updated_date: new Date(),
                    },
                    { where: { entity_id: entityId, address_type: addrTypeMap[fieldTypeId], is_deleted: false } }
                );
                break;
            }
            case 31:
                await models.entity_individual_details.update(
                    { alternate_email: newValue, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            default:
                logger.warn(`_applyFieldChangeNow: no handler for field_type_id=${fieldTypeId}`);
                break;
        }

        await this.entityFieldChangeHistoryDao.updateWhere({ cron_status: 1 }, { change_id: changeRecord.change_id });
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  checkIdNumber / checkIndividualName
    // ═════════════════════════════════════════════════════════════════════════
    checkIdNumber = async (query) => {
        try {
            const where = {
                m_identification_id: parseInt(query.id_type, 10),
                id_number:           query.id_number,
                is_deleted:          false,
            };
            if (query.exclude_entity_id) where.entity_id = { [Op.ne]: query.exclude_entity_id };
            const existing = await this.identificationDao.checkExist(where);
            return responseHandler.returnSuccess(httpStatus.OK, 'Check complete', { exists: existing });
        } catch (err) {
            logger.error('checkIdNumber error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
    };

    checkIndividualName = async (query) => {
        try {
            const nameVal = (query.name || '').trim();
            // IS_ENCRYPT=true  → exact match on ciphertext
            // IS_ENCRYPT=false → exact plain text match
            const where = {
                name:        IS_ENCRYPT ? _enc(nameVal) : { [Op.like]: nameVal },
                entity_type: 'INDIVIDUAL',
                is_deleted:  false,
            };
            if (query.entity_id) where.entity_id = { [Op.ne]: query.entity_id };
            const existing = await this.entityDao.checkExist(where);
            return responseHandler.returnSuccess(httpStatus.OK, 'Check complete', { exists: existing });
        } catch (err) {
            logger.error('checkIndividualName error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  CREATE
    // ═════════════════════════════════════════════════════════════════════════
    create = async (body, files = [], userId = null, req = null) => {
        const models   = getCurrentModels();
        const portName = body.port_name || null;
        let   portId   = null;
        if (portName) {
            try { const r = await this._resolvePort(portName); portId = r.port_number; }
            catch (e) { logger.warn(`[create] port "${portName}": ${e.message}`); }
        }

        const newIndexToIdentId = {};
        const addressIdByType   = {};
        const t = await models.sequelize.transaction();
        let entityId;

        try {
            // IS_ENCRYPT=true → encrypt name; false → plain
            const entity = await models.entities.create({
                entity_type:  'INDIVIDUAL',
                name:         _enc(body.name),
                client_no:    body.client_no  || null,
                status:       body.status     || 'ACTIVE',
                is_deleted:   false,
                created_by:   body.created_by || null,
                updated_by:   body.created_by || null,
                updated_date: new Date(),
            }, { transaction: t });

            entityId = entity.entity_id;

            await models.entity_individual_details.create({
                entity_id:                 entityId,
                salutation_id:             body.salutation_id              || null,
                former_name:               body.former_name                || null,
                member_alias_name:         body.member_alias_name          || null,
                member_assessment_rating:  body.member_assessment_rating   || null,
                member_gender:             body.member_gender              || null,
                member_dob:                body.member_dob                 || null,
                country_of_birth:          body.country_of_birth           || null,
                country_of_birth_code:     body.country_of_birth_code      || null,
                member_nationality:        body.member_nationality         || null,
                member_nationality_code:   body.member_nationality_code    || null,
                race_id:                   body.race_id                    || null,
                additional_notes:          body.additional_notes           || null,
                father_name:               body.father_name                || null,
                mother_name:               body.mother_name                || null,
                spouse_name:               body.spouse_name                || null,
                preferred_contact_mode:    body.preferred_contact_mode     || null,
                skype_id:                  body.skype_id                   || null,
                alternate_email:           body.alternate_email            || null,
                services_to_contact:       body.services_to_contact        || null,
                notice_from_email:         body.notice_from_email          ?? true,
                notice_from_mobile_notify: body.notice_from_mobile_notify  ?? false,
                notice_from_whatsapp:      body.notice_from_whatsapp       ?? false,
                occupation:                body.occupation                 || null,
                employer_name:             body.employer_name              || null,
                tax_id:                    body.tax_id                     || null,
                individual_admin_access:   body.individual_admin_access    || null,
                individual_group_access:   body.individual_group_access    || null,
                is_pep:                    body.is_pep                     ?? false,
                pep_details:               body.pep_details                || null,
                deceased_date:             body.deceased_date              || null,
                deceased_remarks:          body.deceased_remarks           || null,
                is_deleted:                false,
                created_by:                body.created_by                 || null,
                updated_by:                body.created_by                 || null,
                updated_date:              new Date(),
            }, { transaction: t });

            if (Array.isArray(body.identifications) && body.identifications.length > 0) {
                for (const [idx, doc] of body.identifications.entries()) {
                    const created = await models.entity_identification.create({
                        entity_id: entityId, entity_type: 'INDIVIDUAL',
                        m_identification_id: parseInt(doc.m_identification_id, 10) || null,
                        id_number: doc.id_number || '', id_issued_country: doc.id_issued_country || null,
                        id_issued_date: doc.id_issued_date || null, id_expired_date: doc.id_expired_date || null,
                        document_url: null, document_name: null,
                        is_primary: doc.is_primary ?? false, is_deleted: false,
                        created_by: body.created_by || null, updated_date: new Date(),
                    }, { transaction: t });
                    newIndexToIdentId[String(idx)] = created.identification_id;
                }
            }

            let defaultAddressId = null;
            if (Array.isArray(body.addresses) && body.addresses.length > 0) {
                for (const [idx, addr] of body.addresses.entries()) {
                    const created = await models.entity_address.create({
                        entity_id: entityId, entity_type: 'INDIVIDUAL',
                        address_type: addr.address_type || 'CONTACT',
                        block_no: addr.block_no || null, street_name: addr.street_name || null,
                        building_name: addr.building_name || null, level_no: addr.level_no || null,
                        unit_no: addr.unit_no || null, city: addr.city || null, state: addr.state || null,
                        postal_code: addr.postal_code || null, country: addr.country || 'Singapore',
                        country_code: addr.country_code || null, region_id: addr.region_id || null,
                        proof_of_address_url: null, proof_of_address_name: null,
                        is_primary: addr.is_primary ?? (idx === 0),
                        effective_from: addr.effective_from || null, effective_to: addr.effective_to || null,
                        is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
                    }, { transaction: t });
                    addressIdByType[created.address_type] = created.address_id;
                    if (created.is_primary) defaultAddressId = created.address_id;
                }
            }

            let defaultContactId = null;
            if (Array.isArray(body.contacts) && body.contacts.length > 0) {
                for (const [idx, c] of body.contacts.entries()) {
                    const created = await models.entity_contact.create({
                        entity_id: entityId, entity_type: 'INDIVIDUAL',
                        contact_type: c.contact_type || 'MOBILE',
                        phone_country_code: c.phone_country_code || '+65',
                        // IS_ENCRYPT=true → encrypt contact_value; false → plain
                        contact_value: _enc(c.contact_value) || null,
                        is_primary: c.is_primary ?? (idx === 0),
                        is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
                    }, { transaction: t });
                    if (created.is_primary) defaultContactId = created.contact_id;
                }
            }

            if (Array.isArray(body.relationships) && body.relationships.length > 0) {
                for (const r of body.relationships) {
                    await models.entity_relationships.create({
                        entity_id: entityId, related_name: r.related_name || null,
                        related_entity_id: r.related_entity_id || null,
                        relationship_type: r.relationship_type,
                        is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
                    }, { transaction: t });
                }
            }

            if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
                for (const tag_id of body.tag_ids) {
                    await models.entity_tags.create({ entity_id: entityId, tag_id, created_by: body.created_by || null }, { transaction: t });
                }
            }

            if (defaultAddressId || defaultContactId) {
                const ptrs = {};
                if (defaultAddressId) ptrs.default_address_id = defaultAddressId;
                if (defaultContactId) ptrs.default_contact_id = defaultContactId;
                await models.entities.update(ptrs, { where: { entity_id: entityId }, transaction: t });
            }

            await t.commit();

        } catch (err) {
            await t.rollback();
            logger.error('Create individual error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error creating individual');
        }

        if (Array.isArray(files) && files.length > 0) {
            try {
                await this._uploadAndPatchDocuments({
                    files, entityId, userId, portId, portName, req,
                    newIndexToIdentId, addressIdByType,
                    existingIdentIds: new Set(Object.values(newIndexToIdentId).map(Number)),
                });
            } catch (e) { logger.error(`[create] file upload error entity=${entityId}: ${e.message}`); }
        }

        return responseHandler.returnSuccess(httpStatus.OK, 'Individual created successfully', { entity_id: entityId });
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  UPDATE
    // ═════════════════════════════════════════════════════════════════════════
    update = async (entityId, body, files = [], userId = null, req = null) => {
        const models   = getCurrentModels();
        const portName = body.port_name || null;
        let   portId   = null;
        if (portName) {
            try { const r = await this._resolvePort(portName); portId = r.port_number; }
            catch (e) { logger.warn(`[update] port "${portName}": ${e.message}`); }
        }

        const newIndexToIdentId = {};
        const addressIdByType   = {};
        const existingIdentIds  = new Set();
        const t = await models.sequelize.transaction();

        try {
            const existing = await this._checkEntity(entityId);
            if (!existing) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            }

            // IS_ENCRYPT=true → encrypt name; false → plain
            const entityUpdates = { updated_by: body.updated_by || body.created_by || null, updated_date: new Date() };
            if (body.name      !== undefined) entityUpdates.name      = _enc(body.name);
            if (body.client_no !== undefined) entityUpdates.client_no = body.client_no;
            if (body.status    !== undefined) entityUpdates.status    = body.status;
            await models.entities.update(entityUpdates, { where: { entity_id: entityId }, transaction: t });

            const detailFields = [
                'salutation_id', 'former_name', 'member_alias_name', 'member_assessment_rating',
                'member_gender', 'member_dob', 'country_of_birth', 'country_of_birth_code',
                'member_nationality', 'member_nationality_code', 'race_id', 'additional_notes',
                'father_name', 'mother_name', 'spouse_name', 'preferred_contact_mode',
                'skype_id', 'alternate_email', 'services_to_contact',
                'notice_from_email', 'notice_from_mobile_notify', 'notice_from_whatsapp',
                'occupation', 'employer_name', 'tax_id',
                'individual_admin_access', 'individual_group_access',
                'is_pep', 'pep_details', 'deceased_date', 'deceased_remarks',
            ];
            const detailUpdates = { updated_by: body.updated_by || body.created_by || null, updated_date: new Date() };
            detailFields.forEach(f => { if (body[f] !== undefined) detailUpdates[f] = body[f]; });
            await models.entity_individual_details.update(detailUpdates, { where: { entity_id: entityId }, transaction: t });

            if (Array.isArray(body.identifications)) {
                const existingRows = await models.entity_identification.findAll({ where: { entity_id: entityId, is_deleted: false }, transaction: t });
                const existingById = {};
                existingRows.forEach(r => { existingById[r.identification_id] = r; });
                const incomingIds = new Set();

                for (const [idx, doc] of body.identifications.entries()) {
                    const fields = {
                        m_identification_id: parseInt(doc.m_identification_id, 10) || null,
                        id_number: doc.id_number || '', id_issued_country: doc.id_issued_country || null,
                        id_issued_date: doc.id_issued_date || null, id_expired_date: doc.id_expired_date || null,
                        is_primary: doc.is_primary ?? false, updated_date: new Date(), updated_by: body.updated_by || null,
                    };
                    if (doc.identification_id && existingById[doc.identification_id]) {
                        await existingById[doc.identification_id].update(fields, { transaction: t });
                        incomingIds.add(Number(doc.identification_id));
                        existingIdentIds.add(Number(doc.identification_id));
                    } else {
                        const created = await models.entity_identification.create({
                            entity_id: entityId, entity_type: 'INDIVIDUAL', ...fields,
                            document_url: null, document_name: null, is_deleted: false,
                            created_by: body.updated_by || body.created_by || null,
                        }, { transaction: t });
                        newIndexToIdentId[String(idx)] = created.identification_id;
                        existingIdentIds.add(created.identification_id);
                    }
                }

                for (const [id, record] of Object.entries(existingById)) {
                    if (!incomingIds.has(Number(id))) await record.update({ is_deleted: true, updated_date: new Date() }, { transaction: t });
                }
            }

            let defaultAddressId = null;
            if (Array.isArray(body.addresses)) {
                const existingAddrs = await models.entity_address.findAll({ where: { entity_id: entityId, is_deleted: false }, transaction: t });
                const addrByType = {};
                existingAddrs.forEach(a => { addrByType[a.address_type] = a; });
                const incomingAddrTypes = new Set(body.addresses.map(a => a.address_type || 'CONTACT'));

                for (const addr of body.addresses) {
                    const atype  = addr.address_type || 'CONTACT';
                    const fields = {
                        block_no: addr.block_no || null, street_name: addr.street_name || null,
                        building_name: addr.building_name || null, level_no: addr.level_no || null,
                        unit_no: addr.unit_no || null, city: addr.city || null, state: addr.state || null,
                        postal_code: addr.postal_code || null, country: addr.country || 'Singapore',
                        country_code: addr.country_code || null, region_id: addr.region_id || null,
                        proof_of_address_url: addr.proof_of_address_url || null,
                        proof_of_address_name: addr.proof_of_address_name || null,
                        is_primary: addr.is_primary ?? false,
                        effective_from: addr.effective_from || null, effective_to: addr.effective_to || null,
                        updated_date: new Date(),
                    };
                    let saved;
                    if (addrByType[atype]) { await addrByType[atype].update(fields, { transaction: t }); saved = addrByType[atype]; }
                    else { saved = await models.entity_address.create({ entity_id: entityId, entity_type: 'INDIVIDUAL', address_type: atype, is_deleted: false, created_by: body.updated_by || body.created_by || null, ...fields }, { transaction: t }); }
                    addressIdByType[atype] = saved.address_id;
                    if (saved.is_primary) defaultAddressId = saved.address_id;
                }

                for (const [atype, record] of Object.entries(addrByType)) {
                    if (!incomingAddrTypes.has(atype)) await record.update({ is_deleted: true, updated_date: new Date() }, { transaction: t });
                }
            }

            let defaultContactId = null;
            if (Array.isArray(body.contacts)) {
                const existingContacts = await models.entity_contact.findAll({ where: { entity_id: entityId, entity_type: 'INDIVIDUAL', is_deleted: false }, transaction: t });
                const existingById = {};
                existingContacts.forEach(c => { existingById[c.contact_id] = c; });
                const incomingIds = new Set();

                for (const c of body.contacts) {
                    const fields = {
                        contact_type: c.contact_type || 'MOBILE',
                        phone_country_code: c.phone_country_code || '+65',
                        // IS_ENCRYPT=true → encrypt contact_value; false → plain
                        contact_value: _enc(c.contact_value) || null,
                        is_primary: c.is_primary ?? false,
                        updated_by: body.updated_by || null, updated_date: new Date(),
                    };
                    if (c.contact_id && existingById[c.contact_id]) {
                        await existingById[c.contact_id].update(fields, { transaction: t });
                        incomingIds.add(Number(c.contact_id));
                        if (fields.is_primary) defaultContactId = c.contact_id;
                    } else {
                        const created = await models.entity_contact.create({ entity_id: entityId, entity_type: 'INDIVIDUAL', ...fields, is_deleted: false, created_by: body.updated_by || body.created_by || null }, { transaction: t });
                        if (fields.is_primary) defaultContactId = created.contact_id;
                    }
                }

                for (const [id, record] of Object.entries(existingById)) {
                    if (!incomingIds.has(Number(id))) await record.update({ is_deleted: true, updated_date: new Date() }, { transaction: t });
                }
            }

            if (Array.isArray(body.official_company_contacts)) {
                const contactIds = body.official_company_contacts
                    .map(c => Number(c.contact_id))
                    .filter(Boolean);
                const rows = contactIds.length
                    ? await models.official_company_contact.findAll({
                        where: {
                            contact_id: { [Op.in]: contactIds },
                            official_entity_id: String(entityId),
                            deleted: 0,
                        },
                        transaction: t,
                    })
                    : [];
                const existingById = {};
                rows.forEach(row => { existingById[row.contact_id] = row; });

                for (const c of body.official_company_contacts) {
                    const contactId = Number(c.contact_id);
                    const row = existingById[contactId];
                    if (!row) continue;

                    await row.update({
                        email:          c.email          || '',
                        mobile:         c.mobile         || '',
                        mobile_code:    c.mobile_code    || '',
                        telephone:      c.telephone      || '',
                        telephone_code: c.telephone_code || '',
                        office:         c.office         || '',
                        office_code:    c.office_code    || '',
                        ext_no:         c.ext_no         || '',
                    }, { transaction: t });
                }
            }

            if (Array.isArray(body.relationships)) {
                await models.entity_relationships.update({ is_deleted: true, updated_date: new Date() }, { where: { entity_id: entityId, is_deleted: false }, transaction: t });
                for (const r of body.relationships) {
                    await models.entity_relationships.create({
                        entity_id: entityId, related_name: r.related_name || null,
                        related_entity_id: r.related_entity_id || null,
                        relationship_type: r.relationship_type,
                        is_deleted: false, created_by: body.updated_by || body.created_by || null, updated_date: new Date(),
                    }, { transaction: t });
                }
            }

            if (Array.isArray(body.tag_ids)) {
                await models.entity_tags.destroy({ where: { entity_id: entityId }, transaction: t });
                for (const tag_id of body.tag_ids) {
                    await models.entity_tags.create({ entity_id: entityId, tag_id, created_by: body.updated_by || body.created_by || null }, { transaction: t });
                }
            }

            const ptrs = {};
            if (defaultAddressId !== null) ptrs.default_address_id = defaultAddressId;
            if (defaultContactId !== null) ptrs.default_contact_id = defaultContactId;
            if (Object.keys(ptrs).length) await models.entities.update(ptrs, { where: { entity_id: entityId }, transaction: t });

            await t.commit();

        } catch (err) {
            await t.rollback();
            logger.error('Update individual error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating individual');
        }

        if (Array.isArray(files) && files.length > 0) {
            try {
                await this._uploadAndPatchDocuments({ files, entityId, userId, portId, portName, req, newIndexToIdentId, addressIdByType, existingIdentIds });
            } catch (e) { logger.error(`[update] file upload error entity=${entityId}: ${e.message}`); }
        }

        return responseHandler.returnSuccess(httpStatus.OK, 'Individual updated successfully', { entity_id: entityId });
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  _uploadAndPatchDocuments
    // ═════════════════════════════════════════════════════════════════════════
    _uploadAndPatchDocuments = async ({ files, entityId, userId, portId, portName, req, newIndexToIdentId = {}, addressIdByType = {}, existingIdentIds = new Set() }) => {
        const models     = getCurrentModels();
        const proofFiles = files.filter(f => (f.fieldname || '').replace(/\[\]$/, '').match(/^proof_(contact|residential|foreign)_address$/));
        const scanFiles  = files.filter(f => (f.fieldname || '').replace(/\[\]$/, '').startsWith('id_document_'));

        const proofResultByAddrType = {};
        for (const file of proofFiles) {
            const fieldname = (file.fieldname || '').replace(/\[\]$/, '');
            const mapping   = PROOF_BASE_NAMES[fieldname];
            if (!mapping) continue;
            const addrType  = mapping.addrType;
            const addressId = addressIdByType[addrType];
            try {
                const doc = await uploadDocument({
                    file, userId, port_number: portId, port_name: portName,
                    entity_id: entityId, entity_type: 'individual', module_name: 'individual',
                    sub_module_name: mapping.sub_module_base, module_record_id: addressId || entityId,
                    doc_category: mapping.docCategory, doc_name: file.originalname || fieldname,
                    sub_folder: mapping.subFolder, replace_existing: false, delete_old_file: false, req,
                });
                if (doc) {
                    if (!proofResultByAddrType[addrType]) proofResultByAddrType[addrType] = [];
                    proofResultByAddrType[addrType].push({ doc_id: doc.doc_id, file_path: doc.file_path || '', file_name: file.originalname || '' });
                    if (addressId) await this.documentStoreDao.updateWhere({ module_record_id: addressId }, { doc_id: doc.doc_id });
                }
            } catch (err) { logger.error(`[uploadAndPatch] proof "${fieldname}": ${err.message}`); }
        }

        for (const [addrType, docs] of Object.entries(proofResultByAddrType)) {
            if (!docs.length) continue;
            const addressId = addressIdByType[addrType];
            if (!addressId) continue;
            try {
                await models.entity_address.update(
                    { proof_of_address_url: docs[0].file_path, proof_of_address_name: docs[0].file_name, updated_date: new Date() },
                    { where: { address_id: addressId, is_deleted: false } }
                );
            } catch (err) { logger.warn(`[uploadAndPatch] patch address addr=${addressId}: ${err.message}`); }
        }

        const scanResultByIdentId = {};
        for (const file of scanFiles) {
            const fieldname = (file.fieldname || '').replace(/\[\]$/, '');
            const suffix    = fieldname.replace('id_document_', '');
            const isNew     = suffix.startsWith('new_');
            let identificationId = isNew ? (newIndexToIdentId[suffix.replace('new_', '')] || null) : (Number(suffix) || null);
            if (!identificationId) continue;
            const identKey = String(identificationId);
            try {
                const doc = await uploadDocument({
                    file, userId, port_number: portId, port_name: portName,
                    entity_id: entityId, entity_type: 'individual', module_name: 'individual',
                    sub_module_name: 'id_document', module_record_id: identificationId,
                    doc_category: 'id_document', doc_name: file.originalname || fieldname,
                    sub_folder: 'individual/id_documents', replace_existing: false, delete_old_file: false, req,
                });
                if (doc) {
                    if (!scanResultByIdentId[identKey]) scanResultByIdentId[identKey] = [];
                    scanResultByIdentId[identKey].push({ doc_id: doc.doc_id, file_path: doc.file_path || '', file_name: file.originalname || '' });
                }
            } catch (err) { logger.error(`[uploadAndPatch] scan "${fieldname}": ${err.message}`); }
        }

        for (const [identKey, docs] of Object.entries(scanResultByIdentId)) {
            if (!docs.length) continue;
            try {
                await models.entity_identification.update(
                    { document_url: docs[0].file_path, document_name: docs[0].file_name, updated_date: new Date() },
                    { where: { identification_id: Number(identKey), entity_id: entityId, is_deleted: false } }
                );
            } catch (err) { logger.warn(`[uploadAndPatch] patch ident identId=${identKey}: ${err.message}`); }
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  LIST
    // ═════════════════════════════════════════════════════════════════════════
    list = async (query) => {
        try {
            const hasSearch = query.search && String(query.search).trim() !== '';
            const keyword   = hasSearch ? String(query.search).toLowerCase().trim() : '';

            const where = buildCompleteWhere({
                query,
                searchFields: [],           // no SQL LIKE — name may be encrypted
                filterFields: FILTER_FIELDS,
                baseWhere:    { entity_type: 'INDIVIDUAL', is_deleted: 0 },
            });

            const { page, limit, offset } = getPaginationParams(query, 10);

            const ALLOWED_SORT = ['entity_id', 'name', 'client_no', 'status', 'created_date'];
            const sortCol = ALLOWED_SORT.includes(query.sort) ? query.sort : 'entity_id';
            const sortDir = (query.order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            const order   = [[sortCol, sortDir]];

            const models      = getCurrentModels();
            const detailWhere = { is_deleted: 0 };
            if (query.risk)        detailWhere.member_assessment_rating = query.risk;
            if (query.gender)      detailWhere.member_gender            = query.gender;
            if (query.nationality) detailWhere.member_nationality       = { [Op.like]: `%${query.nationality}%` };
            if (query.dob_from || query.dob_to) {
                detailWhere.member_dob = {};
                if (query.dob_from) detailWhere.member_dob[Op.gte] = query.dob_from;
                if (query.dob_to)   detailWhere.member_dob[Op.lte] = query.dob_to;
            }
            if (query.created_from || query.created_to) {
                where.created_date = {};
                if (query.created_from) where.created_date[Op.gte] = query.created_from;
                if (query.created_to)   where.created_date[Op.lte] = query.created_to;
            }

            const hasDetailFilter = Object.keys(detailWhere).length > 1;

            // IS_ENCRYPT=false → add SQL LIKE directly for plain text search
            if (!IS_ENCRYPT && hasSearch) {
                where[Op.or] = [
                    { name:      { [Op.like]: `%${keyword}%` } },
                    { client_no: { [Op.like]: `%${keyword}%` } },
                ];
            }

            const includeOpts = [
                {
                    model: models.entity_individual_details, as: 'individual_detail',
                    required: hasDetailFilter, where: detailWhere,
                    attributes: ['member_gender', 'member_dob', 'member_nationality', 'member_assessment_rating'],
                },{
                    model: models.entity_identification, as: 'identifications',
                    required: false, where: { entity_type: 'INDIVIDUAL', is_deleted: 0 },
                    attributes: ['identification_id', 'id_number', 'is_primary', 'm_identification_id'],
                    include: models.member_id_type
                        ? [{ model: models.member_id_type, as: 'id_type', required: false, attributes: ['id_name'] }]
                        : [],
                },{
                    model: models.entity_address, as: 'addresses',
                    required: false, where: { entity_type: 'INDIVIDUAL', is_deleted: 0 },
                    attributes: ['address_id', 'is_primary', 'address_type', 'block_no', 'street_name', 'level_no', 'unit_no', 'building_name', 'postal_code', 'country'],
                },{
                    model: models.entity_contact, as: 'contacts',
                    required: false, where: { entity_type: 'INDIVIDUAL', is_deleted: 0 },
                    attributes: ['contact_id', 'is_primary', 'contact_type', 'phone_country_code', 'contact_value'],
                },
                this._officialCompanyContactInclude(models, [
                    'contact_id', 'email', 'mobile', 'mobile_code', 'telephone',
                    'telephone_code', 'office', 'office_code', 'ext_no', 'deleted',
                ]),
            ];

            const attrs    = ['entity_id', 'name', 'client_no', 'status', 'default_address_id', 'default_contact_id', 'created_date'];
            const baseOpts = { where, order, attributes: attrs, include: includeOpts };

            // ── Helper: Sequelize instance → plain object → decrypt name ──
            const _toPlainAndDecrypt = async (r) => {
                const plain = r.toJSON ? r.toJSON() : { ...r };
                const flatIdentifications = (plain.identifications || []).map(ident => {
                    const { id_type, ...rest } = ident;
                    return { ...rest, id_type_name: id_type?.id_name || null };
                });
                return {
                    ...plain,
                    name: plain.name ? (_dec(plain.name) ?? plain.name) : plain.name,
                    identifications: flatIdentifications,
                    official_company_contacts: await this._formatOfficialCompanyContacts(plain.official_company_contacts || [], models),
                };
            };

            if (IS_ENCRYPT) {
                // ── ENCRYPTED PATH ────────────────────────────────────────

                if (hasSearch) {
                    // Fetch ALL rows → decrypt → JS filter → JS paginate
                    const allRows   = await this.entityDao.findAll(baseOpts);
                    const decrypted = await Promise.all(allRows.map(_toPlainAndDecrypt));
                    const filtered  = decrypted.filter(row =>
                        (row.name      && String(row.name).toLowerCase().includes(keyword)) ||
                        (row.client_no && String(row.client_no).toLowerCase().includes(keyword))
                    );

                    const totalItems = filtered.length;

                    if (!totalItems) {
                        return responseHandler.returnSuccess(httpStatus.OK, 'No individuals found',
                            responseHandler.getPaginationData({ count: 0, rows: [] }, page, limit)
                        );
                    }

                    const start         = (page - 1) * limit;
                    const paginatedRows = filtered.slice(start, start + limit);

                    return responseHandler.returnSuccess(httpStatus.OK, 'Individual list fetched successfully',
                        responseHandler.getPaginationData({ count: totalItems, rows: paginatedRows }, page, limit)
                    );

                } else {
                    // No search → DB-level pagination → decrypt after
                    const result = await this.entityDao.findAndCountAll({
                        ...baseOpts,
                        limit,
                        offset,
                        distinct: true,
                    });

                    if (!result.count) {
                        return responseHandler.returnSuccess(httpStatus.OK, 'No individuals found',
                            responseHandler.getPaginationData({ count: 0, rows: [] }, page, limit)
                        );
                    }

                    const decryptedRows = await Promise.all(result.rows.map(_toPlainAndDecrypt));

                    return responseHandler.returnSuccess(httpStatus.OK, 'Individual list fetched successfully',
                        responseHandler.getPaginationData({ count: result.count, rows: decryptedRows }, page, limit)
                    );
                }

            } else {
                // ── PLAIN TEXT PATH ───────────────────────────────────────
                const result = await this.entityDao.findAndCountAll({
                    ...baseOpts,
                    limit,
                    offset,
                    distinct: true,
                });

                if (result.count === 0) {
                    return responseHandler.returnSuccess(httpStatus.OK, 'No individuals found',
                        responseHandler.getPaginationData({ count: 0, rows: [] }, page, limit)
                    );
                }

                const rows = await Promise.all(result.rows.map(_toPlainAndDecrypt));
                const entityIds = rows.map(r => r.entity_id);

                const officialMap = await getOfficialRoleGroupsByEntityIds(
                    models,
                    entityIds,
                    { entityKey: 'official_entity_id' }
                );

                rows.forEach(row => {
                    row.official_roles = officialMap[row.entity_id] || {};
                });

                
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'Individual list fetched successfully',
                    responseHandler.getPaginationData({ count: result.count, rows }, page, limit),
                );
            }

        } catch (err) {
            logger.error('List individual error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching individual list');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  GET
    // ═════════════════════════════════════════════════════════════════════════
    get = async (entityId, portName = null) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');

            let portId = null;
            if (portName) {
                try { const r = await this._resolvePort(portName); portId = r.port_number; }
                catch (e) { logger.warn(`[get] Could not resolve port: ${e.message}`); }
            }

            const models = getCurrentModels();
            const [detail, identifications, addresses, contacts, relationships, official_company_contacts] = await Promise.all([
                this.detailDao.findOneByWhere({ entity_id: entityId, is_deleted: false }),
                models.entity_identification.findAll({
                    where: { entity_id: entityId, is_deleted: false },
                    order: Sequelize.literal('identification_id ASC, is_primary DESC'),
                    include: models.member_id_type ? [{
                        model: models.member_id_type,
                        as: 'id_type',
                        required: false,
                        attributes: ['id_name'],
                    }] : [],
                }),
                this.addressDao.findByWhere({ entity_id: entityId, is_deleted: false }),
                this.contactDao.findByWhere({ entity_id: entityId, is_deleted: false }),
                this.relationshipDao.findByWhere({ entity_id: entityId, is_deleted: false }),
                models.official_company_contact.findAll({
                    where: { official_entity_id: entityId, deleted: 0 },
                    order: [['contact_id', 'DESC']],
                    include: this._officialCompanyContactInclude(models).include,
                }),
            ]);

            const { byProofType, byIdentId, allDocs } = await this._getDocuments(entityId, portId);

            const ADDR_TYPE_TO_PROOF_BASE = {
                CONTACT: 'proof_contact_address', RESIDENTIAL: 'proof_residential_address', FOREIGN: 'proof_foreign_address',
            };

            const enrichedAddresses = (addresses || []).map(a => {
                const baseKey  = ADDR_TYPE_TO_PROOF_BASE[a.address_type];
                const proofArr = baseKey ? (byProofType[baseKey] || []) : [];
                return {
                    ...a.toJSON(),
                    proof_docs: proofArr.map(d => ({ doc_id: d.doc_id, file_path: d.file_path, file_name: d.file_name })),
                };
            });

           const enrichedIdentifications = (identifications || []).map(ident => {
                const plain   = ident.toJSON ? ident.toJSON() : { ...ident };
                const scanArr = byIdentId[String(plain.identification_id)] || [];
                const { id_type, ...rest } = plain;
                return {
                    ...rest,
                    id_type_name: id_type?.id_name || null,
                    scan_docs: scanArr.map(d => ({ doc_id: d.doc_id, file_path: d.file_path, file_name: d.file_name })),
                };
            });

            const tags = await this.entityDao.findAll({
                where: { entity_id: entityId },
                include: [{ model: getCurrentModels().entity_tags, as: 'tags', include: [{ model: getCurrentModels().tag, as: 'tag_info', attributes: ['tag_id', 'tag_name', 'tag_color'] }] }],
                attributes: [],
            }).then(rows => rows[0]?.tags || []);
            
            // IS_ENCRYPT=true → decrypt name; false → plain as-is
            const decryptedEntity = _decRow(entity, ENTITY_ENCRYPTED_FIELDS);

            // IS_ENCRYPT=true → decrypt contact_value on each contact; false → plain as-is
            const decryptedContacts = _decRows(contacts || [], CONTACT_ENCRYPTED_FIELDS);
            const enrichedOfficialCompanyContacts = await this._formatOfficialCompanyContacts(official_company_contacts || [], models);
            const officialRoles = await this._getOfficialRolesByIndividual(entityId);

            return responseHandler.returnSuccess(httpStatus.OK, 'Individual fetched successfully', {
                ...decryptedEntity,
                individual_detail: detail                  || null,
                identifications:   enrichedIdentifications || [],
                addresses:         enrichedAddresses       || [],
                contacts:          decryptedContacts,
                relationships:     relationships           || [],
                official_company_contacts :  enrichedOfficialCompanyContacts,
                official_roles: officialRoles,
                documents:         allDocs,
                tags,
            });

        } catch (err) {
            logger.error('Get individual error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching individual');
        }
    };

    // ═════════════════════════════════════════════════════════════════════════
    //  DELETE
    // ═════════════════════════════════════════════════════════════════════════
    delete = async (entityId) => {
        try {
            const existing = await this._checkEntity(entityId);
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            await this.entityDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { entity_id: entityId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Individual deleted successfully');
        } catch (err) {
            logger.error('Delete individual error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting individual');
        }
    };

    // ─── Sub-resource methods ─────────────────────────────────────────────────

    createIdentification = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            const data = await this.identificationDao.create({
                entity_id: entityId, entity_type: 'INDIVIDUAL',
                m_identification_id: parseInt(body.m_identification_id, 10) || null,
                id_number: body.id_number, id_issued_country: body.id_issued_country || null,
                id_issued_date: body.id_issued_date || null, id_expired_date: body.id_expired_date || null,
                document_url: body.document_url || null, document_name: body.document_name || null,
                is_primary: body.is_primary ?? false, is_deleted: false,
                created_by: body.created_by || null, updated_date: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Identification added successfully', data);
        } catch (err) {
            logger.error('Create identification error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding identification');
        }
    };

    updateIdentification = async (identificationId, body) => {
        try {
            const existing = await this.identificationDao.findOneByWhere({ identification_id: identificationId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Identification not found');
            const allowed = ['m_identification_id', 'id_number', 'id_issued_country', 'id_issued_date', 'id_expired_date', 'document_url', 'document_name', 'is_primary'];
            const updates = {};
            allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
            updates.updated_by = body.updated_by || null;
            updates.updated_date = new Date();
            await this.identificationDao.updateWhere(updates, { identification_id: identificationId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Identification updated successfully', await this.identificationDao.findOneByWhere({ identification_id: identificationId }));
        } catch (err) {
            logger.error('Update identification error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating identification');
        }
    };

    deleteIdentification = async (identificationId) => {
        try {
            const existing = await this.identificationDao.findOneByWhere({ identification_id: identificationId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Identification not found');
            await this.identificationDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { identification_id: identificationId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Identification deleted successfully');
        } catch (err) {
            logger.error('Delete identification error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting identification');
        }
    };

    createAddress = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            const data = await this.addressDao.create({
                entity_id: entityId, entity_type: 'INDIVIDUAL',
                address_type: body.address_type || 'CONTACT', block_no: body.block_no || null,
                street_name: body.street_name || null, building_name: body.building_name || null,
                level_no: body.level_no || null, unit_no: body.unit_no || null,
                city: body.city || null, state: body.state || null, postal_code: body.postal_code || null,
                country: body.country || 'Singapore', country_code: body.country_code || null,
                region_id: body.region_id || null,
                proof_of_address_url: body.proof_of_address_url || null,
                proof_of_address_name: body.proof_of_address_name || null,
                is_primary: body.is_primary ?? false,
                effective_from: body.effective_from || null, effective_to: body.effective_to || null,
                is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Address added successfully', data);
        } catch (err) {
            logger.error('Create address error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding address');
        }
    };

    updateAddress = async (addressId, body) => {
        try {
            const existing = await this.addressDao.findOneByWhere({ address_id: addressId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Address not found');
            const allowed = ['address_type', 'block_no', 'street_name', 'building_name', 'level_no', 'unit_no', 'city', 'state', 'postal_code', 'country', 'country_code', 'region_id', 'proof_of_address_url', 'proof_of_address_name', 'is_primary', 'effective_from', 'effective_to'];
            const updates = {};
            allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
            updates.updated_by = body.updated_by || null;
            updates.updated_date = new Date();
            await this.addressDao.updateWhere(updates, { address_id: addressId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Address updated successfully', await this.addressDao.findOneByWhere({ address_id: addressId }));
        } catch (err) {
            logger.error('Update address error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating address');
        }
    };

    deleteAddress = async (addressId) => {
        try {
            const existing = await this.addressDao.findOneByWhere({ address_id: addressId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Address not found');
            await this.addressDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { address_id: addressId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Address deleted successfully');
        } catch (err) {
            logger.error('Delete address error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting address');
        }
    };

    createContact = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            const data = await this.contactDao.create({
                entity_id: entityId, entity_type: 'INDIVIDUAL',
                contact_type: body.contact_type || 'MOBILE',
                phone_country_code: body.phone_country_code || '+65',
                // IS_ENCRYPT=true → encrypt contact_value; false → plain
                contact_value: _enc(body.contact_value) || null,
                is_primary: body.is_primary ?? false,
                is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
            });
            // Decrypt before returning so UI always gets plain text
            return responseHandler.returnSuccess(httpStatus.OK, 'Contact added successfully',
                _decRow(data, CONTACT_ENCRYPTED_FIELDS)
            );
        } catch (err) {
            logger.error('Create contact error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding contact');
        }
    };

    updateContact = async (contactId, body) => {
        try {
            const existing = await this.contactDao.findOneByWhere({ contact_id: contactId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Contact not found');
            const allowed = ['contact_type', 'phone_country_code', 'contact_value', 'is_primary'];
            const updates = {};
            allowed.forEach(f => {
                if (body[f] !== undefined) {
                    // IS_ENCRYPT=true → encrypt contact_value; all other fields plain
                    updates[f] = (IS_ENCRYPT && CONTACT_ENCRYPTED_FIELDS.includes(f))
                        ? _enc(body[f])
                        : body[f];
                }
            });
            updates.updated_by   = body.updated_by || null;
            updates.updated_date = new Date();
            await this.contactDao.updateWhere(updates, { contact_id: contactId });
            const updated = await this.contactDao.findOneByWhere({ contact_id: contactId });
            // Decrypt before returning so UI always gets plain text
            return responseHandler.returnSuccess(httpStatus.OK, 'Contact updated successfully',
                _decRow(updated, CONTACT_ENCRYPTED_FIELDS)
            );
        } catch (err) {
            logger.error('Update contact error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating contact');
        }
    };

    deleteContact = async (contactId) => {
        try {
            const existing = await this.contactDao.findOneByWhere({ contact_id: contactId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Contact not found');
            await this.contactDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { contact_id: contactId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Contact deleted successfully');
        } catch (err) {
            logger.error('Delete contact error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting contact');
        }
    };

    createRelationship = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Individual not found');
            const data = await this.relationshipDao.create({
                entity_id: entityId, related_name: body.related_name || null,
                related_entity_id: body.related_entity_id || null,
                relationship_type: body.relationship_type,
                is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Relationship added successfully', data);
        } catch (err) {
            logger.error('Create relationship error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding relationship');
        }
    };

    updateRelationship = async (relationshipId, body) => {
        try {
            const existing = await this.relationshipDao.findOneByWhere({ relationship_id: relationshipId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Relationship not found');
            const allowed = ['related_name', 'related_entity_id', 'relationship_type'];
            const updates = {};
            allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
            updates.updated_by = body.updated_by || null;
            updates.updated_date = new Date();
            await this.relationshipDao.updateWhere(updates, { relationship_id: relationshipId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Relationship updated successfully', await this.relationshipDao.findOneByWhere({ relationship_id: relationshipId }));
        } catch (err) {
            logger.error('Update relationship error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating relationship');
        }
    };

    deleteRelationship = async (relationshipId) => {
        try {
            const existing = await this.relationshipDao.findOneByWhere({ relationship_id: relationshipId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Relationship not found');
            await this.relationshipDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { relationship_id: relationshipId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Relationship deleted successfully');
        } catch (err) {
            logger.error('Delete relationship error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting relationship');
        }
    };
}

module.exports = EntityIndividualService;
