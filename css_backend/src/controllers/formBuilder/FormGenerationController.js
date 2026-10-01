'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const FormGenerationService = require('../../service/formBuilder/FormGenerationService');
const FormHtmlRenderService = require('../../service/formBuilder/FormHtmlRenderService');
const FormPdfRenderService = require('../../service/formBuilder/FormPdfRenderService');
const FormArtifactDownloadService = require('../../service/formBuilder/FormArtifactDownloadService');
const FormDocxRenderService = require('../../service/formBuilder/FormDocxRenderService');
const logHelper = require('../../helper/LogHelper');
const { MODULES, ACTIONS, STATUS } = logHelper;
const DirectFormRenderService = require('../../service/formBuilder/DirectFormRenderService');

class FormGenerationController {
    constructor() { this.service = new FormGenerationService(); }
    _userId = req => req.user?.user_id ?? req.user?.id ?? null;
    _send = async (res, callback) => {
        try {
            const result = await callback();
            res.status(result.statusCode).send(result.response);
        } catch (error) {
            logger.error(error);
            res.status(httpStatus.BAD_GATEWAY).send(error);
        }
    };
    direct = async (req, res) => {
        try {
            const format = String(req.params.format || '').toUpperCase();
            if (!['HTML', 'PDF', 'DOCX'].includes(format)) return res.status(httpStatus.BAD_REQUEST).send({ status: false, message: 'Invalid format' });
            const result = await new DirectFormRenderService().render(req.params.form_id, req.body, format);
            res.set('Content-Type', result.mimeType);
            res.set('Cache-Control', 'private, no-store');
            res.set('X-Content-Type-Options', 'nosniff');
            if (format === 'HTML') return res.status(httpStatus.OK).send(result.html);
            res.set('Content-Disposition', `attachment; filename="${result.fileName.replace(/"/g, '')}"`);
            res.set('Content-Length', String(result.buffer.length));
            return res.status(httpStatus.OK).end(result.buffer);
        } catch (error) {
            logger.error('Direct form render error:', error);
            return res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({ status: false, message: error.message });
        }
    };
    create = async (req, res) => this._send(res, () => this.service.create(
        req.params.form_id,
        req.body,
        req.get('Idempotency-Key') || req.body.idempotency_key,
        this._userId(req)
    ));
    get = async (req, res) => this._send(res, () => this.service.get(req.params.generation_run_id));
    list = async (req, res) => this._send(res, () => this.service.list(req.params.form_id));
    regenerate = async (req, res) => this._send(res, async () => {
        const result = await this.service.regenerate(
            req.params.generation_run_id,
            req.get('Idempotency-Key'),
            this._userId(req)
        );
        await logHelper.writeAuditLog(req, {
            action: ACTIONS.REGENERATE_FORM,
            module: MODULES.FORMS,
            table_name: 'form_generation_runs',
            record_id: result.response?.data?.generation_run_id || req.params.generation_run_id,
            status: result.response?.status ? STATUS.SUCCESS : STATUS.FAILED,
            error_message: result.response?.status ? null : result.response?.message,
            new_values: result.response?.status ? { source_generation_run_id: Number(req.params.generation_run_id) } : null,
        });
        return result;
    });
    renderHtml = async (req, res) => this._send(
        res,
        () => new FormHtmlRenderService().render(req.params.generation_run_id, this._userId(req))
    );
    renderPdf = async (req, res) => this._send(
        res,
        async () => {
            const result = await new FormPdfRenderService().render(req.params.generation_run_id, this._userId(req), req);
            await logHelper.writeAuditLog(req, {
                action: ACTIONS.GENERATE_FORM,
                module: MODULES.FORMS,
                table_name: 'form_generation_runs',
                record_id: req.params.generation_run_id,
                status: result.response?.status ? STATUS.SUCCESS : STATUS.FAILED,
                error_message: result.response?.status ? null : result.response?.message,
                new_values: result.response?.status ? { artifact_type: 'PDF' } : null,
            });
            return result;
        }
    );
    renderDocx = async (req, res) => this._send(
        res,
        async () => {
            const result = await new FormDocxRenderService().render(req.params.generation_run_id, this._userId(req), req);
            await logHelper.writeAuditLog(req, {
                action: ACTIONS.GENERATE_FORM,
                module: MODULES.FORMS,
                table_name: 'form_generation_runs',
                record_id: req.params.generation_run_id,
                status: result.response?.status ? STATUS.SUCCESS : STATUS.FAILED,
                error_message: result.response?.status ? null : result.response?.message,
                new_values: result.response?.status ? { artifact_type: 'DOCX' } : null,
            });
            return result;
        }
    );
    download = async (req, res) => {
        try {
            const resolved = await new FormArtifactDownloadService().resolve(req.params.artifact_id);
            await logHelper.writeAuditLog(req, {
                action: ACTIONS.DOWNLOAD_DOCUMENT,
                module: MODULES.FORMS,
                table_name: 'form_generation_artifacts',
                record_id: resolved.artifact.generation_artifact_id,
                new_values: {
                    generation_run_id: resolved.artifact.generation_run_id,
                    document_store_id: resolved.artifact.document_store_id,
                    artifact_type: resolved.artifact.artifact_type,
                },
            });
            res.set('Cache-Control', 'private, no-store');
            res.set('X-Content-Type-Options', 'nosniff');
            if (resolved.redirectUrl) return res.redirect(httpStatus.FOUND, resolved.redirectUrl);
            return res.download(resolved.absolutePath, resolved.fileName);
        } catch (error) {
            logger.error('Download generation artifact error:', error);
            await logHelper.writeFailedLog(req, {
                action: ACTIONS.DOWNLOAD_DOCUMENT,
                module: MODULES.FORMS,
                table_name: 'form_generation_artifacts',
                record_id: req.params.artifact_id,
            }, error.message);
            return res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).send({
                status: false,
                message: error.statusCode ? error.message : 'Unable to download generated artifact',
            });
        }
    };
}

module.exports = FormGenerationController;
