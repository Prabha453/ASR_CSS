'use strict';

// Expansion pass for popup-scoped loop blocks. Runs before the generic
// collection-block pass in htmlTemplateRenderer so that
//
//   {{#Popup_Section_1##officials}}
//       {{Popup_Section_1##name}} — {{Popup_Section_1##role_name}}
//   {{/Popup_Section_1##officials}}
//
// is turned into one rendered row per selected record. Inside the block a token
// prefixed with the block's own field key (`Popup_Section_1##name`) resolves
// against the CURRENT loop record; any other token is left untouched for the
// later scalar pass to handle from the global `values`.

const {
    escapeHtml, getPath, displayValue, applyFormatters, parseExpression, rowFieldKey,
    formatterContext,
} = require('./templateTokens');
const {
    parseScopedFieldToken, scopedBlockPattern, describeScopedBlock,
} = require('./scopedLoopBlock');

// Replace the tokens inside one iteration of a block body against `record`.
const defaultRenderValue = value => escapeHtml(displayValue(value));

const renderRow = (body, fieldKey, record, renderValue = defaultRenderValue) => body.replace(
    /\{\{\s*([^{}#\/][^{}]*?)\s*\}\}/g,
    (token, expression) => {
        const { key, formatters } = parseExpression(expression);
        const scoped = parseScopedFieldToken(key);
        // Only this block's own `<fieldKey>##<path>` tokens bind to the loop
        // record. A bare token, or one scoped to a different popup field, is
        // left for the outer passes.
        if (!scoped || scoped.fieldKey !== fieldKey) return token;
        // The picker emits the field's shortcode key after "##"
        // ("official_record.name"); the loop record is already that mapped
        // record, so strip the domain root ("official_record.") to read "name".
        const value = getPath(record, rowFieldKey(scoped.path));
        const resolved = value !== undefined ? value : getPath(record, scoped.path);
        if (resolved === undefined) return '';
        return renderValue(applyFormatters(
            resolved,
            formatters,
            formatterContext(key, {}, record)
        ));
    }
);

const renderScopedLoopBlocks = (content, values = {}, options = {}) => String(content || '').replace(
    scopedBlockPattern(),
    (match, openId, body, closeId) => {
        const { fieldKey, valueKey } = describeScopedBlock(openId, closeId);
        const collection = values[valueKey];
        // Empty / missing selection, or an unknown popup field → render nothing.
        // Never throw "Block value is not a collection" for a scoped loop.
        if (!Array.isArray(collection) || collection.length === 0) return '';
        return collection.map(record => renderRow(body, fieldKey, record, options.renderValue)).join('');
    }
);

module.exports = { renderScopedLoopBlocks };
