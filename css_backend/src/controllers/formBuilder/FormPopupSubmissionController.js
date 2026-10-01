'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const FormPopupSubmissionService = require('../../service/formBuilder/FormPopupSubmissionService');

class FormPopupSubmissionController {
    constructor() { this.service = new FormPopupSubmissionService(); }
    validate = async (req, res) => {
        try {
            const result = await this.service.validate(req.params.form_id, req.body.entity_id, req.body.popup_values);
            res.status(result.statusCode).send(result.response);
        } catch (error) {
            logger.error(error);
            res.status(httpStatus.BAD_GATEWAY).send(error);
        }
    };
}

module.exports = FormPopupSubmissionController;
