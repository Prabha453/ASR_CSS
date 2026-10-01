const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class LanguageValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            l_type: Joi.string()
                .trim()
                .max(20)
                .required(),

            l_page: Joi.string()
                .trim()
                .max(100)
                .required(),

            l_label: Joi.string()
                .trim()
                .max(200)
                .required(),

            l_value: Joi.string()
                .required(),

            locale: Joi.string()
                .trim()
                .max(10)
                .default('en'),

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

module.exports = LanguageValidator;