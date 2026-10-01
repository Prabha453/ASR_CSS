'use strict';

const REMINDER_MERGE_FIELDS = [
    { label: 'Company Name', slug: 'Company_name', path: 'company.name' },
    { label: 'Client Number', slug: 'Company_client_no', path: 'company.client_no' },
    { label: 'Registration Number', slug: 'Registration_Num', path: 'company.registration_no' },
    { label: 'UEN Number', slug: 'Company_uen_no', path: 'company.uen_no' },
    { label: 'FBRN Number', slug: 'Company_fbrn_no', path: 'company.fbrn_reg_no' },
    { label: 'ACRA Number', slug: 'Company_acra_no', path: 'company.acra_no' },
    { label: 'Registered Office Address', slug: 'Company_reg_Office_address', path: 'company.registered_office_address' },
    { label: 'Local Address', slug: 'Company_local_address', path: 'company.local_address' },
    { label: 'Foreign Address', slug: 'Company_foreign_address', path: 'company.foreign_address' },
    { label: 'Incorporation Date', slug: 'com_incorporation_date', path: 'company.incorporation_date' },
    { label: 'FYE Date', slug: 'Company_fye_date', path: 'company.fye_date' },
    { label: 'Country', slug: 'country', path: 'company.country' },
    { label: 'Event Name', slug: 'Event_name', path: 'event.name' },
    { label: 'Event Subject', slug: 'Event_subject', path: 'event.subject' },
    { label: 'Event Due Date', slug: 'Event_due_date', path: 'event.due_date' },
    { label: 'Event FYE Date', slug: 'Event_fye_date', path: 'event.fye_date' },
    { label: 'Notice Date', slug: 'Event_notice_date', path: 'event.notice_date' },
    { label: 'Received Date', slug: 'Event_received_date', path: 'event.received_date' },
    { label: 'Period From', slug: 'Event_period_from', path: 'event.period_from' },
    { label: 'Period To', slug: 'Event_period_to', path: 'event.period_to' },
    { label: 'Held Date', slug: 'Event_held_date', path: 'event.held_date' },
    { label: 'Filing / Completed Date', slug: 'Event_filing_date', path: 'event.filing_date' },
    { label: 'Venue', slug: 'Event_venue', path: 'event.venue' },
    { label: 'Agenda', slug: 'Event_agenda', path: 'event.agenda' },
    { label: 'Reminder Date', slug: 'Reminder_date', path: 'reminder.scheduled_date' },
];

const normalizeMergeKey = value =>
    String(value || '')
        .trim()
        .replace(/[.\s-]+/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();

const getValueByPath = (source = {}, path = '') => {
    const parts = String(path || '').split('.').filter(Boolean);
    let value = source;
    for (const part of parts) {
        if (!value || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
        value = value[part];
    }
    return value;
};

const buildMergeValueMap = (context = {}) => {
    const map = {};

    const setValue = (key, value) => {
        if (!key) return;
        map[normalizeMergeKey(key)] = value ?? '';
    };

    REMINDER_MERGE_FIELDS.forEach((field) => {
        const value = getValueByPath(context, field.path);
        setValue(field.slug, value);
        setValue(field.path, value);
    });

    Object.entries(context.company || {}).forEach(([key, value]) => {
        setValue(`company.${key}`, value);
        setValue(`company_${key}`, value);
    });

    Object.entries(context.event || {}).forEach(([key, value]) => {
        setValue(`event.${key}`, value);
        setValue(`event_${key}`, value);
    });

    Object.entries(context.reminder || {}).forEach(([key, value]) => {
        setValue(`reminder.${key}`, value);
        setValue(`reminder_${key}`, value);
    });

    return map;
};

const renderReminderTemplate = (template, context = {}) => {
    const valueMap = buildMergeValueMap(context);
    return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_.\-\s]+)\s*\}\}/g, (_, key) => {
        const normalizedKey = normalizeMergeKey(key);
        if (Object.prototype.hasOwnProperty.call(valueMap, normalizedKey)) {
            return valueMap[normalizedKey] === undefined || valueMap[normalizedKey] === null
                ? ''
                : String(valueMap[normalizedKey]);
        }

        const directValue = getValueByPath(context, key);
        return directValue === undefined || directValue === null ? '' : String(directValue);
    });
};

