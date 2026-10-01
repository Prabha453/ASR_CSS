'use strict';

const httpStatus = require('http-status');
const { Op } = require('sequelize');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { parseTemplateFields, parseScopedKey } = require('../../domain/formBuilder/templateFieldParser');
const { scopedLoopTemplateKeys } = require('../../domain/formBuilder/scopedLoopBlock');
const { normalizeAliasKey } = require('../../domain/formBuilder/shortcodeDefinition');
const { hashTemplateVersion } = require('../../domain/formBuilder/templateVersionHash');
const { normalizePopupSchema, validatePopupSchema, mergePopupSchemas } = require('../../domain/formBuilder/popupSchema');
const {
    isOfficialTypeFormatter, isSupportedOfficialTypeFormatter,
} = require('../../domain/formBuilder/templateTokens');

const asArray = value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};

const formatArgument = formatter => {
    const index = formatter.indexOf(':');
    return index < 0 ? null : formatter.slice(index + 1).trim();
};

const buildFieldRecord = (parsed, definition = null) => {
    if (!definition) {
        return {
            shortcode_id: null,
            original_key: parsed.key,
            canonical_key: null,
            formatters: parsed.formatters,
            occurrences: parsed.occurrences,
            is_block: parsed.is_block,
            is_required: true,
            validation_status: 'UNKNOWN',
            validation_message: `Unknown shortcode: ${parsed.key}`,
        };
    }
    const allowedFormats = asArray(definition.allowed_formats);
    const invalid = parsed.formatters.filter(formatter => {
        if (isOfficialTypeFormatter(formatter)) {
            return definition.source_domain !== 'OFFICIAL'
                || !isSupportedOfficialTypeFormatter(formatter);
        }
        const format = formatArgument(formatter);
        return format && !allowedFormats.includes(format);
    });
    return {
        shortcode_id: definition.shortcode_id,
        original_key: parsed.key,
        canonical_key: definition.shortcode_key,
        formatters: parsed.formatters,
        occurrences: parsed.occurrences,
        is_block: parsed.is_block,
        is_required: true,
        validation_status: invalid.length ? 'INVALID_FORMAT' : 'VALID',
        validation_message: invalid.length ? `Format not allowed: ${invalid.join(', ')}` : null,
    };
};

const hashField = field => ({
    shortcode_id: field.shortcode_id || null,
    original_key: field.original_key,
    canonical_key: field.canonical_key || null,
    formatters: asArray(field.formatters),
    occurrences: field.occurrences,
    is_block: Boolean(field.is_block),
    is_required: Boolean(field.is_required),
    validation_status: field.validation_status,
});

// Template shortcode fields, minus the popup-scoped loop keys ("field##officials"
// and their inner "field##name" tokens) — those are loop constructs resolved by
// PopupLoopMappingService, not shortcodes, so they must not be flagged unknown.
const shortcodeFields = (content = '') => {
    const loopKeys = scopedLoopTemplateKeys(content);
    return parseTemplateFields(content).filter(field => !loopKeys.has(field.key));
};

const versionSnapshot = (sourceType, content, popupSchema, layout, fields) => ({
    source_type: sourceType,
    content,
    popup_schema: popupSchema,
    layout,
    fields: fields.map(hashField),
});

