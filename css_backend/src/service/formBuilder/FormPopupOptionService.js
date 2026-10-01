'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { Op } = require('sequelize');
const { normalizePopupSchema } = require('../../domain/formBuilder/popupSchema');
const { formatOptionLabel } = require('../../domain/formBuilder/optionLabelFormat');

const plain = row => row?.toJSON ? row.toJSON() : row;
const findSchemaField = (schema, key) => normalizePopupSchema(schema)
    .flatMap(section => section.fields)
    .find(field => field.field_key === String(key || '').toLowerCase());

const applySearchAndLimit = (options, search, limit) => {
    const term = String(search || '').trim().toLowerCase();
    const filtered = term ? options.filter(option => option.label.toLowerCase().includes(term)) : options;
    return filtered.slice(0, limit);
};

const paginateOptions = (options, search, page, limit) => {
    const term = String(search || '').trim().toLowerCase();
    const filtered = term ? options.filter(option => option.label.toLowerCase().includes(term)) : options;
    // No limit supplied → return every matching option (dropdowns are not paginated).
    if (!limit) {
        return { options: filtered, total: filtered.length, page: 1, has_more: false };
    }
    const currentPage = page || 1;
    const offset = (currentPage - 1) * limit;
    return {
        options: filtered.slice(offset, offset + limit),
        total: filtered.length,
        page: currentPage,
        has_more: offset + limit < filtered.length,
    };
};

const latestShareOptions = rows => {
    const seen = new Set();
    const options = [];
    for (const sourceRow of rows) {
        const row = plain(sourceRow);
        const key = [row.company_share_id, row.share_class_id, row.currency, row.share_type].join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        const quantity = Number(row.balance_after_qty || 0);
        if (quantity <= 0) continue;
        options.push({
            value: row.company_share_id,
            label: `${row.currency} ${row.share_type} (${quantity})`,
            meta: {
                share_class_id: row.share_class_id,
                currency: row.currency,
                share_type: row.share_type,
                quantity,
                share_set_id: row.share_set_id,
            },
        });
    }
    return options;
};

class FormPopupOptionService {
    constructor(models = null) { this.models = models; }
    _models = () => this.models || getCurrentModels();

    _officialOptions = async (models, entityId, source, role) => {
        const where = { entity_id: entityId, is_current: 1, is_deleted: 0 };
        if (source === 'SHAREHOLDERS') where.official_master_slug = 'shareholders';
        if (source === 'OFFICIALS' && role) where.official_master_slug = role;
        const rows = await models.officials.findAll({
            where,
            include: [
                { model: models.entities, as: 'official_entity', required: false },
                { model: models.official_master, as: 'official_master', required: false },
            ],
            order: [['official_id', 'ASC']],
        });
        return rows.map(sourceRow => {
            const row = plain(sourceRow);
            const entity = plain(row.official_entity) || {};
            const master = plain(row.official_master) || {};
            return {
                value: row.official_id,
                label: entity.name || `Official ${row.official_id}`,
                meta: {
                    official_entity_id: row.official_entity_id,
                    role: row.official_master_slug,
                    role_name: master.official_master_name || row.official_master_slug || null,
                    official_type: row.official_type,
                    name: entity.name || null,
                    client_number: entity.client_no || null,
                },
            };
        });
    };

    _officialRecordOptions = async (models, entityId, roles = [], statuses = []) => {
        const where = { entity_id: entityId, is_deleted: 0 };
        if (roles.length) where.official_master_slug = { [Op.in]: roles };
        if (statuses.length === 1) where.is_current = statuses[0] === 'CURRENT' ? 1 : 0;
        const rows = await models.officials.findAll({
            where,
            include: [
                { model: models.entities, as: 'official_entity', required: false },
                { model: models.official_master, as: 'official_master', required: false },
                { model: models.officials_date, as: 'date_record', required: false },
            ],
            order: [['official_id', 'DESC']],
        });
        return rows.map(sourceRow => {
            const row = plain(sourceRow);
            const entity = plain(row.official_entity) || {};
            const master = plain(row.official_master) || {};
            const date = plain(row.date_record) || {};
            const status = row.is_current ? 'CURRENT' : 'CEASED';
            const effectiveDate = status === 'CURRENT' ? date.appointment_date : date.ceased_date;
            return {
                value: row.official_id,
                label: `${entity.name || `Official ${row.official_id}`} - ${row.official_master_slug || 'official'}${effectiveDate ? ` (${effectiveDate})` : ''}`,
                meta: {
                    official_entity_id: row.official_entity_id,
                    role: row.official_master_slug,
                    role_name: master.official_master_name || row.official_master_slug || null,
                    official_type: row.official_type,
                    status,
                    name: entity.name || null,
                    client_number: entity.client_no || null,
                    appointment_date: date.appointment_date || null,
                    cessation_date: date.ceased_date || null,
                },
            };
        });
    };

