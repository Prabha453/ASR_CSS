const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../../helper/ApiError');
const { EVENT_STATUS_VALUES } = require('../../config/companyEventStatus');

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

class CompanyEventStatusValidator {
    updateStatus = validate(Joi.object({
        status: Joi.string().valid(...EVENT_STATUS_VALUES).required(),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = CompanyEventStatusValidator;
