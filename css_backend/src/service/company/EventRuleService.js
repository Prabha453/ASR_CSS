const httpStatus = require('http-status');
const { Op } = require('sequelize');

const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { getDefaultCompanyEventRulesForDisplay } = require('../../config/defaultCompanyEventRules');

const CompanyEventRuleDao = require('../../dao/company/CompanyEventRuleDao');

const logHelper = require('../../helper/LogHelper');
const { MODULES, ACTIONS, STATUS } = require('../../helper/LogHelper');

// ── Pure helpers (duplicated from CompanyEventService) ──
// Self-contained copies so EventRuleService has no dependency on the event
// service module.

const jsonArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return value.split(',').map(item => item.trim()).filter(Boolean);
        }
    }
    return [];
};

const jsonObject = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
};

const csvNumbers = (value) => {
    if (Array.isArray(value)) return value.map(Number).filter(Boolean);
    if (value === undefined || value === null || value === '') return [];
    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.map(Number).filter(Boolean);
        } catch {
            return [];
        }
    }
    return String(value)
        .split(',')
        .map(item => Number(String(item).trim()))
        .filter(Boolean);
};

const csvString = (value) => {
    const numbers = csvNumbers(value);
    return numbers.length ? numbers.join(',') : null;
};

const boolValue = (value, fallback = true) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'active'].includes(String(value).toLowerCase());
};

const slugify = value =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

class EventRuleService {
    constructor() {
        this.ruleDao = new CompanyEventRuleDao();
    }

    _row = row => (row?.toJSON ? row.toJSON() : row);

    _toEventRuleResponse(row) {
        const value = this._row(row);
        if (!value) return value;

        return {
            ...value,
            country_id_list: csvNumbers(value.country_ids),
            legacy_country_id_list: csvNumbers(value.legacy_country_ids),
            company_type_id_list: csvNumbers(value.company_type_ids),
            rule_config: jsonObject(value.rule_config),
        };
    }