    _eventOptions = async (models, entityId, eventFilter = 'all') => {
        const rows = await models.company_event.findAll({
            where: { entity_id: entityId, is_deleted: false },
            include: [{ model: models.company_event_name, as: 'event', required: false }],
            order: [['due_date', 'DESC'], ['company_event_id', 'DESC']],
        });
        const options = rows.map(sourceRow => {
            const row = plain(sourceRow);
            const event = plain(row.event) || {};
            return {
                value: row.company_event_id,
                label: `${event.event_name || row.event_slug}${row.due_date ? ` - ${row.due_date}` : ''}`,
                meta: { event_slug: row.event_slug, due_date: row.due_date, status: row.status },
            };
        });
        // `eventFilter` may be a single slug, a comma-joined list ("agm,egm"),
        // or an array — the builder now lets an OFFICIAL/COMPLAINANT field be
        // scoped to several events at once. Empty / "all" ⇒ no filter.
        const wanted = (Array.isArray(eventFilter) ? eventFilter : String(eventFilter || 'all').split(','))
            .map(value => String(value).trim().toLowerCase())
            .filter(Boolean);
        if (!wanted.length || wanted.includes('all')) return options;
        return options.filter(option => {
            const eventSlug = String(option.meta.event_slug || '').toLowerCase();
            const label = option.label.toLowerCase();
            return wanted.some(value => eventSlug === value || label.includes(value));
        });
    };

    // officials.official_type ENUM — the real column a "shareholder entity
    // type" filter has to read, so source_filter_4 is validated against this,
    // not against the (dead) legacy Individual/Corporate/... param list.
    static SHAREHOLDER_ENTITY_TYPES = ['COMPANY', 'INDIVIDUAL', 'JOINT', 'SUB_FUND'];

    // Every shareholder currently holding `companyShareId` (a css_entity_shares
    // structure row) — the inverse of "this shareholder's holdings": here the
    // share is fixed and we list who holds it. One option per shareholder,
    // value = the shareholder's own share_ledger row id (what a "Shareholder
    // Level Shares" popup selection and its ##shareholder_shares loop key off).
    // `wantOfficialTypes` (officials.official_type values) filters WHICH
    // shareholders show up, e.g. only COMPANY (corporate) holders.
    _shareholdersOfShareOptions = async (models, entityId, companyShareId, wantStatus, wantOfficialTypes = []) => {
        const rows = await models.share_ledger.findAll({
            where: {
                entity_id: entityId,
                company_share_id: companyShareId,
                ledger_scope: 'SHAREHOLDER',
                status: wantStatus || 'VALID',
                is_deleted: 0,
            },
            order: [['official_entity_id', 'ASC'], ['transaction_date', 'DESC'], ['posting_order', 'DESC'], ['id', 'DESC']],
        });
        const latestByShareholder = new Map();
        for (const raw of rows) {
            const row = plain(raw);
            if (latestByShareholder.has(row.official_entity_id)) continue;
            if (Number(row.balance_after_qty || 0) <= 0) continue;
            latestByShareholder.set(row.official_entity_id, row);
        }
        const shareholderIds = [...latestByShareholder.keys()].filter(Boolean);
        const [shareholders, shareholderOfficials] = await Promise.all([
            shareholderIds.length ? models.entities.findAll({
                where: { entity_id: { [Op.in]: shareholderIds }, is_deleted: false },
            }) : [],
            shareholderIds.length ? models.officials.findAll({
                where: {
                    entity_id: entityId, official_entity_id: { [Op.in]: shareholderIds },
                    official_master_slug: 'shareholders', is_deleted: 0,
                },
            }) : [],
        ]);
        const nameById = new Map(shareholders.map(raw => {
            const row = plain(raw);
            return [row.entity_id, row.name];
        }));
        const typeById = new Map(shareholderOfficials.map(raw => {
            const row = plain(raw);
            return [row.official_entity_id, row.official_type];
        }));
        return [...latestByShareholder.values()]
            .filter(row => !wantOfficialTypes.length || wantOfficialTypes.includes(typeById.get(row.official_entity_id)))
            .map(row => ({
                value: row.id,
                label: `${nameById.get(row.official_entity_id) || `Shareholder ${row.official_entity_id}`} (${Number(row.balance_after_qty).toLocaleString()} ${row.share_type})`,
                meta: {
                    shareholder_entity_id: row.official_entity_id,
                    shareholder_name: nameById.get(row.official_entity_id) || null,
                    official_type: typeById.get(row.official_entity_id) || null,
                    currency: row.currency,
                    share_type: row.share_type,
                    quantity: Number(row.balance_after_qty),
                },
            }));
    };

