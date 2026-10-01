const Joi = require('joi');

const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class CompanyEventNameValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            event_type: Joi.alternatives()
                .try(
                    Joi.number().integer().valid(0, 1, 2),
                    Joi.string().valid('0', '1', '2', 'EVENT', 'LOG', 'Event', 'Log', 'event', 'log')
                )
                .required(),

            event_name: Joi.string()
                .trim()
                .max(150)
                .required(),

            event_subject: Joi.string()
                .trim()
                .max(300)
                .allow(null, ''),

            color_code: Joi.string()
                .trim()
                .max(10)
                .default('#3788D8'),

            recurring_period: Joi.number()
                .integer()
                .min(0)
                .default(0),

            recurring_duration: Joi.string()
                .trim()
                .max(50)
                .allow(null, ''),

            is_system_event: Joi.boolean()
                .optional(),

            is_recurring: Joi.boolean()
                .optional()
                .default(false),

            category: Joi.string()
                .trim()
                .max(50)
                .allow(null, ''),

            authority_type: Joi.string()
                .trim()
                .max(80)
                .allow(null, ''),

            default_frequency: Joi.string()
                .valid('ONE_TIME', 'ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'AD_HOC')
                .allow(null, ''),

            supports_extension: Joi.boolean()
                .optional(),

            supports_waiver: Joi.boolean()
                .optional(),

            evidence_required: Joi.boolean()
                .optional(),

            active: Joi.boolean()
                .optional(),

            operational_lead_days: Joi.number()
                .integer()
                .min(0)
                .allow(null, ''),

            grace_period_days: Joi.number()
                .integer()
                .min(0)
                .allow(null, ''),

            created_by: Joi.number()
                .integer()
                .allow(null),

            updated_by: Joi.number()
                .integer()
                .allow(null),

        });

        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        };

        const { error, value } =
            schema.validate(req.body, options);

        if (error) {

            const errorMessage = error.details
                .map((details) => details.message)
                .join(', ');

            return next(
                new ApiError(
                    httpStatus.BAD_REQUEST,
                    errorMessage
                )
            );
        }

        req.body = value;

        return next();
    }

}

module.exports = CompanyEventNameValidator;
