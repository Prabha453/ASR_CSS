const httpStatus = require('http-status');
const { Op } = require('sequelize');

const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { getOfficialRoleGroupsByEntityIds } = require('../../helper/officialRoleHelper');

const EntityCompanyService = require('./EntityCompanyService');
const CompanyEventDao = require('../../dao/company/CompanyEventDao');
const { decrypt } = require('../../utils/crypto');

const logHelper = require('../../helper/LogHelper');
const { MODULES, ACTIONS, STATUS } = require('../../helper/LogHelper');
const { EVENT_STATUS, EVENT_STATUS_VALUES, OPEN_EVENT_STATUSES, ALLOWED_STATUS_TRANSITIONS } = require('../../config/companyEventStatus');
const { copyChecklistTemplateToEvent } = require('../../helper/documentChecklistHelper');

// EVENT_STATUS/EVENT_STATUS_VALUES now come from src/config/companyEventStatus.js
// (shared with EntityCompanyService.js and CommonCronService.js — see that module
// for the full workflow lifecycle and transition map, spec §10).

// Maximum total extension window from the original due date, in days.
// Kept as a single source of truth so the API and the frontend's
// canApplyExtension() gate agree at the boundary.
const MAX_EXTENSION_TOTAL_DAYS = 180;

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

const jsonPayload = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string' && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) return parsed;
        } catch {
            return jsonArray(value);
        }
    }
    return fallback;
};

const flattenPartyPayload = (value) => {
    const payload = jsonPayload(value, []);
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

const hasToRecipient = value =>
    flattenPartyPayload(value).some(row => String(row?.channel || '').toUpperCase() === 'TO');

const isValidEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

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

const dateOrNull = (value) => {
    if (!value) return null;
    const clean = String(value).trim().split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [day, month, year] = clean.split('/');
        return `${year}-${month}-${day}`;
    }
    return value;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const addDays = (value, days) => {
    const date = new Date(dateOrNull(value));
    if (Number.isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
};

const addRecurringInterval = (value, period = 1, duration = 'Years') => {
    const clean = dateOrNull(value);
    if (!clean) return null;

    const date = new Date(clean);
    if (Number.isNaN(date.getTime())) return null;

    const amount = Number(period || 1);
    const unit = String(duration || 'Years').trim().toLowerCase();

    if (unit.startsWith('year')) date.setFullYear(date.getFullYear() + amount);
    else if (unit.startsWith('month')) date.setMonth(date.getMonth() + amount);
    else if (unit.startsWith('week')) date.setDate(date.getDate() + (amount * 7));
    else date.setDate(date.getDate() + amount);

    return date.toISOString().slice(0, 10);
};

const daysBetween = (from, to) => {
    const start = new Date(dateOrNull(from));
    const end = new Date(dateOrNull(to));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - start.getTime()) / 86400000);
};

const REMINDER_DATE_BASIS = {
    ACTUAL: 'ACTUAL_DUE_DATE',
    EXTENDED: 'EXTENDED_DUE_DATE',
};

const LEGACY_YEARLY_RECURRING_SLUGS = new Set([
    'agm',
    'ar',
    'annual-general-meeting',
    'annual-return-filing',
    'anniversary',
    'anniversary-of-registration',
    'annual-filing',
    'annual-declaration',
    'eci',
    'tax-return',
]);

const BLOCKED_NEXT_EVENT_COMPANY_STATUSES = new Set([
    'TERMINATED',
    'STRIKING OFF',
    'PRE-INCORPORATION',
    'DISSOLVED',
    'STRUCK-OFF',
    'STRUCK OFF',
    'DE-REGISTERED',
    'DEREGISTERED',
]);

const normalizeReminderDateBasis = value =>
    String(value || '').toUpperCase() === REMINDER_DATE_BASIS.ACTUAL
        ? REMINDER_DATE_BASIS.ACTUAL
        : REMINDER_DATE_BASIS.EXTENDED;

const maybeDecryptContactValue = (value) => {
    const clean = String(value || '').trim();
    if (!clean) return '';
    if (isValidEmail(clean)) return clean;
    if (/^[a-f0-9]+$/i.test(clean) && clean.length % 2 === 0) {
        const decrypted = decrypt(clean);
        if (decrypted && isValidEmail(decrypted)) return decrypted;
    }
    return clean;
};

// NOTE: `boolValue` is currently unused within this trimmed file (it was only
// consumed by saveEventRule, which now lives in EventRuleService). Kept here
// only if other event-payload logic in your codebase still references it via
// this module; safe to delete if nothing imports it from here.

const agmStatusFields = [
    'prepared_date',
    'dormant_status',
    'solvent_status',
    'accounts_status',
    'xbrl',
    'financial_statements_status',
    'audited_fs_status',
    'fs_signed_by',
    'financial_statement_date',
    'agm_documents',
];

const eventDetailFields = [
    'year_of_fye',
    'actual_year',
    'held_time',
    'held_time_end',
    'venue_type',
    'venue',
    'meeting_chairman',
    'type_shareholder',
    'meeting_corporate_shareholder_rep',
    'meeting_agenda',
    'sender_email',
    'reply_to_email',
    'group_to_recipient',
    'email_config_id',
    'remarks',
];

class CompanyEventService {
    constructor() {
        this.entityCompanyService = new EntityCompanyService();
        this.eventDao = new CompanyEventDao();
    }

    _row = row => (row?.toJSON ? row.toJSON() : row);

    _normalizeEventStatus(value) {
        const status = String(value || '').toUpperCase();
        return EVENT_STATUS_VALUES.includes(status) ? status : null;
    }

    _resolveEventStatus(body = {}, existing = null, filingDate = null) {
        const explicitStatus = this._normalizeEventStatus(body.status);
        if ([EVENT_STATUS.WAIVED, EVENT_STATUS.DISPENSE, EVENT_STATUS.EXEMPT, EVENT_STATUS.CANCELLED].includes(explicitStatus)) {
            return explicitStatus;
        }

        const completedDate = dateOrNull(
            filingDate
            || body.filing_date
            || body.completed_date
            || body.completedDate
            || existing?.filing_date
        );

        if (completedDate && completedDate <= todayDate()) {
            return EVENT_STATUS.COMPLETED;
        }

        if (explicitStatus) return explicitStatus;
        return this._normalizeEventStatus(existing?.status) || EVENT_STATUS.PENDING;
    }

    _eventDisplayStatus(event = {}) {
        const status = this._normalizeEventStatus(event.status) || EVENT_STATUS.PENDING;
        const dueDate = dateOrNull(event.extended_due_date || event.due_date);
        if (this._eventExtensionType(event) === 'AGM' && [EVENT_STATUS.WAIVED, EVENT_STATUS.DISPENSE].includes(status)) {
            return 'DISPENSE';
        }
        // OVERDUE now applies to any open/in-progress status, not just PENDING —
        // an event stuck in IN_PREPARATION past its due date is still overdue.
        if (OPEN_EVENT_STATUSES.includes(status) && dueDate && dueDate < todayDate()) {
            return 'OVERDUE';
        }
        if (status === EVENT_STATUS.PENDING) {
            const targetDate = dateOrNull(event.operational_target_date);
            if (targetDate) return todayDate() < targetDate ? 'UPCOMING' : 'NOT_STARTED';
        }
        return status;
    }

    // Spec §7.2 "Grace Period" — does NOT change display_status/is_overdue (an event
    // can be OVERDUE while still in_grace_period, with penalty_started still false).
    // Purely computed, mirrors _eventDisplayStatus's date-comparison style.
    _penaltyStatus(event = {}) {
        const status = this._normalizeEventStatus(event.status) || EVENT_STATUS.PENDING;
        if (!OPEN_EVENT_STATUSES.includes(status)) {
            return { in_grace_period: false, penalty_started: false };
        }

        const dueDate = dateOrNull(event.extended_due_date || event.due_date);
        const graceEndDate = dateOrNull(event.grace_end_date);
        const penaltyStartDate = dateOrNull(event.penalty_start_date);
        const today = todayDate();

        const isPastDue = Boolean(dueDate && dueDate < today);
        const inGracePeriod = Boolean(isPastDue && graceEndDate && today <= graceEndDate);
        const penaltyStarted = Boolean(isPastDue && penaltyStartDate && today >= penaltyStartDate);

        return { in_grace_period: inGracePeriod, penalty_started: penaltyStarted };
    }

    _eventExtensionType(event = {}) {
        const slug = String(event.event_slug || event.event?.event_slug || '').toLowerCase();
        const name = String(event.event?.event_name || event.event_name || '').toLowerCase();
        if (slug === 'agm' || name === 'agm' || slug === 'annual-general-meeting' || name === 'annual general meeting') return 'AGM';
        if (slug === 'ar' || name === 'ar' || slug === 'annual-return-filing' || name === 'annual return filing') return 'AR';
        if (slug === 'annual-filing' || name === 'annual filing') return 'ANNUAL_FILING';
        return '';
    }

    _extensionAllowedDays(type) {
        if (type === 'AGM') return [60];
        if (type === 'AR') return [60];
        if (type === 'ANNUAL_FILING') return [60];
        return [];
    }

    // Statuses that permanently or temporarily take an event out of the
    // "active" extension/dispense/exempt/workflow lifecycle. Kept as one helper
    // so every gate (extend, dispense, exempt, workflow-status update) reads the
    // same source of truth.
    _isBlockedLifecycleStatus(status) {
        return [
            EVENT_STATUS.COMPLETED,
            EVENT_STATUS.WAIVED,
            EVENT_STATUS.DISPENSE,
            EVENT_STATUS.EXEMPT,
            EVENT_STATUS.CANCELLED,
            EVENT_STATUS.FILED,
            EVENT_STATUS.NOT_APPLICABLE,
        ].includes(status);
    }