    getEventRules = async (query = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.company_event_rule) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event rule model is unavailable');
            }

            const where = { is_deleted: false };
            if (query.event_id) where.event_id = Number(query.event_id);
            if (query.event_slug) where.event_slug = query.event_slug;
            if (query.is_active !== undefined) {
                where.is_active = String(query.is_active) === 'true' || String(query.is_active) === '1';
            }

            const rows = await this.ruleDao.findAll({
                where,
                order: [['event_id', 'ASC'], ['rule_id', 'ASC']],
                include: [
                    ...(models.company_event_name ? [{
                        model: models.company_event_name,
                        as: 'event',
                        required: false,
                        attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'is_system_event', 'is_recurring', 'recurring_period', 'recurring_duration'],
                    }] : []),
                ],
            });

            const databaseRules = rows.map(row => this._toEventRuleResponse(row));
            const defaultRules = getDefaultCompanyEventRulesForDisplay();
            const requestedEventId = query.event_id ? Number(query.event_id) : null;
            const requestedEventSlug = query.event_slug ? String(query.event_slug) : null;
            const defaultSlugs = defaultRules.map(rule => rule.event_slug);
            const eventMasters = models.company_event_name
                ? await models.company_event_name.findAll({
                    where: {
                        event_slug: { [Op.in]: defaultSlugs },
                        event_type: 'EVENT',
                        is_deleted: false,
                    },
                    attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'is_system_event'],
                })
                : [];
            const eventBySlug = Object.fromEntries(eventMasters.map(row => {
                const event = this._row(row);
                return [event.event_slug, event];
            }));
            const displayDefaults = defaultRules
                .map(rule => ({
                    ...rule,
                    event_id: eventBySlug[rule.event_slug]?.e_id || null,
                    event: eventBySlug[rule.event_slug] || { event_name: rule.event_slug, event_slug: rule.event_slug },
                    country_id_list: rule.country_ids,
                    legacy_country_id_list: rule.legacy_country_ids,
                    company_type_id_list: rule.company_type_ids,
                }))
                .filter(rule => !requestedEventId || Number(rule.event_id) === requestedEventId)
                .filter(rule => !requestedEventSlug || rule.event_slug === requestedEventSlug);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company event rules fetched',
                [...displayDefaults, ...databaseRules]
            );
        } catch (err) {
            logger.error('Get company event rules error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching company event rules');
        }
    };

    saveEventRule = async (body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        if (!models.company_event_rule || !models.company_event_name) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event rule models are unavailable');
        }

        const eventId = Number(body.event_id);
        if (!eventId) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is required');
        }

        const t = await models.sequelize.transaction();

        try {
            const eventMaster = await models.company_event_name.findOne({
                where: { e_id: eventId, event_type: 'EVENT', is_deleted: false },
                transaction: t,
            });

            if (!eventMaster) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Selected event is unavailable');
            }

            const event = this._row(eventMaster);
            const eventSlug = event.event_slug || slugify(event.event_name);
            const incomingRuleConfig = jsonObject(body.rule_config);
            const groups = jsonArray(incomingRuleConfig.groups || body.groups);
            const phases = incomingRuleConfig.phases && typeof incomingRuleConfig.phases === 'object'
                ? incomingRuleConfig.phases
                : body.phases && typeof body.phases === 'object'
                    ? body.phases
                    : null;
            const now = new Date();
            const resolvedUserId = userId || body.updated_by || body.created_by || null;
            const companyTypeIds = csvString(body.company_type_ids || body.company_type_id_list);
            const countryIds = csvString(body.country_ids || body.country_id_list);
            const legacyCountryIds = csvString(body.legacy_country_ids || body.legacy_country_id_list);
            const jurisdictionId = body.jurisdiction_id !== undefined && body.jurisdiction_id !== null && body.jurisdiction_id !== ''
                ? Number(body.jurisdiction_id) || null
                : null;

            if (!legacyCountryIds) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Country is required');
            }

            if (!countryIds) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Client customer country is required');
            }

            if (!companyTypeIds) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company type is required');
            }

            const payload = {
                event_id: event.e_id,
                event_slug: eventSlug,
                country_ids: countryIds,
                legacy_country_ids: legacyCountryIds,
                company_type_ids: companyTypeIds,
                jurisdiction_id: jurisdictionId,
                rule_config: {
                    ...(body.rule_config && typeof body.rule_config === 'object' ? body.rule_config : {}),
                    ...(phases ? { phases } : {}),
                    groups,
                    country_ids: countryIds,
                    legacy_country_ids: legacyCountryIds,
                    company_type_ids: companyTypeIds,
                    scope: {
                        country_ids: legacyCountryIds,
                        customer_country_ids: countryIds,
                        company_type_ids: companyTypeIds,
                    },
                },
                is_active: boolValue(body.is_active, true),
                is_deleted: false,
                updated_date: now,
                updated_by: resolvedUserId,
            };

            if (body.rule_priority !== undefined && body.rule_priority !== null && body.rule_priority !== '') {
                payload.rule_priority = Number(body.rule_priority) || 0;
            }

            // Rule versioning (spec §5.3): a rule that has left DRAFT is governed —
            // editing it creates a new DRAFT version instead of mutating the
            // published/under-review/approved row in place.
            let row;
            let isCreate = false;
            let isNewVersion = false;
            let oldValues = null;

            if (body.rule_id) {
                const existing = await this.ruleDao.findOne({
                    where: { rule_id: Number(body.rule_id), is_deleted: false },
                    transaction: t,
                });

                if (!existing) {
                    await t.rollback();
                    return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event rule not found');
                }

                oldValues = this._toEventRuleResponse(existing);

                if (['PUBLISHED', 'APPROVED', 'UNDER_REVIEW'].includes(existing.version_status)) {
                    isNewVersion = true;
                    row = await this.ruleDao.create({
                        ...payload,
                        rule_code: existing.rule_code || existing.rule_id,
                        version_no: (existing.version_no || 1) + 1,
                        version_status: 'DRAFT',
                        effective_from: null,
                        effective_to: null,
                        submitted_by: null,
                        submitted_date: null,
                        approved_by: null,
                        approved_date: null,
                        published_by: null,
                        published_date: null,
                        retired_by: null,
                        retired_date: null,
                        superseded_by_rule_id: null,
                        is_active: false,
                        created_date: now,
                        created_by: resolvedUserId,
                    }, { transaction: t });
                } else {
                    row = existing;
                    await row.update(payload, { transaction: t });
                }
            } else {
                isCreate = true;
                row = await this.ruleDao.create({
                    ...payload,
                    version_no: 1,
                    version_status: 'DRAFT',
                    created_date: now,
                    created_by: body.created_by || resolvedUserId,
                }, { transaction: t });
                await row.update({ rule_code: row.rule_id }, { transaction: t });
            }

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.SAVE_EVENT_RULE,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: row.rule_id,
                new_values: this._toEventRuleResponse(row),
                old_values: (isCreate || isNewVersion) ? null : oldValues,
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                isNewVersion ? 'New draft version created' : 'Company event rule saved',
                this._toEventRuleResponse(row)
            );
        } catch (err) {
            await t.rollback();
            logger.error('Save company event rule error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.SAVE_EVENT_RULE,
                user_id: userId,
                table_name: 'company_event_rule',
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error saving company event rule');
        }
    };

    deleteEventRule = async (ruleId, body = {}, userId = null, req = null) => {
        try {
            const id = Number(ruleId || body.rule_id);
            if (!id) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Rule id is required');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            const [affected] = await this.ruleDao.update(
                {
                    is_deleted: true,
                    is_active: false,
                    updated_by: resolvedUserId,
                    updated_date: new Date(),
                },
                { where: { rule_id: id, is_deleted: false } }
            );

            if (!affected) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event rule not found');
            }

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.DELETE_EVENT_RULE,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: id,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Company event rule deleted', { rule_id: id });
        } catch (err) {
            logger.error('Delete company event rule error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.DELETE_EVENT_RULE,
                user_id: userId,
                table_name: 'company_event_rule',
                record_id: ruleId,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting company event rule');
        }
    };

    // Shared DRAFT→UNDER_REVIEW→APPROVED→RETIRED transitions (spec §5.3). PUBLISHED is
    // handled separately by publishRule since it also has to supersede the prior version.
    _transitionRule = async (ruleId, body = {}, userId = null, req = null, options = {}) => {
        const {
            fromStatuses, toStatus, actorField, dateField, action,
            notFoundMessage, invalidMessage, successMessage, extraUpdate = {},
        } = options;

        const models = getCurrentModels();
        if (!models.company_event_rule) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event rule model is unavailable');
        }

        const id = Number(ruleId || body.rule_id);
        if (!id) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Rule id is required');
        }

        const resolvedUserId = userId || body.updated_by || null;
        const t = await models.sequelize.transaction();

        try {
            const row = await this.ruleDao.findOne({ where: { rule_id: id, is_deleted: false }, transaction: t });
            if (!row) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, notFoundMessage);
            }

            if (!fromStatuses.includes(row.version_status)) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, invalidMessage);
            }

            const oldValues = this._toEventRuleResponse(row);
            const now = new Date();

            await row.update({
                version_status: toStatus,
                [actorField]: resolvedUserId,
                [dateField]: now,
                updated_date: now,
                updated_by: resolvedUserId,
                ...extraUpdate,
            }, { transaction: t });

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: id,
                old_values: oldValues,
                new_values: this._toEventRuleResponse(row),
            });

            return responseHandler.returnSuccess(httpStatus.OK, successMessage, this._toEventRuleResponse(row));
        } catch (err) {
            await t.rollback();
            logger.error('Transition company event rule error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: id,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating company event rule');
        }
    };

    submitForReview = (ruleId, body = {}, userId = null, req = null) => this._transitionRule(ruleId, body, userId, req, {
        fromStatuses: ['DRAFT'],
        toStatus: 'UNDER_REVIEW',
        actorField: 'submitted_by',
        dateField: 'submitted_date',
        action: ACTIONS.SUBMIT_EVENT_RULE,
        notFoundMessage: 'Company event rule not found',
        invalidMessage: 'Only draft rules can be submitted for review',
        successMessage: 'Rule submitted for review',
    });

    approveRule = (ruleId, body = {}, userId = null, req = null) => this._transitionRule(ruleId, body, userId, req, {
        fromStatuses: ['UNDER_REVIEW'],
        toStatus: 'APPROVED',
        actorField: 'approved_by',
        dateField: 'approved_date',
        action: ACTIONS.APPROVE_EVENT_RULE,
        notFoundMessage: 'Company event rule not found',
        invalidMessage: 'Only rules under review can be approved',
        successMessage: 'Rule approved',
    });

    retireRule = (ruleId, body = {}, userId = null, req = null) => this._transitionRule(ruleId, body, userId, req, {
        fromStatuses: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'],
        toStatus: 'RETIRED',
        actorField: 'retired_by',
        dateField: 'retired_date',
        action: ACTIONS.RETIRE_EVENT_RULE,
        notFoundMessage: 'Company event rule not found',
        invalidMessage: 'Rule cannot be retired from its current status',
        successMessage: 'Rule retired',
        extraUpdate: { is_active: false },
    });

    // Publishing is not a plain status flip: it also supersedes whatever was previously
    // PUBLISHED under the same rule_code, so only one version of a rule is ever live.
    publishRule = async (ruleId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        if (!models.company_event_rule) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event rule model is unavailable');
        }

        const id = Number(ruleId || body.rule_id);
        if (!id) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Rule id is required');
        }

        const resolvedUserId = userId || body.updated_by || null;
        const t = await models.sequelize.transaction();

        try {
            const row = await this.ruleDao.findOne({ where: { rule_id: id, is_deleted: false }, transaction: t });
            if (!row) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event rule not found');
            }

            if (row.version_status !== 'APPROVED') {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Only approved rules can be published');
            }

            const now = new Date();
            const effectiveFrom = body.effective_from ? new Date(body.effective_from) : now;
            const ruleCode = row.rule_code || row.rule_id;

            const priorPublished = await this.ruleDao.findAll({
                where: {
                    rule_code: ruleCode,
                    version_status: 'PUBLISHED',
                    rule_id: { [Op.ne]: id },
                },
                transaction: t,
            });

            for (const prior of priorPublished) {
                await prior.update({
                    version_status: 'SUPERSEDED',
                    superseded_by_rule_id: id,
                    effective_to: effectiveFrom,
                    is_active: false,
                    updated_date: now,
                    updated_by: resolvedUserId,
                }, { transaction: t });
            }

            const oldValues = this._toEventRuleResponse(row);

            await row.update({
                version_status: 'PUBLISHED',
                effective_from: effectiveFrom,
                effective_to: body.effective_to ? new Date(body.effective_to) : null,
                published_by: resolvedUserId,
                published_date: now,
                is_active: true,
                updated_date: now,
                updated_by: resolvedUserId,
            }, { transaction: t });

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.PUBLISH_EVENT_RULE,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: id,
                old_values: oldValues,
                new_values: this._toEventRuleResponse(row),
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Rule published', this._toEventRuleResponse(row));
        } catch (err) {
            await t.rollback();
            logger.error('Publish company event rule error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.PUBLISH_EVENT_RULE,
                user_id: resolvedUserId,
                table_name: 'company_event_rule',
                record_id: id,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error publishing company event rule');
        }
    };

    listRuleVersions = async (ruleId) => {
        try {
            const id = Number(ruleId);
            if (!id) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Rule id is required');
            }

            const models = getCurrentModels();
            if (!models.company_event_rule) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event rule model is unavailable');
            }

            const anchor = await this.ruleDao.findOne({ where: { rule_id: id, is_deleted: false } });
            if (!anchor) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event rule not found');
            }

            const ruleCode = anchor.rule_code || anchor.rule_id;
            const rows = await this.ruleDao.findAll({
                where: { rule_code: ruleCode, is_deleted: false },
                order: [['version_no', 'DESC']],
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Rule versions fetched',
                rows.map(row => this._toEventRuleResponse(row))
            );
        } catch (err) {
            logger.error('List company event rule versions error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching rule versions');
        }
    };
}

module.exports = EventRuleService;
