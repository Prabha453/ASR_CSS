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

class EventRuleValidator {
    save = validate(Joi.object({
        rule_id: Joi.number().integer().allow(null, ''),
        event_id: Joi.number().integer().required(),
        event_slug: Joi.string().trim().max(80).allow(null, ''),
        country_ids: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        country_id_list: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        legacy_country_ids: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        legacy_country_id_list: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        company_type_ids: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        company_type_id_list: Joi.alternatives().try(Joi.string().allow(null, ''), Joi.array()).allow(null),
        jurisdiction_id: Joi.number().integer().allow(null, ''),
        phases: Joi.object().unknown(true).allow(null),
        groups: Joi.array().items(Joi.object().unknown(true)).allow(null),
        rule_config: Joi.alternatives().try(Joi.object().unknown(true), Joi.string().allow(null, '')).allow(null),
        is_active: Joi.boolean().truthy(1, '1', 'true').falsy(0, '0', 'false').default(true),
        rule_priority: Joi.number().integer().allow(null, ''),
        port_name: Joi.string().allow(null, ''),
        created_by: Joi.number().integer().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    delete = validate(Joi.object({
        rule_id: Joi.number().integer().required(),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    submitForReview = validate(Joi.object({
        rule_id: Joi.number().integer().required(),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    approve = validate(Joi.object({
        rule_id: Joi.number().integer().required(),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    publish = validate(Joi.object({
        rule_id: Joi.number().integer().required(),
        effective_from: Joi.date().required(),
        effective_to: Joi.date().allow(null, ''),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));

    retire = validate(Joi.object({
        rule_id: Joi.number().integer().required(),
        remarks: Joi.string().allow(null, ''),
        updated_by: Joi.number().integer().allow(null, ''),
    }));
}

module.exports = EventRuleValidator;
