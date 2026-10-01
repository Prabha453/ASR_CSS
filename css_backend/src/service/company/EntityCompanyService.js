const httpStatus   = require('http-status');
const { Op, Sequelize } = require('sequelize');

const { getCurrentModels } = require('../../models');

const EntityCompanyDao        = require('../../dao/company/EntityCompanyDao');
const EntityCompanyDetailDao  = require('../../dao/company/EntityCompanyDetailDao');
const EntityAddressDao        = require('../../dao/individual/EntityAddressDao');
const EntityContactDao        = require('../../dao/individual/EntityContactDao');
const EntityIdentificationDao = require('../../dao/individual/EntityIdentificationDao');
const EntityFieldChangeHistoryDao = require('../../dao/individual/EntityFieldChangeHistoryDao');
const EntityStatusDateDao          = require('../../dao/company/EntityStatusDateDao');
const UserDao                      = require('../../dao/UserDao');

const documentHelper = require('../../helper/documentHelper');
const DocumentStoreDaos  = require('../../dao/DocumentStoreDao');
const { getSequelizeForDb } = require('../../models');
const config = require('../../config/config');

const responseHandler = require('../../helper/responseHandler');
const logger          = require('../../config/logger');
const { getOfficialRoleGroupsByEntityIds } = require('../../helper/officialRoleHelper');
const {
    addDatePart,
    calculateRuleDate,
    csvNumbers,
    dateFromOnly,
    eventSlugFromName,
    getRuleGroups,
    jsonObject,
    monthsBetween,
    ruleHasMatchingGroup,
    ruleMatchesScope,
    selectBestRule,
    toDateOnly,
} = require('../../helper/eventHelper');
const { EVENT_STATUS, OPEN_EVENT_STATUSES, ALLOWED_STATUS_TRANSITIONS } = require('../../config/companyEventStatus');
const { getDefaultCompanyEventRule } = require('../../config/defaultCompanyEventRules');
const { copyChecklistTemplateToEvent } = require('../../helper/documentChecklistHelper');

const {
    buildCompleteWhere,
    getPaginationParams,
    fetchWithEncryptedSearch,
} = require('../../helper/searchHelper');

const {
    encrypt,
    decrypt,
    decryptRow,
    decryptRows,
} = require('../../utils/crypto');

// 
// IS_ENCRYPT â€” master switch for field-level encryption
//
// true  â†’ name and contact_value are AES-encrypted before DB write,
//         decrypted on read, and history values are stored encrypted.
// false â†’ plain text stored and returned as-is (original behaviour).
//
// Switch to true only after migrating existing rows to ciphertext.
// 
const IS_ENCRYPT = false;

// Helpers that respect IS_ENCRYPT
const _enc  = (val) => IS_ENCRYPT ? (encrypt(val)  ?? val) : val;
const _dec  = (val) => IS_ENCRYPT ? (decrypt(val)  ?? val) : val;
const _decRow  = (row, fields) => IS_ENCRYPT ? decryptRow(row, fields)   : (row.toJSON ? row.toJSON() : { ...row });
const _decRows = (rows, fields) => IS_ENCRYPT ? decryptRows(rows, fields) : rows.map(r => r.toJSON ? r.toJSON() : { ...r });

// Group an array of DAO rows by a given key (returns plain objects)
const _groupById = (rows = [], key) =>
    rows.reduce((acc, row) => {
        const val  = row?.toJSON ? row.toJSON() : row;
        const id   = val[key];
        if (!acc[id]) acc[id] = [];
        acc[id].push(val);
        return acc;
    }, {});

const ENTITY_ENCRYPTED_FIELDS  = ['name'];
const CONTACT_ENCRYPTED_FIELDS = ['contact_value'];

const SEARCH_FIELDS = ['name', 'client_no'];
const FILTER_FIELDS = ['status', 'company_type_id'];

const ENTITY_FIELDS = [
    'name', 'former_name', 'client_no', 'status',
    'company_type_id', 'remarks', 'additional_remarks',
];

const PROOF_BASE_NAMES = {
    proof_registered_address:          { sub_module_base: 'proof_registered_address',          docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/registered',          addrType: 'REGISTERED'          },
    proof_mailing_address:             { sub_module_base: 'proof_mailing_address',             docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/mailing',             addrType: 'MAILING'             },
    proof_business_address:            { sub_module_base: 'proof_business_address',            docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/business',            addrType: 'BUSINESS'            },
    proof_foreign_address:             { sub_module_base: 'proof_foreign_address',             docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/foreign',             addrType: 'FOREIGN'             },
    proof_other_address:               { sub_module_base: 'proof_other_address',               docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/other',               addrType: 'OTHER'               },
    proof_register_of_members_address: { sub_module_base: 'proof_register_of_members_address', docCategory: 'proof_of_address', subFolder: 'company/proof_of_address/register_of_members', addrType: 'REGISTER_OF_MEMBERS' },
};

const LOGO_FIELDNAME          = 'company_logo';
const LOGO_SUB_FOLDER         = 'company_logo';
const LOGO_MODULE_NAME        = 'corporate_registration';
const LOGO_SUB_MODULE_NAME    = 'corporate_log';
const LOGO_DOC_CATEGORY       = 'corporate_log';
const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE_BYTES     = 5 * 1024 * 1024; // 5 MB

// Validates a multer file object for the company-logo slot.
// Returns an error message string, or null when the file is acceptable.
const _validateLogoFile = (file) => {
    if (!file) return 'Company logo file is missing.';
    if (!ALLOWED_LOGO_MIME_TYPES.includes((file.mimetype || '').toLowerCase())) {
        return `Invalid company logo type "${file.mimetype}". Allowed formats: JPG, JPEG, PNG, WEBP.`;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
        return `Company logo exceeds the ${(MAX_LOGO_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB size limit.`;
    }
    return null;
};

const ADDR_TYPE_TO_PROOF_BASE = {
    REGISTERED:          'proof_registered_address',
    MAILING:             'proof_mailing_address',
    BUSINESS:            'proof_business_address',
    FOREIGN:             'proof_foreign_address',
    OTHER:               'proof_other_address',
    REGISTER_OF_MEMBERS: 'proof_register_of_members_address',
};

const CSV_FIELDS = ['segregation_ids', 'bn_ids', 'service_ids', 'group_ids'];
const toCSV = (val) => {
    if (val === undefined || val === null) return null;
    if (Array.isArray(val)) return val.length ? val.join(',') : null;
    return val;
};

const DETAIL_FIELDS = [
    'corp_sec_id', 'segregation_ids', 'bn_ids', 'service_ids', 'fee_id',
    'e_status_id', 'related_industry_id', 'software_id',
    'ssic_id', 'ssic_user_description', 'ssic_id_secondary', 'ssic_user_description_secondary',
    'risk_assessment_rating', 'public_interest_company', 'location_common_seal_remarks',
    'jurisdiction_incorp_name', 'jurisdiction_corp_name', 'jurisdiction_corp_id',
    'country', 'country_id', 'region_id', 'jurisdiction_id',
    'company_incorporation_date', 'company_takeover_date', 'company_fin_date',
    'mail_redirection', 'holding_company_name', 'holding_company_entity_id',
    'company_xbrl_required', 'company_services_provided', 'bank_id',
    'logo_name', 'logo_url',
    'admin_access', 'group_access', 'user_access', 'person_in_charge',
    'group_ids', 'referral_source', 'company_referral_partner_id',
    'individual_referral_partner_id', 'senior_partner_id', 'lawyer_id', 'manager_id',
    'source_from',
];

// DATEONLY columns on entity_company_details — an incoming '' (field cleared
// client-side) must be stored as NULL, never as an empty string.
const DATE_FIELDS = new Set([
    'company_incorporation_date', 'company_takeover_date', 'company_fin_date',
]);
const normalizeDetailValue = (f, v) => (DATE_FIELDS.has(f) && v === '') ? null : v;

const TYPE_FIELD_KEY = {
    1:  'company_registered_address',
    2:  'company_foreign_address',
    3:  'company_mailing_address',
    15: 'company_business_address',
    16: 'company_other_address',
    25: 'company_register_of_members_address',
    4:  'company_name',
    30: 'company_formar_name',
    38: 'company_type',
    11: 'company_email',
    12: 'company_contact_num',
    13: 'company_telephone_no',
};

// History field_type_ids stored encrypted (only matters when IS_ENCRYPT=true)
const ENCRYPTED_HISTORY_FIELD_TYPE_IDS = new Set([4, 11]);

const _eventJsonPayload = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) return parsed;
        } catch {
            return fallback;
        }
    }
    return fallback;
};

const _flattenEventParties = (value) => {
    const payload = _eventJsonPayload(value, []);
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
        return [
            ...(Array.isArray(payload.officials) ? payload.officials : []),
            ...(Array.isArray(payload.users) ? payload.users : []),
            ...(Array.isArray(payload.custom) ? payload.custom : []),
        ];
    }
    return [];
};

const _isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const _contactEmail = (value) => {
    const clean = String(value || '').trim();
    if (!clean) return '';
    if (_isEmail(clean)) return clean;
    if (/^[a-f0-9]+$/i.test(clean) && clean.length % 2 === 0) {
        const decrypted = decrypt(clean);
        if (decrypted && _isEmail(decrypted)) return decrypted;
    }
    return clean;
};

class EntityCompanyService {

    constructor() {
        this.entityDao                   = new EntityCompanyDao();
        this.detailDao                   = new EntityCompanyDetailDao();
        this.addressDao                  = new EntityAddressDao();
        this.contactDao                  = new EntityContactDao();
        this.identificationDao           = new EntityIdentificationDao();
        this.entityFieldChangeHistoryDao = new EntityFieldChangeHistoryDao();
        this.statusDateDao               = new EntityStatusDateDao();
        this.documentStoreDao            = new DocumentStoreDaos();
        this.userDao                     = new UserDao();
    }

