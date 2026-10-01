const Joi = require('joi');
const httpStatus = require('http-status');

const ApiError = require('../../helper/ApiError');

class OfficialMasterValidator {

    async createValidator(req, res, next) {

        const schema = Joi.object({

            official_master_name: Joi.string()
                .trim()
                .max(150)
                .required(),

            official_order: Joi.number()
                .required()
                .allow(0, null, ''),

            is_representative: Joi.number()
                .valid(0, 1)
                .default(0),

            is_entity_type: Joi.string()
                .valid(
                    'COMPANY',
                    'INDIVIDUAL',
                    'ALL'
                )
                .default('ALL'),

            is_parent: Joi.number()
                .integer()
                .default(0),

            is_active: Joi.number()
            .valid(0, 1)
            .default(0),
            
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

module.exports = OfficialMasterValidator;