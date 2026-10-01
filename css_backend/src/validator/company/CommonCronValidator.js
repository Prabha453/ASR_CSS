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

class CommonCronValidator {
    sendDue = validate(Joi.object({
        date: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null, ''),
        entity_id: Joi.number().integer().allow(null, ''),
        entityId: Joi.number().integer().allow(null, ''),
        company_id: Joi.number().integer().allow(null, ''),
        companyId: Joi.number().integer().allow(null, ''),
        company_event_id: Joi.number().integer().allow(null, ''),
        companyEventId: Joi.number().integer().allow(null, ''),
        dry_run: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false').default(false),
        dryRun: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false'),
        preview: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false'),
        force: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false').default(false),
        limit: Joi.number().integer().min(1).max(10000).allow(null, ''),
        port_name: Joi.string().allow(null, ''),
    }));
}

module.exports = CommonCronValidator;
