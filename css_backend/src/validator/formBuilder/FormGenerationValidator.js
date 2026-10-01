'use strict';

const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../../helper/ApiError');

class FormGenerationValidator {
    regenerate = async (req, res, next) => {
        const key = req.get('Idempotency-Key');
        if (!key || key.trim().length < 8 || key.length > 128) {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'A valid Idempotency-Key header is required'));
        }
        return next();
    };
    create = async (req, res, next) => {
        const schema = Joi.object({
            entity_id: Joi.number().integer().positive().required(),
            company_event_id: Joi.number().integer().positive().allow(null),
            popup_values: Joi.object().unknown(true).default({}),
            idempotency_key: Joi.string().trim().min(8).max(128),
        });
        const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
        if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error.details.map(item => item.message).join(', ')));
        const key = req.get('Idempotency-Key') || value.idempotency_key;
        if (!key || key.trim().length < 8 || key.length > 128) {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'A valid Idempotency-Key header is required'));
        }
        req.body = value;
        return next();
    };
}

module.exports = FormGenerationValidator;
