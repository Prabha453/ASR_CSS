const Joi        = require('joi');
const httpStatus = require('http-status');
const ApiError   = require('../../helper/ApiError');

// Joi's date() type attempts `new Date('')` for an empty string BEFORE checking
// .allow(null, ''), producing an "Invalid Date" object instead of passing '' through —
// which then fails at the DB layer. Normalize empty-string date fields to null first,
// so clearing a date (e.g. the status-driven lifecycle dates) actually clears it.
const normalizeEmptyDates = (body) => {
    Object.keys(body || {}).forEach(key => {
        if (key.endsWith('_date') && body[key] === '') body[key] = null;
    });
    return body;
};

const validate = (schema) => async (req, res, next) => {
    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(normalizeEmptyDates(req.body), options);
    if (error) {
        const msg = error.details.map(d => d.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, msg));
    }
    req.body = value;
    return next();
};

// ─── Shared sub-schemas ────────────────────────────────────────────────────────

const addressSchema = Joi.object({
    address_type: Joi.string()
        .valid('CONTACT','RESIDENTIAL','FOREIGN','REGISTERED','BUSINESS','MAILING','OTHER','REGISTER_OF_MEMBERS')
        .default('REGISTERED'),
    block_no:              Joi.string().max(20).allow(null, ''),
    street_name:           Joi.string().max(200).allow(null, ''),
    building_name:         Joi.string().max(200).allow(null, ''),
    level_no:              Joi.string().max(20).allow(null, ''),
    unit_no:               Joi.string().max(50).allow(null, ''),
    city:                  Joi.string().max(100).allow(null, ''),
    state:                 Joi.string().max(100).allow(null, ''),
    postal_code:           Joi.string().max(20).allow(null, ''),
    country:               Joi.string().max(100).default('Singapore'),
    country_code:          Joi.string().max(3).allow(null, ''),
    region_id:             Joi.number().integer().allow(null,''),
    proof_of_address_url:  Joi.string().max(500).allow(null, ''),
    proof_of_address_name: Joi.string().max(200).allow(null, ''),
    is_primary:            Joi.boolean().default(false),
    effective_from:        Joi.date().iso().allow(null, ''),
    effective_to:          Joi.date().iso().allow(null, ''),
    created_by:            Joi.number().integer().allow(null,''),
});

const contactSchema = Joi.object({
    contact_id:         Joi.number().integer().allow(null),
    contact_type:       Joi.string().valid('OFFICE','MOBILE','FAX','HOME','EMAIL','OTHER').default('EMAIL'),
    phone_country_code: Joi.string().max(10).default('+65'),
    contact_value:      Joi.string().max(500).allow(null, ''),
    is_primary:         Joi.boolean().default(false),
    created_by:         Joi.number().integer().allow(null),
});

// ─── Core company fields ───────────────────────────────────────────────────────

