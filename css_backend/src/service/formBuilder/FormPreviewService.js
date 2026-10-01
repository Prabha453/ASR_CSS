'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const ShortcodeResolverService = require('./ShortcodeResolverService');
const { parseTemplateFields, hasUsableValue } = require('../../domain/formBuilder/templateFieldParser');
const { scopedLoopTemplateKeys } = require('../../domain/formBuilder/scopedLoopBlock');
const FormPopupSubmissionService = require('./FormPopupSubmissionService');

const formatterFormat = formatter => {
    const separator = formatter.indexOf(':');
    return separator < 0 ? null : formatter.slice(separator + 1).trim();
};

class FormPreviewService {
    _loadTemplate = async (models, formId, source) => {
        const form = await models.form.findOne({
            where: { form_id: formId, is_deleted: false, status: true },
        });
        if (!form) return { error: responseHandler.returnError(httpStatus.NOT_FOUND, 'Form not found') };

        const plainForm = form.toJSON ? form.toJSON() : form;
        if (source === 'DRAFT') {
            return {
                form: plainForm,
                content: plainForm.form_content || '',
                version: null,
            };
        }

        const versionRow = await models.form_template_version.findOne({
            where: { form_id: formId, lifecycle_status: 'PUBLISHED' },
            order: [['version_number', 'DESC']],
        });
        if (!versionRow) {
            return {
                error: responseHandler.returnError(
                    httpStatus.CONFLICT,
                    'Form has no published template version'
                ),
            };
        }
        const version = versionRow.toJSON ? versionRow.toJSON() : versionRow;
        return { form: plainForm, content: version.content_snapshot || '', version };
    };

    preview = async (formId, context = {}, options = {}) => {
        try {
            const models = getCurrentModels();
            const source = options.source === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
            const template = await this._loadTemplate(models, formId, source);
            if (template.error) return template.error;

            const plainForm = template.form;
            // Popup-scoped loop keys ("field##officials" + inner "field##name")
            // are not shortcodes — they render from the popup selection, so they
            // never count towards preview readiness.
            const loopKeys = scopedLoopTemplateKeys(template.content);
            const parsedFields = parseTemplateFields(template.content)
                .filter(field => !loopKeys.has(field.key));
            const resolver = new ShortcodeResolverService(models);
            const resolvedFields = await resolver.resolve(
                parsedFields.map(field => field.key),
                {
                    entityId: context.entity_id,
                    eventId: context.company_event_id || null,
                    now: context.now || new Date(),
                    popupValues: context.popup_values || {},
                    formId: Number(formId),
                }
            );

            const parsedByKey = new Map(parsedFields.map(field => [field.key, field]));
            const fields = resolvedFields.map(result => {
                const parsed = parsedByKey.get(result.requested_key);
                const invalidFormats = (parsed?.formatters || [])
                    .map(formatter => ({ formatter, format: formatterFormat(formatter) }))
                    .filter(item => item.format && !result.allowed_formats?.includes(item.format))
                    .map(item => item.formatter);
                const valueReady = result.resolved && hasUsableValue(result.value);
                let reason = result.reason || null;
                if (result.resolved && !valueReady) reason = 'VALUE_NOT_FOUND';
                if (invalidFormats.length) reason = 'FORMAT_NOT_ALLOWED';
                return {
                    ...result,
                    occurrences: parsed?.occurrences || 0,
                    formatters: parsed?.formatters || [],
                    invalid_formatters: invalidFormats,
                    required: true,
                    ready: valueReady && invalidFormats.length === 0,
                    reason,
                };
            });
            const blocking = fields.filter(field => !field.ready);
            const popupValidation = template.version
                ? await new FormPopupSubmissionService(models).validateVersion(
                    template.version,
                    context.entity_id,
                    context.popup_values || {}
                )
                : { valid: true, errors: [] };

            return responseHandler.returnSuccess(httpStatus.OK, 'Form preview readiness calculated', {
                form: {
                    form_id: plainForm.form_id,
                    form_name: plainForm.form_name,
                    template_id: plainForm.template_id,
                },
                template: {
                    source,
                    template_version_id: template.version?.template_version_id || null,
                    version_number: template.version?.version_number || null,
                    content_hash: template.version?.content_hash || null,
                },
                context: {
                    entity_id: context.entity_id,
                    company_event_id: context.company_event_id || null,
                },
                ready: blocking.length === 0 && popupValidation.valid,
                summary: {
                    total_fields: fields.length,
                    ready_fields: fields.length - blocking.length,
                    blocking_fields: blocking.length,
                    popup_errors: popupValidation.errors.length,
                },
                fields,
                popup_validation: popupValidation,
            });
        } catch (error) {
            logger.error('Form preview error:', error);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                error.message || 'Error calculating form preview'
            );
        }
    };

    previewDraft = async (formId, context = {}) => this.preview(formId, context, { source: 'DRAFT' });
}

FormPreviewService.formatterFormat = formatterFormat;

module.exports = FormPreviewService;
