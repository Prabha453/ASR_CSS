'use strict';

// A popup-scoped loop block iterates the records a single popup section
// selected, e.g.
//
//   {{#Popup_Section_1##officials}}
//       {{Popup_Section_1##name}}
//   {{/Popup_Section_1##officials}}
//
// The block identifier carries BOTH the popup field key and the loop type, so
// there is never any ambiguity about which selection feeds the block (unlike
// the legacy `{{#officials}}` form). Each loop type keeps its own
// business-specific retrieval / mapping — this module only parses and validates
// the block syntax; it never touches the database.

const { SCOPE_SEPARATOR } = require('./templateFieldParser');

// The business domains that already own a retrieval + mapping pipeline. Roles
// (director, secretary, shareholder, auditor, …) are NOT loop types — they
// stay as data on each mapped official (`role`, `role_name`). Shares DOES get
// two loop types: `shares` (a company-level share/class structure row —
// css_entity_shares) and `shareholder_shares` (one shareholder's holding of
// one such share — css_share_ledger) are different tables with different id
// spaces, not two views of the same record.
const SCOPED_LOOP_TYPES = Object.freeze(['officials', 'events', 'shares', 'shareholder_shares']);

// Popup field keys are stored as lower-cased slugs (see popupSchema.js), so the
// scope half of a block/token is lower-cased to match. The loop type is
// likewise normalised.
const parseScopedBlockKey = (rawKey = '') => {
    const text = String(rawKey || '').trim();
    const index = text.indexOf(SCOPE_SEPARATOR);
    if (index < 0) return null;
    return {
        fieldKey: text.slice(0, index).trim().toLowerCase(),
        loopType: text.slice(index + SCOPE_SEPARATOR.length).trim().toLowerCase(),
    };
};

// A field token inside a block body — `Popup_Section_1##appointment_date` —
// splits the same way: scope half + record path (everything after the first
// `##`, so dotted paths survive).
const parseScopedFieldToken = (rawKey = '') => {
    const parsed = parseScopedBlockKey(rawKey);
    return parsed && { fieldKey: parsed.fieldKey, path: parsed.loopType };
};

// The canonical `values` key an expanded block reads its collection from.
const scopedBlockValueKey = (fieldKey, loopType) =>
    `${String(fieldKey).toLowerCase()}${SCOPE_SEPARATOR}${String(loopType).toLowerCase()}`;

const IDENTIFIER = '[A-Za-z0-9_.-]+##[A-Za-z0-9_.-]+';

// Fresh (non-sticky-state) matcher for {{#a##type}} … {{/a##type}} — captures
// (openId, body, closeId). A new object each call so callers never share
// `lastIndex`.
const scopedBlockPattern = () => new RegExp(
    `\\{\\{\\s*#\\s*(${IDENTIFIER})\\s*\\}\\}([\\s\\S]*?)\\{\\{\\s*/\\s*(${IDENTIFIER})\\s*\\}\\}`,
    'g'
);

// Validate one matched open/close pair and return the normalised descriptor.
// Throws with a clear message on a mismatched pair or an unknown loop type.
const describeScopedBlock = (openId, closeId) => {
    const open = parseScopedBlockKey(openId);
    const close = parseScopedBlockKey(closeId);
    if (!open || !close ||
        open.fieldKey !== close.fieldKey || open.loopType !== close.loopType) {
        throw new Error(
            `Mismatched scoped loop block: {{#${openId}}} closed by {{/${closeId}}}`
        );
    }
    if (!SCOPED_LOOP_TYPES.includes(open.loopType)) {
        throw new Error(
            `Unknown scoped loop type "${open.loopType}" in {{#${openId}}}. `
            + `Supported types: ${SCOPED_LOOP_TYPES.join(', ')}`
        );
    }
    return {
        fieldKey: open.fieldKey,
        loopType: open.loopType,
        valueKey: scopedBlockValueKey(open.fieldKey, open.loopType),
    };
};

// Scan a template for every popup-scoped loop block. A popup field key that does
// not exist is NOT rejected here — the caller resolves it to an empty
// collection so the block simply renders nothing.
const findScopedLoopBlocks = (content = '') => {
    const blocks = [];
    const pattern = scopedBlockPattern();
    let match;
    while ((match = pattern.exec(String(content))) !== null) {
        const [, openId, body, closeId] = match;
        blocks.push({ ...describeScopedBlock(openId, closeId), body });
    }
    return blocks;
};

// Every template key that is part of well-formed scoped-loop syntax: the block
// identifiers ("field##type") plus the inner field tokens ("field##path") that
// bind to the loop record. Shortcode validators use this to skip loop keys
// instead of flagging them as unknown shortcodes. Lenient — a malformed block
// is ignored here (surfaced elsewhere), never thrown.
const scopedLoopTemplateKeys = (content = '') => {
    const keys = new Set();
    const pattern = scopedBlockPattern();
    let match;
    while ((match = pattern.exec(String(content))) !== null) {
        const [, openId, body, closeId] = match;
        const open = parseScopedBlockKey(openId);
        const close = parseScopedBlockKey(closeId);
        if (!open || !close ||
            open.fieldKey !== close.fieldKey || open.loopType !== close.loopType ||
            !SCOPED_LOOP_TYPES.includes(open.loopType)) {
            continue;
        }
        // Both the raw identifier (as parseTemplateFields records it) and the
        // normalised value key, so callers can match either.
        keys.add(String(openId).trim());
        keys.add(`${open.fieldKey}${SCOPE_SEPARATOR}${open.loopType}`);
        const tokenPattern = /\{\{\s*([^{}#\/][^{}]*?)\s*\}\}/g;
        let token;
        while ((token = tokenPattern.exec(body)) !== null) {
            const rawKey = token[1].split('|')[0].trim();
            const scoped = parseScopedFieldToken(rawKey);
            if (scoped && scoped.fieldKey === open.fieldKey) keys.add(rawKey);
        }
    }
    return keys;
};

// Re-order database rows to exactly match the order the user picked the ids in.
// Rows whose id is not in the selection are dropped; selected ids with no row
// are skipped. `idOf` reads the identifier off a mapped record.
const orderBySelection = (records, selectedIds, idOf) => {
    const byId = new Map();
    for (const record of records) {
        const key = String(idOf(record));
        if (!byId.has(key)) byId.set(key, record);
    }
    const ordered = [];
    for (const id of selectedIds) {
        const record = byId.get(String(id));
        if (record) ordered.push(record);
    }
    return ordered;
};

module.exports = {
    SCOPED_LOOP_TYPES,
    parseScopedBlockKey,
    parseScopedFieldToken,
    scopedBlockValueKey,
    scopedBlockPattern,
    describeScopedBlock,
    findScopedLoopBlocks,
    scopedLoopTemplateKeys,
    orderBySelection,
};
