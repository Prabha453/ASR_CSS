'use strict';

const httpStatus = require('http-status');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { getCurrentModels, getSequelizeForDb } = require('../../models');
const config = require('../../config/config');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const { uploadDocument } = require('../../helper/documentHelper');
const { renderPdfBuffer } = require('./PdfBrowserAdapter');
const FormHtmlRenderService = require('./FormHtmlRenderService');

const parseJson = value => {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch (error) { return value; }
};

const tenantDbName = req => req.user?.portName || req.user?.port_name ||
    decodeURIComponent(String(req.originalUrl || '').split('/').filter(Boolean)[0] || '');

const resolvePort = async req => {
    const portName = tenantDbName(req);
    const directNumber = Number(req.user?.port_number) || null;
    if (!portName) throw new Error('Unable to resolve tenant database name for document storage');
    if (directNumber) return { port_name: portName, port_number: directNumber };
    const portModels = await getSequelizeForDb(config.portDbName);
    const [rows] = await portModels.sequelize.query(
        'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
        { replacements: [portName] }
    );
    if (!rows?.length) throw new Error(`Port metadata not found for tenant database "${portName}"`);
    return { port_name: rows[0].port_db, port_number: rows[0].port_number };
};

class FormPdfRenderService {
    render = async (generationRunId, userId, req) => {
        const models = getCurrentModels();
        let claimed = false;
        try {
            const existing = await models.form_generation_artifact.findOne({
                where: { generation_run_id: generationRunId, artifact_type: 'PDF' },
            });
            if (existing) {
                const document = existing.document_store_id
                    ? await models.document_store.findOne({ where: { doc_id: existing.document_store_id, is_deleted: false } })
                    : null;
                return responseHandler.returnSuccess(httpStatus.OK, 'Existing PDF artifact returned', { artifact: existing, document });
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
            const [claimCount] = await models.form_generation_run.update(
                { lifecycle_status: 'RENDERING', failure_code: null, failure_message: null, updated_at: new Date() },
                { where: { generation_run_id: generationRunId, lifecycle_status: { [Op.in]: ['READY', 'FAILED'] } } }
            );
            if (!claimCount) {
                return responseHandler.returnError(httpStatus.CONFLICT, 'Generation run is already rendering or completed');
            }
            claimed = true;
            const pdfBuffer = await renderPdfBuffer(
                htmlArtifact.content_snapshot,
                parseJson(run.layout_snapshot) || {}
            );
            const contentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
            const port = await resolvePort(req);
            const fileName = `form_${run.form_id}_run_${run.generation_run_id}.pdf`;
            const document = await uploadDocument({
                file: {
                    originalname: fileName,
                    mimetype: 'application/pdf',
                    size: pdfBuffer.length,
                    buffer: pdfBuffer,
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
                sub_folder: 'form_generation/pdf',
                req,
            });
            await models.document_store.update(
                { file_hash: contentHash },
                { where: { doc_id: document.doc_id } }
            );
            const artifact = await models.form_generation_artifact.create({
                generation_run_id: generationRunId,
                artifact_type: 'PDF',
                content_snapshot: null,
                content_hash: contentHash,
                document_store_id: document.doc_id,
                file_size_bytes: pdfBuffer.length,
                created_by: userId,
                created_at: new Date(),
            });
            await run.update({
                lifecycle_status: 'COMPLETED', completed_at: new Date(), updated_at: new Date(),
            });
            return responseHandler.returnSuccess(httpStatus.CREATED, 'PDF artifact rendered and stored', { artifact, document });
        } catch (error) {
            if (claimed) {
                await models.form_generation_run.update({
                    lifecycle_status: 'FAILED',
                    failure_code: 'PDF_RENDER_FAILED',
                    failure_message: String(error.message || error).slice(0, 1000),
                    updated_at: new Date(),
                }, { where: { generation_run_id: generationRunId } }).catch(() => {});
            }
            logger.error('Render generation PDF error:', error.message);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
        }
    };
}

FormPdfRenderService.tenantDbName = tenantDbName;
FormPdfRenderService.resolvePort = resolvePort;

module.exports = FormPdfRenderService;
