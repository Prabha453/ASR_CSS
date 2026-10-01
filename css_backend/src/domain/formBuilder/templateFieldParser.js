'use strict';

// A field-scoped template key binds a shortcode to the record picked in one
// specific popup field, e.g. {{director_1##official_record.name}} resolves
// `official_record.name` against whatever the `director_1` popup field
// selected — so three "Director" pickers no longer all collapse onto the
// first OFFICIAL_RECORDS selection. `scope` is null for an ordinary shortcode.
const SCOPE_SEPARATOR = '##';

const parseScopedKey = (rawKey = '') => {
    const text = String(rawKey || '').trim();
    const index = text.indexOf(SCOPE_SEPARATOR);
    if (index < 0) return { scope: null, key: text };
    return {
        scope: text.slice(0, index).trim().toLowerCase(),
        key: text.slice(index + SCOPE_SEPARATOR.length).trim(),
    };
};

const parseTemplateFields = (content = '') => {
    const fields = new Map();
    const pattern = /\{\{\s*([^{}]+?)\s*\}\}/g;
    let match;
    while ((match = pattern.exec(String(content))) !== null) {
        let expression = match[1].trim();
        if (!expression || /^[\/^!?]/.test(expression)) continue;
        const isBlock = expression.startsWith('#');
        if (isBlock) expression = expression.slice(1).trim();
        const parts = expression.split('|').map(part => part.trim()).filter(Boolean);
        const key = parts.shift();
        if (!key) continue;
        const current = fields.get(key) || { key, formatters: [], occurrences: 0, is_block: false };
        current.occurrences += 1;
        current.is_block = current.is_block || isBlock;
        for (const formatter of parts) {
            if (!current.formatters.includes(formatter)) current.formatters.push(formatter);
        }
        fields.set(key, current);
    }
    return [...fields.values()];
};

const hasUsableValue = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'formatted')) {
        return Boolean(value.formatted);
    }
    return true;
};

module.exports = { parseTemplateFields, hasUsableValue, parseScopedKey, SCOPE_SEPARATOR };
