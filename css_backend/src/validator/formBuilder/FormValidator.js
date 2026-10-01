'use strict';

const Joi        = require('joi');
const httpStatus = require('http-status');
const ApiError   = require('../../helper/ApiError');

// ─── popup row / section sub-schemas ─────────────────────────────────────────

const popupRowSchema = Joi.object({
    pop_up_field_id: Joi.alternatives()
        .try(Joi.number().integer(), Joi.string().allow(''))
        .allow(null)
        .default(''),

    popup_fields: Joi.string().allow(null, '').default(''),

    pop_up_temp_param: Joi.string().allow(null, '').default(''),

    pop_up_field_label_name: Joi.string().allow(null, '').default(''),

}).options({ allowUnknown: true });

const popupSectionSchema = Joi.object({
    section_name: Joi.string().allow(null, '').default(''),
    rows: Joi.array().items(popupRowSchema).default([]),
}).options({ allowUnknown: true });

// ─── custom type: popup_fields may arrive as a JSON string (FormData) or array ─

const popupFieldsType = Joi.alternatives().try(
    Joi.array().items(popupSectionSchema).default([]),

    // FormData sends it as a JSON string — parse it, then validate the array
    Joi.string().custom((val, helpers) => {
        let parsed;
        try   { parsed = JSON.parse(val); }
        catch { return helpers.error('any.invalid'); }

        if (!Array.isArray(parsed)) return helpers.error('any.invalid');

        const result = Joi.array().items(popupSectionSchema).validate(parsed);
        if (result.error) return helpers.error('any.invalid');
        return result.value;
    })
).default([]);

// ─── main validator ───────────────────────────────────────────────────────────

class FormValidator {

