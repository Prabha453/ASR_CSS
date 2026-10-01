const Joi = require('joi');

const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class TypeOfFeeValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            type_of_fee: Joi.string()
                .trim()
                .max(150)
                .required(),

            currency: Joi.string()
                .trim()
                .length(3)
                .default('SGD'),

            low_range: Joi.number()
                .precision(2)
                .allow(null,''),

            high_range: Joi.number()
                .precision(2)
                .allow(null,''),

            fee_amt: Joi.number()
                .precision(2)
                .default(0),

            plus_minus: Joi.number()
                .valid(-1, 0, 1)
                .default(0),

            category_id: Joi.number()
                .integer()
                .allow(null,''),

            description: Joi.string()
                .trim()
                .max(500)
                .allow(null, ''),

            detailed_description: Joi.string()
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

module.exports = TypeOfFeeValidator;