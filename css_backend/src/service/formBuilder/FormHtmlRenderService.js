'use strict';

const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { hashTemplateVersion } = require('../../domain/formBuilder/templateVersionHash');
const { renderHtmlTemplate } = require('../../domain/formBuilder/htmlTemplateRenderer');
const { parseScopedKey, SCOPE_SEPARATOR } = require('../../domain/formBuilder/templateFieldParser');
const FormTemplateVersionService = require('./FormTemplateVersionService');

const parseJson = value => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch (error) { return value; }
};

const buildRenderValues = resolvedSnapshot => {
    const snapshot = parseJson(resolvedSnapshot) || {};
    const values = {};
    for (const result of snapshot.shortcodes || []) {
        const officialType = result.selection_context?.official_type;
        if (officialType) {
            const { scope } = parseScopedKey(result.requested_key);
            values[scope
                ? `${scope}${SCOPE_SEPARATOR}official_type`
                : 'official_record.official_type'] = officialType;
        }
        if (result.resolved === false) {
            // Known shortcode with no value → render empty, not the literal {{token}}.
            // Unknown keys (no canonical_key) are left for the template author to see.
            if (result.canonical_key) {
                values[result.requested_key] = '';
                values[result.canonical_key] = '';
            }
            continue;
        }
        values[result.requested_key] = result.value;
        if (result.canonical_key) values[result.canonical_key] = result.value;
    }
    for (const [key, entry] of Object.entries(snapshot.popup || {})) {
        const selected = entry.selected || [];
        const display = selected.length
            ? (Array.isArray(entry.value) ? selected.map(item => item.label) : selected[0]?.label)
            : entry.value;
        values[key] = display;
        const officialType = selected[0]?.meta?.official_type;
        if (officialType) values[`${key}${SCOPE_SEPARATOR}official_type`] = officialType;
    }
    // Popup-scoped loop collections, frozen at run creation, keyed by
    // "<field>##<type>" — the key renderScopedLoopBlocks reads.
    for (const [key, records] of Object.entries(snapshot.loops || {})) {
        values[key] = records;
    }
    return values;
};

class FormHtmlRenderService {
    constructor(models = null) { this.models = models; }
    _models = () => this.models || getCurrentModels();

    render = async (generationRunId, userId = null) => {
        try {
            const models = this._models();
            const existing = await models.form_generation_artifact.findOne({
                where: { generation_run_id: generationRunId, artifact_type: 'HTML' },
            });
            if (existing) return responseHandler.returnSuccess(httpStatus.OK, 'Existing HTML artifact returned', existing);
            const runRow = await models.form_generation_run.findOne({
                where: { generation_run_id: generationRunId },
            });
            if (!runRow) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Generation run not found');
            const run = runRow.toJSON ? runRow.toJSON() : runRow;
            if (!['READY', 'COMPLETED'].includes(run.lifecycle_status)) {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Generation run is not ready for rendering');
            }
            if (!run.template_content_snapshot || !run.layout_snapshot || !run.template_fields_snapshot) {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Generation run does not contain a complete template snapshot');
            }
            const versionSnapshot = FormTemplateVersionService.versionSnapshot(
                'HTML',
                run.template_content_snapshot,
                parseJson(run.popup_schema_snapshot) || [],
                parseJson(run.layout_snapshot),
                parseJson(run.template_fields_snapshot) || []
            );
            if (hashTemplateVersion(versionSnapshot) !== run.template_content_hash) {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Generation run template snapshot integrity check failed');
            }
            const html = renderHtmlTemplate(
                run.template_content_snapshot,
                buildRenderValues(run.resolved_snapshot)
            );
            const contentHash = hashTemplateVersion(html);
            let artifact;
            try {
                artifact = await models.form_generation_artifact.create({
                    generation_run_id: generationRunId,
                    artifact_type: 'HTML',
                    content_snapshot: html,
                    content_hash: contentHash,
                    created_by: userId,
                    created_at: new Date(),
                });
            } catch (error) {
                if (error.name !== 'SequelizeUniqueConstraintError') throw error;
                artifact = await models.form_generation_artifact.findOne({
                    where: { generation_run_id: generationRunId, artifact_type: 'HTML' },
                });
            }
            return responseHandler.returnSuccess(httpStatus.CREATED, 'HTML artifact rendered', artifact);
        } catch (error) {
            logger.error('Render generation HTML error:', error.message);
            return responseHandler.returnError(httpStatus.UNPROCESSABLE_ENTITY, error.message);
        }
    };
}

FormHtmlRenderService.buildRenderValues = buildRenderValues;

module.exports = FormHtmlRenderService;
