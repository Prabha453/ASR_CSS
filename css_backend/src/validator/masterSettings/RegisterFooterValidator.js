const Joi = require('joi');

const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class RegisterFooterValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            re_type: Joi.string()
                .trim()
                .max(50)
                .required(),

            re_text: Joi.string()
                .required(),

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

module.exports = RegisterFooterValidator;