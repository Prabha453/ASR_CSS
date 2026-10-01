'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const { parseTemplateFields, parseScopedKey, SCOPE_SEPARATOR } = require('../../domain/formBuilder/templateFieldParser');
const { renderHtmlTemplate } = require('../../domain/formBuilder/htmlTemplateRenderer');
const { renderDocxBuffer } = require('../../domain/formBuilder/docxRenderer');
const { buildPrintableHtml, renderPdfBuffer } = require('./PdfBrowserAdapter');
const { normalizePopupSchema } = require('../../domain/formBuilder/popupSchema');
const ShortcodeResolverService = require('./ShortcodeResolverService');
const PopupLoopMappingService = require('./PopupLoopMappingService');
const FormPopupOptionService = require('./FormPopupOptionService');
const JSZip = require('jszip');

const plain = row => row?.toJSON ? row.toJSON() : row;
const arrayValue = value => Array.isArray(value) ? value : [value];
const addSelectionContext = (values, token, result) => {
    const officialType = result.selection_context?.official_type;
    if (!officialType) return;
    const { scope } = parseScopedKey(token);
    values[scope ? `${scope}${SCOPE_SEPARATOR}official_type` : 'official_record.official_type'] = officialType;
};

class DirectFormRenderService {
    constructor(models = null) { this.models = models; }

