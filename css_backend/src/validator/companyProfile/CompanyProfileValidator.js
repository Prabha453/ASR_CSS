const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../../helper/ApiError');

class CompanyProfileValidator {

    async companyProfileValidator(req, res, next) {

        // create schema object
        const schema = Joi.object({

            // =========================
            // Company Profile
            // =========================

            cp_company_name: Joi.string()
                .trim()
                .max(255)
                .required(),

            cp_registration_no: Joi.string()
                .trim()
                .max(150)
                .allow(null, ''),

            cp_country: Joi.string()
                .trim()
                .max(100)
                .allow(null, ''),

            cp_registered_client: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            cp_mailling_address: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            cp_reg_add_block: Joi.string()
                .trim()
                .max(100)
                .allow(null, ''),

            cp_registered_address: Joi.string()
                .trim()
                .max(500)
                .allow(null, ''),

            cp_reg_add_building: Joi.string()
                .trim()
                .max(255)
                .allow(null, ''),

            cp_reg_add_level: Joi.string()
                .trim()
                .max(50)
                .allow(null, ''),

            cp_reg_add_unit: Joi.string()
                .trim()
                .max(50)
                .allow(null, ''),

            cp_reg_add_pcode: Joi.string()
                .trim()
                .max(20)
                .allow(null, ''),

            cp_port_title : Joi.string()
                .trim()
                .max(255)
                .allow(null, ''),

            cp_currency: Joi.string()
                .trim()
                .max(10)
                .required(),

            cp_gst: Joi.number()
                .min(0)
                .default(0),

            cp_default_level_held_time: Joi.string()
                .trim()
                .max(100)
                .allow(null, ''),

            cp_theme_style: Joi.string()
                .trim()
                .valid(
                    'custom',
                    'light',
                    'dark'
                )
                .default('custom'),

            cp_caps_proper: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            // =========================
            // Decimal Settings
            // =========================

            cp_no_of_share_decimal_place: Joi.number()
                .integer()
                .min(0)
                .max(12)
                .required(),

            cp_paid_up_share_decimal_place: Joi.number()
                .integer()
                .min(0)
                .max(12)
                .required(),

            cp_issued_share_decimal_place: Joi.number()
                .integer()
                .min(0)
                .max(12)
                .required(),

            // =========================
            // Contact Information
            // =========================

            cp_email_id: Joi.array()
                .items(
                    Joi.string()
                        .trim()
                        .email()
                        .allow('')
                )
                .default([]),

            cp_reply_id: Joi.array()
                .items(
                    Joi.string()
                        .trim()
                        .email()
                        .allow('')
                )
                .default([]),

            cp_contact_number: Joi.array()
                .items(
                    Joi.string()
                        .trim()
                        .max(20)
                        .allow('')
                )
                .default([]),

            // =========================
            // Email Configuration
            // =========================

            cp_email_config: Joi.array()
                .items(

                    Joi.object({

                        email_config_id: Joi.alternatives()
                            .try(
                                Joi.number().integer(),
                                Joi.string().allow('')
                            )
                            .allow(null),

                        from_name: Joi.string()
                            .trim()
                            .max(255)
                            .allow(null, ''),

                        smtp_host: Joi.string()
                            .trim()
                            .hostname()
                            .max(200)
                            .allow(null, ''),

                        smtp_port: Joi.number()
                            .integer()
                            .min(1)
                            .max(65535)
                            .default(587)
                            .allow(null, ''),

                        smtp_user: Joi.string()
                            .trim()
                            .max(200)
                            .allow(null, ''),

                        smtp_password: Joi.string()
                            .max(500)
                            .allow(null, ''),

                        smtp_encryption: Joi.string()
                            .trim()
                            .uppercase()
                            .valid('NONE', 'TLS', 'SSL')
                            .default('TLS')
                            .allow(null, ''),

                        smtp_email: Joi.string()
                            .trim()
                            .email()
                            .max(255)
                            .allow(null, ''),

                        reply_email: Joi.string()
                            .trim()
                            .email()
                            .max(255)
                            .allow(null, ''),

                        aws_ses: Joi.boolean()
                            .default(false),

                        sending_default_email: Joi.boolean()
                            .default(false),

                        group_to_recipient: Joi.number()
                            .integer()
                            .valid(0, 1)
                            .default(0),

                    })

                )
                .default([]),

            // =========================
            // System Configuration
            // =========================

            cp_timezone_user: Joi.string()
                .trim()
                .max(100)
                .default('Asia/Singapore'),

            port_name : Joi.string()
                 .optional(),

            // =========================
            // Shares Certificate
            // =========================

            cp_share_certificate_payment: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            cp_allotment_partial_payment_share_cert: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            cp_transfer_partial_payment_share_cert: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            cp_each_partial_payment_share_cert: Joi.number()
                .integer()
                .valid(0, 1)
                .default(0),

            // =========================
            // Authorized Capital
            // =========================

            cp_authorized_captial_countries: Joi.array()
                .items(
                    Joi.alternatives().try(Joi.number().integer(), Joi.string())
                )
                .default([]),
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

            // on fail return comma separated errors
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

        // validated body
        req.body = value;

        return next();

    }

}

module.exports = CompanyProfileValidator;