class FormTemplateVersionService {
    validateContent = async (content = '') => {
        try {
            const models = getCurrentModels();
            const definitions = await models.form_shortcode_definition.findAll({
                where: { is_deleted: false },
                include: [{ model: models.form_shortcode_alias, as: 'aliases', where: { is_deleted: false }, required: false }],
            });
            const byKey = new Map();
            for (const row of definitions) {
                const definition = row.toJSON ? row.toJSON() : row;
                byKey.set(normalizeAliasKey(definition.shortcode_key), { definition, isAlias: false });
                for (const aliasRow of definition.aliases || []) {
                    const alias = aliasRow.toJSON ? aliasRow.toJSON() : aliasRow;
                    byKey.set(normalizeAliasKey(alias.alias_key), { definition, isAlias: true });
                }
            }
            const fields = shortcodeFields(content).map(parsed => {
                // {{<popup field key>##<shortcode>}} — validate the shortcode on
                // the right of ##; the popup field binding is checked elsewhere.
                const { key: lookupKey } = parseScopedKey(parsed.key);
                const match = byKey.get(normalizeAliasKey(lookupKey));
                if (!match) return buildFieldRecord(parsed);
                if (match.definition.status !== 'ACTIVE') {
                    return {
                        ...buildFieldRecord(parsed, match.definition),
                        validation_status: 'RETIRED',
                        validation_message: `Retired shortcode: ${parsed.key}`,
                    };
                }
                const field = buildFieldRecord(parsed, match.definition);
                if (field.validation_status === 'VALID' && match.isAlias) {
                    field.validation_status = 'LEGACY_ALIAS';
                    field.validation_message = `Use canonical shortcode: ${match.definition.shortcode_key}`;
                }
                return field;
            });
            const blockingStatuses = new Set(['UNKNOWN', 'RETIRED', 'INVALID_FORMAT']);
            return responseHandler.returnSuccess(httpStatus.OK, 'Template shortcodes validated', {
                total_fields: fields.length,
                blocking_fields: fields.filter(field => blockingStatuses.has(field.validation_status)).length,
                warning_fields: fields.filter(field => field.validation_status === 'LEGACY_ALIAS').length,
                fields,
            });
        } catch (error) {
            logger.error('Validate template content error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    _definitionsByKey = async (models, transaction) => {
        const rows = await models.form_shortcode_definition.findAll({
            where: { is_deleted: false, status: 'ACTIVE' },
            include: [{ model: models.form_shortcode_alias, as: 'aliases', where: { is_deleted: false }, required: false }],
            transaction,
        });
        const result = new Map();
        for (const row of rows) {
            const definition = row.toJSON ? row.toJSON() : row;
            result.set(normalizeAliasKey(definition.shortcode_key), definition);
            for (const aliasRow of definition.aliases || []) {
                const alias = aliasRow.toJSON ? aliasRow.toJSON() : aliasRow;
                result.set(normalizeAliasKey(alias.alias_key), definition);
            }
        }
        return result;
    };

    createDraft = async (formId, userId = null) => {
        const models = getCurrentModels();
        const transaction = await models.sequelize.transaction();
        try {
            const formRow = await models.form.findOne({
                where: { form_id: formId, is_deleted: false },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!formRow) {
                await transaction.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Form not found');
            }
            const form = formRow.toJSON ? formRow.toJSON() : formRow;
            const latestVersion = Number(await models.form_template_version.max('version_number', {
                where: { form_id: formId }, transaction,
            })) || 0;
            const layout = {
                orientation: form.orientation,
                margin_top: form.margin_top,
                margin_right: form.margin_right,
                margin_bottom: form.margin_bottom,
                margin_left: form.margin_left,
                header_margin: form.header_margin,
                footer_margin: form.footer_margin,
            };
            const popupSchema = normalizePopupSchema(form.popup_fields || []);
            const parsed = shortcodeFields(form.form_content || '');
            const definitions = await this._definitionsByKey(models, transaction);
            const fieldRecords = parsed.map(field => {
                const { key: lookupKey } = parseScopedKey(field.key);
                return buildFieldRecord(
                    field,
                    definitions.get(normalizeAliasKey(lookupKey)) || null
                );
            });
            const snapshot = versionSnapshot('HTML', form.form_content || '', popupSchema, layout, fieldRecords);
            const version = await models.form_template_version.create({
                form_id: formId,
                version_number: latestVersion + 1,
                lifecycle_status: 'DRAFT',
                source_type: 'HTML',
                content_snapshot: form.form_content || '',
                source_doc_id: null,
                popup_schema: popupSchema,
                layout_snapshot: layout,
                content_hash: hashTemplateVersion(snapshot),
                created_by: userId,
                created_at: new Date(),
            }, { transaction });
            if (fieldRecords.length) {
                await models.form_template_version_field.bulkCreate(
                    fieldRecords.map(field => ({ ...field, template_version_id: version.template_version_id })),
                    { transaction }
                );
            }
            await transaction.commit();
            return responseHandler.returnSuccess(httpStatus.CREATED, 'Template draft version created', {
                template_version_id: version.template_version_id,
                version_number: version.version_number,
                content_hash: version.content_hash,
                validation: {
                    total_fields: fieldRecords.length,
                    invalid_fields: fieldRecords.filter(field => field.validation_status !== 'VALID').length,
                    fields: fieldRecords,
                },
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Create template version error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    publish = async (versionId, userId = null) => {
        const models = getCurrentModels();
        const transaction = await models.sequelize.transaction();
        try {
            const version = await models.form_template_version.findOne({
                where: { template_version_id: versionId }, transaction, lock: transaction.LOCK.UPDATE,
            });
            if (!version) {
                await transaction.rollback();
                return responseHandler.returnError(httpStatus.NOT_FOUND, 'Template version not found');
            }
            if (version.lifecycle_status !== 'DRAFT') {
                await transaction.rollback();
                return responseHandler.returnError(httpStatus.CONFLICT, 'Only a draft version can be published');
            }
            const schemaErrors = validatePopupSchema(version.popup_schema || []);
            if (schemaErrors.length) {
                await transaction.rollback();
                return responseHandler.returnError(httpStatus.UNPROCESSABLE_ENTITY, schemaErrors.join('; '));
            }
            await models.form_template_version.update(
                { lifecycle_status: 'RETIRED' },
                { where: { form_id: version.form_id, lifecycle_status: 'PUBLISHED' }, transaction }
            );
            await version.update({
                lifecycle_status: 'PUBLISHED', published_by: userId, published_at: new Date(),
            }, { transaction });
            await transaction.commit();
            return responseHandler.returnSuccess(httpStatus.OK, 'Template version published', {
                template_version_id: version.template_version_id,
                version_number: version.version_number,
                content_hash: version.content_hash,
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Publish template version error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    list = async (formId) => {
        try {
            const models = getCurrentModels();
            const rows = await models.form_template_version.findAll({
                where: { form_id: formId },
                include: [{ model: models.form_template_version_field, as: 'fields' }],
                order: [['version_number', 'DESC']],
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Template versions fetched', rows);
        } catch (error) {
            logger.error('List template versions error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    updatePopupSchema = async (versionId, schema) => {
        try {
            const models = getCurrentModels();
            const version = await models.form_template_version.findOne({
                where: { template_version_id: versionId },
            });
            if (!version) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Template version not found');
            if (version.lifecycle_status !== 'DRAFT') {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Published template schemas are immutable');
            }
            const normalized = normalizePopupSchema(schema);
            const errors = validatePopupSchema(normalized);
            if (errors.length) {
                return responseHandler.returnError(httpStatus.UNPROCESSABLE_ENTITY, errors.join('; '));
            }
            const fieldRows = await models.form_template_version_field.findAll({
                where: { template_version_id: versionId },
            });
            const fields = fieldRows.map(row => row.toJSON ? row.toJSON() : row);
            const contentHash = hashTemplateVersion(versionSnapshot(
                version.source_type,
                version.content_snapshot || '',
                normalized,
                version.layout_snapshot,
                fields
            ));
            await version.update({ popup_schema: normalized, content_hash: contentHash });
            return responseHandler.returnSuccess(httpStatus.OK, 'Template popup schema updated', {
                template_version_id: version.template_version_id,
                popup_schema: normalized,
                content_hash: contentHash,
            });
        } catch (error) {
            logger.error('Update template popup schema error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    getPublishedPopupSchema = async (formId) => {
        try {
            const models = getCurrentModels();
            const version = await models.form.findOne({
                where: { form_id: formId, is_deleted: false },
                attributes: ['form_id', 'popup_fields'],
            });
            if (!version) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Form not found');
            return responseHandler.returnSuccess(httpStatus.OK, 'Published popup schema fetched', {
                form_id: version.form_id, popup_schema: normalizePopupSchema(version.popup_fields || []),
            });
        } catch (error) {
            logger.error('Get published popup schema error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    getMergedPublishedPopupSchema = async formIds => {
        try {
            const models = getCurrentModels();
            const uniqueIds = [...new Set(formIds.map(Number))];
            const rows = await models.form.findAll({
                where: { form_id: { [Op.in]: uniqueIds }, is_deleted: false },
                attributes: ['form_id', 'popup_fields'],
            });
            const versions = rows.map(row => row.toJSON ? row.toJSON() : row);
            const found = new Set(versions.map(version => Number(version.form_id)));
            const missing = uniqueIds.filter(id => !found.has(id));
            if (missing.length) {
                return responseHandler.returnError(httpStatus.NOT_FOUND, `Published template version not found for form(s): ${missing.join(', ')}`);
            }
            const merged = mergePopupSchemas(versions.map(version => ({ form_id: version.form_id, schema: version.popup_fields })));
            if (merged.conflicts.length) {
                return responseHandler.returnError(httpStatus.CONFLICT, merged.conflicts.join('; '));
            }
            return responseHandler.returnSuccess(httpStatus.OK, 'Published popup schemas merged', {
                forms: versions.map(({ form_id }) => ({ form_id })),
                popup_schema: merged.schema,
            });
        } catch (error) {
            logger.error('Merge published popup schemas error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

FormTemplateVersionService.asArray = asArray;
FormTemplateVersionService.buildFieldRecord = buildFieldRecord;
FormTemplateVersionService.shortcodeFields = shortcodeFields;
FormTemplateVersionService.versionSnapshot = versionSnapshot;

module.exports = FormTemplateVersionService;
