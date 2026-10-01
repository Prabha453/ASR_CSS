const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../helper/ApiError');

class ToDoTaskValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            task_text: Joi.string()
                .trim()
                .min(1)
                .required()
                .messages({
                    'string.empty': 'Please enter a task.',
                    'any.required': 'Please enter a task.',
                }),

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

    async updateStatusValidator(req, res, next) {

        const schema = Joi.object({

            status: Joi.string()
                .valid('PENDING', 'COMPLETED')
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

module.exports = ToDoTaskValidator;