    /**
     * SHARES popup options — resolved for the actual company at form-fill time,
     * straight from css_entity_shares + css_shares. The builder only stores the
     * high-level pickers:
     *
     *   source_filter_1  COMPANY_LEVEL_SHARES     → the company's own share
     *                                               structure rows (css_entity_shares)
     *                    SHAREHOLDER_LEVEL_SHARES → holdings of ONE record the
     *                                               field's parent selected —
     *                                               either a shareholder (lists
     *                                               that shareholder's shares)
     *                                               or a company-level share
     *                                               (lists who holds it)
     *   source_filter_2  Valid | Invalid | All    → css_shares.status
     *   source_filter_3  Allotment | Transfer |   → transaction_type.t_name of the
     *                    Redemption | All            matching css_shares row
     *   source_filter_4  Company | Individual |   → officials.official_type of
     *                    Joint | Sub Fund | All      the shareholder (comma-
     *                                                joined; SHAREHOLDER_LEVEL_
     *                                                SHARES only)
     */
    _shareOptions = async (models, entityId, parentValue, field = {}) => {
        const level   = String(field.source_filter_1 || 'all').toUpperCase();
        const status  = String(field.source_filter_2 || 'all').toUpperCase();
        const txType  = String(field.source_filter_3 || 'all').toLowerCase();
        const wantStatus = ['VALID', 'INVALID'].includes(status) ? status : null;
        const wantType   = ['allotment', 'transfer', 'redemption'].includes(txType) ? txType : null;
        const wantOfficialTypes = String(field.source_filter_4 || 'all').split(',')
            .map(value => value.trim().toUpperCase())
            .filter(value => FormPopupOptionService.SHAREHOLDER_ENTITY_TYPES.includes(value));

        // ── Shareholder-level: holdings of whatever the parent field selected ──
        // No parent picked yet, or it doesn't resolve to anything usable, is NOT
        // a validation error — the popup simply has nothing to show until then.
        if (level === 'SHAREHOLDER_LEVEL_SHARES') {
            if (!parentValue) return { options: [] };
            const shareholder = await models.officials.findOne({
                where: {
                    official_id: parentValue,
                    entity_id: entityId,
                    official_master_slug: 'shareholders',
                    is_current: 1,
                    is_deleted: 0,
                },
            });
            if (shareholder) {
                // The whole list is already one shareholder's own holdings — an
                // entity-type filter either matches that one shareholder or rules
                // the field out entirely, it can't narrow row-by-row.
                if (wantOfficialTypes.length && !wantOfficialTypes.includes(shareholder.official_type)) {
                    return { options: [] };
                }
                const rows = await models.share_ledger.findAll({
                    where: {
                        entity_id: entityId,
                        official_entity_id: shareholder.official_entity_id,
                        ledger_scope: 'SHAREHOLDER',
                        status: wantStatus || 'VALID',
                        is_deleted: 0,
                    },
                    order: [['transaction_date', 'DESC'], ['posting_order', 'DESC'], ['id', 'DESC']],
                });
                return { options: latestShareOptions(rows) };
            }
            // Not a shareholder id — try it as a company-level share (the parent
            // is a "Company Level Shares" field): list who holds that share.
            const companyShare = await models.entity_shares.findOne({
                where: { id: parentValue, entity_id: entityId, is_deleted: 0 },
            });
            if (companyShare) {
                return { options: await this._shareholdersOfShareOptions(
                    models, entityId, companyShare.id, wantStatus, wantOfficialTypes
                ) };
            }
            return { options: [] };
        }

        // ── Company-level (default): the company's own share structure ──
        // css_shares rows carry the status + transaction type; join them to the
        // css_entity_shares structure rows on share_set_id.
        const shareWhere = { entity_id: entityId, is_deleted: 0 };
        if (wantStatus) shareWhere.status = wantStatus;
        const shareRows = await models.shares.findAll({
            where: shareWhere,
            include: [{ model: models.transaction_type, as: 'transaction_type', required: false }],
            order: [['transaction_date', 'DESC'], ['share_id', 'DESC']],
        });
        const shareBySet = new Map();
        for (const raw of shareRows) {
            const s = plain(raw);
            const typeName = String(plain(s.transaction_type)?.t_name || s.extra_type_of_transaction || '').toLowerCase();
            if (wantType && !typeName.includes(wantType)) continue;
            if (!shareBySet.has(s.share_set_id)) {
                shareBySet.set(s.share_set_id, { status: s.status, typeName, share_id: s.share_id });
            }
        }

        const entityShares = await models.entity_shares.findAll({
            where: { entity_id: entityId, is_deleted: 0 },
            include: [{ model: models.share_class_master, as: 'share_class', required: false }],
            order: [['date_of_transaction', 'DESC'], ['id', 'DESC']],
        });

        const options = entityShares
            .map(raw => plain(raw))
            // When a status / transaction-type filter is set, only keep structure
            // rows that have a matching css_shares transaction.
            .filter(row => (!wantStatus && !wantType) || shareBySet.has(row.share_set_id))
            .map(row => {
                const className = plain(row.share_class)?.sc_name || `Class ${row.share_class_id}`;
                const matched = shareBySet.get(row.share_set_id) || {};
                return {
                    value: row.id,
                    label: `${className} — ${row.currency} ${row.share_type} (${row.number_of_shares})`,
                    meta: {
                        share_class_id: row.share_class_id,
                        share_class_name: className,
                        currency: row.currency,
                        share_type: row.share_type,
                        number_of_shares: row.number_of_shares,
                        quantity: row.number_of_shares,
                        share_set_id: row.share_set_id,
                        share_id: matched.share_id || null,
                        status: matched.status || null,
                        transaction_type: matched.typeName || null,
                    },
                };
            });
        return { options };
    };

