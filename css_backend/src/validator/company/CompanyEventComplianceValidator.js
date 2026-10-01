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

class CompanyEventComplianceValidator {
    requestExtension = validate(Joi.object({
        requested_due_date: Joi.date().required(),
        reason: Joi.string().trim().min(3).required(),
        authority: Joi.string().trim().allow(null, ''),
        reference: Joi.string().trim().allow(null, ''),
        reminder_date_basis: Joi.string().valid('EXTENDED_DUE_DATE', 'ACTUAL_DUE_DATE').allow(null, ''),
        evidence_doc_id: Joi.number().integer().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    requestWaiver = validate(Joi.object({
        reason: Joi.string().trim().min(3).required(),
        authority: Joi.string().trim().allow(null, ''),
        reference: Joi.string().trim().allow(null, ''),
        evidence_doc_id: Joi.number().integer().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = CompanyEventComplianceValidator;
