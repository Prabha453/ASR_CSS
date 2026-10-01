const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class ProductAndServiceValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            item_name: Joi.string()
                .trim()
                .max(255)
                .required(),

            currency_code: Joi.string()
                .trim()
                .max(10)
                .default('SGD'),

            range_low: Joi.number()
                .allow(null, ''),

            range_high: Joi.number()
                .allow(null, ''),

            fee_amount: Joi.number()
                .required(),

            quantity: Joi.number()
                .integer()
                .min(1)
                .default(1),

            uom: Joi.string()
                .trim()
                .max(100)
                .allow(null, ''),

            status: Joi.string()
                .valid('ACTIVE', 'INACTIVE')
                .default('ACTIVE'),

            commission_type: Joi.string()
                .valid('FIXED', 'PERCENTAGE')
                .allow(null, ''),

            commission_value: Joi.number()
                .allow(null, ''),

            service_type: Joi.string()
                .trim()
                .max(100)
                .allow(null, ''),

            category_id: Joi.number()
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

module.exports = ProductAndServiceValidator;