'use strict';

const Joi        = require('joi');
const httpStatus = require('http-status');
const ApiError   = require('../../helper/ApiError');

/**
 * EntityChargeValidator
 * Validates request bodies for POST /create and PUT /update/:charge_id.
 *
 * Field names mirror the FRONTEND Formik initialValues exactly.
 * The service's buildChargeRecord() / mapChargeeToDb() handles the
 * DB-column mapping, so we validate the frontend names here.
 */
class EntityChargeValidator {

    // ── Shared chargee schema ──────────────────────────────────────────────
    // Each chargee object is validated identically on create and update.
    #chargeeSchema = Joi.object({

        chargee_id : Joi.alternatives()
            .try(Joi.number().integer().positive(), Joi.string().allow('', null))
            .allow('', null),
            
        chargee_type: Joi.string()
            .valid('1', '2')          // '1' = Corporate, '2' = Individual
            .allow('', null),

        chargee_company_entity_id: Joi.when('chargee_type', {
            is:   '1',
            then: Joi.string().trim().max(255).required()
                    .messages({ 'any.required': 'Entity name is required for corporate chargee' }),
            otherwise: Joi.string().trim().max(255).allow('', null),
        }),

        // Individual fields
        chargee_individual_entity_id: Joi.alternatives()
            .try(Joi.number().integer().positive(), Joi.string().allow('', null))
            .allow('', null),

        // Monies
        chargee_secures_all_monies: Joi.string()
            .valid('1', '2')          // '1' = Yes, '2' = No
            .allow('', null),

        chargee_currency: Joi.string()
            .trim()
            .max(10)
            .allow('', null),

        chargee_amount_secured: Joi.when('chargee_secures_all_monies', {
            is:   '2',
            then: Joi.alternatives()
                    .try(
                        Joi.number().positive(),
                        Joi.string().pattern(/^\d+(\.\d{1,2})?$/)
                    )
                    .required()
                    .messages({ 'any.required': 'Amount secured is required when charge does not secure all monies' }),
            otherwise: Joi.alternatives()
                    .try(Joi.number().allow(null), Joi.string().allow('', null))
                    .allow(null),
        }),
    });

    // ── Shared base schema (fields common to create and update) ───────────
    #baseSchema = () => Joi.object({

        // Basic information
        company_id: Joi.alternatives()
            .try(Joi.number().integer().positive(), Joi.string().trim().min(1))
            .required()
            .messages({ 'any.required': 'Company is required' }),

        charge_number: Joi.string()
            .trim()
            .pattern(/^[1-9][0-9]*$/)
            .required()
            .messages({
                'any.required':    'Charge number is required',
                'string.pattern.base': 'Charge number must be numeric (e.g. 1001)',
            }),

        registration_date: Joi.string()
            .trim()
            .required()
            .messages({ 'any.required': 'Registration date is required' }),

        lodgement_type: Joi.string()
            .valid('1', '2', '3', '4')
            .allow('', null),

        // Instrument and its execution
        instrument_executed_location: Joi.string()
            .valid('1', '2')
            .allow('', null),

        charge_creation_date: Joi.string()
            .trim()
            .required()
            .messages({ 'any.required': 'Charge creation date is required' }),

        instrument_option: Joi.string()
            .valid('1', '2')
            .allow('', null),

        instrument_description: Joi.string()
            .valid(...Array.from({ length: 20 }, (_, i) => String(i + 1)))
            .allow('', null),

        instrument_date: Joi.string()
            .trim()
            .required()
            .messages({ 'any.required': 'Date of instrument is required' }),

        instrument_executed_presence: Joi.string()
            .trim()
            .max(1000)
            .allow('', null),

        property_description: Joi.string()
            .trim()
            .max(2000)
            .allow('', null),

        restrictions_prohibitions: Joi.string()
            .trim()
            .max(2000)
            .allow('', null),

        salient_covenants: Joi.string()
            .trim()
            .max(2000)
            .allow('', null),

        // Lodgement information
        statement_lodged_behalf_of: Joi.string()
            .valid('1', '2', '3')
            .allow('', null),

        type_of_charge: Joi.string()
            .valid(...Array.from({ length: 10 }, (_, i) => String(i + 1)))
            .allow('', null),

        satisfaction_date: Joi.string()
            .trim()
            .allow('', null),

        nature_of_satisfaction: Joi.string()
            .valid('1', '2', '3', '4', '5', '6')
            .allow('', null),

        // Remarks
        remarks: Joi.string()
            .trim()
            .max(2000)
            .allow('', null),

        // Chargees array
        chargees: Joi.array()
            .items(this.#chargeeSchema)
            .min(1)
            .required()
            .messages({
                'array.min':     'At least one chargee is required',
                'any.required':  'Chargees are required',
            }),

        // Meta — set by controller, not form fields
        created_by: Joi.number().integer().allow(null),
        updated_by: Joi.number().integer().allow(null),
        port_name : Joi.string().optional(),
        

        // reCAPTCHA token — required on both create and update
        recaptcha_token: Joi.string()
            .allow('', null),
    });

    // ── OPTIONS ───────────────────────────────────────────────────────────
    #joiOptions = {
        abortEarly:    false,   // collect ALL errors, not just the first
        allowUnknown:  true,    // tolerate extra keys (e.g. multipart fields)
        stripUnknown:  true,    // remove keys not in schema
    };

    // ── Helper: run schema and call next() or throw ApiError ──────────────
    #validate = (schema, req, res, next) => {
        const { error, value } = schema.validate(req.body, this.#joiOptions);

        if (error) {
            const message = error.details.map(d => d.message).join(', ');
            return next(new ApiError(httpStatus.BAD_REQUEST, message));
        }

        req.body = value;
        return next();
    };

    // ── CREATE ────────────────────────────────────────────────────────────
    createValidator = (req, res, next) => {
        const schema = this.#baseSchema();
        return this.#validate(schema, req, res, next);
    };

    // ── UPDATE ────────────────────────────────────────────────────────────
    // Same rules as create; charge_id comes from req.params, not req.body.
    updateValidator = (req, res, next) => {
        const schema = this.#baseSchema();
        return this.#validate(schema, req, res, next);
    };
}

module.exports = EntityChargeValidator;