const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class TransactionTypeValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            t_type: Joi.string()
                .trim()
                .max(50)
                .required(),

            t_name: Joi.string()
                .trim()
                .max(150)
                .required(),
           t_order: Joi.number()
                .required().allow(0,null,''),

           t_type_no : Joi.string()
                .trim()
                .max(200)
                .allow(null,''),

           t_type_color : Joi.string()
                .trim()
                .max(20)
                .allow(null,''),    

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

module.exports = TransactionTypeValidator;