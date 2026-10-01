'use strict';

const crypto = require('crypto');
const httpStatus = require('http-status');
const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { uploadDocument } = require('../../helper/documentHelper');
const { renderDocxBuffer } = require('../../domain/formBuilder/docxRenderer');
const FormHtmlRenderService = require('./FormHtmlRenderService');
const { resolvePort } = require('./FormPdfRenderService');

const parseJson = value => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch (error) { return value; }
};

class FormDocxRenderService {
    render = async (generationRunId, userId, req) => {
        const models = getCurrentModels();
        try {
            const existing = await models.form_generation_artifact.findOne({
                where: { generation_run_id: generationRunId, artifact_type: 'DOCX' },
            });
            if (existing) {
                const document = existing.document_store_id
                    ? await models.document_store.findOne({ where: { doc_id: existing.document_store_id, is_deleted: false } })
                    : null;
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing DOCX artifact returned', { artifact: existing, document });
            }
            const run = await models.form_generation_run.findOne({ where: { generation_run_id: generationRunId } });
            if (!run) return responseHandler.returnError(httpStatus.NOT_FOUND, 'Generation run not found');

            let htmlArtifact = await models.form_generation_artifact.findOne({
                where: { generation_run_id: generationRunId, artifact_type: 'HTML' },
            });
            if (!htmlArtifact) {
                const htmlResult = await new FormHtmlRenderService(models).render(generationRunId, userId);
                if (!htmlResult.response.status) return htmlResult;
                htmlArtifact = htmlResult.response.data;
            }
            const docxBuffer = await renderDocxBuffer(htmlArtifact.content_snapshot, parseJson(run.layout_snapshot) || {});
            const contentHash = crypto.createHash('sha256').update(docxBuffer).digest('hex');
            const port = await resolvePort(req);
            const fileName = `form_${run.form_id}_run_${run.generation_run_id}.docx`;
            const document = await uploadDocument({
                file: {
                    originalname: fileName,
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: docxBuffer.length,
                    buffer: docxBuffer,
                },
                userId,
                ...port,
                entity_id: run.entity_id,
                entity_type: 'company',
                module_name: 'form_generation',
                sub_module_name: 'generated_form',
                module_record_id: run.generation_run_id,
                doc_category: 'generated_compliance_form',
                doc_name: fileName,
                sub_folder: 'form_generation/docx',
                req,
            });
            await models.document_store.update({ file_hash: contentHash }, { where: { doc_id: document.doc_id } });
            const artifact = await models.form_generation_artifact.create({
                generation_run_id: generationRunId,
                artifact_type: 'DOCX',
                content_snapshot: null,
                content_hash: contentHash,
                document_store_id: document.doc_id,
                file_size_bytes: docxBuffer.length,
                created_by: userId,
                created_at: new Date(),
            });
            await run.update({
                lifecycle_status: 'COMPLETED', completed_at: new Date(), updated_at: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.CREATED, 'DOCX artifact rendered and stored', { artifact, document });
        } catch (error) {
            logger.error('Render generation DOCX error:', error.message);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

module.exports = FormDocxRenderService;
