'use strict';

const {
    escapeHtml, getPath, formatDate, displayValue, applyFormatters, parseExpression,
    assertSafeTemplate, rowFieldKey, formatterContext, isOfficialTypeFormatter,
} = require('./templateTokens');
const { renderScopedLoopBlocks } = require('./scopedLoopRenderer');

// Keep preview-only markup out of HTML attributes. Values are first surrounded
// by private markers, then the markers are converted to spans only while the
// scanner is outside an HTML tag. A shortcode used in an href/title/etc. still
// renders as the plain escaped value.
const PREVIEW_MARKER_OPEN = '\uE000form-shortcode-preview\uE001';
const PREVIEW_MARKER_CLOSE = '\uE002form-shortcode-preview\uE003';
const PREVIEW_HIGHLIGHT = '<span class="form-shortcode-highlight" style="background-color:#ffeb3b;color:inherit;">';

// CKEditor escapes a manually typed `<br>` as text. Form authors commonly use
// it inside a compact loop body, expecting a document line break. Decode only
// this inert, allow-listed tag after shortcode replacement; no arbitrary HTML
// is decoded here.
const normalizeEditorBreaks = content => String(content)
    .replace(/&lt;br\s*\/?&gt;/gi, '<br>');

const applyPreviewHighlights = content => {
    let result = '';
    let inTag = false;
    let quote = null;

    for (let index = 0; index < content.length;) {
        if (content.startsWith(PREVIEW_MARKER_OPEN, index)) {
            const valueStart = index + PREVIEW_MARKER_OPEN.length;
            const valueEnd = content.indexOf(PREVIEW_MARKER_CLOSE, valueStart);
            if (valueEnd < 0) {
                result += content.slice(index);
                break;
            }
            const value = content.slice(valueStart, valueEnd);
            result += inTag ? value : `${PREVIEW_HIGHLIGHT}${value}</span>`;
            index = valueEnd + PREVIEW_MARKER_CLOSE.length;
            continue;
        }

        const character = content[index];
        result += character;
        if (inTag) {
            if (quote) {
                if (character === quote) quote = null;
            } else if (character === '"' || character === "'") {
                quote = character;
            } else if (character === '>') {
                inTag = false;
            }
        } else if (character === '<') {
            inTag = true;
        }
        index += 1;
    }
    return result;
};

const renderHtmlTemplate = (content, values, options = {}) => {
    assertSafeTemplate(content);
    let rendered = String(content || '');
    const renderValue = value => {
        const escaped = escapeHtml(displayValue(value));
        return options.highlightShortcodes
            ? `${PREVIEW_MARKER_OPEN}${escaped}${PREVIEW_MARKER_CLOSE}`
            : escaped;
    };
    // Popup-scoped loops ({{#Field##officials}} … {{/Field##officials}}) are
    // expanded first, against the per-field collections the caller placed in
    // `values` under the "<field>##<type>" key. The generic block pass below
    // never sees them — its identifier class excludes "#".
    rendered = renderScopedLoopBlocks(rendered, values, { renderValue });
    rendered = rendered.replace(
        /\{\{\s*#\s*([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\s*\/\s*\1\s*\}\}/g,
        (match, collectionKey, body) => {
            const collection = values[collectionKey];
            if (!Array.isArray(collection)) throw new Error(`Block value is not a collection: ${collectionKey}`);
            return collection.map(item => body.replace(/\{\{\s*([^{}#\/][^{}]*?)\s*\}\}/g, (token, expression) => {
                const parsed = parseExpression(expression);
                // Resolve against the current row first: try the token as
                // written, then stripped of any "scope##" / domain-root prefix
                // ("all_officials##official_record.name" → "name"). Fall back to
                // the global values only if the row has nothing.
                const rowKey = rowFieldKey(parsed.key);
                const local = getPath(item, parsed.key);
                const rowLocal = local !== undefined ? local : getPath(item, rowKey);
                const value = rowLocal !== undefined ? rowLocal
                    : (values[parsed.key] !== undefined ? values[parsed.key] : values[rowKey]);
                if (value === undefined) {
                    return parsed.formatters.some(isOfficialTypeFormatter) ? '' : token;
                }
                return renderValue(applyFormatters(
                    value,
                    parsed.formatters,
                    formatterContext(parsed.key, values, item)
                ));
            })).join('');
        }
    );
    if (/\{\{\s*[#\/]\s*/.test(rendered)) throw new Error('Unmatched template block');
    rendered = rendered.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (token, expression) => {
        const parsed = parseExpression(expression);
        if (!Object.prototype.hasOwnProperty.call(values, parsed.key)) {
            // Unknown shortcodes normally remain visible so template mistakes
            // can be found. A type-conditioned field is an optional branch,
            // however, and must stay empty when no mapping exists.
            return parsed.formatters.some(isOfficialTypeFormatter) ? '' : token;
        }
        return renderValue(applyFormatters(
            values[parsed.key],
            parsed.formatters,
            formatterContext(parsed.key, values)
        ));
    });
    const highlighted = options.highlightShortcodes ? applyPreviewHighlights(rendered) : rendered;
    return normalizeEditorBreaks(highlighted);
};

module.exports = { escapeHtml, getPath, formatDate, applyFormatters, assertSafeTemplate, renderHtmlTemplate };
