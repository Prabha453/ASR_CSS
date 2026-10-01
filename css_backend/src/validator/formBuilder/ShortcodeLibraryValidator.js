'use strict';

const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../../helper/ApiError');

const DOMAINS = ['COMPANY', 'OFFICIAL', 'SHARE', 'EVENT', 'COMMON', 'TRANSACTION', 'MANUAL', 'CALCULATED', 'DOCUMENT', 'SYSTEM'];
const TYPES = ['STRING', 'TEXT', 'BOOLEAN', 'INTEGER', 'DECIMAL', 'MONEY', 'DATE', 'DATETIME', 'EMAIL', 'ADDRESS', 'FILE_REFERENCE', 'JSON'];

class ShortcodeLibraryValidator {
    save = (req, res, next) => {
        const schema = Joi.object({
            shortcode_key: Joi.string().trim().max(190).required(),
            label: Joi.string().trim().max(190).required(),
            source_domain: Joi.string().uppercase().valid(...DOMAINS).required(),
            sort_order: Joi.number().integer().min(1).max(9999).default(1),
            is_custom_backend: Joi.boolean().truthy(1).falsy(0).default(false),
            resolver_name: Joi.string().trim().uppercase().max(100).allow('').default(''),
            resolver_path: Joi.string().trim().max(190).allow('').default(''),
            value_type: Joi.string().uppercase().valid(...TYPES).default('STRING'),
            is_collection: Joi.boolean().truthy(1).falsy(0).default(false),
            sensitivity: Joi.string().uppercase().valid('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED').default('INTERNAL'),
            description: Joi.string().trim().allow('', null),
            example_value: Joi.any().allow(null),
            allowed_formats: Joi.array().items(Joi.string().trim().max(80)).default([]),
            selection_behavior: Joi.string().uppercase().valid('NONE', 'ALL', 'SELECT_ONE', 'SELECT_MANY').default('NONE'),
            role_tags: Joi.array().items(Joi.string().trim().max(80)).default([]),
            aliases: Joi.array().items(Joi.string().trim().max(190)).default([]),
            status: Joi.string().uppercase().valid('ACTIVE', 'DEPRECATED', 'RETIRED').default('ACTIVE'),
        });
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: false,
        });
        if (error) {
            return next(new ApiError(
                httpStatus.BAD_REQUEST,
                error.details.map(detail => detail.message).join(', ')
            ));
        }
        req.body = value;
        return next();
    };
}

module.exports = ShortcodeLibraryValidator;
