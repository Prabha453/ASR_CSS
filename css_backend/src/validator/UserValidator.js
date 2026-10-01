const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../helper/ApiError');

class UserValidator {

    async userCreateValidator(req, res, next) {
        // create schema object
        const schema = Joi.object({

            user_role: Joi.string()
                .valid(
                    'SUPER_ADMIN',
                    'ADMIN',
                    'MANAGER',
                    'STAFF',
                    'VIEWER',
                    'CLIENT'
                )
                .default('STAFF'),

            user_group_id: Joi.number()
                .integer()
                .positive()
                .allow(null),

            first_name: Joi.string()
                .trim()
                .max(100)
                .required(),

            last_name: Joi.string()
                .trim()
                .max(100)
                .required(),

            department: Joi.string()
                .trim()
                .max(150)
                .allow(null, ''),

            designation: Joi.string()
                .trim()
                .max(150)
                .allow(null, ''),

            whatsapp_no: Joi.string()
                .trim()
                .max(20)
                .allow(null, ''),

            email: Joi.string()
                .trim()
                .lowercase()
                .email()
                .max(200)
                .required(),

            user_name: Joi.string()
                .trim()
                .min(3)
                .max(100)
                .required(),

            user_password: Joi.string()
                .min(6)
                .max(255)
                .required(),

            confirm_password: Joi.string()
                .valid(Joi.ref('user_password'))
                .optional()
                .allow(null, '')
                .messages({
                    'any.only': 'Confirm password does not match',
                }),

            zoom_account_email: Joi.string()
                .trim()
                .email()
                .max(200)
                .allow(null, ''),

            zoom_account_password: Joi.string()
                .max(255)
                .allow(null, ''),

            zoom_client_id: Joi.string()
                .max(255)
                .allow(null, ''),

            zoom_client_secret: Joi.string()
                .max(255)
                .allow(null, ''),

            user_status: Joi.string()
                .valid(
                    'ACTIVE',
                    'INACTIVE',
                    'SUSPENDED',
                    'PENDING'
                )
                .default('PENDING'),

            password_session_timeout: Joi.number()
                .integer()
                .min(1)
                .default(30),

            password_renewal_days: Joi.number()
                .integer()
                .min(1)
                .default(90),

            twofa_enabled: Joi.boolean()
                .default(false),

            join_date: Joi.date()
                .allow(null),

            profile_photo_url: Joi.string()
                .max(500)
                .allow(null, ''),

        });

        // schema options
        const options = {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        };

        // validate request body against schema
        const { error, value } = schema.validate(req.body, options);

        if (error) {

            const errorMessage = error.details
                .map((details) => details.message)
                .join(', ');

            return next(
                new ApiError(
                    httpStatus.BAD_REQUEST,
                    errorMessage,
                )
            );

        }

        // remove confirm password before save
        delete value.confirm_password;

        // validated data
        req.body = value;

        return next();

    }
    
    async userLoginValidator(req, res, next) {
        // create schema object
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
        });

        // schema options
        const options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
        };

        // validate request body against schema
        const { error, value } = schema.validate(req.body, options);

        if (error) {
            // on fail return comma separated errors
            const errorMessage = error.details
                .map((details) => {
                    return details.message;
                })
                .join(', ');
            next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
        } else {
            // on success replace req.body with validated value and trigger next middleware function
            req.body = value;
            return next();
        }
    }

    async changePasswordValidator(req, res, next) {

        // create schema object
        const schema = Joi.object({

            old_password: Joi.string()
                .required(),

            password: Joi.string()
                .min(6)
                .required(),

            confirm_password: Joi.string()
                .valid(Joi.ref('password'))
                .required()
                .messages({
                    'any.only': 'Confirm password does not match',
                }),

        });

        // schema options
        const options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
        };

        // validate request body against schema
        const { error, value } = schema.validate(req.body, options);

        if (error) {

            // on fail return comma separated errors
            const errorMessage = error.details
                .map((details) => {
                    return details.message;
                })
                .join(', ');

            next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));

        } else {

            // remove confirm password before service
            delete value.confirm_password;

            // validated body
            req.body = value;

            return next();
        }
    }
}

module.exports = UserValidator;