    render = async (formId, payload, format) => {
        const models = this.models || getCurrentModels();
        const form = plain(await models.form.findOne({
            where: { form_id: formId, is_deleted: false },
        }));
        if (!form) {
            const error = new Error('Form not found');
            error.statusCode = httpStatus.NOT_FOUND;
            throw error;
        }
        const entity = await models.entities.findOne({
            where: { entity_id: payload.entity_id, entity_type: 'COMPANY', is_deleted: false },
        });
        if (!entity) {
            const error = new Error('Company not found');
            error.statusCode = httpStatus.NOT_FOUND;
            throw error;
        }

        const popupValues = payload.popup_values || {};
        const popupFields = normalizePopupSchema(form.popup_fields || []).flatMap(section => section.fields || []);
        const sourceId = (...sources) => {
            for (const field of popupFields) {
                if (!sources.includes(field.value_source)) continue;
                const value = popupValues[field.field_key];
                const single = Array.isArray(value) ? value[0] : value;
                if (single !== undefined && single !== null && single !== '') return single;
            }
            return null;
        };
        // Split template keys into ordinary shortcodes and field-scoped ones
        // ({{<popup field key>##<shortcode>}}). Scoped keys are grouped by the
        // popup field they bind to so each is resolved against that field's own
        // selected record.
        const plainKeys = [];
        const scopedByField = new Map();
        for (const { key: rawKey, is_block } of parseTemplateFields(form.form_content || '')) {
            // {{#Field##officials}} … {{/…}} is a popup-scoped loop, handled
            // separately by PopupLoopMappingService — not a field-scoped token.
            if (is_block && rawKey.includes(SCOPE_SEPARATOR)) continue;
            const { scope, key } = parseScopedKey(rawKey);
            if (!scope) { plainKeys.push(rawKey); continue; }
            if (!scopedByField.has(scope)) scopedByField.set(scope, new Set());
            scopedByField.get(scope).add(key);
        }

        const resolverService = new ShortcodeResolverService(models);
        const resolved = await resolverService.resolve(plainKeys, {
            entityId: payload.entity_id,
            // COMPLAINANT is the builder's label for the company-event source.
            eventId: payload.company_event_id || sourceId('EVENT', 'COMPLAINANT'),
            allotmentId: sourceId('ALLOTMENTS'),
            shareTransactionId: sourceId('SHARE_TRANSACTIONS'),
            officialRecordId: sourceId('OFFICIAL_RECORDS'),
            shareId: sourceId('SHARES'),
            now: new Date(),
            popupValues,
            popupFields,
            formId: form.form_id,
            form,
        });
        const values = {};
        resolved.forEach(item => {
            addSelectionContext(values, item.requested_key, item);
            if (item.resolved) {
                values[item.requested_key] = item.value;
                if (item.canonical_key) values[item.canonical_key] = item.value;
            } else if (item.canonical_key) {
                // Known shortcode, but no value for this company / selection. Emit an
                // empty string so the document reads cleanly instead of leaving the
                // literal {{token}} behind. Truly unknown keys (canonical_key === null)
                // are left untouched so template typos stay visible.
                values[item.requested_key] = '';
                values[item.canonical_key] = '';
            }
        });

        // Field-scoped shortcodes: resolve each group against the record picked
        // in its own popup field. The popup field's data source decides which
        // resolver context slot the selection feeds.
        const SCOPE_SLOT_BY_SOURCE = {
            OFFICIAL_RECORDS: 'officialRecordId',
            OFFICIALS: 'officialRecordId',
            SHAREHOLDERS: 'officialRecordId',
            EVENT: 'eventId',
            COMPLAINANT: 'eventId',
            ALLOTMENTS: 'allotmentId',
            SHARE_TRANSACTIONS: 'shareTransactionId',
            SHARES: 'shareId',
        };
        for (const [scopeKey, rhsKeys] of scopedByField) {
            const field = popupFields.find(item => item.field_key === scopeKey);
            const slot = field && SCOPE_SLOT_BY_SOURCE[field.value_source];
            const rawSelection = popupValues[scopeKey];
            const selectedId = Array.isArray(rawSelection) ? rawSelection[0] : rawSelection;
            const context = {
                entityId: payload.entity_id,
                now: new Date(),
                popupValues,
                popupFields,
                formId: form.form_id,
                form,
                scopeKey,
                selectedValue: rawSelection,
                popupField: field || null,
            };
            if (slot && selectedId !== undefined && selectedId !== null && selectedId !== '') {
                context[slot] = selectedId;
            }
            const scopedResults = await resolverService.resolve([...rhsKeys], context);
            scopedResults.forEach(item => {
                const token = `${scopeKey}${SCOPE_SEPARATOR}${item.requested_key}`;
                addSelectionContext(values, token, item);
                if (item.resolved) values[token] = item.value;
                else if (item.canonical_key) values[token] = '';
                // Unknown right-hand key (canonical_key === null) is left literal.
            });
        }
        const optionService = new FormPopupOptionService(models);
        const todayIso = new Date().toISOString().slice(0, 10);
        for (const field of popupFields) {
            const hasSubmitted = Object.prototype.hasOwnProperty.call(popupValues, field.field_key);
            // DATES is a "Blank / Today's Date" choice. Fall back to the builder
            // default when the client omits the field entirely.
            if (field.value_source === 'DATES') {
                const submitted = hasSubmitted ? popupValues[field.field_key] : field.source_filter_1;
                const wantsToday = submitted === 'today' || submitted === todayIso;
                const display = wantsToday ? todayIso : '';
                values[field.field_key] = display;
                continue;
            }
            if (!hasSubmitted) continue;
            const raw = popupValues[field.field_key];
            let display = raw;
            if (['OFFICIALS', 'OFFICIAL_RECORDS', 'SHAREHOLDERS', 'EVENT', 'COMPLAINANT', 'SHARES', 'ALLOTMENTS', 'SHARE_TRANSACTIONS'].includes(field.value_source)) {
                const parent = field.depends_on?.[0] ? popupValues[field.depends_on[0]] : null;
                const result = await optionService.resolveForField(field, payload.entity_id, parent);
                const selected = (result.options || []).filter(option => arrayValue(raw).map(String).includes(String(option.value)));
                display = Array.isArray(raw) ? selected.map(option => option.label) : selected[0]?.label || raw;
                const officialType = selected[0]?.meta?.official_type;
                if (officialType) values[`${field.field_key}${SCOPE_SEPARATOR}official_type`] = officialType;
            }
            values[field.field_key] = display;
        }
        // Popup-scoped loops: {{#<field>##officials|events|shares}} … {{/…}}.
        // Each block iterates the records its own popup section selected, in the
        // user's pick order, mapped through the existing per-domain logic.
        const loopValues = await new PopupLoopMappingService(models).buildLoopValues(
            form.form_content || '',
            { entityId: payload.entity_id, popupFields, popupValues }
        );
        Object.assign(values, loopValues);
        const upper = String(format).toUpperCase();
        // Yellow merge-field highlighting is a preview aid only. PDF and DOCX
        // continue through the normal renderer without preview markup.
        const html = renderHtmlTemplate(form.form_content || '', values, {
            highlightShortcodes: upper === 'HTML',
        });
        const layout = {
            orientation: form.orientation,
            margin_top: form.margin_top, margin_right: form.margin_right,
            margin_bottom: form.margin_bottom, margin_left: form.margin_left,
            header_margin: form.header_margin, footer_margin: form.footer_margin,
        };
        if (upper === 'HTML') {
            return {
                html: buildPrintableHtml(html, layout),
                mimeType: 'text/html; charset=utf-8',
            };
        }
        const rendered = upper === 'PDF' ? await renderPdfBuffer(html, layout) : await renderDocxBuffer(html, layout);
        const buffer = Buffer.isBuffer(rendered) ? rendered : Buffer.from(rendered);
        if (upper === 'DOCX') {
            const archive = await JSZip.loadAsync(buffer);
            if (!archive.file('[Content_Types].xml') || !archive.file('word/document.xml')) {
                throw new Error('DOCX conversion produced an invalid document package');
            }
        }
        const extension = upper.toLowerCase();
        return {
            buffer,
            fileName: `${form.download_name || form.form_name || `form_${formId}`}.${extension}`,
            mimeType: upper === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
    };
}

module.exports = DirectFormRenderService;
