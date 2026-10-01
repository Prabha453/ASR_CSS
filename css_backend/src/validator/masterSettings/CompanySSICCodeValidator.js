const Joi = require('joi');

const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class CompanySSICCodeValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            ssic_code: Joi.string()
                .trim()
                .max(20)
                .required(),

            ssic_description: Joi.string()
                .trim()
                .max(500)
                .required(),

            country: Joi.string()
                .trim()
                .max(100)
                .default('Singapore'),

            country_code: Joi.string()
                .trim()
                .max(3)
                .allow(null, ''),

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

module.exports = CompanySSICCodeValidator;