const coreSchema = {
    // Entity
    name:               Joi.string().trim().max(300).required(),
    former_name:        Joi.string().max(300).allow(null, ''),
    client_no:          Joi.string().trim().max(50).allow(null, ''),
    status:             Joi.string().valid('ACTIVE','INACTIVE','PENDING').default('ACTIVE'),
    company_type_id:    Joi.number().integer().allow(null),
    remarks:            Joi.string().allow(null, ''),
    additional_remarks: Joi.string().allow(null, ''),
    created_by:         Joi.number().integer().allow(null),
    // Flat identification fields accepted for convenience — service maps them to entity_identification rows
    uen_no:      Joi.string().trim().max(50).allow(null, ''),
    fbrn_reg_no: Joi.string().trim().max(50).allow(null, ''),
    uf_no:       Joi.string().trim().max(50).allow(null, ''),
    domes_bus_no:Joi.string().trim().max(50).allow(null, ''),
    acra_no:     Joi.string().trim().max(50).allow(null, ''),

    // Detail
    corp_sec_id:              Joi.number().integer().allow(null),
    segregation_ids:          Joi.string().max(500).allow(null, ''),
    bn_ids:                   Joi.string().max(500).allow(null, ''),
    service_ids:              Joi.string().max(500).allow(null, ''),
    fee_id:                   Joi.number().integer().allow(null),
    e_status_id:              Joi.number().integer().allow(null),
    related_industry_id:      Joi.number().integer().allow(null),
    software_id:              Joi.number().integer().allow(null),
    ssic_id:                  Joi.number().integer().allow(null),
    ssic_user_description:    Joi.string().max(500).allow(null, ''),
    ssic_id_secondary:        Joi.number().integer().allow(null),
    ssic_user_description_secondary: Joi.string().max(500).allow(null, ''),
    risk_assessment_rating:   Joi.string().valid('LOW','MEDIUM','HIGH','VERY_HIGH').allow(null, ''),
    public_interest_company:  Joi.boolean().default(false),
    location_common_seal_remarks: Joi.string().allow(null, ''),
    jurisdiction_incorp_name: Joi.string().max(200).allow(null, ''),
    jurisdiction_corp_name:   Joi.string().max(200).allow(null, ''),
    jurisdiction_corp_id:     Joi.string().max(100).allow(null, ''),
    country:                  Joi.string().max(100).allow(null, ''),
    country_id:               Joi.number().integer().allow(null),
    region_id:                Joi.number().integer().allow(null),
    jurisdiction_id:          Joi.number().integer().allow(null, ''),
    company_incorporation_date:  Joi.date().iso().allow(null, ''),
    company_takeover_date:       Joi.date().iso().allow(null, ''),
    company_fin_date:            Joi.date().iso().allow(null, ''),
    mail_redirection:            Joi.boolean().default(false),
    holding_company_name:        Joi.string().max(300).allow(null, ''),
    holding_company_entity_id:   Joi.number().integer().allow(null),
    company_xbrl_required:       Joi.boolean().default(false),
    company_services_provided:   Joi.array().allow(null),
    bank_id:                     Joi.number().integer().allow(null),
    logo_name:                   Joi.string().max(300).allow(null, ''),
    logo_url:                    Joi.string().max(500).allow(null, ''),
    remove_company_logo:         Joi.any(),
    admin_access:                Joi.object().allow(null),
    group_access:                Joi.object().allow(null),
    user_access:                 Joi.object().allow(null),
    person_in_charge:            Joi.number().integer().allow(null),
    group_ids:                      Joi.string().max(255).allow(null, ''),
    referral_source:                Joi.string().max(100).allow(null, ''),
    company_referral_partner_id:    Joi.number().integer().allow(null),
    individual_referral_partner_id: Joi.number().integer().allow(null),
    senior_partner_id:              Joi.number().integer().allow(null),
    lawyer_id:                      Joi.number().integer().allow(null),
    manager_id:                     Joi.number().integer().allow(null),
    source_from:                 Joi.string().valid('FORM','DM','SCRIPT','API','MANUAL').default('MANUAL'),

    addresses: Joi.array().items(addressSchema).default([]),
    contacts:  Joi.array().items(contactSchema).default([]),
    tag_ids:   Joi.array().items(Joi.number().integer()).default([]),
    port_name : Joi.string().optional(),

    // Entity Status lifecycle: one shared date field, upserted into
    // entity_status_date (one row per entity_id + e_status_id) whenever it's provided.
    status_effective_date: Joi.date().iso().allow(null, ''),
    status_remarks:        Joi.string().allow(null, ''),
};

// ─── Exported validators ───────────────────────────────────────────────────────

class EntityCompanyValidator {

    createValidator = validate(Joi.object(coreSchema));

    updateValidator = validate(
        Joi.object({
            ...coreSchema,
            name:       Joi.string().trim().max(300),       // optional on update
            port_name : Joi.string().optional(),
            updated_by: Joi.number().integer().allow(null),
        }).fork(['name'], s => s.optional())
    );

    createAddressValidator = validate(addressSchema);
    updateAddressValidator = validate(addressSchema);

    createContactValidator = validate(contactSchema);
    updateContactValidator = validate(contactSchema);

}

module.exports = EntityCompanyValidator;
