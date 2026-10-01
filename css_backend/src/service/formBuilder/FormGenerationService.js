'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { hashTemplateVersion } = require('../../domain/formBuilder/templateVersionHash');
const { normalizePopupSchema } = require('../../domain/formBuilder/popupSchema');
const FormPopupSubmissionService = require('./FormPopupSubmissionService');
const FormPopupOptionService = require('./FormPopupOptionService');
const ShortcodeResolverService = require('./ShortcodeResolverService');
const PopupLoopMappingService = require('./PopupLoopMappingService');
const { parseScopedKey, SCOPE_SEPARATOR } = require('../../domain/formBuilder/templateFieldParser');

const plain = row => row?.toJSON ? row.toJSON() : row;
const asValues = value => Array.isArray(value) ? value : [value];

class FormGenerationService {
    constructor(models = null) { this.models = models; }
    _models = () => this.models || getCurrentModels();
    _resolver = models => new ShortcodeResolverService(models);

    _resolveShortcodes = async (models, versionFields, {
        entityId,
        eventId = null,
        allotmentId = null,
        shareTransactionId = null,
        officialRecordId = null,
        shareId = null,
        popupFields = [],
        popupValues = {},
        formId = null,
        templateVersionId = null,
    }) => {
        const resolver = this._resolver(models);
        const results = new Array(versionFields.length);
        const plainEntries = [];
        const scopedEntries = new Map();

        versionFields.forEach((field, index) => {
            const parsed = parseScopedKey(field.original_key);
            const entry = { field, index, lookupKey: parsed.key };
            if (!parsed.scope) {
                plainEntries.push(entry);
                return;
            }
            if (!scopedEntries.has(parsed.scope)) scopedEntries.set(parsed.scope, []);
            scopedEntries.get(parsed.scope).push(entry);
        });

        if (plainEntries.length) {
            const resolved = await resolver.resolve(plainEntries.map(entry => entry.lookupKey), {
                entityId,
                eventId,
                allotmentId,
                shareTransactionId,
                officialRecordId,
                shareId,
                popupFields,
                popupValues,
                formId,
                templateVersionId,
            });
            resolved.forEach((result, index) => {
                results[plainEntries[index].index] = result;
            });
        }

        const slotBySource = {
            OFFICIAL_RECORDS: 'officialRecordId',
            OFFICIALS: 'officialRecordId',
            SHAREHOLDERS: 'officialRecordId',
            EVENT: 'eventId',
            COMPLAINANT: 'eventId',
            ALLOTMENTS: 'allotmentId',
            SHARE_TRANSACTIONS: 'shareTransactionId',
            SHARES: 'shareId',
        };
        await Promise.all([...scopedEntries.entries()].map(async ([scopeKey, entries]) => {
            const popupField = popupFields.find(field => field.field_key === scopeKey) || null;
            const rawSelection = popupValues[scopeKey];
            const selectedId = Array.isArray(rawSelection) ? rawSelection[0] : rawSelection;
            const options = {
                entityId,
                popupFields,
                popupValues,
                formId,
                templateVersionId,
                scopeKey,
                popupField,
                selectedValue: rawSelection,
            };
            const slot = popupField && slotBySource[popupField.value_source];
            if (slot && selectedId !== undefined && selectedId !== null && selectedId !== '') {
                options[slot] = selectedId;
            }
            const scoped = await resolver.resolve(entries.map(entry => entry.lookupKey), options);
            scoped.forEach((result, index) => {
                const entry = entries[index];
                results[entry.index] = {
                    ...result,
                    requested_key: entry.field.original_key,
                    canonical_key: result.canonical_key
                        ? `${scopeKey}${SCOPE_SEPARATOR}${result.canonical_key}`
                        : null,
                };
            });
        }));

        return results.filter(Boolean);
    };

    _popupSnapshot = async (models, version, entityId, values) => {
        const optionService = new FormPopupOptionService(models);
        const fields = normalizePopupSchema(version.popup_schema || []).flatMap(section => section.fields);
        const snapshot = {};
        for (const field of fields) {
            if (!Object.prototype.hasOwnProperty.call(values, field.field_key)) continue;
            const value = values[field.field_key];
            if (['OFFICIALS', 'OFFICIAL_RECORDS', 'SHAREHOLDERS', 'EVENT', 'COMPLAINANT', 'SHARES', 'ALLOTMENTS', 'SHARE_TRANSACTIONS'].includes(field.value_source)) {
                const parentValue = field.depends_on?.[0] ? values[field.depends_on[0]] : null;
                const resolved = await optionService.resolveForField(field, entityId, parentValue);
                const selected = (resolved.options || []).filter(option =>
                    asValues(value).map(String).includes(String(option.value))
                );
                snapshot[field.field_key] = { value, selected };
            } else {
                snapshot[field.field_key] = { value };
            }
        }
        return snapshot;
    };

