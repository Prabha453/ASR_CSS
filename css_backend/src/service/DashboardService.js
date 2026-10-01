'use strict';

const httpStatus = require('http-status');
const { Op, fn, col } = require('sequelize');

const { getCurrentModels } = require('../models');
const responseHandler = require('../helper/responseHandler');
const logger = require('../config/logger');
const { OPEN_EVENT_STATUSES } = require('../config/companyEventStatus');

const UPCOMING_PERIODS = [7, 15, 30, 60, 90];
const CLOSED_STATUSES = ['COMPLETED', 'FILED'];
const REMINDER_STATUSES = ['PENDING', 'SENT', 'FAILED', 'SKIPPED'];
const NOT_TRACKED_DELIVERY_STATES = ['BOUNCED', 'SUPPRESSED', 'ESCALATED'];
const DEFERRED_KPIS = ['WORKLOAD_BY_ASSIGNEE', 'COUNTRY_RISK_HEATMAP', 'RULE_COVERAGE', 'RULE_CHANGE_IMPACT'];

const dateOrNull = (value) => {
    if (!value) return null;
    const clean = String(value).trim().split(' ')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : null;
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const addDays = (value, days) => {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return null;
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
};

const daysBetween = (fromIso, toIso) => {
    const from = new Date(`${fromIso}T00:00:00Z`).getTime();
    const to = new Date(`${toIso}T00:00:00Z`).getTime();
    return Math.round((to - from) / 86400000);
};

const clampTopN = (value, fallback = 20, max = 50) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.min(Math.round(n), max);
};

const clampDays = (value, fallback) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.round(n);
};

class DashboardService {

    // Spec §17 "Reporting and Dashboards" — one aggregation endpoint covering the
    // KPIs this schema can support today. See src/config/companyEventStatus.js for
    // the shared OPEN_EVENT_STATUSES this mirrors CompanyEventService's
    // _eventDisplayStatus OVERDUE comparison against (effectiveDue < today for an
    // open-status event) without importing that service directly.
    getPortfolioOverview = async (query = {}) => {
        try {
            const models = getCurrentModels();
            if (!models.company_event) {
                return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Company event model is unavailable');
            }

            const topN = clampTopN(query.top_n);
            const filingRateDays = clampDays(query.filing_rate_days, 365);
            const notificationDays = clampDays(query.notification_days, 90);

            const [upcomingAndOverdue, onTimeFilingRate, pendingDocuments, extensionUsage, notificationDelivery] = await Promise.all([
                this._upcomingAndOverdue(models, topN),
                this._onTimeFilingRate(models, filingRateDays),
                this._pendingDocuments(models, topN),
                this._extensionUsage(models, topN),
                this._notificationDelivery(models, notificationDays),
            ]);

            return responseHandler.returnSuccess(httpStatus.OK, 'Portfolio dashboard fetched', {
                generated_at: new Date().toISOString(),
                upcoming: upcomingAndOverdue.upcoming,
                overdue: upcomingAndOverdue.overdue,
                on_time_filing_rate: onTimeFilingRate,
                pending_documents: pendingDocuments,
                extension_usage: extensionUsage,
                notification_delivery: notificationDelivery,
                deferred_kpis: DEFERRED_KPIS,
            });
        } catch (err) {
            logger.error('Get portfolio dashboard overview error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching portfolio dashboard');
        }
    };