    // Upsert the entity_status_date row for (entity_id, e_status_id): update the
    // existing row's date/remarks if this entity has already recorded that status
    // before, otherwise insert a new one. One row per status per company — not an
    // append-only log.
    _upsertStatusDate = async (entityId, body, userId, t) => {
        if (!body.e_status_id || !body.status_effective_date) return;
        const models = getCurrentModels();

        const existing = await models.entity_status_date.findOne({
            where: { entity_id: entityId, e_status_id: body.e_status_id },
            transaction: t,
        });

        if (existing) {
            await existing.update({
                effective_date: body.status_effective_date,
                remarks:        body.status_remarks || null,
            }, { transaction: t });
            return;
        }

        await models.entity_status_date.create({
            entity_id:      entityId,
            e_status_id:    body.e_status_id,
            effective_date: body.status_effective_date,
            remarks:        body.status_remarks || null,
            created_by:     userId || null,
        }, { transaction: t });
    };

    _primaryEmailsByOfficialId = async (models, partyRows = []) => {
        if (!models.officials || !models.entity_contact) return {};

        const officialIds = [...new Set((partyRows || [])
            .map(row => Number(row?.official_id))
            .filter(Boolean))];
        if (!officialIds.length) return {};

        const officials = await models.officials.findAll({
            attributes: ['official_id', 'official_entity_id'],
            where: {
                official_id: { [Op.in]: officialIds },
                is_deleted: 0,
            },
        });

        const officialToEntity = {};
        const entityIds = [];
        officials.forEach(row => {
            const plain = row?.toJSON ? row.toJSON() : row;
            if (plain.official_id && plain.official_entity_id) {
                officialToEntity[plain.official_id] = Number(plain.official_entity_id);
                entityIds.push(Number(plain.official_entity_id));
            }
        });

        const uniqueEntityIds = [...new Set(entityIds.filter(Boolean))];
        if (!uniqueEntityIds.length) return {};

        const contacts = await models.entity_contact.findAll({
            attributes: ['entity_id', 'contact_value', 'is_primary', 'contact_id'],
            where: {
                entity_id: { [Op.in]: uniqueEntityIds },
                contact_type: 'EMAIL',
                is_deleted: false,
            },
            order: [['is_primary', 'DESC'], ['contact_id', 'ASC']],
        });

        const emailByEntityId = {};
        contacts.forEach(row => {
            const plain = row?.toJSON ? row.toJSON() : row;
            const email = _contactEmail(plain.contact_value);
            if (!emailByEntityId[plain.entity_id] && _isEmail(email)) {
                emailByEntityId[plain.entity_id] = email;
            }
        });

        return officialIds.reduce((acc, officialId) => {
            const entityId = officialToEntity[officialId];
            if (entityId && emailByEntityId[entityId]) acc[officialId] = emailByEntityId[entityId];
            return acc;
        }, {});
    };

    _enrichReceivingParties = async (models, receivingParties, event = {}) => {
        const payload = _eventJsonPayload(receivingParties, []);
        const rows = _flattenEventParties(payload);
        const emailByOfficialId = await this._primaryEmailsByOfficialId(models, rows);

        const enrichRow = (row = {}) => {
            if (row?.official_id) {
                const email = emailByOfficialId[Number(row.official_id)] || '';
                if (!email) {
                    logger.warn('Company event official recipient has no primary email', {
                        companyEventId: event.company_event_id || null,
                        officialId: row.official_id,
                        officialEntityId: row.official_entity_id || null,
                        channel: row.channel || '',
                    });
                }
                return { ...row, email };
            }
            return row;
        };

        if (Array.isArray(payload)) return payload.map(enrichRow);
        if (payload && typeof payload === 'object') {
            return {
                ...payload,
                officials: Array.isArray(payload.officials) ? payload.officials.map(enrichRow) : [],
                users: Array.isArray(payload.users) ? payload.users : [],
                custom: Array.isArray(payload.custom) ? payload.custom : [],
            };
        }
        return payload;
    };

    _enrichCompanyEvents = async (models, events = []) => Promise.all((events || []).map(async (eventRow) => {
        const event = eventRow?.toJSON ? eventRow.toJSON() : { ...eventRow };
        return {
            ...event,
            allowed_status_transitions: this._allowedEventStatusTransitions(event),
            receiving_parties: await this._enrichReceivingParties(models, event.receiving_parties, event),
        };
    }));

    _allowedEventStatusTransitions(event = {}) {
        const status = String(event.status || EVENT_STATUS.PENDING).toUpperCase();
        return ALLOWED_STATUS_TRANSITIONS[status] || [];
    }

    _formatOfficialRoles = (officials = [], subRoleNameBySlug = {}) => {
        const grouped = {};

        (officials || []).forEach(row => {
            const plain = row?.toJSON ? row.toJSON() : row;
            const master = plain.official_master || {};
            const roleName = master.official_master_name || plain.official_master_slug || '';
            if (!roleName) return;

            if (!grouped[roleName]) {
                grouped[roleName] = {
                    role_name: roleName,
                    official_master_id: plain.official_master_id || master.official_master_id || null,
                    official_master_slug: plain.official_master_slug || master.official_master_slug || null,
                    officials_count: 0,
                    official_ids: [],
                    official_entities: [],
                    sub_roles: [],
                };
            }

            grouped[roleName].officials_count += 1;
            if (plain.official_id) grouped[roleName].official_ids.push(plain.official_id);
            if (plain.official_entity_id || plain.official_entity?.name) {
                grouped[roleName].official_entities.push({
                    entity_id: plain.official_entity_id || null,
                    name: plain.official_entity?.name || '',
                    client_no: plain.official_entity?.client_no || '',
                    entity_type: plain.official_entity?.entity_type || '',
                });
            }

            (plain.date_records || plain.official_dates || [])
                .filter(date => String(date.is_main_role) !== '1' && (date.official_master_slug || subRoleNameBySlug[date.official_master_slug]))
                .forEach(date => {
                    const subRoleName = subRoleNameBySlug[date.official_master_slug] || date.official_master_slug || '';
                    const exists = grouped[roleName].sub_roles.some(item =>
                        item.sub_role_name === subRoleName
                        && item.official_master_slug === date.official_master_slug
                    );
                    if (!exists) {
                        grouped[roleName].sub_roles.push({
                            sub_role_name: subRoleName,
                            official_master_slug: date.official_master_slug || null,
                        });
                    }
                });
        });

        return Object.values(grouped);
    };

    async _getOfficialMasterNameBySlug(models) {
        if (!models.official_master) return {};

        const rows = await models.official_master.findAll({
            attributes: ['official_master_name', 'official_master_slug'],
        });

        return rows.reduce((acc, row) => {
            const plain = row?.toJSON ? row.toJSON() : row;
            if (plain.official_master_slug) acc[plain.official_master_slug] = plain.official_master_name;
            return acc;
        }, {});
    }

    async _getOfficialRolesByCompanyIds(models, entityIds = []) {
        return getOfficialRoleGroupsByEntityIds(models, entityIds, { entityKey: 'entity_id' });
    }

    async _resolveCompanyCountryId(models, detail, transaction = null) {
        if (detail?.country_id) return Number(detail.country_id);
        const countryName = String(detail?.country || '').trim();
        if (!countryName || !models.countries) return null;

        const row = await models.countries.findOne({
            where: {
                [Op.or]: [
                    { name: countryName },
                    { country_name: countryName },
                ],
            },
            attributes: ['id'],
            transaction,
        });

        const plain = row?.toJSON ? row.toJSON() : row;
        return plain?.id ? Number(plain.id) : null;
    }

    // Spec §5 jurisdiction hierarchy. Unlike country (which has a legacy free-text
    // fallback lookup), jurisdiction is a brand-new field with nothing legacy to
    // reconcile — a company simply has one or doesn't yet.
    _resolveCompanyJurisdictionId(detail) {
        return detail?.jurisdiction_id ? Number(detail.jurisdiction_id) : null;
    }

    // Loads the (small) jurisdictions table once and returns { byId, levelById } so
    // callers can build ancestor chains / specificity tiers in memory instead of
    // issuing N+1 queries per company sync or rule-matching pass.
    async _loadJurisdictionMaps(models, transaction = null) {
        if (!models.jurisdiction) return { byId: {}, levelById: {} };

        const rows = await models.jurisdiction.findAll({
            where: { is_deleted: false },
            attributes: ['jurisdiction_id', 'parent_jurisdiction_id', 'level'],
            transaction,
        });

        const byId = {};
        const levelById = {};
        rows.forEach((row) => {
            const plain = row.toJSON ? row.toJSON() : row;
            byId[plain.jurisdiction_id] = plain.parent_jurisdiction_id || null;
            levelById[plain.jurisdiction_id] = plain.level;
        });

        return { byId, levelById };
    }

    // Self + every ancestor up the parent_jurisdiction_id chain, so a rule scoped to a
    // broader jurisdiction (e.g. a state) still matches a company registered in a
    // narrower one nested under it (e.g. a free zone within that state).
    _jurisdictionAncestorIds(jurisdictionByIdMap, jurisdictionId) {
        const ancestors = [];
        let current = jurisdictionId ? Number(jurisdictionId) : null;
        const seen = new Set();
        while (current && !seen.has(current)) {
            ancestors.push(current);
            seen.add(current);
            current = jurisdictionByIdMap[current] || null;
        }
        return ancestors;
    }

    async _getEventMasters(models) {
        const rows = await models.company_event_name.findAll({
            where: {
                is_deleted: false,
                event_type: 'EVENT',
            },
            attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'category', 'recurring_period', 'recurring_duration', 'operational_lead_days', 'grace_period_days'],
            order: [['e_id', 'ASC']],
        });

        const bySlug = {
            _byEventId: {},
            _byName: {},
            _generationSlugs: [],
        };
        rows.forEach(row => {
            const plain = row.toJSON ? row.toJSON() : row;
            const slug = plain.event_slug || eventSlugFromName(plain.event_name);
            if (!slug) return;
            if (!bySlug[slug]) bySlug[slug] = plain;
            bySlug._byEventId[plain.e_id] = slug;
            bySlug._byName[eventSlugFromName(plain.event_name)] = slug;
            bySlug._generationSlugs.push(slug);
        });

