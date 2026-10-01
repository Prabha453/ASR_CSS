const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class JurisdictionValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            country_id: Joi.number().integer().required(),

            parent_jurisdiction_id: Joi.number().integer().allow(null, ''),

            level: Joi.string()
                .valid('COUNTRY_NATIONAL', 'STATE_PROVINCE', 'FREE_ZONE', 'MUNICIPALITY')
                .required(),

            name: Joi.string().trim().max(150).required(),

            code: Joi.string().trim().max(50).allow('', null),

            is_active: Joi.boolean(),

            updated_by: Joi.number().integer().allow(null),

        });

        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        };

        const { error, value } = schema.validate(req.body, options);

        if (error) {
            const errorMessage = error.details.map((details) => details.message).join(', ');
            return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
        }

        req.body = value;

        return next();
    }

}

module.exports = JurisdictionValidator;