const EVENT_FIELD_MAP = {
    1: 'FYE',
    2: 'INCORPORATION_DATE',
    3: 'HELD_DATE',
    4: 'INCORPORATION_ANNIVERSARY',
    5: 'NEXT_JAN_31_AFTER_EVENT',
};

const EVENT_REFERENCE_MAP = {
    1: 'EVENT',
    2: 'FIELD',
    3: 'FIXED_DATE',
    4: 'CLIENT_DEFINED',
};

const EVENT_DMY_MAP = {
    1: 'DAY',
    2: 'MONTH',
    3: 'YEAR',
};

const pad2 = value => String(value).padStart(2, '0');

const toDateOnly = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }

    const raw = String(value).trim();
    if (!raw) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;

    const dmyDash = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyDash) return `${dmyDash[3]}-${pad2(dmyDash[2])}-${pad2(dmyDash[1])}`;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
};

const dateFromOnly = value => {
    const normalized = toDateOnly(value);
    if (!normalized) return null;
    const [year, month, day] = normalized.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const addDatePart = (dateValue, amount = 0, unit = 'DAY') => {
    const date = dateFromOnly(dateValue);
    if (!date) return null;

    const value = Number(amount) || 0;
    const normalizedUnit = String(unit || 'DAY').toUpperCase();

    if (normalizedUnit === 'MONTH') {
        const startDay = date.getDate();
        date.setMonth(date.getMonth() + value);
        if (date.getDate() !== startDay) date.setDate(0);
    } else if (normalizedUnit === 'YEAR') {
        const startMonth = date.getMonth();
        date.setFullYear(date.getFullYear() + value);
        if (date.getMonth() !== startMonth) date.setDate(0);
    } else {
        date.setDate(date.getDate() + value);
    }

    return toDateOnly(date);
};

const endOfMonth = (dateValue) => {
    const date = dateFromOnly(dateValue);
    if (!date) return null;
    return toDateOnly(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

const financialYearFromDate = value => {
    const normalized = toDateOnly(value);
    return normalized ? normalized.slice(0, 4) : null;
};

const checkCondition = (left, operator, right) => {
    switch (Number(operator)) {
        case 1: return left === right;
        case 2: return left < right;
        case 3: return left > right;
        case 4: return left <= right;
        case 5: return left >= right;
        default: return false;
    }
};

const getDateConditionValues = (dateValue, conditionValue) => {
    const normalizedDate = toDateOnly(dateValue);
    if (!normalizedDate) return null;

    const raw = String(conditionValue ?? '').trim();
    if (!raw) return null;

    const [, month, day] = normalizedDate.split('-').map(Number);

    if (/^\d{1,2}$/.test(raw)) {
        const conditionMonth = Number(raw);
        if (conditionMonth < 1 || conditionMonth > 12) return null;
        return { left: month, right: conditionMonth };
    }

    const dayMonth = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dayMonth) {
        return {
            left: (month * 100) + day,
            right: (Number(dayMonth[2]) * 100) + Number(dayMonth[1]),
        };
    }

    const fullDate = toDateOnly(raw);
    return fullDate ? { left: normalizedDate, right: fullDate } : null;
};

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

const eventSlugFromName = (name = '') => {
    const normalized = String(name || '').trim().toLowerCase();
    if (!normalized) return '';
    return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

const monthsBetween = (startValue, endValue) => {
    const start = dateFromOnly(startValue);
    const end = dateFromOnly(endValue);
    if (!start || !end) return null;
    return ((end.getFullYear() - start.getFullYear()) * 12) + (end.getMonth() - start.getMonth());
};

const fixedDatePart = (field, part, context) => {
    const key = String(field || '').toUpperCase();
    const sourceDate = key === 'INCORPORATION_DATE'
        ? context.incorporationDate
        : key === 'HELD_DATE'
            ? context.heldDate
            : context.fyeDate;

    const normalized = toDateOnly(sourceDate);
    if (!normalized) return null;
    const [year, month, day] = normalized.split('-');
    if (part === 'day') return day;
    if (part === 'month') return month;
    return year;
};

const normalizeStep = (step = {}) => {
    const logic = Number.isInteger(Number(step.reference_logic))
        ? EVENT_REFERENCE_MAP[Number(step.reference_logic)]
        : String(step.reference_logic || '').toUpperCase();
    const rawField = Number.isInteger(Number(step.field))
        ? EVENT_FIELD_MAP[Number(step.field)]
        : String(step.field || '').toUpperCase();

    const offset = step.offset || {
        value: step.dmy_counter ?? step.offset_value ?? 0,
        unit: Number.isInteger(Number(step.dmy_type))
            ? EVENT_DMY_MAP[Number(step.dmy_type)]
            : step.offset_unit,
    };
    const fieldAlias = {
        ACTUAL_FYE: 'FYE',
        AGM_HELD_DATE: 'HELD_DATE',
        DATE_OF_AGM_PLUS_ONE_YEAR_JAN_31: 'NEXT_JAN_31_AFTER_EVENT',
    };
    const unitAlias = {
        DAYS: 'DAY',
        MONTHS: 'MONTH',
        YEARS: 'YEAR',
    };
    const normalizedUnit = String(offset.unit || 'DAY').toUpperCase();

    return {
        ...step,
        reference_logic: logic,
        field: fieldAlias[rawField] || rawField,
        event_slug: step.event_slug || step.reference_event_slug,
        event_id: step.event_id || step.event_master,
        offset: {
            value: Number(offset.value || 0),
            unit: unitAlias[normalizedUnit] || normalizedUnit,
        },
        end_month: Boolean(step.end_month),
    };
};

const resolveReferenceDate = (stepInput, context, generatedBySlug) => {
    const step = normalizeStep(stepInput);
    const logic = String(step.reference_logic || '').toUpperCase();
    const field = String(step.field || '').toUpperCase();

    if (logic === 'EVENT') {
        const eventSlug = step.event_slug || context.eventSlugByEventId?.[Number(step.event_id)];
        return generatedBySlug[eventSlug]?.due_date
            || context.previousEventsBySlug?.[eventSlug]?.due_date
            || null;
    }

    if (logic === 'FIXED_DATE') {
        const source = step.fixed_date || {};
        const dd = source.day_field ? fixedDatePart(source.day_field, 'day', context) : source.day;
        const mm = source.month_field ? fixedDatePart(source.month_field, 'month', context) : source.month;
        let yyyy = source.year_field ? fixedDatePart(source.year_field, 'year', context) : source.year;
        if (String(source.year_field || '').toUpperCase() === 'CURRENT_YEAR') yyyy = new Date().getFullYear();
        if (!dd || !mm || !yyyy) return null;
        return toDateOnly(`${pad2(dd)}-${pad2(mm)}-${yyyy}`);
    }

    if (field === 'INCORPORATION_DATE') return context.incorporationDate;
    if (field === 'INCORPORATION_ANNIVERSARY') return addDatePart(context.incorporationDate, 1, 'YEAR');
    if (field === 'HELD_DATE') return context.heldDate;
    if (field === 'FYE') return context.fyeDate || context.incorporationDate;
    if (field === 'NEXT_YA_NOV_30') {
        const fyeDate = dateFromOnly(context.fyeDate);
        if (!fyeDate) return null;
        return `${fyeDate.getFullYear() + 1}-11-30`;
    }
    if (field === 'NEXT_MARCH_1_AFTER_INCORPORATION_YEAR') {
        const incorporationDate = dateFromOnly(context.incorporationDate);
        if (!incorporationDate) return null;
        return `${incorporationDate.getFullYear() + 1}-03-01`;
    }
    if (field === 'NEXT_JAN_31_AFTER_EVENT') {
        const eventDate = context.eventDate || context.heldDate || context.fyeDate || context.incorporationDate;
        const normalized = dateFromOnly(eventDate);
        if (!normalized) return null;
        return `${normalized.getFullYear() + 1}-01-31`;
    }

    return context.fyeDate || context.incorporationDate;
};

const matchesRuleConditions = (rule, context, conditionsInput = null) => {
    const conditions = conditionsInput || jsonArray(rule.conditions);
    if (!conditions.length) return true;

    const evaluateConditionPart = (condition, operatorKey = 'operator', valueKey = 'value') => {
        if (!condition?.[operatorKey]) return null;
        if (condition[valueKey] === undefined || condition[valueKey] === null || condition[valueKey] === '') return null;

        const field = String(condition.field || '').toUpperCase();
        let left;
        let right = condition[valueKey];

        if (field === 'INCORPORATION_DATE') {
            const values = getDateConditionValues(context.incorporationDate, right);
            if (!values) return false;
            left = values.left;
            right = values.right;
        } else if (field === 'FYE') {
            const values = getDateConditionValues(context.fyeDate, right);
            if (!values) return false;
            left = values.left;
            right = values.right;
        } else if (field === 'HELD_DATE') {
            const values = getDateConditionValues(context.heldDate, right);
            if (!values) return false;
            left = values.left;
            right = values.right;
        } else if (field === 'FYE_PERIOD_MONTHS') {
            left = context.periodMonths;
            right = Number(right);
        } else if (field === 'HAS_PREVIOUS_EVENT') {
            left = Boolean(context.previousEventsBySlug?.[condition.event_slug]);
            right = condition[valueKey] === undefined ? true : Boolean(condition[valueKey]);
        } else {
            return true;
        }

        if (left === null || left === undefined || right === null || right === undefined) return false;
        return checkCondition(left, condition[operatorKey], right);
    };

    const conditionResults = conditions.flatMap(condition => {
        const firstResult = evaluateConditionPart(condition);
        const secondResult = evaluateConditionPart(condition, 'operator2', 'value2');

        return [firstResult, secondResult].filter(result => result !== null);
    });

    if (!conditionResults.length) return true;

    const mode = String(rule.condition_mode || rule.conditions_mode || 'ALL').toUpperCase();
    return mode === 'ANY' ? conditionResults.some(Boolean) : conditionResults.every(Boolean);
};

const getRuleGroups = (rule, phaseInput = null) => {
    const config = jsonObject(rule.rule_config);
    const phase = String(phaseInput || rule.rule_phase || rule.row_type || 'FIRST').toUpperCase();
    const phaseConfig = config.phases?.[phase] || config[phase.toLowerCase()] || null;
    const phaseGroups = jsonArray(phaseConfig?.groups || phaseConfig);
    if (phaseGroups.length) {
        return phaseGroups.map(group => ({
            condition_mode: group.condition_mode || group.conditions_mode || 'ALL',
            conditions: jsonArray(group.conditions),
            steps: jsonArray(group.steps),
            take: group.take || 'LATEST',
        }));
    }

    const groups = jsonArray(rule.groups).length ? jsonArray(rule.groups) : jsonArray(config.groups);
    if (groups.length) {
        return groups.map(group => ({
            condition_mode: group.condition_mode || group.conditions_mode || 'ALL',
            conditions: jsonArray(group.conditions),
            steps: jsonArray(group.steps),
            take: group.take || 'LATEST',
        }));
    }

    return [{
        condition_mode: rule.condition_mode || rule.conditions_mode || 'ALL',
        conditions: jsonArray(rule.conditions),
        steps: jsonArray(rule.steps),
        take: rule.take || 'LATEST',
    }];
};

const groupMatches = (ruleGroup, context) =>
    matchesRuleConditions({
        condition_mode: ruleGroup.condition_mode,
        conditions_mode: ruleGroup.condition_mode,
    }, context, ruleGroup.conditions);

const ruleHasMatchingGroup = (rule, context) =>
    getRuleGroups(rule, context.rulePhase).some(group => groupMatches(group, context));

const calculateStepsDate = (stepsInput, context, generatedBySlug, take = 'LATEST') => {
    const steps = jsonArray(stepsInput);
    let selected = null;
    const mode = String(take || 'LATEST').toUpperCase();

    for (const rawStep of steps) {
        const step = normalizeStep(rawStep);
        const baseDate = resolveReferenceDate(step, context, generatedBySlug);
        if (!baseDate) continue;

        const offset = step.offset || {};
        let dueDate = Number(offset.value || 0) === 0
            ? toDateOnly(baseDate)
            : addDatePart(baseDate, offset.value, offset.unit);

        if (step.end_month) dueDate = endOfMonth(dueDate);
        if (!dueDate) continue;

        const current = {
            due_date: dueDate,
            base_date: toDateOnly(baseDate),
            source_basis: step.source_basis || step.field || step.reference_logic || null,
        };

        if (mode === 'FIRST') return current;

        if (!selected || dateFromOnly(current.due_date) > dateFromOnly(selected.due_date)) {
            selected = current;
        }
    }

    return selected;
};

const calculateRuleDate = (rule, context, generatedBySlug) => {
    const groups = getRuleGroups(rule, context.rulePhase);
    let latest = null;

    for (const group of groups) {
        if (!groupMatches(group, context)) continue;

        const result = calculateStepsDate(group.steps, context, generatedBySlug, group.take);
        if (!result?.due_date) continue;

        if (!latest || dateFromOnly(result.due_date) > dateFromOnly(latest.due_date)) {
            latest = result;
        }
    }

    return latest;
};

const ruleMatchesScope = (rule, context) => {
    const config = jsonObject(rule.rule_config);
    const scope = jsonObject(config.scope);
    const countryIds = [
        ...csvNumbers(rule.country_ids),
        ...csvNumbers(config.country_ids),
        ...csvNumbers(config.customer_country_ids),
        ...csvNumbers(scope.customer_country_ids),
    ].map(Number).filter(Boolean);
    const legacyCountryIds = [
        ...csvNumbers(rule.legacy_country_ids),
        ...csvNumbers(config.legacy_country_ids),
        ...csvNumbers(scope.country_ids),
    ].map(Number).filter(Boolean);
    const companyTypeIds = [
        ...csvNumbers(rule.company_type_ids),
        ...csvNumbers(config.company_type_ids),
        ...csvNumbers(scope.company_type_ids),
    ].map(Number).filter(Boolean);

    const customerCountryId = Number(context.customerCountryId || context.countryId || 0) || null;
    const ruleCountryId = Number(context.ruleCountryId || context.portCountryId || context.countryId || 0) || null;

    if (countryIds.length && (!customerCountryId || !countryIds.includes(customerCountryId))) return false;
    if (legacyCountryIds.length && (!ruleCountryId || !legacyCountryIds.includes(ruleCountryId))) return false;
    if (companyTypeIds.length && !companyTypeIds.includes(Number(context.companyTypeId))) return false;

    // Spec §5 jurisdiction hierarchy: a rule scoped to a jurisdiction (state/province,
    // free zone or municipality) only matches a company registered in that exact
    // jurisdiction or one nested under it. context.jurisdictionAncestorIds is
    // precomputed once per sync (self + every parent up the chain) so this is a
    // simple membership check, not a query.
    const ruleJurisdictionId = Number(rule.jurisdiction_id) || null;
    if (ruleJurisdictionId && !(context.jurisdictionAncestorIds || []).includes(ruleJurisdictionId)) return false;

    return true;
};

// jurisdictionLevelById: { [jurisdiction_id]: 'COUNTRY_NATIONAL'|'STATE_PROVINCE'|'FREE_ZONE'|'MUNICIPALITY' },
// precomputed once from the (small) jurisdictions table — see EntityCompanyService.
const ruleScopeSpecificity = (rule, jurisdictionLevelById = {}) => {
    const config = jsonObject(rule.rule_config);
    const scope = jsonObject(config.scope);
    const countryIds = [
        ...csvNumbers(rule.country_ids),
        ...csvNumbers(config.country_ids),
        ...csvNumbers(config.customer_country_ids),
        ...csvNumbers(scope.customer_country_ids),
    ];
    const legacyCountryIds = [
        ...csvNumbers(rule.legacy_country_ids),
        ...csvNumbers(config.legacy_country_ids),
        ...csvNumbers(scope.country_ids),
    ];
    const companyTypeIds = [
        ...csvNumbers(rule.company_type_ids),
        ...csvNumbers(config.company_type_ids),
        ...csvNumbers(scope.company_type_ids),
    ];

    // Unchanged from the pre-jurisdiction formula — every existing rule (jurisdiction_id
    // NULL) resolves to exactly this 0-3 score, so today's ordering is fully preserved.
    const legacySpecificity = (countryIds.length ? 1 : 0) + (legacyCountryIds.length ? 1 : 0) + (companyTypeIds.length ? 1 : 0);

    // Spec §5.2 priority: "authority or free-zone rule" outranks "state/province rule",
    // which outranks plain country/company-type scoping. Only rules that explicitly set
    // jurisdiction_id get a tier bump — a strict superset of the old behavior.
    const ruleJurisdictionId = Number(rule.jurisdiction_id) || null;
    const jurisdictionLevel = ruleJurisdictionId ? jurisdictionLevelById[ruleJurisdictionId] : null;
    // A COUNTRY_NATIONAL jurisdiction row is just an explicit FK for country-wide scope —
    // no more specific than having no jurisdiction_id at all, so it stays tier 0.
    const jurisdictionTier = (!jurisdictionLevel || jurisdictionLevel === 'COUNTRY_NATIONAL') ? 0
        : (jurisdictionLevel === 'STATE_PROVINCE' ? 1 : 2);

    return jurisdictionTier * 10 + legacySpecificity;
};

// Picks a single winning rule among several PUBLISHED, scope-matching candidates and
// records why, so generation is never a silent "oldest row wins" (see EntityCompanyService).
const selectBestRule = (candidateRows = [], context = {}) => {
    const candidates = candidateRows.map((row) => {
        const plain = row.toJSON ? row.toJSON() : row;
        return {
            rule_id: plain.rule_id,
            rule_code: plain.rule_code || plain.rule_id,
            version_no: plain.version_no,
            rule_priority: Number(plain.rule_priority || 0),
            specificity: ruleScopeSpecificity(plain, context.jurisdictionLevelById || {}),
            effective_from: plain.effective_from || null,
            row: plain,
        };
    });

    if (!candidates.length) return { selected: null, selected_reason: null, candidates: [] };

    const sorted = [...candidates].sort((a, b) => {
        if (b.rule_priority !== a.rule_priority) return b.rule_priority - a.rule_priority;
        if (b.specificity !== a.specificity) return b.specificity - a.specificity;
        const aEffective = dateFromOnly(a.effective_from)?.getTime() || 0;
        const bEffective = dateFromOnly(b.effective_from)?.getTime() || 0;
        if (bEffective !== aEffective) return bEffective - aEffective;
        return Number(b.rule_id) - Number(a.rule_id);
    });

    const winner = sorted[0];
    const runnerUp = sorted[1];

    let selectedReason = 'Only matching published rule';
    if (runnerUp) {
        if (winner.rule_priority !== runnerUp.rule_priority) {
            selectedReason = `Higher priority (${winner.rule_priority} > ${runnerUp.rule_priority})`;
        } else if (winner.specificity !== runnerUp.specificity) {
            selectedReason = `More specific scope (${winner.specificity} vs ${runnerUp.specificity} matched dimensions)`;
        } else if (winner.effective_from !== runnerUp.effective_from) {
            selectedReason = `Later effective date (${winner.effective_from} > ${runnerUp.effective_from})`;
        } else {
            selectedReason = `Highest rule_id tiebreak (#${winner.rule_id})`;
        }
    }

    return {
        selected: winner.row,
        selected_reason: selectedReason,
        candidates: candidates.map(candidate => ({
            rule_id: candidate.rule_id,
            rule_code: candidate.rule_code,
            version_no: candidate.version_no,
            rule_priority: candidate.rule_priority,
            specificity: candidate.specificity,
            effective_from: candidate.effective_from,
            matched: true,
            selected: candidate.rule_id === winner.rule_id,
        })),
    };
};

module.exports = {
    REMINDER_MERGE_FIELDS,
    addDatePart,
    calculateRuleDate,
    csvNumbers,
    dateFromOnly,
    eventSlugFromName,
    financialYearFromDate,
    getRuleGroups,
    jsonArray,
    jsonObject,
    monthsBetween,
    renderReminderTemplate,
    ruleHasMatchingGroup,
    ruleMatchesScope,
    selectBestRule,
    toDateOnly,
};