    // (a) Upcoming by Period + Overdue Compliance — same date comparison, split by
    // whether the effective due date has already passed. Buckets are cumulative
    // ("due within 30 days" includes everything due within 7).
    async _upcomingAndOverdue(models, topN) {
        const today = todayDate();
        const rows = await models.company_event.findAll({
            where: { is_deleted: false, status: { [Op.in]: OPEN_EVENT_STATUSES } },
            attributes: ['company_event_id', 'entity_id', 'event_id', 'event_slug', 'status', 'due_date', 'extended_due_date'],
            include: [
                { model: models.entities, as: 'entity', attributes: ['entity_id', 'name'] },
                { model: models.company_event_name, as: 'event', attributes: ['e_id', 'event_name'] },
            ],
        });

        const periodEnds = UPCOMING_PERIODS.map(days => ({ days, endDate: addDays(today, days) }));
        const periods = periodEnds.map(p => ({ days: p.days, count: 0 }));
        const overdueRows = [];

        rows.forEach((row) => {
            const value = row.toJSON ? row.toJSON() : row;
            const effectiveDue = dateOrNull(value.extended_due_date) || dateOrNull(value.due_date);
            if (!effectiveDue) return;

            if (effectiveDue < today) {
                overdueRows.push({
                    company_event_id: value.company_event_id,
                    entity_id: value.entity_id,
                    entity_name: value.entity?.name || null,
                    event_name: value.event?.event_name || value.event_slug,
                    status: value.status,
                    due_date: value.due_date,
                    extended_due_date: value.extended_due_date,
                    days_overdue: daysBetween(effectiveDue, today),
                });
                return;
            }

            periodEnds.forEach((p, index) => {
                if (effectiveDue <= p.endDate) periods[index].count += 1;
            });
        });

        overdueRows.sort((a, b) => b.days_overdue - a.days_overdue);

        return {
            upcoming: { periods },
            overdue: { total: overdueRows.length, top: overdueRows.slice(0, topN) },
        };
    }

    // (b) On-Time Filing Rate — completed/filed events within the trailing window,
    // filing_date compared against the effective due date at time of filing.
    async _onTimeFilingRate(models, days) {
        const today = todayDate();
        const rows = await models.company_event.findAll({
            where: {
                is_deleted: false,
                status: { [Op.in]: CLOSED_STATUSES },
                filing_date: { [Op.ne]: null, [Op.gte]: addDays(today, -days) },
            },
            attributes: ['company_event_id', 'due_date', 'extended_due_date', 'filing_date'],
        });

        let onTime = 0;
        let late = 0;
        let excludedNoDueDate = 0;

        rows.forEach((row) => {
            const value = row.toJSON ? row.toJSON() : row;
            const effectiveDue = dateOrNull(value.extended_due_date) || dateOrNull(value.due_date);
            const filingDate = dateOrNull(value.filing_date);
            if (!effectiveDue || !filingDate) {
                excludedNoDueDate += 1;
                return;
            }
            if (filingDate <= effectiveDue) onTime += 1;
            else late += 1;
        });

        const denominator = onTime + late;
        return {
            window_days: days,
            total_filed: rows.length,
            on_time: onTime,
            late,
            excluded_no_due_date: excludedNoDueDate,
            rate_pct: denominator > 0 ? Math.round((onTime / denominator) * 1000) / 10 : null,
        };
    }

    // (c) Pending Documents — mandatory checklist items not yet APPROVED/NOT_APPLICABLE
    // on events that are still open (operationally blocking right now, not all-time).
    async _pendingDocuments(models, topN) {
        if (!models.company_event_document) {
            return { total: 0, by_status: {}, top: [] };
        }

        const rows = await models.company_event_document.findAll({
            where: { is_deleted: false, is_mandatory: true, status: { [Op.notIn]: ['APPROVED', 'NOT_APPLICABLE'] } },
            include: [{
                model: models.company_event,
                as: 'company_event',
                required: true,
                where: { is_deleted: false, status: { [Op.in]: OPEN_EVENT_STATUSES } },
                attributes: ['company_event_id', 'entity_id', 'event_slug', 'status', 'due_date', 'extended_due_date'],
                include: [{ model: models.entities, as: 'entity', attributes: ['entity_id', 'name'] }],
            }],
        });

        const byStatus = {};
        const items = rows.map((row) => {
            const value = row.toJSON ? row.toJSON() : row;
            byStatus[value.status] = (byStatus[value.status] || 0) + 1;
            const event = value.company_event || {};
            return {
                event_document_id: value.event_document_id,
                company_event_id: value.company_event_id,
                entity_id: event.entity_id,
                entity_name: event.entity?.name || null,
                event_slug: event.event_slug,
                document_name: value.document_name,
                status: value.status,
                due_date: event.extended_due_date || event.due_date || null,
            };
        });

        items.sort((a, b) => (a.due_date || '9999-99-99').localeCompare(b.due_date || '9999-99-99'));

        return { total: items.length, by_status: byStatus, top: items.slice(0, topN) };
    }

