'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const FormTemplateVersionService = require('../../service/formBuilder/FormTemplateVersionService');

class FormTemplateVersionController {
    constructor() {
        this.service = new FormTemplateVersionService();
    }
    _userId = req => req.user?.user_id || req.user?.id || null;
    _send = async (res, callback) => {
        try {
            const result = await callback();
            res.status(result.statusCode).send(result.response);
        } catch (error) {
            logger.error(error);
            res.status(httpStatus.BAD_GATEWAY).send(error);
        }
    };
    createDraft = async (req, res) => this._send(
        res, () => this.service.createDraft(req.params.form_id, this._userId(req))
    );
    publish = async (req, res) => this._send(
        res, () => this.service.publish(req.params.template_version_id, this._userId(req))
    );

    validateContent = async (req, res) => this._send(
        res, () => this.service.validateContent(req.body.content)
    );
    list = async (req, res) => this._send(res, () => this.service.list(req.params.form_id));
    updatePopupSchema = async (req, res) => this._send(
        res,
        () => this.service.updatePopupSchema(req.params.template_version_id, req.body.sections)
    );
    getPublishedPopupSchema = async (req, res) => this._send(
        res,
        () => this.service.getPublishedPopupSchema(req.params.form_id)
    );
    getMergedPublishedPopupSchema = async (req, res) => this._send(
        res,
        () => this.service.getMergedPublishedPopupSchema(req.body.form_ids)
    );
}

module.exports = FormTemplateVersionController;
