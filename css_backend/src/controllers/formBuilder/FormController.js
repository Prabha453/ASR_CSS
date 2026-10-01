'use strict';

const httpStatus = require('http-status');
const logger     = require('../../config/logger');
const FormService = require('../../service/formBuilder/FormService');
const FormPreviewService = require('../../service/formBuilder/FormPreviewService');

class FormController {

    constructor() {
        this.formService = new FormService();
        this.formPreviewService = new FormPreviewService();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve the authenticated user-id from req.user.
     * Handles both { user_id } and { id } shapes set by your auth middleware.
     */
    _userId(req) {
        return req.user?.user_id ?? req.user?.id ?? null;
    }


    /**
     * Collect multer files regardless of whether the route uses
     * upload.single(), upload.array(), or upload.fields().
     *
     *   req.file   → single file  → wrap in array
     *   req.files  → array / fields object → flatten
     */
    _files(req) {
        if (req.file) return [req.file];
        if (!req.files) return [];
        if (Array.isArray(req.files)) return req.files;
        // upload.fields() → { fieldName: [File, …], … }
        return Object.values(req.files).flat();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE  POST /formbuilder
    // ─────────────────────────────────────────────────────────────────────────

    create = async (req, res) => {
        try {
            const responseData = await this.formService.save(
                null,               // id = null  → INSERT
                req.body,
                this._files(req),
                this._userId(req),
                req,
            );

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE  PUT /formbuilder/:form_id
    // ─────────────────────────────────────────────────────────────────────────

    update = async (req, res) => {
        try {
            const responseData = await this.formService.save(
                req.params.form_id, // id → UPDATE
                req.body,
                this._files(req),
                this._userId(req),
                req,
            );

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // GET  GET /formbuilder/:form_id
    // ─────────────────────────────────────────────────────────────────────────

    get = async (req, res) => {
        try {
            const responseData = await this.formService.get(
                req.params.form_id,
            );

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // LIST  GET /formbuilder
    // ─────────────────────────────────────────────────────────────────────────

    list = async (req, res) => {
        try {
            const responseData = await this.formService.list(
                req.query,
            );

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    preview = async (req, res) => {
        try {
            const responseData = await this.formPreviewService.preview(
                req.params.form_id,
                req.body
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    previewDraft = async (req, res) => {
        try {
            const responseData = await this.formPreviewService.previewDraft(
                req.params.form_id,
                req.body
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE  DELETE /formbuilder/:form_id
    // ─────────────────────────────────────────────────────────────────────────

    delete = async (req, res) => {
        try {
            // form_id comes from the URL param, not the body
            const responseData = await this.formService.delete(
                req.body.form_id,
            );

            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = FormController;