    // (d) Extension Usage — approved extensions grouped by compliance type, company,
    // and (thin, single-jurisdiction-today) country. compliance_extension has no
    // direct model association to entities (only to company_event), so entity/country
    // data is fetched separately and merged in JS rather than via eager-load include.
    async _extensionUsage(models, topN) {
        if (!models.compliance_extension) {
            return { total_extensions: 0, total_extension_days: 0, by_compliance: [], by_jurisdiction: { data_coverage_pct: 0, note: 'No extension data available.', buckets: [] }, by_company: [] };
        }

        const rows = await models.compliance_extension.findAll({
            where: { action: 'EXTEND', status: 'APPROVED' },
            attributes: ['extension_id', 'entity_id', 'event_slug', 'extension_days'],
            raw: true,
        });

        const entityIds = [...new Set(rows.map(row => row.entity_id).filter(Boolean))];
        const entityById = new Map();
        if (entityIds.length && models.entities) {
            const entities = await models.entities.findAll({
                where: { entity_id: { [Op.in]: entityIds } },
                attributes: ['entity_id', 'name'],
                include: models.entity_company_details ? [{
                    model: models.entity_company_details,
                    as: 'company_detail',
                    attributes: ['country'],
                    required: false,
                }] : [],
            });
            entities.forEach((entity) => {
                const value = entity.toJSON ? entity.toJSON() : entity;
                entityById.set(value.entity_id, value);
            });
        }

        const byCompliance = new Map();
        const byEntity = new Map();
        const byCountry = new Map();
        let totalDays = 0;
        let withCountry = 0;

        rows.forEach((value) => {
            const days = Number(value.extension_days) || 0;
            totalDays += days;

            const compliance = byCompliance.get(value.event_slug) || { event_slug: value.event_slug, count: 0, total_days: 0 };
            compliance.count += 1;
            compliance.total_days += days;
            byCompliance.set(value.event_slug, compliance);

            const entityInfo = entityById.get(value.entity_id);
            const entityName = entityInfo?.name || `Entity #${value.entity_id}`;
            const entity = byEntity.get(value.entity_id) || { entity_id: value.entity_id, entity_name: entityName, count: 0 };
            entity.count += 1;
            byEntity.set(value.entity_id, entity);

            const country = entityInfo?.company_detail?.country || null;
            if (country) withCountry += 1;
            const countryKey = country || 'UNKNOWN';
            byCountry.set(countryKey, (byCountry.get(countryKey) || 0) + 1);
        });

        const byComplianceList = Array.from(byCompliance.values()).sort((a, b) => b.count - a.count);
        const byEntityList = Array.from(byEntity.values()).sort((a, b) => b.count - a.count).slice(0, topN);
        const byCountryList = Array.from(byCountry.entries())
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count);

        return {
            total_extensions: rows.length,
            total_extension_days: totalDays,
            by_compliance: byComplianceList,
            by_jurisdiction: {
                data_coverage_pct: rows.length > 0 ? Math.round((withCountry / rows.length) * 1000) / 10 : 0,
                note: 'Country sourced from entity_company_details.country; the system is effectively single-jurisdiction today, so this breakdown is thin.',
                buckets: byCountryList,
            },
            by_company: byEntityList,
        };
    }

    // (e) Notification Delivery — reminder log status counts over a trailing window.
    // Only PENDING/SENT/FAILED/SKIPPED exist today; BOUNCED/SUPPRESSED/ESCALATED are
    // named explicitly as not-yet-tracked rather than silently omitted.
    async _notificationDelivery(models, days) {
        const counts = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 };

        if (!models.company_event_reminder_log) {
            return { window_days: days, total: 0, counts, not_tracked: NOT_TRACKED_DELIVERY_STATES };
        }

        const rows = await models.company_event_reminder_log.findAll({
            attributes: ['status', [fn('COUNT', col('status')), 'count']],
            where: { scheduled_date: { [Op.gte]: addDays(todayDate(), -days) } },
            group: ['status'],
            raw: true,
        });

        let total = 0;
        rows.forEach((row) => {
            const status = String(row.status || '').toUpperCase();
            const count = Number(row.count) || 0;
            if (REMINDER_STATUSES.includes(status)) counts[status] = count;
            total += count;
        });

        return { window_days: days, total, counts, not_tracked: NOT_TRACKED_DELIVERY_STATES };
    }

}

module.exports = DashboardService;
