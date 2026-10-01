const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../../helper/ApiError');

const validate = (schema) => async (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
    });

    if (error) {
        const message = error.details.map(detail => detail.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, message));
    }

    req.body = value;
    return next();
};

class DocumentChecklistTemplateValidator {
    saveAll = validate(Joi.object({
        event_master_id: Joi.number().integer().required(),
        items: Joi.array().items(Joi.object({
            checklist_template_id: Joi.number().integer().allow(null, ''),
            document_name: Joi.string().trim().max(150).required(),
            description: Joi.string().trim().allow(null, ''),
            is_mandatory: Joi.boolean().optional(),
            sort_order: Joi.number().integer().allow(null, ''),
        })).default([]),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = DocumentChecklistTemplateValidator;
