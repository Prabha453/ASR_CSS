'use strict';

const httpStatus = require('http-status');
const logger = require('../../config/logger');
const FormAiEditService = require('../../service/formBuilder/FormAiEditService');

class FormAiEditController {
    constructor() {
        this.service = new FormAiEditService();
    }

    _userId = req => req.user?.user_id || req.user?.id || null;

    edit = async (req, res) => {
        try {
            const result = await this.service.edit(req.body, {
                userId: this._userId(req),
                formId: req.body.form_id || null,
            });
            return res.status(result.statusCode).send(result.response);
        } catch (error) {
            logger.error('Form AI edit controller error', error);
            return res.status(httpStatus.BAD_GATEWAY).send({
                status: false,
                code: httpStatus.BAD_GATEWAY,
                message: 'The AI editing service is temporarily unavailable.',
            });
        }
    };
}

module.exports = FormAiEditController;
