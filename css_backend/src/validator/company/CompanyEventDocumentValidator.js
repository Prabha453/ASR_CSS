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

class CompanyEventDocumentValidator {
    updateStatus = validate(Joi.object({
        status: Joi.string()
            .valid('REQUIRED', 'REQUESTED', 'RECEIVED', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_APPLICABLE')
            .required(),
        doc_id: Joi.number().integer().allow(null, ''),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = CompanyEventDocumentValidator;
