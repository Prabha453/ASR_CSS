'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { normalizePopupSchema } = require('../../domain/formBuilder/popupSchema');
const FormPopupOptionService = require('./FormPopupOptionService');

const hasValue = value => value !== null && value !== undefined && value !== '' &&
    (!Array.isArray(value) || value.length > 0);
const valuesArray = value => Array.isArray(value) ? value : [value];
const comparable = value => String(value);

const validateLocalValue = (field, value) => {
    if (!hasValue(value)) return null;
    if (field.multiple && !Array.isArray(value)) return 'Multiple selections must be an array';
    if (!field.multiple && Array.isArray(value)) return 'Only one selection is allowed';
    const values = valuesArray(value);
    if (field.control_type === 'NUMBER' && values.some(item => !Number.isFinite(Number(item)))) return 'A valid number is required';
    if (field.control_type === 'DATE' && values.some(item => !/^\d{4}-\d{2}-\d{2}$/.test(String(item)))) {
        return 'A date in YYYY-MM-DD format is required';
    }
    if ((field.control_type === 'SELECT' || field.control_type === 'MULTISELECT') && field.options.length) {
        const allowed = new Set(field.options.map(option => comparable(option.value)));
        if (values.some(item => !allowed.has(comparable(item)))) return 'Selection is not in the published option list';
    }
    return null;
};

class FormPopupSubmissionService {
    constructor(models = null) {
        this.models = models;
        this.optionService = new FormPopupOptionService(models);
    }
    _models = () => this.models || getCurrentModels();

    validateVersion = async (version, entityId, values = {}) => {
        const fields = normalizePopupSchema(version.popup_schema || []).flatMap(section => section.fields);
        const knownKeys = new Set(fields.map(field => field.field_key));
        const errors = [];
        for (const key of Object.keys(values)) {
            if (!knownKeys.has(key)) errors.push({ field_key: key, code: 'UNKNOWN_FIELD', message: 'Field is not in the published schema' });
        }
        for (const field of fields) {
            const value = values[field.field_key];
            if (field.required && field.value_source !== 'COMPANY' && !hasValue(value)) {
                errors.push({ field_key: field.field_key, code: 'REQUIRED', message: 'A value is required' });
                continue;
            }
            if (!hasValue(value)) continue;
            const missingParent = field.depends_on.find(key => !hasValue(values[key]));
            if (missingParent) {
                errors.push({ field_key: field.field_key, code: 'MISSING_DEPENDENCY', message: `Select ${missingParent} first` });
                continue;
            }
            const localError = validateLocalValue(field, value);
            if (localError) {
                errors.push({ field_key: field.field_key, code: 'INVALID_VALUE', message: localError });
                continue;
            }
            if (['OFFICIALS', 'OFFICIAL_RECORDS', 'SHAREHOLDERS', 'EVENT', 'COMPLAINANT', 'SHARES', 'ALLOTMENTS', 'SHARE_TRANSACTIONS'].includes(field.value_source)) {
                const parentValue = field.depends_on.length ? values[field.depends_on[0]] : null;
                const resolved = await this.optionService.resolveForField(field, entityId, parentValue);
                if (resolved.error) {
                    errors.push({ field_key: field.field_key, code: 'INVALID_DEPENDENCY', message: resolved.error });
                    continue;
                }
                const allowed = new Set(resolved.options.map(option => comparable(option.value)));
                if (valuesArray(value).some(item => !allowed.has(comparable(item)))) {
                    errors.push({ field_key: field.field_key, code: 'STALE_OR_UNAUTHORIZED', message: 'Selection is stale or not authorized for this company' });
                }
            }
        }
        return { valid: errors.length === 0, errors };
    };

    validate = async (formId, entityId, values = {}) => {
        try {
            const models = this._models();
            const entity = await models.entities.findOne({
                where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false },
            });
            if (!entity) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company not found');
            const versionRow = await models.form_template_version.findOne({
                where: { form_id: formId, lifecycle_status: 'PUBLISHED' },
                order: [['version_number', 'DESC']],
            });
            if (!versionRow) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Published template version not found');
            const version = versionRow.toJSON ? versionRow.toJSON() : versionRow;
            const validation = await this.validateVersion(version, entityId, values);
            return responseHandler.returnSuccess(httpStatus.OK, 'Popup submission validated', {
                template_version_id: version.template_version_id,
                content_hash: version.content_hash,
                ...validation,
            });
        } catch (error) {
            logger.error('Popup submission validation error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

FormPopupSubmissionService.hasValue = hasValue;
FormPopupSubmissionService.validateLocalValue = validateLocalValue;

module.exports = FormPopupSubmissionService;
