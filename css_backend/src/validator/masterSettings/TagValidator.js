const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class TagValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            tag_name: Joi.string()
                .trim()
                .max(100)
                .required(),

            tag_color: Joi.string()
                .trim()
                .max(10)
                .default('#000000'),

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

module.exports = TagValidator;