    aiEditValidator = async (req, res, next) => {
        const schema = Joi.object({
            action: Joi.string().valid(
                'improve', 'grammar', 'professional', 'shorten', 'expand', 'custom'
            ).required(),
            scope: Joi.string().valid('selection', 'document').required(),
            content: Joi.string().min(1).max(60000).required(),
            custom_instruction: Joi.string().trim().max(1000)
                .when('action', {
                    is: 'custom',
                    then: Joi.required(),
                    otherwise: Joi.optional().allow('', null),
                }),
            form_id: Joi.number().integer().positive().allow(null),
        });
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
        });
        if (error) {
            return next(new ApiError(
                httpStatus.BAD_REQUEST,
                error.details.map(detail => detail.message).join(', ')
            ));
        }
        req.body = value;
        return next();
    };

    popupSchemaMergeValidator = async (req, res, next) => {
        const schema = Joi.object({
            form_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(50).unique().required(),
        });
        const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
        if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error.details.map(item => item.message).join(', ')));
        req.body = value;
        return next();
    };

    popupOptionValidator = async (req, res, next) => {
        const schema = Joi.object({
            entity_id: Joi.number().integer().positive().required(),
            parent_value: Joi.number().integer().positive(),
            official_role: Joi.string().trim().max(100),
            search: Joi.string().trim().max(100).allow(''),
            limit: Joi.number().integer().min(1),
            page: Joi.number().integer().min(1),
        });
        const { error, value } = schema.validate(req.query, { abortEarly: false, allowUnknown: false });
        if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error.details.map(item => item.message).join(', ')));
        req.query = value;
        return next();
    };

    popupSubmissionValidator = async (req, res, next) => {
        const schema = Joi.object({
            entity_id: Joi.number().integer().positive().required(),
            popup_values: Joi.object().unknown(true).default({}),
        });
        const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
        if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error.details.map(item => item.message).join(', ')));
        req.body = value;
        return next();
    };

    popupSchemaValidator = async (req, res, next) => {
        const field = Joi.object({
            field_key: Joi.string().trim().max(120).required(),
            label: Joi.string().trim().max(250).required(),
            control_type: Joi.string().valid(
                'TEXT', 'TEXTAREA', 'DATE', 'NUMBER', 'SELECT', 'MULTISELECT', 'CHECKBOX',
                'ENTITY_SELECT', 'EVENT_SELECT', 'OFFICIAL_SELECT', 'SHAREHOLDER_SELECT', 'SHARE_SELECT'
            ).required(),
            value_source: Joi.string().valid('MANUAL', 'COMPANY', 'EVENT', 'OFFICIALS', 'SHAREHOLDERS', 'SHARES').required(),
            required: Joi.boolean().default(false),
            multiple: Joi.boolean().default(false),
            depends_on: Joi.array().items(Joi.string().trim().max(120)).unique().default([]),
            options: Joi.array().items(Joi.object().unknown(true)).default([]),
            order: Joi.number().integer().min(0),
        }).options({ allowUnknown: false });
        const schema = Joi.object({
            sections: Joi.array().items(Joi.object({
                section_key: Joi.string().trim().max(120).required(),
                label: Joi.string().trim().max(250).required(),
                order: Joi.number().integer().min(0),
                fields: Joi.array().items(field).default([]),
            }).options({ allowUnknown: false })).required(),
        });
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error.details.map(item => item.message).join(', ')));
        req.body = value;
        return next();
    };

    previewValidator = async (req, res, next) => {
        const schema = Joi.object({
            entity_id: Joi.number().integer().positive().required(),
            company_event_id: Joi.number().integer().positive().allow(null),
            popup_values: Joi.object().unknown(true).default({}),
        });
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
        });
        if (error) {
            return next(new ApiError(
                httpStatus.BAD_REQUEST,
                error.details.map(detail => detail.message).join(', ')
            ));
        }
        req.body = value;
        return next();
    };

    saveValidator = async (req, res, next) => {

        const schema = Joi.object({

            // ── identifiers ────────────────────────────────────────────────
            category_id: Joi.alternatives()
                .try(
                    Joi.array().items(
                        Joi.alternatives().try(Joi.number().integer(), Joi.string())
                    ).min(1),
                    Joi.number().integer(),
                    Joi.string()
                )
                .required(),

            assigned_user_id: Joi.alternatives()
                .try(
                    Joi.array().items(
                        Joi.alternatives().try(Joi.number().integer(), Joi.string())
                    ),
                    Joi.number().integer(),
                    Joi.string()
                )
                .allow(null)
                .default(null),

            // ── names ──────────────────────────────────────────────────────
            form_name: Joi.string().trim().max(250).required(),

            form_slug: Joi.string().trim().max(250).allow(null, ''),

            download_name: Joi.string().trim().max(250).allow(null, ''),

            // ── content ────────────────────────────────────────────────────
            form_content: Joi.string().allow(null, '').default(''),

            // accepts array OR JSON string (sent via FormData)
            popup_fields: popupFieldsType,

            // ── layout ─────────────────────────────────────────────────────
            orientation: Joi.string().valid('Portrait', 'Landscape').default('Portrait'),

            margin_top: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            margin_right: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            margin_bottom: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            margin_left: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            header_margin: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            footer_margin: Joi.alternatives()
                .try(Joi.number(), Joi.string().pattern(/^\d+(\.\d+)?$/))
                .allow(null, ''),

            // ── metadata ───────────────────────────────────────────────────
            country_code: Joi.string().max(50).allow(null, ''),

            default_library: Joi.string().max(50).allow(null, ''),

            // ── form_type: 0=Form-Builder, 1=Esign, 2=Manual ──────────────
            // FIX: was .valid(0,1) — now includes 2 (Manual)
            form_type: Joi.alternatives()
                .try(
                    Joi.number().integer().valid(0, 1, 2),
                    Joi.string().valid('0', '1', '2')
                )
                .default(0),

            // ── flags ──────────────────────────────────────────────────────
            pdpa_required: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.number().integer().valid(0, 1),
                    Joi.string().valid('0', '1')
                )
                .default(false),

            // make_esign_copy: PHP checks for truthy string, so allow any string/bool
            make_esign_copy: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.string().allow('', 'make_esign_copy'),
                    Joi.number().integer().valid(0, 1)
                )
                .allow(null)
                .default(''),

            status: Joi.alternatives()
                .try(
                    Joi.boolean(),
                    Joi.number().integer().valid(0, 1),
                    Joi.string().valid('0', '1')
                )
                .default(true),

            // ── save behaviour ─────────────────────────────────────────────
            // FIX: was missing entirely — caused req.body.save_type to be stripped
            save_type: Joi.string()
                .valid('save', 'save_as', 'duplicate_form', 'move_to_live')
                .default('save'),

            port_name : Joi.string()
                        .optional(),

            // ── audit ──────────────────────────────────────────────────────
            updated_by: Joi.number().integer().allow(null),
            created_by: Joi.number().integer().allow(null),

        });

        const { error, value } = schema.validate(req.body, {
            abortEarly:    false,
            allowUnknown:  true,
            stripUnknown:  false,
        });

        if (error) {
            const errorMessage = error.details.map((d) => d.message).join(', ');
            return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
        }

        req.body = value;
        return next();
    };

    createValidator = async (req, res, next) => {
        return this.saveValidator(req, res, next);
    };
}

module.exports = FormValidator;
