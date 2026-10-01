'use strict';

// Low-level template primitives shared by the scalar renderer, the generic
// collection-block renderer and the popup-scoped loop renderer. Kept in one
// dependency-free module so the renderers can compose them without importing
// each other.

const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const getPath = (source, path) => String(path).split('.').reduce(
    (value, segment) => value == null ? undefined : value[segment], source
);

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (value, format) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) throw new Error(`Invalid date value: ${value}`);
    const [, year, month, day] = match;
    if (format === 'DD-MMM-YYYY') return `${day}-${monthNames[Number(month) - 1]}-${year}`;
    if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    throw new Error(`Unsupported date format: ${format}`);
};

const displayValue = value => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        if (!Array.isArray(value) && value.formatted) return value.formatted;
        return JSON.stringify(value);
    }
    return String(value);
};

// `official_type` is a conditional formatter used by templates that bind one
// popup field to both the individual and corporate variants of a form. The
// officials table historically stores corporate officials as COMPANY, while
// form wording uses CORPORATE, so both names deliberately normalise to the
// same value.
const OFFICIAL_TYPES = new Set(['COMPANY', 'INDIVIDUAL', 'JOINT', 'SUB_FUND']);

const normalizeOfficialType = value => {
    const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (normalized === 'CORPORATE') return 'COMPANY';
    if (normalized === 'SUBFUND') return 'SUB_FUND';
    return normalized;
};

const parseFormatter = formatter => {
    const [rawName, ...argumentParts] = String(formatter || '').split(':');
    return {
        name: rawName.trim().toLowerCase(),
        argument: argumentParts.join(':').trim(),
    };
};

const isOfficialTypeFormatter = formatter => parseFormatter(formatter).name === 'official_type';

const isSupportedOfficialTypeFormatter = formatter => {
    const { name, argument } = parseFormatter(formatter);
    return name === 'official_type' && OFFICIAL_TYPES.has(normalizeOfficialType(argument));
};

const applyFormatters = (value, formatters = [], context = {}) => {
    // Conditions are evaluated before display formatting. A hidden branch
    // must stay empty even when its value is absent or would fail a formatter
    // such as `date:`.
    for (const formatter of formatters) {
        if (!isOfficialTypeFormatter(formatter)) continue;
        const { argument } = parseFormatter(formatter);
        if (!OFFICIAL_TYPES.has(normalizeOfficialType(argument))) {
            throw new Error(`Unsupported official type: ${argument}`);
        }
        if (normalizeOfficialType(context.official_type) !== normalizeOfficialType(argument)) {
            return '';
        }
    }

    let result = value;
    for (const formatter of formatters) {
        const { name, argument } = parseFormatter(formatter);
        if (name === 'official_type') continue;
        if (name === 'date') result = formatDate(result, argument);
        else if (name === 'uppercase') result = displayValue(result).toUpperCase();
        else if (name === 'lowercase') result = displayValue(result).toLowerCase();
        else throw new Error(`Unsupported formatter: ${formatter}`);
    }
    return result;
};

const parseExpression = expression => {
    const parts = expression.split('|').map(part => part.trim()).filter(Boolean);
    return { key: parts.shift(), formatters: parts };
};

// Inside a repeating block every row IS the current record, so a token that
// carries a scope prefix ("all_officials##official_record.name") or a domain
// root ("official_record.name", "event.due_date") should resolve straight
// against the row's own mapped fields ("name", "due_date"). This strips both so
// the same picker token works inside a loop and as a standalone field-scoped
// token outside one.
const ROW_DOMAIN_ROOTS = new Set([
    'official_record', 'official', 'officials',
    'event', 'events',
    'share_record', 'share', 'shares', 'share_allotment', 'share_transaction',
]);

const rowFieldKey = key => {
    let path = String(key);
    const scope = path.indexOf('##');
    if (scope >= 0) path = path.slice(scope + 2).trim();
    const dot = path.indexOf('.');
    if (dot > 0 && ROW_DOMAIN_ROOTS.has(path.slice(0, dot))) path = path.slice(dot + 1);
    return path;
};

// Find the selected official type that belongs to one token. Scalar popup
// fields store it under `<scope>##official_type`; loop rows carry it directly.
// Unscoped selected-official tokens use `official_record.official_type`.
const formatterContext = (key, values = {}, record = null) => {
    const row = record && typeof record === 'object' ? record : {};
    let officialType = row.official_type || row.entity_type || null;
    if (!officialType) {
        const text = String(key || '');
        const scopeIndex = text.indexOf('##');
        if (scopeIndex >= 0) {
            const scope = text.slice(0, scopeIndex).trim().toLowerCase();
            officialType = values[`${scope}##official_type`]
                || values[`${scope}##official_record.official_type`]
                || values[`${scope}##official_record.entity_type`]
                || null;
        } else if (text === 'official_record' || text.startsWith('official_record.')) {
            officialType = values['official_record.official_type']
                || values['official_record.entity_type']
                || null;
        }
    }
    return { official_type: officialType };
};

const assertSafeTemplate = content => {
    if (/<\s*(script|iframe|object|embed)\b/i.test(content) ||
        /\son[a-z]+\s*=/i.test(content) || /(javascript|file)\s*:/i.test(content)) {
        throw new Error('Template contains unsafe active content');
    }
};

module.exports = {
    escapeHtml, getPath, formatDate, displayValue, applyFormatters, parseExpression,
    assertSafeTemplate, rowFieldKey, normalizeOfficialType, isOfficialTypeFormatter,
    isSupportedOfficialTypeFormatter, formatterContext,
};