    create = async (formId, payload, idempotencyKey, userId = null) => {
        try {
            const models = this._models();
            const versionRow = await models.form_template_version.findOne({
                where: { form_id: formId, lifecycle_status: 'PUBLISHED' },
                include: [{ model: models.form_template_version_field, as: 'fields' }],
                order: [['version_number', 'DESC']],
            });
            if (!versionRow) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Published template version not found');
            const version = plain(versionRow);
            const entity = await models.entities.findOne({
                where: { entity_id: payload.entity_id, entity_type: 'COMPANY', is_deleted: false },
            });
            if (!entity) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Company not found');

            const selectionSnapshot = payload.popup_values || {};
            const popupFields = normalizePopupSchema(version.popup_schema || []).flatMap(section => section.fields);
            const eventField = popupFields.find(field => ['EVENT', 'COMPLAINANT'].includes(field.value_source));
            const allotmentField = popupFields.find(field => field.value_source === 'ALLOTMENTS');
            const shareTransactionField = popupFields.find(field => field.value_source === 'SHARE_TRANSACTIONS');
            const officialRecordField = popupFields.find(field => (
                ['OFFICIAL_RECORDS', 'OFFICIALS', 'SHAREHOLDERS'].includes(field.value_source)
            ));
            const shareField = popupFields.find(field => field.value_source === 'SHARES');
            const selectedEventValue = eventField ? selectionSnapshot[eventField.field_key] : null;
            const effectiveEventId = payload.company_event_id ||
                (Array.isArray(selectedEventValue) ? selectedEventValue[0] : selectedEventValue) || null;
            const selectedAllotmentValue = allotmentField ? selectionSnapshot[allotmentField.field_key] : null;
            const effectiveAllotmentId = Array.isArray(selectedAllotmentValue)
                ? selectedAllotmentValue[0]
                : selectedAllotmentValue || null;
            const selectedShareTransactionValue = shareTransactionField
                ? selectionSnapshot[shareTransactionField.field_key]
                : null;
            const effectiveShareTransactionId = Array.isArray(selectedShareTransactionValue)
                ? selectedShareTransactionValue[0]
                : selectedShareTransactionValue || null;
            const selectedOfficialRecordValue = officialRecordField
                ? selectionSnapshot[officialRecordField.field_key]
                : null;
            const effectiveOfficialRecordId = Array.isArray(selectedOfficialRecordValue)
                ? selectedOfficialRecordValue[0]
                : selectedOfficialRecordValue || null;
            const selectedShareValue = shareField ? selectionSnapshot[shareField.field_key] : null;
            const effectiveShareId = Array.isArray(selectedShareValue)
                ? selectedShareValue[0]
                : selectedShareValue || null;
            const requestHash = hashTemplateVersion({
                form_id: Number(formId),
                template_version_id: version.template_version_id,
                template_content_hash: version.content_hash,
                entity_id: payload.entity_id,
                company_event_id: effectiveEventId,
                popup_values: selectionSnapshot,
            });
            const existing = await models.form_generation_run.findOne({ where: { idempotency_key: idempotencyKey } });
            if (existing) {
                if (existing.request_hash !== requestHash) {
                    return responseHandler.returnError(httpStatus.CONFLICT, 'Idempotency key was already used for a different request');
                }
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing generation run returned', existing);
            }

            const submission = new FormPopupSubmissionService(models);
            const validation = await submission.validateVersion(version, payload.entity_id, selectionSnapshot);
            if (!validation.valid) {
                return responseHandler.returnError(
                    httpStatus.UNPROCESSABLE_ENTITY,
                    validation.errors.map(error => `${error.field_key}: ${error.message}`).join('; ')
                );
            }
            const versionFields = (version.fields || []).map(plain).sort(
                (left, right) => Number(left.version_field_id) - Number(right.version_field_id)
            );
            const shortcodeResults = await this._resolveShortcodes(models, versionFields, {
                entityId: payload.entity_id,
                eventId: effectiveEventId,
                allotmentId: effectiveAllotmentId,
                shareTransactionId: effectiveShareTransactionId,
                officialRecordId: effectiveOfficialRecordId,
                shareId: effectiveShareId,
                popupValues: selectionSnapshot,
                popupFields,
                formId: Number(formId),
                templateVersionId: version.template_version_id,
            });
            const popupSnapshot = await this._popupSnapshot(models, version, payload.entity_id, selectionSnapshot);
            // Popup-scoped loops: freeze each block's selected records (mapped,
            // in pick order) into the run so the DOCX/PDF render is reproducible
            // without re-reading master data.
            const loopSnapshot = await new PopupLoopMappingService(models).buildLoopValues(
                version.content_snapshot || '',
                { entityId: payload.entity_id, popupFields, popupValues: selectionSnapshot }
            );
            const now = new Date();
            let run;
            try {
                run = await models.form_generation_run.create({
                    idempotency_key: idempotencyKey,
                    request_hash: requestHash,
                    form_id: formId,
                    template_version_id: version.template_version_id,
                    entity_id: payload.entity_id,
                    lifecycle_status: 'READY',
                    template_content_hash: version.content_hash,
                    selection_snapshot: selectionSnapshot,
                    resolved_snapshot: { shortcodes: shortcodeResults, popup: popupSnapshot, loops: loopSnapshot },
                    popup_schema_snapshot: normalizePopupSchema(version.popup_schema || []),
                    template_content_snapshot: version.content_snapshot,
                    layout_snapshot: version.layout_snapshot,
                    template_fields_snapshot: versionFields,
                    created_by: userId,
                    created_at: now,
                    updated_at: now,
                });
            } catch (error) {
                if (error.name !== 'SequelizeUniqueConstraintError') throw error;
                run = await models.form_generation_run.findOne({ where: { idempotency_key: idempotencyKey } });
                if (!run || run.request_hash !== requestHash) {
                    return responseHandler.returnError(httpStatus.CONFLICT, 'Idempotency key collision');
                }
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing generation run returned', run);
            }
            return responseHandler.returnSuccess(httpStatus.CREATED, 'Generation run prepared', run);
        } catch (error) {
            logger.error('Create generation run error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    get = async generationRunId => {
        try {
            const row = await this._models().form_generation_run.findOne({
                where: { generation_run_id: generationRunId },
            });
            if (!row) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Generation run not found');
            return responseHandler.returnSuccess(httpStatus.OK, 'Generation run fetched', row);
        } catch (error) {
            logger.error('Get generation run error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    regenerate = async (generationRunId, idempotencyKey, userId = null) => {
        try {
            const models = this._models();
            const sourceRow = await models.form_generation_run.findOne({
                where: { generation_run_id: generationRunId },
            });
            if (!sourceRow) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Source generation run not found');
            const source = plain(sourceRow);
            if (!source.template_content_snapshot || !source.template_fields_snapshot || !source.resolved_snapshot) {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Source run does not contain a complete immutable snapshot');
            }
            const requestHash = hashTemplateVersion({
                operation: 'REGENERATE_FROM_SNAPSHOT',
                source_generation_run_id: Number(generationRunId),
                source_request_hash: source.request_hash,
            });
            const existing = await models.form_generation_run.findOne({ where: { idempotency_key: idempotencyKey } });
            if (existing) {
                if (existing.request_hash !== requestHash) {
                    return responseHandler.returnError(httpStatus.CONFLICT, 'Idempotency key was already used for a different request');
                }
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing regenerated run returned', existing);
            }
            const now = new Date();
            let run;
            try {
                run = await models.form_generation_run.create({
                    idempotency_key: idempotencyKey,
                    request_hash: requestHash,
                    form_id: source.form_id,
                    template_version_id: source.template_version_id,
                    entity_id: source.entity_id,
                    source_generation_run_id: source.generation_run_id,
                    lifecycle_status: 'READY',
                    template_content_hash: source.template_content_hash,
                    selection_snapshot: source.selection_snapshot,
                    resolved_snapshot: source.resolved_snapshot,
                    popup_schema_snapshot: source.popup_schema_snapshot,
                    template_content_snapshot: source.template_content_snapshot,
                    layout_snapshot: source.layout_snapshot,
                    template_fields_snapshot: source.template_fields_snapshot,
                    created_by: userId,
                    created_at: now,
                    updated_at: now,
                });
            } catch (error) {
                if (error.name !== 'SequelizeUniqueConstraintError') throw error;
                run = await models.form_generation_run.findOne({ where: { idempotency_key: idempotencyKey } });
                if (!run || run.request_hash !== requestHash) {
                    return responseHandler.returnError(httpStatus.CONFLICT, 'Idempotency key collision');
                }
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing regenerated run returned', run);
            }
            return responseHandler.returnSuccess(httpStatus.CREATED, 'Generation run recreated from immutable snapshot', run);
        } catch (error) {
            logger.error('Regenerate generation run error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };

    list = async formId => {
        try {
            const models = this._models();
            const rows = await models.form_generation_run.findAll({
                where: { form_id: formId },
                attributes: [
                    'generation_run_id', 'form_id', 'template_version_id', 'entity_id',
                    'source_generation_run_id',
                    'lifecycle_status', 'template_content_hash', 'failure_code', 'failure_message',
                    'created_by', 'created_at', 'updated_at', 'completed_at',
                ],
                include: [{
                    model: models.form_generation_artifact,
                    as: 'artifacts',
                    attributes: [
                        'generation_artifact_id', 'artifact_type', 'content_hash',
                        'document_store_id', 'file_size_bytes', 'created_at',
                    ],
                    include: [{
                        model: models.document_store,
                        as: 'document',
                        attributes: ['doc_id', 'doc_name', 'mime_type', 'file_size_kb'],
                        where: { is_deleted: false },
                        required: false,
                    }],
                    required: false,
                }],
                order: [['created_at', 'DESC']],
                limit: 100,
            });
            return responseHandler.returnSuccess(httpStatus.OK, 'Generation runs fetched', rows);
        } catch (error) {
            logger.error('List generation runs error:', error);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

module.exports = FormGenerationService;