        return bySlug;
    }

    async _getMatchingEventRule(models, slug, eventId, context) {
        let rows = [];
        if (models.company_event_rule) {
            const today = toDateOnly(new Date());
            rows = await models.company_event_rule.findAll({
                where: {
                    [Op.and]: [
                        { [Op.or]: [{ event_id: eventId }, { event_slug: slug }] },
                        { version_status: 'PUBLISHED' },
                        { effective_from: { [Op.lte]: today } },
                        { [Op.or]: [{ effective_to: null }, { effective_to: { [Op.gte]: today } }] },
                        { is_deleted: false },
                    ],
                },
                order: [['rule_id', 'ASC']],
            });
        }

        const matched = rows.filter(row => {
            const plain = row.toJSON ? row.toJSON() : row;
            const config = jsonObject(plain.rule_config);
            const companyTypeIds = csvNumbers(config.company_type_ids);
            if (companyTypeIds.length && !companyTypeIds.includes(Number(context.companyTypeId))) {
                return false;
            }
            return ruleMatchesScope(plain, context) && ruleHasMatchingGroup(plain, context);
        }).map(row => (row.toJSON ? row.toJSON() : row));

        const selectedRule = selectBestRule(matched, context);
        if (selectedRule.selected) return selectedRule;

        const defaultRule = getDefaultCompanyEventRule(slug, context);
        if (!defaultRule) return selectedRule;

        return {
            selected: defaultRule,
            selected_reason: `Locked system default: ${defaultRule.system_default_key}`,
            candidates: [{
                rule_id: null,
                system_default_key: defaultRule.system_default_key,
                matched: true,
                selected: true,
            }],
        };
    }

    async _getSelectedBusinessEntityNames(models, detail, transaction = null) {
        const selectedBusinessEntityIds = csvNumbers(detail?.bn_ids);
        if (!selectedBusinessEntityIds.length || !models.business_entity) return [];

        const selectedBusinessEntities = await models.business_entity.findAll({
            where: {
                bn_id: { [Op.in]: selectedBusinessEntityIds },
                is_deleted: false,
            },
            attributes: ['bn_id', 'bs_name'],
            transaction,
        });

        return selectedBusinessEntities.map(row => String(row.bs_name || '').trim().toLowerCase());
    }

    async _generateInitialCompanyEvents(entityId, entityData, detailData, transaction = null) {
        const models = getCurrentModels();
        const businessEntityNames = await this._getSelectedBusinessEntityNames(models, detailData, transaction);
        const isCorporateSecretarialClient = businessEntityNames.includes('corporate shareholder client');
        const isTaxationClient = businessEntityNames.includes('taxation client');
        if ((!isCorporateSecretarialClient && !isTaxationClient) || !detailData?.company_incorporation_date) return [];

        const eventDetail = await this._ensureFirstFinancialYearEnd(
            models,
            entityId,
            detailData,
            entityData?.created_by || entityData?.updated_by || null,
            transaction
        );

        return this._syncCompanyEvents(entityId, entityData, eventDetail, transaction);
    }

    async _ensureFirstFinancialYearEnd(models, entityId, detailData, userId = null, transaction = null) {
        const detail = { ...(detailData || {}) };
        if (detail.company_fin_date || !detail.company_incorporation_date) return detail;

        const firstAnniversary = addDatePart(detail.company_incorporation_date, 1, 'YEAR');
        const derivedFye = addDatePart(firstAnniversary, -1, 'DAY');
        if (!derivedFye) return detail;

        detail.company_fin_date = derivedFye;
        if (models.entity_company_details) {
            await models.entity_company_details.update({
                company_fin_date: derivedFye,
                updated_by: userId,
                updated_date: new Date(),
            }, {
                where: { entity_id: entityId, is_deleted: false },
                transaction,
            });
        }

        return detail;
    }

    async _syncCompanyEvents(entityId, entityData, detailData, transaction = null) {
        const models = getCurrentModels();
        if (!models.company_event || !models.company_event_name) return [];

        let detail = detailData || await models.entity_company_details.findOne({
            where: { entity_id: entityId, is_deleted: false },
            transaction,
        }).then(row => row?.toJSON ? row.toJSON() : row);

        if (!detail?.company_incorporation_date && !detail?.company_fin_date) return [];
        detail = await this._ensureFirstFinancialYearEnd(
            models,
            entityId,
            detail,
            entityData?.updated_by || entityData?.created_by || null,
            transaction
        );
        const eventMasters = await this._getEventMasters(models);
        const previousEvents = await models.company_event.findAll({
            where: {
                entity_id: entityId,
                is_deleted: false,
            },
            order: [['due_date', 'DESC'], ['company_event_id', 'DESC']],
            transaction,
        });
        const previousEventsBySlug = {};
        previousEvents.forEach(row => {
            const event = row?.toJSON ? row.toJSON() : row;
            if (!previousEventsBySlug[event.event_slug]) previousEventsBySlug[event.event_slug] = event;
        });

        const resolvedCountryId = await this._resolveCompanyCountryId(models, detail, transaction);
        const resolvedJurisdictionId = this._resolveCompanyJurisdictionId(detail);
        const businessEntityNames = await this._getSelectedBusinessEntityNames(models, detail, transaction);
        const { byId: jurisdictionParentById, levelById: jurisdictionLevelById } = await this._loadJurisdictionMaps(models, transaction);
        const context = {
            entityId,
            companyTypeId: entityData?.company_type_id || null,
            countryId: resolvedCountryId,
            customerCountryId: resolvedCountryId,
            ruleCountryId: resolvedCountryId,
            country: detail.country || null,
            jurisdictionId: resolvedJurisdictionId,
            jurisdictionAncestorIds: this._jurisdictionAncestorIds(jurisdictionParentById, resolvedJurisdictionId),
            jurisdictionLevelById,
            eventSlugByEventId: eventMasters._byEventId || {},
            incorporationDate: toDateOnly(detail.company_incorporation_date),
            fyeDate: toDateOnly(detail.company_fin_date),
            heldDate: null,
            periodMonths: null,
            businessEntityNames,
            previousEventsBySlug,
        };
        context.periodMonths = monthsBetween(context.incorporationDate, context.fyeDate);

        const generatedBySlug = {};
        const rows = [];
        const taxEventSlugs = new Set(['eci', 'tax-return']);
        const isCorporateSecretarialClient = businessEntityNames.includes('corporate shareholder client');
        const isTaxationClient = businessEntityNames.includes('taxation client');
        const generationOrder = { agm: 1, 'india-agm': 1, ar: 2, 'india-aoc-4': 2, 'india-mgt-7': 2 };
        const slugs = [...(eventMasters._generationSlugs || [])].sort((left, right) =>
            (generationOrder[left] || 100) - (generationOrder[right] || 100)
        );
        for (const slug of slugs) {
            const isTaxEvent = taxEventSlugs.has(slug) || String(eventMasters[slug]?.category || '').toUpperCase() === 'TAX';
            if (isTaxEvent && !isTaxationClient) continue;
            if (!isTaxEvent && !isCorporateSecretarialClient) continue;

            const eventMaster = eventMasters[slug];
            if (!eventMaster) continue;

            context.rulePhase = previousEventsBySlug[slug] ? 'SUBSEQUENT' : 'FIRST';
            const ruleResult = await this._getMatchingEventRule(models, slug, eventMaster.e_id, context);
            const rule = ruleResult.selected;
            if (!rule) continue;

            const result = calculateRuleDate(rule, context, generatedBySlug);
            if (!result?.due_date) continue;

            const row = {
                entity_id: entityId,
                event_id: eventMaster.e_id,
                event_slug: slug,
                rule_id: rule.rule_id || null,
                year_of_fye: context.fyeDate ? String(new Date(context.fyeDate).getFullYear()) : null,
                period_start: context.incorporationDate || null,
                period_end: context.fyeDate || null,
                actual_year: context.fyeDate ? String(new Date(context.fyeDate).getFullYear()) : null,
                actual_fye: context.fyeDate || null,
                fye_date: context.fyeDate || null,
                base_date: result.base_date,
                due_date: result.due_date,
                operational_target_date: addDatePart(result.due_date, -(Number(eventMaster.operational_lead_days) || 7), 'DAY'),
                grace_end_date: Number(eventMaster.grace_period_days) > 0
                    ? addDatePart(result.due_date, Number(eventMaster.grace_period_days), 'DAY')
                    : null,
                penalty_start_date: addDatePart(result.due_date, Number(eventMaster.grace_period_days) || 0, 'DAY'),
                source_from: 'AUTO_RULE',
                source_basis: result.source_basis,
                generated_from_date: context.incorporationDate || null,
                recurring_period: eventMaster.recurring_period || 0,
                recurring_duration: eventMaster.recurring_duration || '',
                attendees: [],
                receiving_parties: [],
                is_deleted: false,
                created_by: entityData?.created_by || entityData?.updated_by || null,
                updated_by: entityData?.updated_by || entityData?.created_by || null,
                updated_date: new Date(),
            };

            const existing = await models.company_event.findOne({
                where: {
                    entity_id: entityId,
                    event_id: eventMaster.e_id,
                    source_from: 'AUTO_RULE',
                    is_deleted: false,
                },
                transaction,
            });

            let savedEvent;
            if (existing) {
                // Closed events are historical compliance evidence. Company
                // date changes may recalculate only open system events.
                if (!this._canRecalculateSystemEvent(existing)) {
                    rows.push(existing);
                    generatedBySlug[slug] = existing.toJSON ? existing.toJSON() : existing;
                    continue;
                }
                // Regeneration must never touch workflow status — a manually
                // progressed (or terminal) status must survive resync. Only
                // due_date/derived scheduling fields are refreshed here.
                await existing.update(row, { transaction });
                savedEvent = existing;
                rows.push(existing);
            } else {
                row.status = EVENT_STATUS.PENDING;
                row.created_date = new Date();
                savedEvent = await models.company_event.create(row, { transaction });
                rows.push(savedEvent);

                await copyChecklistTemplateToEvent(models, {
                    companyEventId: savedEvent.company_event_id, eventMasterId: eventMaster.e_id,
                    entityId, eventId: eventMaster.e_id, eventSlug: slug,
                    userId: row.updated_by,
                }, transaction);
            }

            await this._writeCalculationTrace(models, {
                savedEvent,
                entityId,
                eventMaster,
                slug,
                rule,
                ruleResult,
                context,
                result,
                userId: row.updated_by,
            }, transaction);

            generatedBySlug[slug] = row;
        }

        return rows;
    }

    _canRecalculateSystemEvent(event) {
        const source = String(event?.source_from || '').toUpperCase();
        const status = String(event?.status || EVENT_STATUS.PENDING).toUpperCase();
        return source === 'AUTO_RULE' && OPEN_EVENT_STATUSES.includes(status);
    }

    // Additive audit record explaining why a due date was calculated (spec §5.1/§6.5/§14.2
    // "Why is this due?"). Must never block event generation, so failures are swallowed.
    async _writeCalculationTrace(models, payload, transaction) {
        if (!models.compliance_rule_calculation_log) return;

        const { savedEvent, entityId, eventMaster, slug, rule, ruleResult, context, result, userId } = payload;

        try {
            const trace = await models.compliance_rule_calculation_log.create({
                company_event_id: savedEvent?.company_event_id || null,
                entity_id: entityId,
                event_id: eventMaster.e_id,
                event_slug: slug,
                rule_id: rule?.rule_id || null,
                rule_code: rule?.rule_code || rule?.rule_id || null,
                rule_version_no: rule?.version_no || null,
                rule_phase: context.rulePhase || null,
                trigger_date_basis: result.source_basis || null,
                trigger_date: result.base_date || null,
                base_date: result.base_date || null,
                computed_due_date: result.due_date || null,
                formula_steps: getRuleGroups(rule, context.rulePhase),
                candidate_rules: ruleResult.candidates || [],
                selected_reason: ruleResult.selected_reason || null,
                created_date: new Date(),
                created_by: userId || null,
            }, { transaction });

            if (savedEvent?.update) {
                await savedEvent.update({ calculation_trace_id: trace.calculation_log_id }, { transaction });
            }
        } catch (err) {
            logger.warn('Failed to write compliance calculation trace:', err?.message || err);
        }
    }

    _eventEventInclude(models) {
        return models.company_event_name ? [{
            model: models.company_event_name,
            as: 'event',
            required: false,
            attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'recurring_period', 'recurring_duration'],
        }] : [];
    }

    getEventDetails = async (entityId, query = {}) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');

            const models = getCurrentModels();
            if (!models.company_event) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event event model is unavailable');
            }

            const where = { entity_id: entityId, is_deleted: false };
            if (query.company_event_id) where.company_event_id = query.company_event_id;
            if (query.event_slug) where.event_slug = query.event_slug;

            const include = [
                ...this._eventEventInclude(models),
            ];

            const rows = await models.company_event.findAll({
                where,
                include,
                order: [['due_date', 'ASC'], ['company_event_id', 'ASC']],
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Company event event details fetched', rows);
        } catch (err) {
            logger.error('Get event event details error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching event event details');
        }
    };

    validateActualFye = async (entityId, body = {}) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            }

            const models = getCurrentModels();
            const detail = await models.entity_company_details.findOne({
                where: { entity_id: entityId, is_deleted: false },
            }).then(row => row?.toJSON ? row.toJSON() : row);

            const incorporationDate = toDateOnly(detail?.company_incorporation_date);
            const actualFye = toDateOnly(body.actual_fye || body.company_fin_date || body.fye_date);
            if (!incorporationDate) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Please update incorporation date first');
            }
            if (!actualFye) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Actual FYE date is required');
            }

            const lastAllowedFye = addDatePart(incorporationDate, 18, 'MONTH');
            const isOutOfRange = dateFromOnly(actualFye) > dateFromOnly(lastAllowedFye);
            if (body.strict_range === true && isOutOfRange) {
                return responseHandler.returnSuccess(httpStatus.OK, 'FYE is out of allowed range', {
                    status: 'out_of_range',
                    range_status: 'out_of_range',
                    message: 'AGM has to be held within 18 months from incorporation date',
                    incorporation_date: incorporationDate,
                    actual_fye: actualFye,
                    last_allowed_fye: lastAllowedFye,
                });
            }

            const eventMasters = models.company_event_name
                ? await this._getEventMasters(models)
                : {};
            const agmSlug = eventMasters._byName?.['annual-general-meeting']
                || eventMasters._byName?.agm
                || null;

            const existing = models.company_event && agmSlug
                ? await models.company_event.findOne({
                    where: {
                        entity_id: entityId,
                        event_slug: agmSlug,
                        period_end: actualFye,
                        is_deleted: false,
                    },
                })
                : null;

            return responseHandler.returnSuccess(httpStatus.OK, 'FYE allowed', {
                status: existing ? 'CONFIRM' : 'ALLOW',
                range_status: isOutOfRange ? 'out_of_range' : 'ALLOW',
                message: existing ? 'FYE already has event records. Confirm before changing.' : 'FYE allowed',
                incorporation_date: incorporationDate,
                actual_fye: actualFye,
                last_allowed_fye: lastAllowedFye,
            });
        } catch (err) {
            logger.error('Validate actual FYE error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error validating FYE');
        }
    };

    syncEvents = async (entityId, body = {}) => {
        const models = getCurrentModels();
        const t = await models.sequelize.transaction();
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            }

            const detailUpdates = {};
            if (body.company_fin_date || body.actual_fye || body.fye_date) {
                detailUpdates.company_fin_date = toDateOnly(body.company_fin_date || body.actual_fye || body.fye_date);
            }
            if (body.company_incorporation_date) {
                detailUpdates.company_incorporation_date = toDateOnly(body.company_incorporation_date);
            }

            if (Object.keys(detailUpdates).length) {
                detailUpdates.updated_by = body.updated_by || body.created_by || null;
                detailUpdates.updated_date = new Date();
                await models.entity_company_details.update(detailUpdates, {
                    where: { entity_id: entityId, is_deleted: false },
                    transaction: t,
                });
            }

            const rows = await this._syncCompanyEvents(
                entityId,
                entity.toJSON ? entity.toJSON() : entity,
                null,
                t
            );

            await t.commit();
            return responseHandler.returnSuccess(httpStatus.OK, 'Company events synced', {
                events: rows.map(row => row?.toJSON ? row.toJSON() : row),
            });
        } catch (err) {
            await t.rollback();
            logger.error('Sync company events error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error syncing company events');
        }
    };

    _buildIdentRow(body, entityId, createdBy) {
        const hasAny = body.uen_no || body.fbrn_reg_no || body.uf_no || body.domes_bus_no || body.acra_no;
        if (!hasAny) return null;
        return {
            entity_id:    entityId,
            entity_type:  'COMPANY',
            uen_no:       body.uen_no       || null,
            fbrn_reg_no:  body.fbrn_reg_no  || null,
            uf_no:        body.uf_no        || null,
            domes_bus_no: body.domes_bus_no || null,
            acra_no:      body.acra_no      || null,
            is_primary:   true,
            is_deleted:   false,
            created_by:   createdBy         || null,
            updated_date: new Date(),
        };
    }

    async _checkEntity(entityId) {
        return this.entityDao.findOneByWhere({
            entity_id:   entityId,
            entity_type: 'COMPANY',
            is_deleted:  false,
        });
    }

    // Returns { byEntityAndProofType: { [entityId]: { [proofType]: docs[] } } }
    _getAllDocuments = async (entityIds) => {
        const allDocs = await this.documentStoreDao.findByWhere({
            entity_id:  { [Op.in]: entityIds },
            is_deleted: false,
        });

        const byEntityAndProofType = (allDocs || []).reduce((acc, doc) => {
            const d = doc?.toJSON ? doc.toJSON() : doc;
            if (!acc[d.entity_id])             acc[d.entity_id]             = {};
            if (!acc[d.entity_id][d.proof_type]) acc[d.entity_id][d.proof_type] = [];
            acc[d.entity_id][d.proof_type].push(d);
            return acc;
        }, {});

        return { byEntityAndProofType };
    };

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
            logger.error(`[_resolvePort] portName="${portName}":`, err.message);
            throw err;
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  GET FIELD HISTORY
    // ═════════════════════════════════════════════════════════════════════════
    getFieldHistory = async (entityId, query) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            }

            const fieldTypeId = query.type_id;
            if (!fieldTypeId) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'type_id is required');
            }

            const where = { entity_id: entityId, field_type_id: fieldTypeId };
            if (query.ref_id) where.ref_id = query.ref_id;

            const rows = await this.entityFieldChangeHistoryDao.findByWhere(
                where, null, ['change_id', 'DESC'], 100
            );

            const userIds = [...new Set(rows.map(r => r.changed_by).filter(Boolean))];
            const users   = await this.userDao.findByWhere({ user_id: { [Op.in]: userIds } });
            const userMap = {};
            users.forEach(u => { userMap[u.user_id] = `${u.first_name} ${u.last_name}` || `User #${u.user_id}`; });

            // Decrypt history values only when IS_ENCRYPT=true and field is encrypted type
            const isEncryptedType = IS_ENCRYPT && ENCRYPTED_HISTORY_FIELD_TYPE_IDS.has(Number(fieldTypeId));

            const history = rows.map(r => ({
                change_id:      r.change_id,
                old_value:      isEncryptedType ? (_dec(r.old_value) || r.old_value || '') : (r.old_value || ''),
                new_value:      isEncryptedType ? (_dec(r.new_value) || r.new_value || '') : (r.new_value || ''),
                field_type_id:  r.field_type_id  || '',
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
            if (!entity) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            }

            const fieldTypeId = body.field_type_id;
            const isProposed  = body.is_proposed === true || body.is_proposed === 1;
            const newValue    = body.new_value  || '';
            const oldValue    = body.old_value  || '';
            const refId       = body.ref_id     || null;
            const updatedBy   = body.updated_by || null;
            const today       = new Date().toISOString().split('T')[0];

            let effectiveDate = isProposed ? '' : (body.effective_date || '');
            let proposedDate  = isProposed ? (body.effective_date || '') : '';

            // Store history values encrypted only when IS_ENCRYPT=true and field warrants it
            const isEncryptedType = IS_ENCRYPT && ENCRYPTED_HISTORY_FIELD_TYPE_IDS.has(Number(fieldTypeId));
            const storedNewValue  = isEncryptedType ? (_enc(newValue) || newValue) : newValue;
            const storedOldValue  = isEncryptedType ? (_enc(oldValue) || oldValue) : oldValue;

            const existing = await this.entityFieldChangeHistoryDao.findOneByWhere({
                entity_id:     entityId,
                field_type_id: fieldTypeId,
                cron_status:   0,
                ...(refId ? { ref_id: refId } : {}),
            });

            if (existing) {
                await this.entityFieldChangeHistoryDao.updateWhere(
                    { cron_status: 2 },
                    { change_id: existing.change_id }
                );
            }

            const changeRecord = await this.entityFieldChangeHistoryDao.create({
                entity_id:        entityId,
                field_key:        TYPE_FIELD_KEY[fieldTypeId] || body.field || '',
                field_type_id:    fieldTypeId,
                identification_id: null,
                old_value:        storedOldValue,
                new_value:        storedNewValue,
                effective_date:   effectiveDate || null,
                proposed_date:    proposedDate  || null,
                is_proposed:      isProposed ? 1 : 0,
                ref_id:           refId,
                cron_status:      0,
                changed_by:       updatedBy,
                created_at:       new Date(),
            });

            const shouldApplyNow = !isProposed && effectiveDate && effectiveDate <= today;
            if (shouldApplyNow) {
                await this._applyFieldChangeNow({ entityId, fieldTypeId, newValue, body, changeRecord });
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Change recorded successfully',
                { change_id: changeRecord.change_id, applied: shouldApplyNow }
            );

        } catch (err) {
            logger.error('saveFieldChange error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error saving field change');
        }
    };

    _applyFieldChangeNow = async ({ entityId, fieldTypeId, newValue, body, changeRecord }) => {
        const models    = getCurrentModels();
        const updatedBy = body.updated_by || null;

        switch (fieldTypeId) {
            case 4:
                // IS_ENCRYPT=true  → encrypt before write
                // IS_ENCRYPT=false → plain write
                await models.entities.update(
                    { name: _enc(newValue), updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            case 30:
                await models.entities.update(
                    { former_name: newValue, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            case 38:
                await models.entities.update(
                    { company_type_id: newValue, updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                break;
            case 11:
                await models.entity_contact.update(
                    { contact_value: _enc(newValue), updated_by: updatedBy, updated_date: new Date() },
                    { where: { entity_id: entityId, contact_type: 'EMAIL', is_primary: true, is_deleted: false } }
                );
                break;
            case 5: {
                const extra = body.extra || {};
                await models.entity_company_details.update(
                    { ssic_id: extra.ssic_id || null, ssic_user_description: extra.ssic_user_description || null, updated_date: new Date(), updated_by: updatedBy },
                    { where: { entity_id: entityId, is_deleted: false } }
                );
                break;
            }
            case 6: {
                const extra = body.extra || {};
                await models.entity_company_details.update(
                    { ssic_id_secondary: extra.ssic_id || null, ssic_user_description_secondary: extra.ssic_user_description || null, updated_date: new Date(), updated_by: updatedBy },
                    { where: { entity_id: entityId, is_deleted: false } }
                );
                break;
            }
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
            case 1: case 3: case 15: case 2: case 16: case 25: {
                const addrTypeMap = { 1: 'REGISTERED', 3: 'MAILING', 15: 'BUSINESS', 2: 'FOREIGN', 16: 'OTHER', 25: 'REGISTER_OF_MEMBERS' };
                const extra = body.extra || {};
                await models.entity_address.update(
                    {
                        block_no: extra.block_no || null, street_name: extra.street_name || null,
                        building_name: extra.building_name || null, level_no: extra.level_no || null,
                        unit_no: extra.unit_no || null, country: extra.country || 'Singapore',
                        state: extra.state || null, city: extra.city || null,
                        postal_code: extra.postal_code || null, updated_date: new Date(),
                    },
                    { where: { entity_id: entityId, address_type: addrTypeMap[fieldTypeId], is_deleted: false } }
                );
                break;
            }
            default:
                logger.warn(`_applyFieldChangeNow: no handler for field_type_id=${fieldTypeId}`);
                break;
        }

        await this.entityFieldChangeHistoryDao.updateWhere(
            { cron_status: 1 },
            { change_id: changeRecord.change_id }
        );
    };

    async _getDocuments(entityId) {
        const where = { entity_id: entityId, entity_type: 'company', module_name: 'company', is_deleted: false };
        const rows  = await this.documentStoreDao.findByWhere(where);
        const allDocs = (rows || []).map(d => ({
            doc_id: d.doc_id, sub_module_name: d.sub_module_name,
            module_record_id: d.module_record_id, doc_category: d.doc_category,
            file_path: d.file_path || null, file_name: d.doc_name || null,
        }));

        const byProofType = {};
        allDocs.forEach(d => {
            if (d.sub_module_name && d.sub_module_name.startsWith('proof_')) {
                if (!byProofType[d.sub_module_name]) byProofType[d.sub_module_name] = [];
                byProofType[d.sub_module_name].push(d);
            }
        });

        return { byProofType, allDocs };
    }

    _uploadAndPatchDocuments = async ({ files, entityId, userId, portId, portName, req, addressIdByType = {}, body = {} }) => {
        const models = getCurrentModels();
        const result = { logo: null, logo_error: null };

        // ── Company logo ──
        const logoFile = files.find(f => f.fieldname === LOGO_FIELDNAME);
        if (logoFile) {
            const validationError = _validateLogoFile(logoFile);
            if (validationError) {
                result.logo_error = validationError;
                logger.error(`[Company uploadAndPatch] logo entity=${entityId}: ${validationError}`);
            } else {
                try {
                    const doc = await documentHelper.uploadDocument({
                        file: logoFile, userId, port_number: portId, port_name: portName,
                        entity_id: entityId, entity_type: 'company', module_name: LOGO_MODULE_NAME,
                        sub_module_name: LOGO_SUB_MODULE_NAME, module_record_id: entityId,
                        doc_category: LOGO_DOC_CATEGORY, doc_name: logoFile.originalname || 'company_logo',
                        sub_folder: LOGO_SUB_FOLDER, replace_existing: true, delete_old_file: true,
                        existing_where: {
                            entity_id: entityId, module_record_id: entityId, entity_type: 'company',
                            module_name: LOGO_MODULE_NAME, sub_module_name: LOGO_SUB_MODULE_NAME,
                        },
                        req,
                    });
                    if (doc) {
                        await models.entity_company_details.update(
                            { logo_name: logoFile.originalname || null, logo_url: doc.file_path || null, updated_date: new Date() },
                            { where: { entity_id: entityId } }
                        );
                        result.logo = { doc_id: doc.doc_id, url: doc.file_path || null, name: logoFile.originalname || null };
                        logger.info(`[Company uploadAndPatch] logo entity=${entityId} → ${doc.file_path}`);
                    }
                } catch (err) {
                    result.logo_error = err.message || 'Failed to upload company logo.';
                    logger.error(`[Company uploadAndPatch] logo: ${err.message}`);
                }
            }
        } else if (['true', '1'].includes(String(body.remove_company_logo))) {
            try {
                const oldDoc = await this.documentStoreDao.findOneByWhere({
                    entity_id: entityId, module_record_id: entityId, entity_type: 'company',
                    module_name: LOGO_MODULE_NAME, sub_module_name: LOGO_SUB_MODULE_NAME, is_deleted: false,
                });
                if (oldDoc) await documentHelper.removeDocument({ doc_id: oldDoc.doc_id, userId, port_number: portId, hard_delete: true });
                await models.entity_company_details.update(
                    { logo_name: null, logo_url: null, updated_date: new Date() },
                    { where: { entity_id: entityId } }
                );
                logger.info(`[Company uploadAndPatch] logo removed entity=${entityId}`);
            } catch (err) {
                result.logo_error = err.message || 'Failed to remove company logo.';
                logger.error(`[Company uploadAndPatch] remove logo: ${err.message}`);
            }
        }

        const proofFiles = files.filter(f => PROOF_BASE_NAMES[(f.fieldname || '').replace(/\[\]$/, '')]);
        const proofResultByAddrType = {};

        for (const file of proofFiles) {
            const fieldname = (file.fieldname || '').replace(/\[\]$/, '');
            const mapping   = PROOF_BASE_NAMES[fieldname];
            if (!mapping) continue;

            const addrType  = mapping.addrType;
            const addressId = addressIdByType[addrType];

            try {
                const doc = await documentHelper.uploadDocument({
                    file, userId, port_number: portId, port_name: portName,
                    entity_id: entityId, entity_type: 'company', module_name: 'company',
                    sub_module_name: mapping.sub_module_base, module_record_id: addressId || entityId,
                    doc_category: mapping.docCategory, doc_name: file.originalname || fieldname,
                    sub_folder: mapping.subFolder, replace_existing: false, delete_old_file: false, req,
                });

                if (doc) {
                    if (!proofResultByAddrType[addrType]) proofResultByAddrType[addrType] = [];
                    proofResultByAddrType[addrType].push({ doc_id: doc.doc_id, file_path: doc.file_path || '', file_name: file.originalname || '' });
                    if (addressId) await this.documentStoreDao.updateWhere({ module_record_id: addressId }, { doc_id: doc.doc_id });
                    logger.info(`[Company uploadAndPatch] proof entity=${entityId} addrType=${addrType} → ${doc.file_path}`);
                }
            } catch (err) {
                logger.error(`[Company uploadAndPatch] proof "${fieldname}": ${err.message}`);
            }
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
            } catch (err) {
                logger.warn(`[Company uploadAndPatch] patch address addr=${addressId}: ${err.message}`);
            }
        }

        return result;
    };

    // ─── CREATE ───────────────────────────────────────────────────────────────
    create = async (body, files = [], userId = null, req = null) => {
        const models   = getCurrentModels();
        const portName = body.port_name || null;
        let   portId   = null;
        if (portName) {
            try { const r = await this._resolvePort(portName); portId = r.port_number; }
            catch (e) { logger.warn(`[create] port "${portName}": ${e.message}`); }
        }

        // Validate the logo before touching the DB — an invalid file should
        // fail the request outright rather than silently dropping the logo
        // after the company record has already been committed.
        const incomingLogoFile = (files || []).find(f => f.fieldname === LOGO_FIELDNAME);
        if (incomingLogoFile) {
            const logoValidationError = _validateLogoFile(incomingLogoFile);
            if (logoValidationError) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, logoValidationError);
            }
        }

        const t = await models.sequelize.transaction();

        try {
            const entity = await models.entities.create({
                entity_type:        'COMPANY',
                name:               _enc(body.name),   // IS_ENCRYPT=true → ciphertext, false → plain
                former_name:        body.former_name        || null,
                client_no:          body.client_no          || null,
                status:             body.status             || 'ACTIVE',
                company_type_id:    body.company_type_id    || null,
                remarks:            body.remarks            || null,
                additional_remarks: body.additional_remarks || null,
                is_deleted:         false,
                created_by:         body.created_by         || null,
                updated_by:         body.created_by         || null,
                updated_date:       new Date(),
            }, { transaction: t });

            const entityId = entity.entity_id;

            const identRow = this._buildIdentRow(body, entityId, body.created_by);
            if (identRow) await models.entity_identification.create(identRow, { transaction: t });

            const detailData = { entity_id: entityId, is_deleted: false, created_by: body.created_by || null, updated_by: body.created_by || null, updated_date: new Date() };
            DETAIL_FIELDS.forEach(f => {
                const v = CSV_FIELDS.includes(f) ? toCSV(body[f]) : (body[f] ?? null);
                detailData[f] = normalizeDetailValue(f, v);
            });
            await models.entity_company_details.create(detailData, { transaction: t });

            await this._upsertStatusDate(entityId, body, body.created_by, t);

            await this._generateInitialCompanyEvents(
                entityId,
                { ...body, company_type_id: entity.company_type_id },
                detailData,
                t
            );

            const addressIdByType = {};
            let defaultAddressId  = null;
            if (Array.isArray(body.addresses) && body.addresses.length > 0) {
                for (const [idx, addr] of body.addresses.entries()) {
                    const saved = await models.entity_address.create({
                        entity_id: entityId, entity_type: 'COMPANY',
                        address_type: addr.address_type || 'REGISTERED',
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
                    addressIdByType[saved.address_type] = saved.address_id;
                    if (saved.is_primary) defaultAddressId = saved.address_id;
                }
            }

            let defaultContactId = null;
            if (Array.isArray(body.contacts) && body.contacts.length > 0) {
                const rows = body.contacts.map((c, idx) => ({
                    entity_id: entityId, entity_type: 'COMPANY',
                    contact_type: c.contact_type || 'EMAIL',
                    phone_country_code: c.phone_country_code || '+65',
                    contact_value: _enc(c.contact_value) || null,  // IS_ENCRYPT switch
                    is_primary: c.is_primary ?? (idx === 0),
                    is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
                }));
                const created = await models.entity_contact.bulkCreate(rows, { transaction: t });
                const primary = created.find(c => c.is_primary) || created[0];
                defaultContactId = primary?.contact_id || null;
            }

            if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
                await models.entity_tags.bulkCreate(
                    body.tag_ids.map(tag_id => ({ entity_id: entityId, tag_id, created_by: body.created_by || null })),
                    { transaction: t }
                );
            }

            const ptrs = {};
            if (defaultAddressId) ptrs.default_address_id = defaultAddressId;
            if (defaultContactId) ptrs.default_contact_id = defaultContactId;
            if (Object.keys(ptrs).length > 0) {
                await models.entities.update(ptrs, { where: { entity_id: entityId }, transaction: t });
            }

            await t.commit();

            let uploadResult = { logo: null, logo_error: null };
            if (Array.isArray(files) && files.length > 0) {
                try { uploadResult = await this._uploadAndPatchDocuments({ files, entityId, userId, portId, portName, req, addressIdByType, body }); }
                catch (e) { logger.error(`[Company create] file upload error entity=${entityId}: ${e.message}`); }
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Company created successfully', {
                entity_id: entityId,
                logo_url:   uploadResult.logo?.url  || null,
                logo_name:  uploadResult.logo?.name || null,
                logo_error: uploadResult.logo_error || null,
            });

        } catch (err) {
            await t.rollback();
            logger.error('Create company error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error creating company');
        }
    };

    // ─── LIST ─────────────────────────────────────────────────────────────────
    list = async (query) => {
        try {
            const hasSearch = query.search && String(query.search).trim() !== '';
            const keyword   = hasSearch ? String(query.search).toLowerCase().trim() : '';

            const where = buildCompleteWhere({
                query,
                searchFields: [],           // no SQL LIKE — name may be encrypted
                filterFields: FILTER_FIELDS,
                baseWhere:    { entity_type: 'COMPANY', is_deleted: 0 },
            });

            const { page, limit, offset } = getPaginationParams(query, 10);

            const ALLOWED_SORT = ['entity_id', 'name', 'client_no', 'status', 'company_type_id', 'created_date'];
            const sortCol = query.sort === 'uen_no' ? 'entity_id' : (ALLOWED_SORT.includes(query.sort) ? query.sort : 'entity_id');
            const sortDir = (query.order || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            const order   = [[sortCol, sortDir]];

            const models      = getCurrentModels();
            const detailWhere = { is_deleted: 0 };
            if (query.risk)        detailWhere.risk_assessment_rating = query.risk;
            if (query.e_status_id) detailWhere.e_status_id  = query.e_status_id;
            if (query.corp_sec_id) detailWhere.corp_sec_id  = query.corp_sec_id;
            if (query.region_id)   detailWhere.region_id    = query.region_id;
            if (query.country)     detailWhere.country      = query.country;

            const hasDetailFilter = Object.keys(detailWhere).length > 1;

            // Filter by business entity name (bn_ids CSV column uses FIND_IN_SET)
            let hasBnFilter = false;
            if (query.bn_name) {
                const bnRecord = await models.business_entity.findOne({
                    where: { bs_name: query.bn_name, is_deleted: false },
                    attributes: ['bn_id'],
                });
                if (bnRecord) {
                    if (!detailWhere[Op.and]) detailWhere[Op.and] = [];
                    detailWhere[Op.and].push(
                        Sequelize.literal(`FIND_IN_SET(${Number(bnRecord.bn_id)}, COALESCE(\`company_detail\`.\`bn_ids\`, ''))`)
                    );
                    hasBnFilter = true;
                }
            }

            if (query.incorp_from || query.incorp_to) {
                detailWhere.company_incorporation_date = {};
                if (query.incorp_from) detailWhere.company_incorporation_date[Sequelize.Op.gte] = query.incorp_from;
                if (query.incorp_to)   detailWhere.company_incorporation_date[Sequelize.Op.lte] = query.incorp_to;
            }
            if (query.created_from || query.created_to) {
                where.created_date = {};
                if (query.created_from) where.created_date[Sequelize.Op.gte] = query.created_from;
                if (query.created_to)   where.created_date[Sequelize.Op.lte] = query.created_to;
            }

            // When IS_ENCRYPT=false and search is present, add SQL LIKE directly
            // (plain text, standard DB search — no fetch-all needed)
            if (!IS_ENCRYPT && hasSearch) {
                where[Op.or] = [
                    { name:      { [Op.like]: `%${keyword}%` } },
                    { client_no: { [Op.like]: `%${keyword}%` } },
                ];
            }

            const includeOpts = [
                {
                    model: models.entity_company_details, as: 'company_detail',
                    required: hasDetailFilter || hasBnFilter, where: detailWhere,
                    attributes: ['e_status_id', 'corp_sec_id', 'risk_assessment_rating', 'company_incorporation_date', 'region_id', 'country'],
                },
                {
                    model: models.entity_identification, as: 'identifications',
                    required: false, where: { entity_type: 'COMPANY', is_deleted: 0 },
                    attributes: ['uen_no', 'fbrn_reg_no', 'uf_no', 'domes_bus_no', 'acra_no'],
                },
                {
                    model: models.entity_address, as: 'addresses',
                    required: false, where: { entity_type: 'COMPANY', is_deleted: 0 },
                    attributes: ['address_id', 'is_primary', 'address_type', 'block_no', 'street_name', 'level_no', 'unit_no', 'building_name', 'postal_code', 'country'],
                },
                ...(models.company_event ? [{
                    model: models.company_event, as: 'events',
                    required: false, where: { is_deleted: 0 },
                    attributes: [
                        'company_event_id', 'event_id', 'event_slug',
                        'year_of_fye', 'period_start', 'period_end', 'actual_year', 'actual_fye',
                        'fye_date', 'base_date', 'sent_date', 'received_date',
                        'held_time', 'held_time_end', 'venue_type', 'venue',
                        'meeting_chairman', 'type_shareholder', 'meeting_corporate_shareholder_rep',
                        'meeting_agenda', 'sender_email', 'reply_to_email',
                        'agm_status_details', 'group_to_recipient', 'email_config_id',
                        'recurring_period', 'recurring_duration', 'extended_due_date', 'reminder_date_basis',
                        'due_date', 'held_date', 'filing_date', 'status',
                        'source_basis', 'remarks', 'attendees', 'receiving_parties', 'reminders', 'uploaded_files', 'created_date',
                    ],
                    include: models.company_event_name ? [{
                        model: models.company_event_name,
                        as: 'event',
                        required: false,
                        attributes: [
                            'e_id', 'event_name', 'event_slug', 'event_subject', 'color_code',
                            'recurring_period', 'recurring_duration', 'supports_extension',
                            'supports_waiver', 'evidence_required',
                        ],
                    }] : [],
                }] : []),
            ];

            const attrs    = ['entity_id', 'entity_type', 'name', 'former_name', 'client_no', 'status', 'company_type_id', 'default_address_id', 'default_contact_id', 'created_date'];
            const baseOpts = { where, order, attributes: attrs, include: includeOpts };

            if (IS_ENCRYPT) {
                // Encrypted path: fetch all → decrypt → JS filter → paginate
                const result = await fetchWithEncryptedSearch({
                    fetchPage: () => this.entityDao.findAndCountAll({ ...baseOpts, limit, offset, distinct: true }),
                    fetchAll:  () => this.entityDao.findAll(baseOpts),
                    hasSearch,
                    keyword,
                    encryptedFields: ENTITY_ENCRYPTED_FIELDS,
                    searchFields:    ['name', 'client_no'],
                    page, limit, offset,
                });

                if (!result.totalItems) {
                    return responseHandler.returnSuccess(httpStatus.OK, 'No companies found', { totalItems: 0, data: [], totalPages: 0, currentPage: page });
                }
                const roleMap = await this._getOfficialRolesByCompanyIds(models, (result.data || []).map(row => row.entity_id));
                result.data = (result.data || []).map(row => ({
                    ...row,
                    events: (row.events || []).map(event => ({
                        ...(event?.toJSON ? event.toJSON() : event),
                        allowed_status_transitions: this._allowedEventStatusTransitions(event),
                    })),
                    official_roles: roleMap[row.entity_id] || {},
                }));
                return responseHandler.returnSuccess(httpStatus.OK, 'Company list fetched successfully', result);

            } else {
                // Plain text path: standard DB pagination + SQL LIKE (already in where above)
                const result = await this.entityDao.findAndCountAll({ ...baseOpts, limit, offset, distinct: true });

                if (result.count === 0) {
                    return responseHandler.returnSuccess(httpStatus.OK, 'No companies found', { totalItems: 0, data: [], totalPages: 0, currentPage: page });
                }

                const roleMap = await this._getOfficialRolesByCompanyIds(models, (result.rows || []).map(row => row.entity_id));
                (result.rows || []).forEach(row => {
                    if (row?.dataValues) {
                        row.dataValues.official_roles = roleMap[row.entity_id] || {};
                        (row.events || []).forEach(event => {
                            if (event?.dataValues) {
                                event.dataValues.allowed_status_transitions = this._allowedEventStatusTransitions(event);
                            }
                        });
                    } else {
                        row.official_roles = roleMap[row.entity_id] || {};
                        row.events = (row.events || []).map(event => ({
                            ...event,
                            allowed_status_transitions: this._allowedEventStatusTransitions(event),
                        }));
                    }
                });

                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'Company list fetched successfully',
                    responseHandler.getPaginationData(result, page, limit)
                );
            }

        } catch (err) {
            logger.error('List company error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching company list');
        }
    };

    // ─── GET ──────────────────────────────────────────────────────────────────
    get = async (entityId) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');

            const models = getCurrentModels();

            const entityJson = entity?.toJSON ? entity.toJSON() : (entity || {});

            const [detail, addresses, contacts, identifications, tags, companyType, eventEvents, officialRoleMap] = await Promise.all([
                this.detailDao.findOneByWhere({ entity_id: entityId, is_deleted: false }),
                this.addressDao.findByWhere({ entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }),
                this.contactDao.findByWhere({ entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }),
                this.identificationDao.findByWhere({ entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }),
                models.entities.findAll({
                    where: { entity_id: entityId },
                    include: [{ model: models.entity_tags, as: 'tags', include: [{ model: models.tag, as: 'tag_info', attributes: ['tag_id', 'tag_name', 'tag_color'] }] }],
                    attributes: [],
                }).then(rows => rows[0]?.tags || []),
                entityJson.company_type_id
                    ? models.company_type.findOne({ where: { company_type_id: entityJson.company_type_id }, attributes: ['company_type_id', 'company_type_name'] })
                    : Promise.resolve(null),
                models.company_event
                    ? models.company_event.findAll({
                        where: { entity_id: entityId, is_deleted: false },
                        order: [['due_date', 'ASC'], ['company_event_id', 'ASC']],
                        include: models.company_event_name ? [{
                            model: models.company_event_name,
                            as: 'event',
                            required: false,
                            attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code'],
                        }] : [],
                    })
                    : Promise.resolve([]),
                this._getOfficialRolesByCompanyIds(models, [entityId]),
            ]);

            const { byProofType, allDocs } = await this._getDocuments(entityId);
            const enrichedAddresses = (addresses || []).map(a => ({
                ...a.toJSON(),
                proof_docs: (byProofType[ADDR_TYPE_TO_PROOF_BASE[a.address_type]] || []).map(d => ({
                    doc_id: d.doc_id, file_path: d.file_path, file_name: d.file_name,
                })),
            }));

            // Decrypt name and contact_value only when IS_ENCRYPT=true
            const decryptedEntity   = _decRow(entity, ENTITY_ENCRYPTED_FIELDS);
            const decryptedContacts = _decRows(contacts || [], CONTACT_ENCRYPTED_FIELDS);

            // status_effective_date for whichever Entity Status is currently
            // selected, so Edit Company auto-fills the right date for that status.
            let detailJson = detail ? detail.toJSON() : null;
            if (detailJson?.e_status_id) {
                const statusDate = await models.entity_status_date.findOne({
                    where: { entity_id: entityId, e_status_id: detailJson.e_status_id, is_deleted: false },
                });
                detailJson.status_effective_date = statusDate?.effective_date || null;
                detailJson.status_remarks        = statusDate?.remarks        || null;
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Company fetched successfully', {
                ...decryptedEntity,
                company_type_name: companyType?.company_type_name || null,
                company_detail:  detailJson       || null,
                addresses:       enrichedAddresses,
                contacts:        decryptedContacts,
                identifications: identifications  || [],
                events: await this._enrichCompanyEvents(models, eventEvents || []),
                official_roles: officialRoleMap[entityId] || {},
                tags,
            });

        } catch (err) {
            logger.error('Get company error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching company');
        }
    };

      // ─── GET ──────────────────────────────────────────────────────────────────
    getAll = async (query) => {
        try {
            const models = getCurrentModels();
            
            // Build dynamic where clause from query params
            const entityWhere = { is_deleted: false };
            const detailWhere = { is_deleted: false };

            if (query?.name) {
                entityWhere.name = { [Op.iLike]: `%${query.name}%` };
            }
            if (query?.status) {
                entityWhere.status = query.status;
            }
            if (query?.company_type) {
                detailWhere.company_type = query.company_type;
            }

            // Fetch all entities with tag filtering support
            const entityRows = await models.entities.findAll({
                where: entityWhere,
                include: [
                    {
                        model: models.entity_tags,
                        as: 'tags',
                        include: [
                            {
                                model: models.tag,
                                as: 'tag_info',
                                attributes: ['tag_id', 'tag_name', 'tag_color'],
                                ...(query?.tag_ids && {
                                    where: { tag_id: { [Op.in]: query.tag_ids } },
                                }),
                            },
                        ],
                    },
                ],
            });

            if (!entityRows.length) {
                return responseHandler.returnSuccess(httpStatus.OK, 'No companies found', []);
            }

            const entityIds = entityRows.map(e => e.entity_id);

            // Fetch all related data in parallel, scoped to matched entity IDs
            const [details, addresses, contacts, identifications] = await Promise.all([
                this.detailDao.findByWhere({ entity_id: { [Op.in]: entityIds }, is_deleted: false }),
                this.addressDao.findByWhere({ entity_id: { [Op.in]: entityIds }, is_deleted: false }),
                this.contactDao.findByWhere({ entity_id: { [Op.in]: entityIds }, is_deleted: false }),
                this.identificationDao.findByWhere({ entity_id: { [Op.in]: entityIds }, is_deleted: false }),
            ]);

            // Group related records by entity_id for O(1) lookup
            const detailMap         = _groupById(details,         'entity_id');
            const addressMap        = _groupById(addresses,        'entity_id');
            const contactMap        = _groupById(contacts,         'entity_id');
            const identificationMap = _groupById(identifications,  'entity_id');

            // Fetch and group all documents across all entities
            const { byEntityAndProofType } = await this._getAllDocuments(entityIds);

            // Assemble enriched response per entity
            const companies = entityRows.map(entityRow => {
                const entity   = entityRow.toJSON();
                const entityId = entity.entity_id;

                const entityAddresses = (addressMap[entityId] || []).map(a => ({
                    ...a,
                    proof_docs: (
                        (byEntityAndProofType[entityId] || {})[ADDR_TYPE_TO_PROOF_BASE[a.address_type]] || []
                    ).map(d => ({
                        doc_id:    d.doc_id,
                        file_path: d.file_path,
                        file_name: d.file_name,
                    })),
                }));

                const decryptedEntity   = _decRow(entity,                              ENTITY_ENCRYPTED_FIELDS);
                const decryptedContacts = _decRows(contactMap[entityId] || [],         CONTACT_ENCRYPTED_FIELDS);

                return {
                    ...decryptedEntity,
                    company_detail:  detailMap[entityId]?.[0]         || null,
                    addresses:       entityAddresses,
                    contacts:        decryptedContacts,
                    identifications: identificationMap[entityId]       || [],
                    tags:            entity.tags                       || [],
                };
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Companies fetched successfully', companies);

        } catch (err) {
            logger.error('Get all companies error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching companies');
        }
    };


    // ─── UPDATE ───────────────────────────────────────────────────────────────
    update = async (entityId, body, files = [], userId = null, req = null) => {
        const models   = getCurrentModels();
        const portName = body.port_name || null;
        let   portId   = null;
        if (portName) {
            try { const r = await this._resolvePort(portName); portId = r.port_number; }
            catch (e) { logger.warn(`[update] port "${portName}": ${e.message}`); }
        }

        // Validate the logo before touching the DB — an invalid file should
        // fail the request outright rather than silently dropping the logo
        // after the company record has already been committed.
        const incomingLogoFile = (files || []).find(f => f.fieldname === LOGO_FIELDNAME);
        if (incomingLogoFile) {
            const logoValidationError = _validateLogoFile(incomingLogoFile);
            if (logoValidationError) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, logoValidationError);
            }
        }

        const t = await models.sequelize.transaction();
        const addressIdByType = {};

        try {
            const existing = await this._checkEntity(entityId);
            if (!existing) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            }

            const entityUpdates = { updated_by: body.updated_by || null, updated_date: new Date() };
            ENTITY_FIELDS.forEach(f => {
                if (body[f] !== undefined) {
                    // Encrypt only name when IS_ENCRYPT=true; all other ENTITY_FIELDS are plain
                    entityUpdates[f] = (IS_ENCRYPT && ENTITY_ENCRYPTED_FIELDS.includes(f))
                        ? _enc(body[f])
                        : body[f];
                }
            });
            await models.entities.update(entityUpdates, { where: { entity_id: entityId }, transaction: t });

            const detailUpdates = { updated_by: body.updated_by || null, updated_date: new Date() };
            DETAIL_FIELDS.forEach(f => {
                if (body[f] === undefined) return;
                const v = CSV_FIELDS.includes(f) ? toCSV(body[f]) : body[f];
                detailUpdates[f] = normalizeDetailValue(f, v);
            });
            const existingDetail = await this.detailDao.findOneByWhere({ entity_id: entityId });
            if (existingDetail) {
                await models.entity_company_details.update(detailUpdates, { where: { entity_id: entityId }, transaction: t });
            } else {
                await models.entity_company_details.create(
                    { entity_id: entityId, is_deleted: false, created_by: body.updated_by || null, ...detailUpdates },
                    { transaction: t }
                );
            }

            await this._upsertStatusDate(entityId, body, body.updated_by, t);

            await this._syncCompanyEvents(
                entityId,
                { ...existing.toJSON(), ...entityUpdates, company_type_id: entityUpdates.company_type_id ?? existing.company_type_id },
                null,
                t
            );

            const identRow = this._buildIdentRow(body, entityId, body.updated_by);
            if (identRow) {
                const existingIdent = await models.entity_identification.findOne({
                    where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }, transaction: t,
                });
                if (existingIdent) await existingIdent.update({ ...identRow, updated_date: new Date() }, { transaction: t });
                else               await models.entity_identification.create(identRow, { transaction: t });
            }

            let defaultAddressId = null;
            if (Array.isArray(body.addresses)) {
                const existingAddrs = await models.entity_address.findAll({
                    where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }, transaction: t,
                });
                const byType   = {};
                existingAddrs.forEach(a => { byType[a.address_type] = a; });
                const incoming = new Set(body.addresses.map(a => a.address_type || 'REGISTERED'));

                for (const addr of body.addresses) {
                    const atype  = addr.address_type || 'REGISTERED';
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
                    if (byType[atype]) { await byType[atype].update(fields, { transaction: t }); saved = byType[atype]; }
                    else               { saved = await models.entity_address.create({ entity_id: entityId, entity_type: 'COMPANY', address_type: atype, is_deleted: false, created_by: body.updated_by || null, ...fields }, { transaction: t }); }
                    if (saved.is_primary) defaultAddressId = saved.address_id;
                    addressIdByType[atype] = saved.address_id;
                }

                for (const [atype, record] of Object.entries(byType)) {
                    if (!incoming.has(atype)) await record.update({ is_deleted: true, updated_date: new Date() }, { transaction: t });
                }
            }

            let defaultContactId = null;
            if (Array.isArray(body.contacts)) {
                const existingContacts = await models.entity_contact.findAll({
                    where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false }, transaction: t,
                });
                const existingById = {};
                existingContacts.forEach(c => { existingById[c.contact_id] = c; });
                const incomingIds = new Set();

                for (const c of body.contacts) {
                    const fields = {
                        contact_type: c.contact_type || 'EMAIL',
                        phone_country_code: c.phone_country_code || '+65',
                        contact_value: _enc(c.contact_value) || null,  // IS_ENCRYPT switch
                        is_primary: c.is_primary ?? false,
                        updated_by: body.updated_by || null, updated_date: new Date(),
                    };
                    if (c.contact_id && existingById[c.contact_id]) {
                        await existingById[c.contact_id].update(fields, { transaction: t });
                        incomingIds.add(Number(c.contact_id));
                        if (fields.is_primary) defaultContactId = c.contact_id;
                    } else {
                        const created = await models.entity_contact.create({ entity_id: entityId, entity_type: 'COMPANY', ...fields, is_deleted: false, created_by: body.updated_by || null }, { transaction: t });
                        if (fields.is_primary) defaultContactId = created.contact_id;
                    }
                }

                for (const [id, record] of Object.entries(existingById)) {
                    if (!incomingIds.has(Number(id))) await record.update({ is_deleted: true, updated_date: new Date() }, { transaction: t });
                }
            }

            if (Array.isArray(body.tag_ids)) {
                await models.entity_tags.destroy({ where: { entity_id: entityId }, transaction: t });
                if (body.tag_ids.length > 0) {
                    await models.entity_tags.bulkCreate(
                        body.tag_ids.map(tag_id => ({ entity_id: entityId, tag_id, created_by: body.updated_by || null })),
                        { transaction: t }
                    );
                }
            }

            const ptrs = {};
            if (defaultAddressId !== null) ptrs.default_address_id = defaultAddressId;
            if (defaultContactId !== null) ptrs.default_contact_id = defaultContactId;
            if (Object.keys(ptrs).length > 0) {
                await models.entities.update(ptrs, { where: { entity_id: entityId }, transaction: t });
            }

            await t.commit();

            let uploadResult = { logo: null, logo_error: null };
            const removeLogo = ['true', '1'].includes(String(body.remove_company_logo));
            if ((Array.isArray(files) && files.length > 0) || removeLogo) {
                try { uploadResult = await this._uploadAndPatchDocuments({ files, entityId, userId, portId, portName, req, addressIdByType, body }); }
                catch (e) { logger.error(`[Company update] file upload error entity=${entityId}: ${e.message}`); }
            }

            return responseHandler.returnSuccess(httpStatus.OK, 'Company updated successfully', {
                entity_id: entityId,
                logo_url:   uploadResult.logo?.url  || null,
                logo_name:  uploadResult.logo?.name || null,
                logo_error: uploadResult.logo_error || null,
            });

        } catch (err) {
            await t.rollback();
            logger.error('Update company error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating company');
        }
    };

    // ─── DELETE ───────────────────────────────────────────────────────────────
    delete = async (entityId) => {
        try {
            const existing = await this._checkEntity(entityId);
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            await this.entityDao.updateWhere({ is_deleted: true, updated_date: new Date() }, { entity_id: entityId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Company deleted successfully');
        } catch (err) {
            logger.error('Delete company error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting company');
        }
    };

    // IS_ENCRYPT=true  → exact match on ciphertext
    // IS_ENCRYPT=false → exact match on plain text (Op.like exact)
    checkEntityName = async (query) => {
        try {
            const nameVal = (query.name || '').trim();
            const where   = {
                name:        IS_ENCRYPT ? _enc(nameVal) : { [Op.like]: nameVal },
                entity_type: 'COMPANY',
                is_deleted:  false,
            };
            if (query.entity_id) where.entity_id = { [Op.ne]: query.entity_id };
            const existing = await this.entityDao.checkExist(where);
            return responseHandler.returnSuccess(httpStatus.OK, 'Check complete', { exists: existing });
        } catch (err) {
            logger.error('checkEntityName error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
    };

    // ─── ADDRESS sub-resource ─────────────────────────────────────────────────
    createAddress = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            const data = await this.addressDao.create({
                entity_id: entityId, entity_type: 'COMPANY',
                address_type: body.address_type || 'REGISTERED', block_no: body.block_no || null,
                street_name: body.street_name || null, building_name: body.building_name || null,
                level_no: body.level_no || null, unit_no: body.unit_no || null,
                city: body.city || null, state: body.state || null, postal_code: body.postal_code || null,
                country: body.country || 'Singapore', country_code: body.country_code || null,
                region_id: body.region_id || null, proof_of_address_url: body.proof_of_address_url || null,
                proof_of_address_name: body.proof_of_address_name || null,
                is_primary: body.is_primary ?? false, effective_from: body.effective_from || null,
                effective_to: body.effective_to || null, is_deleted: false,
                created_by: body.created_by || null, updated_date: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Address added successfully', data);
        } catch (err) {
            logger.error('Create company address error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding address');
        }
    };

    updateAddress = async (addressId, body) => {
        try {
            const existing = await this.addressDao.findOneByWhere({ address_id: addressId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Address not found');
            const allowed = ['address_type', 'block_no', 'street_name', 'building_name', 'level_no', 'unit_no', 'city', 'state', 'postal_code', 'country', 'country_code', 'region_id', 'proof_of_address_url', 'proof_of_address_name', 'is_primary', 'effective_from', 'effective_to'];
            const updates = { updated_by: body.updated_by || null, updated_date: new Date() };
            allowed.forEach(f => { if (body[f] !== undefined) updates[f] = body[f]; });
            await this.addressDao.updateWhere(updates, { address_id: addressId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Address updated successfully', await this.addressDao.findOneByWhere({ address_id: addressId }));
        } catch (err) {
            logger.error('Update company address error:', err);
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
            logger.error('Delete company address error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting address');
        }
    };

    // ─── CONTACT sub-resource ─────────────────────────────────────────────────
    createContact = async (entityId, body) => {
        try {
            const entity = await this._checkEntity(entityId);
            if (!entity) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company not found');
            const data = await this.contactDao.create({
                entity_id: entityId, entity_type: 'COMPANY',
                contact_type: body.contact_type || 'EMAIL',
                phone_country_code: body.phone_country_code || '+65',
                contact_value: _enc(body.contact_value) || null,  // IS_ENCRYPT switch
                is_primary: body.is_primary ?? false,
                is_deleted: false, created_by: body.created_by || null, updated_date: new Date(),
            });
            // Decrypt before returning so UI always gets plain text
            return responseHandler.returnSuccess(httpStatus.OK, 'Contact added successfully', _decRow(data, CONTACT_ENCRYPTED_FIELDS));
        } catch (err) {
            logger.error('Create company contact error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error adding contact');
        }
    };

    updateContact = async (contactId, body) => {
        try {
            const existing = await this.contactDao.findOneByWhere({ contact_id: contactId, is_deleted: false });
            if (!existing) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Contact not found');
            const allowed = ['contact_type', 'phone_country_code', 'contact_value', 'is_primary'];
            const updates = { updated_by: body.updated_by || null, updated_date: new Date() };
            allowed.forEach(f => {
                if (body[f] !== undefined) {
                    updates[f] = (IS_ENCRYPT && CONTACT_ENCRYPTED_FIELDS.includes(f)) ? _enc(body[f]) : body[f];
                }
            });
            await this.contactDao.updateWhere(updates, { contact_id: contactId });
            const updated = await this.contactDao.findOneByWhere({ contact_id: contactId });
            return responseHandler.returnSuccess(httpStatus.OK, 'Contact updated successfully', _decRow(updated, CONTACT_ENCRYPTED_FIELDS));
        } catch (err) {
            logger.error('Update company contact error:', err);
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
            logger.error('Delete company contact error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting contact');
        }
    };
}

module.exports = EntityCompanyService;