    // Spec §10.1/§15.1: completion must not silently bypass mandatory checklist
    // items. Only ever a real gate when a checklist is actually configured — an
    // event type with no template/no instance rows passes trivially, so this is
    // zero-risk for every event type that predates this feature.
    // `companyEventId` set → check the event's own instance rows (update path).
    // `companyEventId` null → no instance exists yet, check the master's template
    // directly (create path, e.g. a manual create that already sets filing_date).
    async _checkChecklistCompletion(models, { companyEventId, eventMasterId }, transaction = null) {
        if (!models.company_event_document || !models.compliance_document_checklist_template) return null;

        let mandatoryTotal = 0;
        let mandatoryOutstanding = 0;

        if (companyEventId) {
            const rows = await models.company_event_document.findAll({
                where: { company_event_id: companyEventId, is_mandatory: true, is_deleted: false },
                transaction,
            });
            mandatoryTotal = rows.length;
            mandatoryOutstanding = rows.filter(row => !['APPROVED', 'NOT_APPLICABLE'].includes(row.status)).length;
        } else if (eventMasterId) {
            mandatoryTotal = await models.compliance_document_checklist_template.count({
                where: { event_master_id: eventMasterId, is_mandatory: true, is_deleted: false },
                transaction,
            });
            mandatoryOutstanding = mandatoryTotal;
        }

        if (mandatoryTotal > 0 && mandatoryOutstanding > 0) {
            return `${mandatoryOutstanding} mandatory document(s) still outstanding — cannot mark this event completed`;
        }
        return null;
    }

    _extensionActionName(type, action) {
        const names = {
            AGM: {
                extend: 'Extended Due Date',
                cancel: 'Cancel AGM extend',
                category: 'AGM Extension',
            },
            AR: {
                extend: 'Extended AR Due Date',
                cancel: 'Cancel AR extend',
                category: 'AR Extension',
            },
            ANNUAL_FILING: {
                extend: 'Extended Annual Filing Due Date',
                cancel: 'Cancel Annual Filing extend',
                category: 'Annual Filing Extension',
            },
        };
        return names[type]?.[action] || action;
    }

    // Spec §7 "Extension, Grace and Waiver Logic" — additive, evidence-backed history.
    // Written alongside the existing instant self-service extend/dispense/exempt actions
    // (auto-approved, since there's no request/approval step today) without changing any
    // of their existing behavior. Never throws — a failure here must not block or roll
    // back the primary action.
    _recordComplianceExtension = async (payload = {}, t = null) => {
        try {
            const models = getCurrentModels();
            if (!models.compliance_extension) return null;
            const row = await models.compliance_extension.create({
                company_event_id: payload.companyEventId,
                entity_id: payload.entityId,
                event_id: payload.eventId,
                event_slug: payload.eventSlug,
                extension_type: payload.extensionType,
                action: payload.action,
                request_date: new Date(),
                reason: payload.reason || null,
                authority: payload.authority || null,
                reference: payload.reference || null,
                previous_due_date: payload.previousDueDate || null,
                requested_due_date: payload.requestedDueDate || null,
                approved_due_date: payload.approvedDueDate || null,
                extension_days: payload.extensionDays ?? null,
                status: 'APPROVED',
                decision_date: new Date(),
                decision_by: payload.userId || null,
                created_by: payload.userId || null,
                created_date: new Date(),
            }, t ? { transaction: t } : {});
            await this._linkEvidenceDoc(payload.evidenceDocId, payload.companyEventId, row.extension_id, 'compliance_extension');
            return row;
        } catch (err) {
            logger.error('Record compliance extension error:', err);
            return null;
        }
    };

