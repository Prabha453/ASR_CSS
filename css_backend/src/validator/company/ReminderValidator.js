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

class ReminderValidator {
    save = validate(Joi.object({
        category: Joi.string().valid('EVENT', 'LOG').default('EVENT'),
        event_id: Joi.number().integer().allow(null, ''),
        company_type_id: Joi.number().integer().allow(null, ''),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
        timing_type: Joi.string().valid('BEFORE', 'AFTER').default('BEFORE'),
        offset_days: Joi.number().integer().min(0).default(0),
        is_recurring: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false').default(false),
        recurring_interval_type: Joi.string().valid('DAILY', 'CUSTOM').allow(null, ''),
        recurring_interval_days: Joi.number().integer().min(1).allow(null, ''),
        sender_name: Joi.string().trim().max(150).required(),
        subject: Joi.string().required(),
        message: Joi.string().required(),
        attachments: Joi.alternatives().try(Joi.array(), Joi.string().allow(null, '')).allow(null),
        port_name: Joi.string().allow(null, ''),
        created_by: Joi.number().integer().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = ReminderValidator;