    _allotmentOptions = async (models, entityId) => {
        const rows = await models.shares.findAll({
            where: { entity_id: entityId, status: 'VALID', is_deleted: 0 },
            include: [{
                model: models.share_transactions,
                as: 'transactions',
                where: { transaction_status: 'IN', status: 'VALID', is_deleted: 0 },
                required: true,
                attributes: ['share_transaction_id', 'no_of_shares'],
            }],
            order: [['transaction_date', 'DESC'], ['share_id', 'DESC']],
        });
        return rows.map(sourceRow => {
            const row = plain(sourceRow);
            const quantity = (row.transactions || []).reduce((sum, item) => sum + Number(plain(item).no_of_shares || 0), 0);
            return {
                value: row.share_id,
                label: `${row.transaction_date} - ${quantity} share${quantity === 1 ? '' : 's'}`,
                meta: { transaction_date: row.transaction_date, share_set_id: row.share_set_id, quantity },
            };
        });
    };

    _shareTransactionOptions = async (models, entityId, transactionTypes = []) => {
        const allowedTypes = (transactionTypes || []).map(value => String(value).toUpperCase()).filter(Boolean);
        const where = { entity_id: entityId, status: 'VALID', is_deleted: 0 };
        if (allowedTypes.length) where.extra_type_of_transaction = { [Op.in]: allowedTypes };
        const rows = await models.shares.findAll({
            where,
            include: [{
                model: models.share_transactions,
                as: 'transactions',
                where: { status: 'VALID', is_deleted: 0 },
                required: true,
                attributes: ['share_transaction_id'],
            }],
            order: [['transaction_date', 'DESC'], ['share_id', 'DESC']],
        });
        return rows.map(sourceRow => {
            const row = plain(sourceRow);
            const type = String(row.extra_type_of_transaction || 'SHARE').toUpperCase();
            return {
                value: row.share_id,
                label: `${type} - ${row.transaction_date} (#${row.share_id})`,
                meta: {
                    transaction_type: type,
                    transaction_date: row.transaction_date,
                    share_set_id: row.share_set_id,
                    line_count: (row.transactions || []).length,
                },
            };
        });
    };

