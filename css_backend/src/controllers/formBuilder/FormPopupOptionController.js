'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const FormPopupOptionService = require('../../service/formBuilder/FormPopupOptionService');

class FormPopupOptionController {
    constructor() { this.service = new FormPopupOptionService(); }
    list = async (req, res) => {
        try {
            const result = await this.service.list(req.params.form_id, req.params.field_key, req.query);
            res.status(result.statusCode).send(result.response);
        } catch (error) {
            logger.error(error);
            res.status(httpStatus.BAD_GATEWAY).send(error);
        }
    };
}

module.exports = FormPopupOptionController;
