const Joi = require('joi');

const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class CorpSecTypeValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            corp_sec_parent: Joi.number()
                .integer()
                .allow(null,''),

            corp_sec_name: Joi.string()
                .trim()
                .max(150)
                .required(),

            files: Joi.string()
                .trim()
                .max(500)
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

module.exports = CorpSecTypeValidator;