'use strict';

// A popup field's picker (checkbox/radio/select) shows one option per
// record, and the LABEL for that option used to be a single hardcoded string
// per data source (e.g. "Tan Wei Ming - directors (2026-09-01)"). This lets
// the FormBuilder author instead pick which pieces appear and in what order,
// from a fixed catalogue per data source — no free typing, so a label can
// never break. Each option keeps its full default label as a fallback: an
// author who never touches this setting sees exactly the old behaviour.

const { formatDate } = require('./templateTokens');

// value_source -> the pieces its options' `meta` can carry, with a display
// label for the builder UI and how to render that piece's raw value.
const OPTION_LABEL_CATALOG = {
    OFFICIAL_RECORDS: [
        { key: 'name', label: 'Name' },
        { key: 'role_name', label: 'Role' },
        { key: 'client_number', label: 'Client Number' },
        { key: 'status', label: 'Status' },
        { key: 'appointment_date', label: 'Appointment Date', kind: 'date' },
        { key: 'cessation_date', label: 'Cessation Date', kind: 'date' },
    ],
    SHARES: [
        { key: 'shareholder_name', label: 'Shareholder Name' },
        { key: 'share_class_name', label: 'Share Class' },
        { key: 'currency', label: 'Currency' },
        { key: 'share_type', label: 'Share Type' },
        { key: 'quantity', label: 'Quantity', kind: 'number' },
        { key: 'official_type', label: 'Shareholder Type' },
    ],
};
// OFFICIALS / SHAREHOLDERS are the same "pick a person" shape as OFFICIAL_RECORDS.
OPTION_LABEL_CATALOG.OFFICIALS = OPTION_LABEL_CATALOG.OFFICIAL_RECORDS;
OPTION_LABEL_CATALOG.SHAREHOLDERS = OPTION_LABEL_CATALOG.OFFICIAL_RECORDS;

const kindByKey = (valueSource) => new Map(
    (OPTION_LABEL_CATALOG[valueSource] || []).map(piece => [piece.key, piece.kind])
);

const formatPieceValue = (value, kind) => {
    if (value === null || value === undefined || value === '') return null;
    if (kind === 'date') {
        try { return formatDate(value, 'DD-MMM-YYYY'); } catch (error) { return String(value); }
    }
    if (kind === 'number') return Number(value).toLocaleString();
    return String(value);
};

// Rebuild an option's label from the pieces the author picked (in that
// order), reading each piece off `meta`. A piece the current option's `meta`
// doesn't carry (e.g. `shareholder_name` on a company-level share) is simply
// skipped rather than showing "null" or breaking the label. Falls back to
// `defaultLabel` when no pieces are configured, or none of them produced
// anything — so a misconfigured/irrelevant selection never yields blank text.
const formatOptionLabel = (valueSource, pieceKeys, meta = {}, defaultLabel) => {
    if (!Array.isArray(pieceKeys) || !pieceKeys.length) return defaultLabel;
    const kinds = kindByKey(valueSource);
    const parts = pieceKeys
        .map(key => formatPieceValue(meta[key], kinds.get(key)))
        .filter(part => part !== null);
    return parts.length ? parts.join(' - ') : defaultLabel;
};

module.exports = { OPTION_LABEL_CATALOG, formatOptionLabel };