    _resolveRawOptions = async (field, models, entityId, parentValue, officialRole) => {
        if (field.value_source === 'OFFICIALS' || field.value_source === 'SHAREHOLDERS') {
            return { options: await this._officialOptions(models, entityId, field.value_source, officialRole) };
        }
        if (field.value_source === 'OFFICIAL_RECORDS') {
            return { options: await this._officialRecordOptions(
                models, entityId, field.official_roles || [], field.official_statuses || []
            ) };
        }
        if (field.value_source === 'EVENT') {
            return { options: await this._eventOptions(models, entityId) };
        }
        if (field.value_source === 'COMPLAINANT') {
            return { options: await this._eventOptions(models, entityId, field.source_filter_1) };
        }
        if (field.value_source === 'SHARES') {
            return this._shareOptions(models, entityId, parentValue, field);
        }
        if (field.value_source === 'ALLOTMENTS') {
            return { options: await this._allotmentOptions(models, entityId) };
        }
        if (field.value_source === 'SHARE_TRANSACTIONS') {
            return { options: await this._shareTransactionOptions(models, entityId, field.transaction_types) };
        }
        return { error: 'This popup field does not use remote options' };
    };

    resolveForField = async (field, entityId, parentValue = null, officialRole = null) => {
        const models = this._models();
        const result = await this._resolveRawOptions(field, models, entityId, parentValue, officialRole);
        // The author's own choice of which pieces make up the label (Name /
        // Role / Date, ...) — set from the FormBuilder page. No selection ⇒
        // each data source's own default label, unchanged.
        const pieces = field.option_label_fields || [];
        if (result.options?.length && pieces.length) {
            result.options = result.options.map(option => ({
                ...option,
                label: formatOptionLabel(field.value_source, pieces, option.meta, option.label),
            }));
        }
        return result;
    };

    list = async (formId, fieldKey, query) => {
        try {
            const models = this._models();
            const versionRow = await models.form.findOne({
                where: { form_id: formId, is_deleted: false },
                attributes: ['form_id', 'popup_fields'],
            });
            if (!versionRow) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Form not found');
            const version = plain(versionRow);
            const field = findSchemaField(version.popup_fields, fieldKey);
            if (!field) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Popup field not found in published template');
            if (['MANUAL', 'COMPANY', 'DATES'].includes(field.value_source)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This popup field does not use remote options');
            }
            const entity = await models.entities.findOne({
                where: { entity_id: query.entity_id, entity_type: 'COMPANY', is_deleted: false },
            });
            if (!entity) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company not found');

            const resolved = await this.resolveForField(field, query.entity_id, query.parent_value, query.official_role);
            if (resolved.error) return responseHandler.returnError(httpStatus.UNPROCESSABLE_ENTITY, resolved.error);
            const options = resolved.options;
            const paged = paginateOptions(options, query.search, query.page, query.limit);
            return responseHandler.returnSuccess(httpStatus.OK, 'Popup options fetched', {
                form_id: version.form_id,
                field_key: field.field_key,
                value_source: field.value_source,
                ...paged,
            });
        } catch (error) {
            logger.error('Popup option resolution error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

FormPopupOptionService.findSchemaField = findSchemaField;
FormPopupOptionService.applySearchAndLimit = applySearchAndLimit;
FormPopupOptionService.paginateOptions = paginateOptions;
FormPopupOptionService.latestShareOptions = latestShareOptions;

module.exports = FormPopupOptionService;