    _recordComplianceWaiver = async (payload = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.compliance_waiver) return null;
            const row = await models.compliance_waiver.create({
                company_event_id: payload.companyEventId,
                entity_id: payload.entityId,
                event_id: payload.eventId,
                event_slug: payload.eventSlug,
                waiver_type: payload.waiverType,
                action: payload.action,
                reason: payload.reason || null,
                authority: payload.authority || null,
                reference: payload.reference || null,
                effective_from: payload.effectiveFrom || null,
                effective_to: payload.effectiveTo || null,
                status: 'APPROVED',
                decision_date: new Date(),
                decision_by: payload.userId || null,
                created_by: payload.userId || null,
                created_date: new Date(),
            });
            await this._linkEvidenceDoc(payload.evidenceDocId, payload.companyEventId, row.waiver_id, 'compliance_waiver');
            return row;
        } catch (err) {
            logger.error('Record compliance waiver error:', err);
            return null;
        }
    };

    // Fire-and-forget: the evidence file is uploaded standalone before the
    // extension/waiver row exists, so this stamps company_event_id/module_record_id
    // onto that document_store row after the fact. Never throws.
    _linkEvidenceDoc = async (docId, companyEventId, moduleRecordId, moduleName) => {
        if (!docId) return;
        try {
            const models = getCurrentModels();
            if (!models.document_store) return;
            await models.document_store.update(
                { company_event_id: companyEventId, module_record_id: moduleRecordId, module_name: moduleName },
                { where: { doc_id: Number(docId), is_deleted: false } }
            );
        } catch (err) {
            logger.warn('Link evidence document error:', err.message);
        }
    };

    _eventInclude(models, mode = 'basic') {
        const includeCompanyContext = ['detail', 'reminder'].includes(mode);
        return [
            ...(models.company_event_name ? [{
                model: models.company_event_name,
                as: 'event',
                required: false,
                attributes: ['e_id', 'event_name', 'event_slug', 'event_subject', 'color_code', 'is_system_event', 'is_recurring', 'recurring_period', 'recurring_duration', 'supports_extension', 'supports_waiver', 'evidence_required'],
            }] : []),
            ...(models.entities ? [{
                model: models.entities,
                as: 'entity',
                required: false,
                attributes: ['entity_id', 'name', 'client_no', 'status', 'uen_no', 'fbrn_reg_no', 'uf_no', 'domes_bus_no', 'acra_no', 'company_type_id'],
                include: includeCompanyContext ? [
                    ...(models.entity_company_details ? [{
                        model: models.entity_company_details,
                        as: 'company_detail',
                        required: false,
                        attributes: ['company_incorporation_date', 'company_fin_date', 'country', 'country_id'],
                    }] : []),
                    ...(models.entity_address ? [{
                        model: models.entity_address,
                        as: 'addresses',
                        required: false,
                        attributes: ['address_id', 'address_type', 'block_no', 'street_name', 'building_name', 'level_no', 'unit_no', 'city', 'state', 'postal_code', 'country', 'is_primary'],
                        where: { is_deleted: false },
                    }] : []),
                ] : [],
            }] : []),
        ];
    }

    _detailPayloadFromBody(body = {}, existing = {}) {
        return eventDetailFields.reduce((acc, field) => {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                if (field === 'meeting_corporate_shareholder_rep') {
                    const value = Array.isArray(body[field]) || (body[field] && typeof body[field] === 'object')
                        ? body[field]
                        : jsonArray(body[field]);
                    acc[field] = Array.isArray(value) && value.length === 0 ? null : value;
                } else {
                    acc[field] = body[field] === '' ? null : body[field];
                }
            } else if (existing && Object.prototype.hasOwnProperty.call(existing, field)) {
                acc[field] = existing[field];
            }

            return acc;
        }, {});
    }

    _agmStatusDetailsFromBody(body = {}, existing = {}) {
        const existingDetails = jsonObject(existing?.agm_status_details);
        const bodyDetails = jsonObject(body.agm_status_details);
        const details = { ...existingDetails, ...bodyDetails };

        agmStatusFields.forEach((field) => {
            if (!Object.prototype.hasOwnProperty.call(body, field)) return;

            if (field === 'fs_signed_by') {
                const value = Array.isArray(body[field]) || (body[field] && typeof body[field] === 'object')
                    ? body[field]
                    : jsonArray(body[field]);
                details[field] = Array.isArray(value) && value.length === 0 ? null : value;
                return;
            }

            details[field] = body[field] === '' ? null : body[field];
        });

        const hasValue = Object.values(details).some((value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (value && typeof value === 'object') return Object.keys(value).length > 0;
            return value !== null && value !== undefined && value !== '';
        });

        return hasValue ? details : null;
    }

    _buildEventPayload(body = {}, eventMaster, userId = null, existing = null) {
        const event = this._row(eventMaster);
        const eventSlug = event.event_slug || body.event_slug || slugify(event.event_name);
        const sourceFrom = body.source_from || existing?.source_from || 'MANUAL';
        const resolvedDueDate = dateOrNull(body.due_date !== undefined ? body.due_date : existing?.due_date);

        return {
            entity_id: Number(body.entity_id || body.company_id || existing?.entity_id) || null,
            event_id: Number(event.e_id || body.event_id || existing?.event_id),
            event_slug: eventSlug,
            rule_id: body.rule_id || existing?.rule_id || null,
            year_of_fye: body.year_of_fye || existing?.year_of_fye || null,
            period_start: dateOrNull(body.period_start !== undefined ? body.period_start : existing?.period_start),
            period_end: dateOrNull(body.period_end !== undefined ? body.period_end : existing?.period_end),
            actual_year: body.actual_year || existing?.actual_year || null,
            actual_fye: dateOrNull(body.actual_fye || body.fye_date || existing?.actual_fye),
            fye_date: dateOrNull(body.fye_date || existing?.fye_date),
            base_date: dateOrNull(body.base_date !== undefined ? body.base_date : existing?.base_date),
            sent_date: dateOrNull(body.sent_date !== undefined ? body.sent_date : existing?.sent_date),
            received_date: dateOrNull(body.received_date !== undefined ? body.received_date : existing?.received_date),
            ...this._detailPayloadFromBody(body, existing),
            agm_status_details: this._agmStatusDetailsFromBody(body, existing),
            recurring_period: body.recurring_period !== undefined && body.recurring_period !== ''
                ? Number(body.recurring_period)
                : existing?.recurring_period ?? (event.is_recurring ? event.recurring_period : null) ?? null,
            recurring_duration: body.recurring_duration !== undefined && body.recurring_duration !== ''
                ? body.recurring_duration
                : existing?.recurring_duration ?? (event.is_recurring ? event.recurring_duration : null) ?? null,
            extended_due_date: dateOrNull(body.extended_due_date !== undefined ? body.extended_due_date : existing?.extended_due_date),
            reminder_date_basis: body.reminder_date_basis !== undefined
                ? normalizeReminderDateBasis(body.reminder_date_basis)
                : normalizeReminderDateBasis(existing?.reminder_date_basis),
            due_date: resolvedDueDate,
            operational_target_date: resolvedDueDate
                ? addDays(resolvedDueDate, -(Number(event.operational_lead_days) || 7))
                : dateOrNull(existing?.operational_target_date),
            grace_end_date: resolvedDueDate
                ? (Number(event.grace_period_days) > 0 ? addDays(resolvedDueDate, Number(event.grace_period_days)) : null)
                : dateOrNull(existing?.grace_end_date),
            penalty_start_date: resolvedDueDate
                ? addDays(resolvedDueDate, Number(event.grace_period_days) || 0)
                : dateOrNull(existing?.penalty_start_date),
            held_date: dateOrNull(body.held_date !== undefined ? body.held_date : existing?.held_date),
            filing_date: dateOrNull(body.filing_date !== undefined ? body.filing_date : (body.completed_date !== undefined ? body.completed_date : existing?.filing_date)),
            status: this._resolveEventStatus(body, existing, body.filing_date !== undefined ? body.filing_date : body.completed_date),
            source_from: sourceFrom,
            source_basis: body.source_basis || (sourceFrom === 'MANUAL' ? 'Manual Event' : existing?.source_basis || null),
            generated_from_date: dateOrNull(body.generated_from_date !== undefined ? body.generated_from_date : existing?.generated_from_date),
            attendees: body.attendees !== undefined ? jsonPayload(body.attendees, []) : jsonPayload(existing?.attendees, []),
            receiving_parties: body.receiving_parties !== undefined ? jsonPayload(body.receiving_parties, []) : jsonPayload(existing?.receiving_parties, []),
            reminders: body.reminders !== undefined ? jsonPayload(body.reminders, []) : jsonPayload(existing?.reminders, []),
            uploaded_files: body.uploaded_files !== undefined ? jsonPayload(body.uploaded_files, []) : jsonPayload(existing?.uploaded_files, []),
            is_deleted: false,
            updated_date: new Date(),
            updated_by: userId || body.updated_by || body.created_by || null,
        };
    }

    _recurringConfigForEvent(event = {}, eventMaster = {}) {
        const slug = String(event.event_slug || eventMaster?.event_slug || '').toLowerCase();
        const rowPeriod = Number(event.recurring_period || 0);
        const masterPeriod = Number(eventMaster?.recurring_period || 0);
        const rowDuration = event.recurring_duration || '';
        const masterDuration = eventMaster?.recurring_duration || '';

        if (rowPeriod > 0 || masterPeriod > 0 || eventMaster?.is_recurring) {
            return {
                period: rowPeriod || masterPeriod || 1,
                duration: rowDuration || masterDuration || 'Years',
            };
        }

        if (LEGACY_YEARLY_RECURRING_SLUGS.has(slug)) {
            return { period: 1, duration: 'Years' };
        }

        return null;
    }

    _nextRecurringEventPayload(existing = {}, eventMaster = {}, userId = null) {
        const config = this._recurringConfigForEvent(existing, eventMaster);
        if (!config || !existing.due_date) return null;

        const nextDueDate = addRecurringInterval(existing.due_date, config.period, config.duration);
        if (!nextDueDate) return null;

        const nextFyeDate = addRecurringInterval(existing.fye_date || existing.actual_fye || existing.period_end, config.period, config.duration);
        const nextPeriodStart = addRecurringInterval(existing.period_start, config.period, config.duration);
        const nextPeriodEnd = addRecurringInterval(existing.period_end, config.period, config.duration);
        const nextActualYear = this._eventYearFromDate(nextFyeDate || nextDueDate);

        return {
            entity_id: existing.entity_id,
            event_id: existing.event_id,
            event_slug: existing.event_slug || eventMaster?.event_slug || slugify(eventMaster?.event_name),
            rule_id: existing.rule_id || null,
            year_of_fye: nextActualYear,
            period_start: nextPeriodStart,
            period_end: nextPeriodEnd || nextFyeDate,
            actual_year: nextActualYear,
            actual_fye: nextFyeDate,
            fye_date: nextFyeDate,
            base_date: nextFyeDate || nextDueDate,
            sent_date: null,
            received_date: null,
            held_time: null,
            held_time_end: null,
            venue_type: null,
            venue: null,
            meeting_chairman: null,
            type_shareholder: null,
            meeting_corporate_shareholder_rep: null,
            meeting_agenda: null,
            sender_email: existing.sender_email || null,
            reply_to_email: existing.reply_to_email || null,
            agm_status_details: null,
            group_to_recipient: existing.group_to_recipient || null,
            email_config_id: existing.email_config_id || null,
            recurring_period: config.period,
            recurring_duration: config.duration,
            extended_due_date: null,
            reminder_date_basis: normalizeReminderDateBasis(existing.reminder_date_basis),
            remarks: null,
            due_date: nextDueDate,
            operational_target_date: nextDueDate ? addDays(nextDueDate, -(Number(eventMaster?.operational_lead_days) || 7)) : null,
            grace_end_date: nextDueDate && Number(eventMaster?.grace_period_days) > 0
                ? addDays(nextDueDate, Number(eventMaster.grace_period_days))
                : null,
            penalty_start_date: nextDueDate ? addDays(nextDueDate, Number(eventMaster?.grace_period_days) || 0) : null,
            held_date: null,
            filing_date: null,
            status: EVENT_STATUS.PENDING,
            source_from: 'AUTO_RULE',
            source_basis: 'Generated from completed recurring event',
            generated_from_date: existing.due_date,
            attendees: jsonPayload(existing.attendees, []),
            receiving_parties: jsonPayload(existing.receiving_parties, []),
            reminders: jsonPayload(existing.reminders, []),
            uploaded_files: [],
            is_deleted: false,
            created_date: new Date(),
            created_by: userId || existing.updated_by || existing.created_by || null,
            updated_date: new Date(),
            updated_by: userId || existing.updated_by || existing.created_by || null,
        };
    }

    async _isNextEventBlockedByCompanyStatus(entityId, transaction = null) {
        const models = getCurrentModels();
        if (!models.entities || !entityId) return false;

        const entity = await models.entities.findOne({
            where: { entity_id: entityId, is_deleted: false },
            attributes: ['entity_id', 'status', 'company_status'],
            transaction,
        });
        const value = String(entity?.status || entity?.company_status || '').trim().toUpperCase();
        return BLOCKED_NEXT_EVENT_COMPANY_STATUSES.has(value);
    }

    async _findExistingRecurringEvent(nextPayload = {}, excludedEventId = null, transaction = null) {
        if (!nextPayload.entity_id || !nextPayload.event_slug || !nextPayload.due_date) return null;

        const where = {
            entity_id: nextPayload.entity_id,
            event_slug: nextPayload.event_slug,
            is_deleted: false,
            ...(excludedEventId ? { company_event_id: { [Op.ne]: excludedEventId } } : {}),
            [Op.or]: [
                ...(nextPayload.fye_date ? [{ fye_date: nextPayload.fye_date }] : []),
                { due_date: nextPayload.due_date },
            ],
        };

        return this.eventDao.findOne({ where, transaction });
    }

    async _ensureInitialRecurringEvents(created = {}, eventMaster = {}, userId = null, transaction = null) {
        if (!created?.company_event_id) return [];
        const isCreateRecurring = Number(created.recurring_period || 0) > 0 || Boolean(eventMaster?.is_recurring);
        if (!isCreateRecurring) return [];
        if (await this._isNextEventBlockedByCompanyStatus(created.entity_id, transaction)) return [];

        const generated = [];
        let baseEvent = created;
        const maxIterations = 5;

        for (let index = 0; index < maxIterations; index += 1) {
            const nextPayload = this._nextRecurringEventPayload(baseEvent, eventMaster, userId);
            if (!nextPayload) break;

            const duplicate = await this._findExistingRecurringEvent(
                nextPayload,
                created.company_event_id,
                transaction
            );
            if (duplicate) break;

            const nextInstance = await this.eventDao.create(nextPayload, { transaction });
            const nextRow = this._row(nextInstance);
            generated.push(nextRow);

            await copyChecklistTemplateToEvent(getCurrentModels(), {
                companyEventId: nextRow.company_event_id, eventMasterId: eventMaster?.e_id,
                entityId: nextRow.entity_id, eventId: nextRow.event_id, eventSlug: nextRow.event_slug,
                userId,
            }, transaction);

            if (!nextPayload.due_date || nextPayload.due_date > todayDate()) break;
            baseEvent = nextRow;
        }

        return generated;
    }

    async _ensureNextRecurringEvent(existing = {}, updated = {}, eventMaster = {}, userId = null, transaction = null) {
        const existingFilingDate = dateOrNull(existing.filing_date);
        const updatedFilingDate = dateOrNull(updated.filing_date);
        if (!updatedFilingDate || existingFilingDate === updatedFilingDate) {
            return null;
        }

        if (await this._isNextEventBlockedByCompanyStatus(updated.entity_id, transaction)) {
            return null;
        }

        const nextPayload = this._nextRecurringEventPayload(updated, eventMaster, userId);
        if (!nextPayload) return null;

        const existingNext = await this._findExistingRecurringEvent(nextPayload, updated.company_event_id, transaction);
        if (existingNext) return this._row(existingNext);

        const created = await this.eventDao.create(nextPayload, { transaction });
        const createdRow = this._row(created);

        await copyChecklistTemplateToEvent(getCurrentModels(), {
            companyEventId: createdRow.company_event_id, eventMasterId: eventMaster?.e_id,
            entityId: createdRow.entity_id, eventId: createdRow.event_id, eventSlug: createdRow.event_slug,
            userId,
        }, transaction);

        return createdRow;
    }

    _validateEventPayload(body = {}, existing = null) {
        const dueDate = body.due_date !== undefined ? body.due_date : existing?.due_date;
        const senderEmail = body.sender_email !== undefined ? body.sender_email : existing?.sender_email;
        const replyEmail = body.reply_to_email !== undefined ? body.reply_to_email : existing?.reply_to_email;
        const receivingParties = body.receiving_parties !== undefined ? body.receiving_parties : existing?.receiving_parties;
        const rows = flattenPartyPayload(receivingParties);

        if (!dueDate) return 'Due date is required';
        if (!senderEmail) return 'Default sending email is required';
        if (!isValidEmail(senderEmail)) return 'Default sending email is invalid';
        if (!replyEmail) return 'Reply email is required';
        if (!isValidEmail(replyEmail)) return 'Reply email is invalid';
        if (!rows.length) {
            return 'Select at least one recipient';
        }
        if (!hasToRecipient(receivingParties)) {
            return 'Select at least one To recipient';
        }

        return null;
    }

    async _enrichReceivingPartyPayload(value, event = {}) {
        const payload = jsonPayload(value, []);
        const rows = flattenPartyPayload(payload);
        const officialEmailById = await this._officialPrimaryEmailByOfficialId(rows);

        const enrichRow = (row = {}) => {
            if (row?.official_id) {
                const email = officialEmailById[Number(row.official_id)] || '';
                if (!email) {
                    logger.warn('Event official recipient has no primary email', {
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
    }

    async _officialPrimaryEmailByOfficialId(rows = []) {
        const models = getCurrentModels();
        if (!models.officials || !models.entity_contact) return {};

        const officialIds = [...new Set((rows || [])
            .map(row => Number(row?.official_id))
            .filter(Boolean))];
        if (!officialIds.length) return {};

        const officialRows = await models.officials.findAll({
            attributes: ['official_id', 'official_entity_id'],
            where: {
                official_id: { [Op.in]: officialIds },
                is_deleted: 0,
            },
        });

        const officialToEntity = {};
        const entityIds = [];
        officialRows.forEach(row => {
            const plain = this._row(row);
            if (plain.official_id && plain.official_entity_id) {
                officialToEntity[plain.official_id] = Number(plain.official_entity_id);
                entityIds.push(Number(plain.official_entity_id));
            }
        });

        const uniqueEntityIds = [...new Set(entityIds.filter(Boolean))];
        if (!uniqueEntityIds.length) return {};

        const contactRows = await models.entity_contact.findAll({
            attributes: ['entity_id', 'contact_value', 'is_primary', 'contact_id'],
            where: {
                entity_id: { [Op.in]: uniqueEntityIds },
                contact_type: 'EMAIL',
                is_deleted: false,
            },
            order: [['is_primary', 'DESC'], ['contact_id', 'ASC']],
        });

        const emailByEntityId = {};
        contactRows.forEach(row => {
            const plain = this._row(row);
            const email = maybeDecryptContactValue(plain.contact_value);
            if (!emailByEntityId[plain.entity_id] && isValidEmail(email)) {
                emailByEntityId[plain.entity_id] = email;
            }
        });

        return officialIds.reduce((acc, officialId) => {
            const entityId = officialToEntity[officialId];
            if (entityId && emailByEntityId[entityId]) {
                acc[officialId] = emailByEntityId[entityId];
            }
            return acc;
        }, {});
    }

    async _toEventResponse(row) {
        const value = this._row(row);
        if (!value) return value;
        const agmStatusDetails = jsonObject(value.agm_status_details);
        const receivingParties = await this._enrichReceivingPartyPayload(value.receiving_parties, value);
        const displayStatus = this._eventDisplayStatus(value);

        return {
            ...value,
            ...agmStatusDetails,
            agm_status_details: agmStatusDetails,
            company_id: value.entity_id,
            company_name: value.entity?.name || value.company_name || '',
            event_name: value.event?.event_name || value.event_name || '',
            event_subject: value.event?.event_subject || value.event_subject || '',
            event_slug: value.event_slug || value.event?.event_slug || '',
            display_status: displayStatus,
            is_overdue: displayStatus === 'OVERDUE',
            ...this._penaltyStatus(value),
            allowed_status_transitions: ALLOWED_STATUS_TRANSITIONS[
                this._normalizeEventStatus(value.status) || EVENT_STATUS.PENDING
            ] || [],
            recurring_period: value.recurring_period ?? value.event?.recurring_period ?? null,
            recurring_duration: value.recurring_duration ?? value.event?.recurring_duration ?? '',
            is_recurring: Boolean(value.recurring_period || value.event?.is_recurring),
            supports_extension: Boolean(value.event?.supports_extension),
            supports_waiver: Boolean(value.event?.supports_waiver),
            evidence_required: Boolean(value.event?.evidence_required),
            attendees: jsonPayload(value.attendees, []),
            receiving_parties: receivingParties,
            reminders: jsonPayload(value.reminders, []),
            uploaded_files: jsonPayload(value.uploaded_files, []),
        };
    }

    _getBulkEntityIds(body = {}) {
        const source = body.entity_ids || body.cmpany_id || body.company_ids || body.selected_entities || body.entities || [];
        const rows = Array.isArray(source) ? source : csvNumbersFallback(source);
        return [...new Set(rows
            .map(item => Number(item?.entity_id || item?.company_id || item?.id || item))
            .filter(Boolean))];
    }

    _getBulkMapValue(mapValue, entityId) {
        const map = jsonObject(mapValue);
        return map[entityId] || map[String(entityId)] || null;
    }

    _getBulkSelectedFye(body = {}, entityId) {
        return this._getBulkMapValue(body.selected_fye_map, entityId)
            || this._getBulkMapValue(body.selected_fye_payload, entityId)
            || {};
    }

    _eventYearFromDate(value) {
        const clean = dateOrNull(value);
        return clean ? String(new Date(clean).getFullYear()) : null;
    }

    _buildBulkReceivingParties(entityId, body = {}, rolesByEntity = {}) {
        const explicit = this._getBulkMapValue(body.receiving_parties_by_entity, entityId);
        if (explicit) return jsonPayload(explicit, { officials: [], users: [], custom: [] });

        const channelByRole = jsonObject(body.receiving_parties);
        const channelByUser = jsonObject(body.user_receiving_parties);
        const officialRoles = rolesByEntity[entityId] || {};
        const officials = [];

        Object.entries(channelByRole).forEach(([roleName, channelValue]) => {
            const channel = String(channelValue || '').toUpperCase();
            if (!['TO', 'CC', 'BCC'].includes(channel)) return;
            const records = Array.isArray(officialRoles[roleName]) ? officialRoles[roleName] : [];

            records.forEach((record) => {
                if (!record.email) return;
                officials.push({
                    official_id: record.official_id || null,
                    official_date_id: record.official_date_id || null,
                    official_entity_id: record.official_entity_id || null,
                    official_entity_name: record.official_entity_name || record.name || '',
                    role: roleName,
                    email: record.email,
                    channel,
                    remarks: '',
                    status: 'active',
                    type: 'official',
                });
            });
        });

        const users = jsonArray(body.system_users || body.users || body.user_options)
            .filter(user => {
                const userId = user?.user_id || user?.id;
                return userId && channelByUser[userId] && isValidEmail(user.email);
            })
            .map(user => ({
                user_id: user.user_id || user.id,
                name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.user_name || user.email || '',
                email: user.email,
                channel: String(channelByUser[user.user_id || user.id] || 'TO').toUpperCase(),
                remarks: '',
                status: 'active',
                type: 'user',
            }))
            .filter(user => ['TO', 'CC', 'BCC'].includes(user.channel));

        const custom = jsonArray(body.custom_receiving_parties)
            .filter(row => row?.email && isValidEmail(row.email))
            .map(row => ({
                name: row.name || '',
                email: row.email,
                channel: String(row.channel || 'TO').toUpperCase(),
                party_type: row.party_type || 'Other',
                remarks: row.remarks || '',
                status: 'active',
                type: 'custom',
            }));

        return { officials, users, custom };
    }

    _buildBulkEventBody(entityId, body = {}, eventMaster = {}, rolesByEntity = {}) {
        const selectedFye = this._getBulkSelectedFye(body, entityId);
        const autoDueDate = this._getBulkMapValue(body.auto_due_date_map, entityId);
        const fyeMode = body.fye_mode || body.selected_fye_mode || 'manual';
        const fyeDate = dateOrNull(selectedFye.actual_fye || selectedFye.fye_date || body.fye_date || body.period_end);
        const dueDate = dateOrNull(
            fyeMode !== 'manual'
                ? (autoDueDate || selectedFye.due_date || body.due_date)
                : body.due_date
        );

        const filingDate = dateOrNull(body.filing_date || body.completed_date);

        return {
            ...body,
            entity_id: entityId,
            company_id: entityId,
            event_id: Number(eventMaster.e_id),
            event_slug: eventMaster.event_slug || body.event_slug || slugify(eventMaster.event_name),
            period_start: dateOrNull(body.period_start),
            period_end: fyeDate || dateOrNull(body.period_end),
            fye_date: fyeDate || dateOrNull(body.fye_date),
            actual_fye: fyeDate || dateOrNull(body.actual_fye),
            year_of_fye: body.year_of_fye || this._eventYearFromDate(fyeDate),
            actual_year: body.actual_year || this._eventYearFromDate(fyeDate) || this._eventYearFromDate(dueDate),
            due_date: dueDate,
            held_date: dateOrNull(body.held_date || body.agm_held_date),
            filing_date: filingDate,
            sent_date: dateOrNull(body.sent_date || body.send_date),
            received_date: dateOrNull(body.received_date || body.receive_date),
            held_time: body.held_time || body.agm_held_time || null,
            held_time_end: body.held_time_end || body.agm_end_time || null,
            source_from: 'MANUAL',
            source_basis: body.source_basis || 'Multiple Event Creation',
            status: this._resolveEventStatus(body, null, filingDate),
            recurring_period: body.is_recurring ? Number(body.recurring_period_number || body.recurring_period || 1) : null,
            recurring_duration: body.is_recurring ? (body.recurring_duration || null) : null,
            attendees: jsonPayload(body.attendees, { officials: [], users: [] }),
            receiving_parties: this._buildBulkReceivingParties(entityId, body, rolesByEntity),
            reminders: jsonPayload(body.reminders, []),
            uploaded_files: jsonPayload(body.uploaded_files, []),
        };
    }

    async _resolveEventMaster(eventSlug, transaction = null) {
        const models = getCurrentModels();
        if (!models.company_event_name) return null;
        const slug = String(eventSlug || '').trim();
        if (!slug) return null;
        return models.company_event_name.findOne({
            where: { event_slug: slug, event_type: 'EVENT', is_deleted: false },
            transaction,
        });
    }

    getEvents = async (query = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.company_event) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event model is unavailable');
            }

            const where = { is_deleted: false };
            if (query.entity_id || query.company_id) where.entity_id = Number(query.entity_id || query.company_id);
            if (query.event_id) where.event_id = Number(query.event_id);
            if (query.event_slug) where.event_slug = query.event_slug;
            if (query.status) {
                const queryStatus = String(query.status).toUpperCase();
                if (queryStatus === 'OVERDUE') {
                    where.status = { [Op.in]: OPEN_EVENT_STATUSES };
                    where.due_date = { [Op.lt]: todayDate() };
                } else {
                    where.status = this._normalizeEventStatus(queryStatus) || queryStatus;
                }
            }
            if (query.due_from || query.due_to) {
                where.due_date = {
                    ...(where.due_date || {}),
                    ...(query.due_from ? { [Op.gte]: query.due_from } : {}),
                    ...(query.due_to ? { [Op.lte]: query.due_to } : {}),
                };
            }

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.max(parseInt(query.limit || 20, 10), 1);
            const offset = (page - 1) * limit;

            const result = await this.eventDao.findAndCountAll({
                where,
                include: this._eventInclude(models, 'basic'),
                order: [['due_date', 'ASC'], ['company_event_id', 'DESC']],
                limit,
                offset,
            });

            const rows = await Promise.all(result.rows.map(row => this._toEventResponse(row)));
            const paginationData = responseHandler.getPaginationData({ count: result.count, rows }, page, limit);

            return responseHandler.returnSuccess(httpStatus.OK, 'Company events fetched', paginationData);
        } catch (err) {
            logger.error('Get company events error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching company events');
        }
    };

    getEvent = async (eventId) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

            const row = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(models, 'detail'),
            });

            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');

            return responseHandler.returnSuccess(httpStatus.OK, 'Company event fetched', await this._toEventResponse(row));
        } catch (err) {
            logger.error('Get company event error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching company event');
        }
    };

    // "Why is this due?" (spec §14.2) — full regeneration history for one event, most
    // recent first, so re-syncs don't erase how an earlier due date was derived.
    getCalculationTrace = async (eventId) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

            const event = await this.eventDao.findOne({ where: { company_event_id: id, is_deleted: false } });
            if (!event) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');

            if (!models.compliance_rule_calculation_log) {
                return responseHandler.returnSuccess(httpStatus.OK, 'Calculation trace fetched', []);
            }

            const rows = await models.compliance_rule_calculation_log.findAll({
                where: { company_event_id: id },
                include: models.company_event_rule ? [{
                    model: models.company_event_rule,
                    as: 'rule',
                    required: false,
                    attributes: ['rule_id', 'rule_code', 'version_no', 'version_status', 'effective_from', 'rule_priority'],
                }] : [],
                order: [['calculation_log_id', 'DESC']],
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Calculation trace fetched',
                rows.map(row => (row.toJSON ? row.toJSON() : row))
            );
        } catch (err) {
            logger.error('Get calculation trace error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching calculation trace');
        }
    };

    createEvent = async (body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        if (!models.company_event || !models.company_event_name) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event models are unavailable');
        }

        const entityId = Number(body.entity_id || body.company_id);
        const eventRef = body.event_slug || body.event_type_slug;
        if (!entityId) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company is required');
        if (!eventRef) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event type is required');

        const t = await models.sequelize.transaction();
        try {
            const eventMaster = await this._resolveEventMaster(eventRef, t);
            if (!eventMaster) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Selected event type is unavailable');
            }

            if (eventMaster.is_system_event && (body.source_from || 'MANUAL') === 'MANUAL') {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'System event types cannot be manually created');
            }

            const resolvedUserId = userId || body.created_by || body.updated_by || null;
            const validationError = this._validateEventPayload(body);
            if (validationError) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, validationError);
            }
            const payload = this._buildEventPayload(body, eventMaster, resolvedUserId);

            if (payload.status === EVENT_STATUS.COMPLETED) {
                const checklistError = await this._checkChecklistCompletion(models, { eventMasterId: eventMaster.e_id }, t);
                if (checklistError) {
                    await t.rollback();
                    return responseHandler.returnError(httpStatus.BAD_REQUEST, checklistError);
                }
            }

            const created = await this.eventDao.create({
                ...payload,
                created_date: new Date(),
                created_by: resolvedUserId,
            }, { transaction: t });
            const createdRow = this._row(created);

            await copyChecklistTemplateToEvent(models, {
                companyEventId: createdRow.company_event_id, eventMasterId: eventMaster.e_id,
                entityId: createdRow.entity_id, eventId: createdRow.event_id, eventSlug: createdRow.event_slug,
                userId: resolvedUserId,
            }, t);

            const generatedRecurringEvents = await this._ensureInitialRecurringEvents(
                createdRow,
                eventMaster,
                resolvedUserId,
                t
            );

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CREATE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: created.company_event_id,
                new_values: {
                    ...payload,
                    generated_recurring_event_ids: generatedRecurringEvents.map(row => row.company_event_id),
                },
            });

            const result = await this.getEvent(created.company_event_id);
            if (result?.response?.data) {
                result.response.data.generated_recurring_event_ids = generatedRecurringEvents.map(row => row.company_event_id);
                result.response.data.next_recurring_event_id = generatedRecurringEvents[0]?.company_event_id || null;
            }
            return result;
        } catch (err) {
            await t.rollback();
            logger.error('Create company event error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CREATE_EVENT,
                user_id: userId,
                table_name: 'company_event',
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error creating company event');
        }
    };

    createMultipleEvents = async (body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        if (!models.company_event || !models.company_event_name) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event models are unavailable');
        }

        const entityIds = this._getBulkEntityIds(body);
        const eventRef = body.event_slug || body.event_type_slug;
        if (!entityIds.length) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Select at least one company');
        if (!eventRef) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event type is required');

        const t = await models.sequelize.transaction();
        const created = [];
        const generatedRecurringEvents = [];
        const failed = [];

        try {
            const eventMaster = await this._resolveEventMaster(eventRef, t);
            if (!eventMaster) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Selected event type is unavailable');
            }

            if (eventMaster.is_system_event && (body.source_from || 'MANUAL') === 'MANUAL') {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'System event types cannot be manually created');
            }

            const rolesByEntity = await getOfficialRoleGroupsByEntityIds(models, entityIds, { entityKey: 'entity_id' });
            const resolvedUserId = userId || body.created_by || body.updated_by || null;

            for (const entityId of entityIds) {
                const eventBody = this._buildBulkEventBody(entityId, body, this._row(eventMaster), rolesByEntity);
                const validationError = this._validateEventPayload(eventBody);
                if (validationError) {
                    failed.push({ entity_id: entityId, message: validationError });
                    continue;
                }

                try {
                    const payload = this._buildEventPayload(eventBody, eventMaster, resolvedUserId);
                    const row = await this.eventDao.create({
                        ...payload,
                        created_date: new Date(),
                        created_by: resolvedUserId,
                    }, { transaction: t });
                    const createdRow = this._row(row);
                    const generatedRows = await this._ensureInitialRecurringEvents(
                        createdRow,
                        eventMaster,
                        resolvedUserId,
                        t
                    );
                    generatedRecurringEvents.push(...generatedRows);
                    created.push({
                        ...createdRow,
                        generated_recurring_event_ids: generatedRows.map(item => item.company_event_id),
                        next_recurring_event_id: generatedRows[0]?.company_event_id || null,
                    });
                } catch (err) {
                    failed.push({ entity_id: entityId, message: err.message || 'Event create failed' });
                }
            }

            if (!created.length) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, failed[0]?.message || 'Failed to create any events');
            }

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CREATE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                new_values: {
                    bulk: true,
                    created_count: created.length,
                    generated_recurring_count: generatedRecurringEvents.length,
                    failed_count: failed.length,
                    entity_ids: entityIds,
                    generated_recurring_event_ids: generatedRecurringEvents.map(row => row.company_event_id),
                },
            });

            return responseHandler.returnSuccess(httpStatus.CREATED, 'Company events created', {
                created_count: created.length,
                generated_recurring_count: generatedRecurringEvents.length,
                failed_count: failed.length,
                created,
                generated_recurring_event_ids: generatedRecurringEvents.map(row => row.company_event_id),
                failed,
            });
        } catch (err) {
            await t.rollback();
            logger.error('Create multiple company events error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CREATE_EVENT,
                user_id: userId,
                table_name: 'company_event',
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error creating company events');
        }
    };

    updateEvent = async (eventId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        const t = await models.sequelize.transaction();
        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                transaction: t,
            });
            if (!existingInstance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const existingEventMaster = await this._resolveEventMaster(existing.event_slug, t);
            const isExistingSystemEvent = Boolean(existingEventMaster?.is_system_event);
            const isAnnualLockedEvent = ['agm', 'ar', 'egm'].includes(String(existing.event_slug || existingEventMaster?.event_slug || '').toLowerCase());
            const updateBody = isExistingSystemEvent || isAnnualLockedEvent
                ? {
                    ...body,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    fye_date: existing.fye_date,
                    actual_fye: existing.actual_fye,
                    period_end: existing.period_end,
                    due_date: existing.due_date,
                }
                : body;
            const eventMaster = await this._resolveEventMaster(updateBody.event_slug || existing.event_slug, t);
            if (!eventMaster) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Selected event type is unavailable');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;
            const validationError = this._validateEventPayload(updateBody, existing);
            if (validationError) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, validationError);
            }
            const payload = this._buildEventPayload(updateBody, eventMaster, resolvedUserId, existing);

            if (payload.status === EVENT_STATUS.COMPLETED && existing.status !== EVENT_STATUS.COMPLETED) {
                const checklistError = await this._checkChecklistCompletion(models, { companyEventId: id }, t);
                if (checklistError) {
                    await t.rollback();
                    return responseHandler.returnError(httpStatus.BAD_REQUEST, checklistError);
                }
            }

            await existingInstance.update(payload, { transaction: t });
            const updatedEvent = { ...existing, ...payload, company_event_id: id };
            const nextRecurringEvent = await this._ensureNextRecurringEvent(
                existing,
                updatedEvent,
                eventMaster,
                resolvedUserId,
                t
            );

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.UPDATE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: existing,
                new_values: {
                    ...payload,
                    next_recurring_event_id: nextRecurringEvent?.company_event_id || null,
                },
            });

            const response = await this.getEvent(id);
            if (response?.response?.data && nextRecurringEvent?.company_event_id) {
                response.response.data.next_recurring_event_id = nextRecurringEvent.company_event_id;
            }
            return response;
        } catch (err) {
            await t.rollback();
            logger.error('Update company event error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.UPDATE_EVENT,
                user_id: userId,
                table_name: 'company_event',
                record_id: id,
                new_values: body,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating company event');
        }
    };

    extendEventDueDate = async (eventId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        const t = await models.sequelize.transaction();
        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(models, 'basic'),
                transaction: t,
            });

            if (!existingInstance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (!type) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This event type does not support due date extension');
            }
            if (!existing.due_date) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Original due date is required before extension');
            }
            if (existing.filing_date) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Completed events cannot be extended');
            }
            // FIX: previously only blocked WAIVED/CANCELLED — EXEMPT events
            // (and COMPLETED, via status) must also be blocked from extension.
            if (this._isBlockedLifecycleStatus(existing.status)) {
                await t.rollback();
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Completed, waived, exempted, or cancelled events cannot be extended'
                );
            }

            const requestedDays = Number(body.extension_days || body.days || 0);
            const allowedDays = this._extensionAllowedDays(type);
            if (!allowedDays.includes(requestedDays)) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, `Allowed extension days: ${allowedDays.join(', ')}`);
            }

            const currentExtendedDate = dateOrNull(existing.extended_due_date);
            if (type === 'ANNUAL_FILING' && currentExtendedDate) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Annual Filing extension is already applied');
            }
            const baseDate = currentExtendedDate || existing.due_date;
            const nextExtendedDate = addDays(baseDate, requestedDays);
            if (!nextExtendedDate) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Unable to calculate extended due date');
            }

            const totalExtensionDays = daysBetween(existing.due_date, nextExtendedDate);
            // Legacy due tracker allows AGM/AR extension three times:
            // 60 days per stage, max 180 days from the original due date.
            if (totalExtensionDays > MAX_EXTENSION_TOTAL_DAYS) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Maximum three extension stages reached');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;
            const reminderDateBasis = normalizeReminderDateBasis(body.reminder_date_basis || existing.reminder_date_basis);

            await existingInstance.update({
                extended_due_date: nextExtendedDate,
                reminder_date_basis: reminderDateBasis,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            }, { transaction: t });

            await this._recordComplianceExtension({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, extensionType: type, action: 'EXTEND',
                reason: body.reason, authority: body.authority, reference: body.reference,
                previousDueDate: currentExtendedDate || existing.due_date,
                requestedDueDate: nextExtendedDate, approvedDueDate: nextExtendedDate,
                extensionDays: requestedDays, evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            }, t);

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.EXTEND_EVENT_DUE_DATE,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    due_date: existing.due_date,
                    extended_due_date: currentExtendedDate || null,
                    reminder_date_basis: normalizeReminderDateBasis(existing.reminder_date_basis),
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    extension_type: type,
                    extension_days: requestedDays,
                    due_date: existing.due_date,
                    extended_due_date: nextExtendedDate,
                    reminder_date_basis: reminderDateBasis,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            await t.rollback();
            logger.error('Extend company event due date error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error extending due date');
        }
    };

    cancelEventDueDateExtension = async (eventId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        const t = await models.sequelize.transaction();
        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(models, 'basic'),
                transaction: t,
            });

            if (!existingInstance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (!type) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This event type does not support due date extension');
            }
            if (!existing.extended_due_date) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'No extended due date to cancel');
            }
            if (existing.filing_date || this._isBlockedLifecycleStatus(existing.status)) {
                await t.rollback();
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Completed, dispensed, exempted, or cancelled events cannot cancel extension'
                );
            }

            const currentExtendedDate = dateOrNull(existing.extended_due_date);
            const stepBackDays = type === 'ANNUAL_FILING' ? null : 60;
            let nextExtendedDate = null;
            if (stepBackDays) {
                const steppedDate = addDays(currentExtendedDate, -stepBackDays);
                nextExtendedDate = steppedDate && steppedDate > existing.due_date ? steppedDate : null;
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                extended_due_date: nextExtendedDate,
                reminder_date_basis: REMINDER_DATE_BASIS.EXTENDED,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            }, { transaction: t });

            await this._recordComplianceExtension({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, extensionType: type, action: 'CANCEL',
                reason: body.reason, authority: body.authority, reference: body.reference,
                previousDueDate: currentExtendedDate, requestedDueDate: nextExtendedDate,
                approvedDueDate: nextExtendedDate,
                extensionDays: -daysBetween(nextExtendedDate || existing.due_date, currentExtendedDate),
                evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            }, t);

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CANCEL_EVENT_DUE_DATE_EXTENSION,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    due_date: existing.due_date,
                    extended_due_date: currentExtendedDate,
                    reminder_date_basis: normalizeReminderDateBasis(existing.reminder_date_basis),
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    extension_type: type,
                    due_date: existing.due_date,
                    extended_due_date: nextExtendedDate,
                    reminder_date_basis: REMINDER_DATE_BASIS.EXTENDED,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            await t.rollback();
            logger.error('Cancel company event extension error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error cancelling due date extension');
        }
    };

    // Compliance workflow lifecycle (spec §10). One generic transition endpoint,
    // validated against ALLOWED_STATUS_TRANSITIONS so the frontend never has to
    // duplicate the transition graph — it reads allowed_status_transitions off
    // the event response instead (see _toEventResponse).
    updateEventWorkflowStatus = async (eventId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        const t = await models.sequelize.transaction();
        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(models, 'basic'),
                transaction: t,
            });

            if (!existingInstance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const targetStatus = this._normalizeEventStatus(body.status);
            if (!targetStatus) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'A valid target status is required');
            }

            const isFiledCompletion = existing.status === EVENT_STATUS.FILED
                && targetStatus === EVENT_STATUS.COMPLETED;
            if (this._isBlockedLifecycleStatus(existing.status) && !isFiledCompletion) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This event is in a terminal state and cannot change workflow status');
            }

            const currentStatus = this._normalizeEventStatus(existing.status) || EVENT_STATUS.PENDING;
            const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
            if (!allowed.includes(targetStatus)) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, `Cannot move from ${currentStatus} to ${targetStatus}`);
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            const filingDate = dateOrNull(body.filing_date || existing.filing_date);
            if (targetStatus === EVENT_STATUS.FILED && !filingDate) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Filing date is required when marking an event as filed');
            }
            if (targetStatus === EVENT_STATUS.COMPLETED && !filingDate) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'A filed event must have a filing date before completion');
            }
            if ([EVENT_STATUS.FILED, EVENT_STATUS.COMPLETED].includes(targetStatus)) {
                const checklistError = await this._checkChecklistCompletion(models, {
                    companyEventId: id,
                    eventMasterId: existing.event_id,
                }, t);
                if (checklistError) {
                    await t.rollback();
                    return responseHandler.returnError(httpStatus.BAD_REQUEST, checklistError);
                }
            }

            const statusUpdates = {
                status: targetStatus,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            };
            if (targetStatus === EVENT_STATUS.FILED) statusUpdates.filing_date = filingDate;
            if (body.remarks !== undefined) statusUpdates.remarks = body.remarks || null;

            await existingInstance.update(statusUpdates, { transaction: t });

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.UPDATE_EVENT_STATUS,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: currentStatus,
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: targetStatus,
                    remarks: body.remarks || null,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            await t.rollback();
            logger.error('Update company event workflow status error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating event status');
        }
    };

    dispenseEvent = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });

            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (type !== 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Only AGM events can be dispensed');
            }
            if (!existing.due_date) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Due date is required before dispense');
            }
            if (existing.filing_date || existing.status === EVENT_STATUS.COMPLETED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Completed events cannot be dispensed');
            }
            if ([EVENT_STATUS.WAIVED, EVENT_STATUS.DISPENSE].includes(existing.status)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is already dispensed');
            }
            // FIX: Dispense and Exempt are mutually exclusive AGM states
            // (legacy: event_status is either 'Dispense' or 'Exempt', never
            // both). An exempted event must cancel exemption first.
            if (existing.status === EVENT_STATUS.EXEMPT) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Exempted events cannot be dispensed — cancel exemption first');
            }
            if (existing.status === EVENT_STATUS.CANCELLED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Cancelled events cannot be dispensed');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.WAIVED,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'AGM_DISPENSE', action: 'APPLY',
                reason: body.reason, authority: body.authority, reference: body.reference,
                effectiveFrom: todayDate(), evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.DISPENSE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: existing.status,
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: EVENT_STATUS.WAIVED,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Dispense company event error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error dispensing event');
        }
    };

    cancelDispenseEvent = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });

            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (type !== 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Only AGM events can cancel dispense');
            }
            if (![EVENT_STATUS.WAIVED, EVENT_STATUS.DISPENSE].includes(existing.status)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is not dispensed');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.PENDING,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'AGM_DISPENSE', action: 'CANCEL',
                reason: body.reason, authority: body.authority, reference: body.reference,
                userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CANCEL_DISPENSE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: existing.status,
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: EVENT_STATUS.PENDING,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Cancel dispense company event error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error cancelling dispense');
        }
    };

    // ── Exempt (mirrors legacy exempt_agm) ──────────────────────────────
    // Distinct AGM-only state from Dispense. Mutually exclusive with WAIVED —
    // an event may be Dispensed OR Exempted, never both at once.
    exemptEvent = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });

            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (type !== 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Only AGM events can be exempted');
            }
            if (!existing.due_date) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Due date is required before exemption');
            }
            if (existing.filing_date || existing.status === EVENT_STATUS.COMPLETED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Completed events cannot be exempted');
            }
            if ([EVENT_STATUS.WAIVED, EVENT_STATUS.DISPENSE].includes(existing.status)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Dispensed events cannot be exempted — cancel dispense first');
            }
            if (existing.status === EVENT_STATUS.EXEMPT) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is already exempted');
            }
            if (existing.status === EVENT_STATUS.CANCELLED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Cancelled events cannot be exempted');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.EXEMPT,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'AGM_EXEMPT', action: 'APPLY',
                reason: body.reason, authority: body.authority, reference: body.reference,
                effectiveFrom: todayDate(), evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.EXEMPT_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: existing.status,
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: EVENT_STATUS.EXEMPT,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Exempt company event error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error exempting event');
        }
    };

    cancelExemptEvent = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });

            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const type = this._eventExtensionType(existing);
            if (type !== 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Only AGM events can cancel exemption');
            }
            if (existing.status !== EVENT_STATUS.EXEMPT) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is not exempted');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.PENDING,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'AGM_EXEMPT', action: 'CANCEL',
                reason: body.reason, authority: body.authority, reference: body.reference,
                userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CANCEL_EXEMPT_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: existing.status,
                },
                new_values: {
                    company_event_id: id,
                    entity_id: existing.entity_id,
                    event_id: existing.event_id,
                    event_slug: existing.event_slug,
                    event_name: existing.event?.event_name || '',
                    status: EVENT_STATUS.PENDING,
                },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Cancel exempt company event error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error cancelling exemption');
        }
    };

    // ── General (non-AGM/AR/ANNUAL_FILING) extension/waiver — spec §7 ──────────
    // Activates the previously-inert supports_extension/supports_waiver/evidence_required
    // master flags for every event type the 3 hardcoded flows don't cover.
    requestGeneralExtension = async (eventId, body = {}, userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        const t = await models.sequelize.transaction();
        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(models, 'basic'),
                transaction: t,
            });
            if (!existingInstance) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            const hardcodedType = this._eventExtensionType(existing);
            if (hardcodedType) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Use the standard extension endpoint for this event type');
            }
            if (!existing.event?.supports_extension) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This event type does not support due date extension');
            }
            if (!existing.due_date) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Original due date is required before extension');
            }
            if (existing.filing_date || this._isBlockedLifecycleStatus(existing.status)) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Completed, waived, or cancelled events cannot be extended');
            }

            const reason = String(body.reason || '').trim();
            if (!reason) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reason is required');
            }
            if (existing.event?.evidence_required && !body.evidence_doc_id) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Evidence is required for this event type');
            }

            const baseline = dateOrNull(existing.extended_due_date || existing.due_date);
            const requestedDueDate = dateOrNull(body.requested_due_date || body.due_date);
            if (!requestedDueDate || requestedDueDate <= baseline) {
                await t.rollback();
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Requested due date must be after the current due date');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;
            const reminderDateBasis = normalizeReminderDateBasis(body.reminder_date_basis || existing.reminder_date_basis);

            await existingInstance.update({
                extended_due_date: requestedDueDate,
                reminder_date_basis: reminderDateBasis,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            }, { transaction: t });

            await this._recordComplianceExtension({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, extensionType: 'GENERAL', action: 'EXTEND',
                reason, authority: body.authority, reference: body.reference,
                previousDueDate: baseline, requestedDueDate, approvedDueDate: requestedDueDate,
                extensionDays: daysBetween(baseline, requestedDueDate),
                evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            }, t);

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.REQUEST_GENERAL_EXTENSION,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: { company_event_id: id, extended_due_date: existing.extended_due_date || null, due_date: existing.due_date },
                new_values: { company_event_id: id, extended_due_date: requestedDueDate, reason, authority: body.authority || null, reference: body.reference || null },
            });

            return this.getEvent(id);
        } catch (err) {
            await t.rollback();
            logger.error('Request general extension error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error requesting extension');
        }
    };

    requestGeneralWaiver = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });
            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            if (this._eventExtensionType(existing) === 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Use the dedicated dispense/exempt endpoints for AGM events');
            }
            if (!existing.event?.supports_waiver) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'This event type does not support waiver');
            }
            if (existing.filing_date || existing.status === EVENT_STATUS.COMPLETED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Completed events cannot be waived');
            }
            if (this._isBlockedLifecycleStatus(existing.status)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is already in a terminal/waived state');
            }

            const reason = String(body.reason || '').trim();
            if (!reason) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Reason is required');
            }
            if (existing.event?.evidence_required && !body.evidence_doc_id) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Evidence is required for this event type');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.WAIVED,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'GENERAL', action: 'APPLY',
                reason, authority: body.authority, reference: body.reference, effectiveFrom: todayDate(),
                evidenceDocId: body.evidence_doc_id, userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.REQUEST_GENERAL_WAIVER,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: { company_event_id: id, status: existing.status },
                new_values: { company_event_id: id, status: EVENT_STATUS.WAIVED, reason, authority: body.authority || null, reference: body.reference || null },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Request general waiver error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error requesting waiver');
        }
    };

    cancelGeneralWaiver = async (eventId, body = {}, userId = null, req = null) => {
        const id = Number(eventId || body.company_event_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

        try {
            const existingInstance = await this.eventDao.findOne({
                where: { company_event_id: id, is_deleted: false },
                include: this._eventInclude(getCurrentModels(), 'basic'),
            });
            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');
            }

            const existing = this._row(existingInstance);
            if (this._eventExtensionType(existing) === 'AGM') {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Use the dedicated cancel-dispense/cancel-exempt endpoints for AGM events');
            }
            if (existing.status !== EVENT_STATUS.WAIVED) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event is not waived');
            }

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            await existingInstance.update({
                status: EVENT_STATUS.PENDING,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            });

            await this._recordComplianceWaiver({
                companyEventId: id, entityId: existing.entity_id, eventId: existing.event_id,
                eventSlug: existing.event_slug, waiverType: 'GENERAL', action: 'CANCEL',
                reason: body.reason, authority: body.authority, reference: body.reference,
                userId: resolvedUserId,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.CANCEL_GENERAL_WAIVER,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
                old_values: { company_event_id: id, status: existing.status },
                new_values: { company_event_id: id, status: EVENT_STATUS.PENDING },
            });

            return this.getEvent(id);
        } catch (err) {
            logger.error('Cancel general waiver error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error cancelling waiver');
        }
    };

    // ── History reads — spec §7.1 "multiple extensions may be stored as separate records" ──
    getEventComplianceExtensions = async (eventId, query = {}) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');
            if (!models.compliance_extension) return responseHandler.returnSuccess(httpStatus.OK, 'Extension history fetched', []);

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
            const result = await models.compliance_extension.findAndCountAll({
                where: { company_event_id: id },
                order: [['extension_id', 'DESC']],
                limit,
                offset: (page - 1) * limit,
            });
            const rows = result.rows.map(row => (row.toJSON ? row.toJSON() : row));
            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Extension history fetched',
                responseHandler.getPaginationData({ count: result.count, rows }, page, limit)
            );
        } catch (err) {
            logger.error('Get event compliance extensions error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching extension history');
        }
    };

    getEventComplianceWaivers = async (eventId, query = {}) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');
            if (!models.compliance_waiver) return responseHandler.returnSuccess(httpStatus.OK, 'Waiver history fetched', []);

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
            const result = await models.compliance_waiver.findAndCountAll({
                where: { company_event_id: id },
                order: [['waiver_id', 'DESC']],
                limit,
                offset: (page - 1) * limit,
            });
            const rows = result.rows.map(row => (row.toJSON ? row.toJSON() : row));
            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Waiver history fetched',
                responseHandler.getPaginationData({ count: result.count, rows }, page, limit)
            );
        } catch (err) {
            logger.error('Get event compliance waivers error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching waiver history');
        }
    };

    // ── Document checklist — spec §15.1 ─────────────────────────────────────
    getEventDocuments = async (eventId) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');
            if (!models.company_event_document) return responseHandler.returnSuccess(httpStatus.OK, 'Document checklist fetched', []);

            // A template can be configured after an event was generated. Add
            // only missing items when its Documents window is opened.
            if (models.company_event && models.compliance_document_checklist_template) {
                const eventInstance = await models.company_event.findOne({
                    where: { company_event_id: id, is_deleted: false },
                    attributes: ['company_event_id', 'entity_id', 'event_id', 'event_slug'],
                });
                if (eventInstance) {
                    const event = this._row(eventInstance);
                    await copyChecklistTemplateToEvent(models, {
                        companyEventId: event.company_event_id,
                        eventMasterId: event.event_id,
                        entityId: event.entity_id,
                        eventId: event.event_id,
                        eventSlug: event.event_slug,
                    });
                }
            }

            const rows = await models.company_event_document.findAll({
                where: { company_event_id: id, is_deleted: false },
                order: [['sort_order', 'ASC'], ['event_document_id', 'ASC']],
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Document checklist fetched',
                rows.map(row => (row.toJSON ? row.toJSON() : row))
            );
        } catch (err) {
            logger.error('Get event documents error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching document checklist');
        }
    };

    updateEventDocumentStatus = async (eventDocumentId, body = {}, userId = null, req = null) => {
        const id = Number(eventDocumentId || body.event_document_id);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Document checklist item id is required');

        try {
            const models = getCurrentModels();
            if (!models.company_event_document) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Document checklist model is unavailable');
            }

            const existingInstance = await models.company_event_document.findOne({
                where: { event_document_id: id, is_deleted: false },
            });
            if (!existingInstance) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Document checklist item not found');
            }

            const targetStatus = String(body.status || '').toUpperCase();
            const allowedStatuses = ['REQUIRED', 'REQUESTED', 'RECEIVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_APPLICABLE'];
            if (!allowedStatuses.includes(targetStatus)) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'A valid document status is required');
            }

            const existing = this._row(existingInstance);
            const resolvedUserId = userId || body.updated_by || body.created_by || null;
            const now = new Date();
            const isReviewDecision = ['APPROVED', 'REJECTED'].includes(targetStatus);

            await existingInstance.update({
                status: targetStatus,
                doc_id: body.doc_id !== undefined ? (body.doc_id || null) : existing.doc_id,
                remarks: body.remarks !== undefined ? body.remarks : existing.remarks,
                reviewed_by: isReviewDecision ? resolvedUserId : existing.reviewed_by,
                reviewed_date: isReviewDecision ? now : existing.reviewed_date,
                updated_by: resolvedUserId,
                updated_date: now,
            });

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.UPDATE_EVENT_DOCUMENT_STATUS,
                user_id: resolvedUserId,
                table_name: 'company_event_document',
                record_id: id,
                old_values: { event_document_id: id, company_event_id: existing.company_event_id, document_name: existing.document_name, status: existing.status },
                new_values: { event_document_id: id, company_event_id: existing.company_event_id, document_name: existing.document_name, status: targetStatus, doc_id: body.doc_id || existing.doc_id },
            });

            return this.getEventDocuments(existing.company_event_id);
        } catch (err) {
            logger.error('Update event document status error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error updating document status');
        }
    };

    getEventExtensionLogs = async (query = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.audit_log) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Audit log model is unavailable');
            }

            const page = Math.max(parseInt(query.page || 1, 10), 1);
            const limit = Math.min(Math.max(parseInt(query.limit || 20, 10), 1), 100);
            const offset = (page - 1) * limit;
            const where = {
                module: MODULES.EVENT,
                action: {
                    [Op.in]: [
                        ACTIONS.EXTEND_EVENT_DUE_DATE,
                        ACTIONS.CANCEL_EVENT_DUE_DATE_EXTENSION,
                    ],
                },
            };

            if (query.company_event_id || query.event_id) {
                where.record_id = Number(query.company_event_id || query.event_id);
            }

            const result = await models.audit_log.findAndCountAll({
                where,
                include: models.user ? [{
                    model: models.user,
                    as: 'user',
                    attributes: ['user_id', 'user_name', 'first_name', 'last_name'],
                    required: false,
                }] : [],
                order: [['created_at', 'DESC']],
                limit,
                offset,
            });

            const rows = result.rows.map(row => this._row(row));
            const paginationData = responseHandler.getPaginationData({ count: result.count, rows }, page, limit);

            return responseHandler.returnSuccess(httpStatus.OK, 'Event extension logs fetched', paginationData);
        } catch (err) {
            logger.error('Get event extension logs error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching event extension logs');
        }
    };

    deleteEvent = async (eventId, body = {}, userId = null, req = null) => {
        try {
            const id = Number(eventId || body.company_event_id);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event id is required');

            const resolvedUserId = userId || body.updated_by || body.created_by || null;

            const [affected] = await this.eventDao.update({
                is_deleted: true,
                updated_by: resolvedUserId,
                updated_date: new Date(),
            }, { where: { company_event_id: id, is_deleted: false } });

            if (!affected) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company event not found');

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.DELETE_EVENT,
                user_id: resolvedUserId,
                table_name: 'company_event',
                record_id: id,
            });

            return responseHandler.returnSuccess(httpStatus.OK, 'Company event deleted', { company_event_id: id });
        } catch (err) {
            logger.error('Delete company event error:', err);
            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.DELETE_EVENT,
                user_id: userId,
                table_name: 'company_event',
                record_id: eventId,
                status: STATUS.FAILED,
                error_message: err.message,
            });
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error deleting company event');
        }
    };

    _normalizeFyePayload(body = {}, userId = null) {
        const actualFye = dateOrNull(body.actual_fye || body.company_fin_date || body.fye_date);
        const periodEnd = dateOrNull(body.period_end || body.fye_to || actualFye);
        return {
            ...body,
            actual_fye: actualFye,
            company_fin_date: actualFye,
            fye_date: actualFye,
            previous_actual_fye: dateOrNull(body.previous_actual_fye || body.old_actual_fye || body.old_fye_date),
            period_start: dateOrNull(body.period_start || body.fye_from),
            period_end: periodEnd,
            year_of_fye: body.year_of_fye || (actualFye ? String(new Date(actualFye).getFullYear()) : null),
            confirm_range: body.confirm_range === true || String(body.confirm_range).toLowerCase() === 'true',
            strict_range: body.strict_range !== undefined
                ? body.strict_range === true || String(body.strict_range).toLowerCase() === 'true'
                : true,
            source_basis: body.source_basis || 'MANUAL_FYE_DATE',
            updated_by: userId || body.updated_by || body.created_by || null,
        };
    }

    validateActualFye = (entityId, body = {}) =>
        this.entityCompanyService.validateActualFye(entityId, this._normalizeFyePayload(body));

    syncEvents = async (entityId, body = {}, userId = null, req = null) => {
        const payload = this._normalizeFyePayload(body, userId);
        const result = await this.entityCompanyService.syncEvents(entityId, payload, userId, req);

        if (!result?.response?.status || !payload.source_basis) return result;

        const events = Array.isArray(result.response?.data?.events) ? result.response.data.events : [];
        const eventIds = events.map(row => row.company_event_id).filter(Boolean);
        if (!eventIds.length) return result;

        const models = getCurrentModels();
        if (models.company_event) {
            await models.company_event.update(
                {
                    source_basis: payload.source_basis,
                    updated_by: payload.updated_by || userId || null,
                    updated_date: new Date(),
                },
                {
                    where: {
                        company_event_id: { [Op.in]: eventIds },
                        entity_id: entityId,
                        is_deleted: false,
                    },
                }
            );
        }

        result.response.data.events = events.map(row => ({
            ...row,
            source_basis: payload.source_basis,
        }));

        return result;
    };

    getEventDetails = (entityId, query = {}) => this.entityCompanyService.getEventDetails(entityId, query);
}

// `_getBulkEntityIds` originally relied on the file-level `csvNumbers` helper
// (used elsewhere for CSV-encoded rule fields, which have now moved to
// EventRuleService). It's reproduced here, scoped to this file only, so bulk
// entity-id parsing keeps working unchanged.
function csvNumbersFallback(value) {
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
}

module.exports = CompanyEventService;
