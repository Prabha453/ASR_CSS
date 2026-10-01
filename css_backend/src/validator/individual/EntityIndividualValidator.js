const Joi        = require('joi');
const httpStatus = require('http-status');
const ApiError   = require('../../helper/ApiError');

const validate = (schema) => async (req, res, next) => {
    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(req.body, options);
    if (error) {
        const msg = error.details.map((d) => d.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, msg));
    }
    req.body = value;
    return next();
};

// ─── Shared schemas ────────────────────────────────────────────────────────────

const identificationSchema = Joi.object({
    identification_id:   Joi.number().integer().allow(null),
    m_identification_id: Joi.number().integer().allow(null),
    id_number:           Joi.string().trim().max(100).required(),
    id_issued_country:   Joi.string().trim().max(100).allow(null, ''),
    id_issued_date:      Joi.date().iso().allow(null, ''),
    id_expired_date:     Joi.date().iso().allow(null, ''),
    document_url:        Joi.string().max(500).allow(null, ''),
    document_name:       Joi.string().max(200).allow(null, ''),
    is_primary:          Joi.boolean().default(false),
    created_by:          Joi.number().integer().allow(null),
});

const addressSchema = Joi.object({
    address_type:          Joi.string().valid('CONTACT','RESIDENTIAL','FOREIGN','REGISTERED','BUSINESS','MAILING','OTHER').default('CONTACT'),
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
    region_id:             Joi.number().integer().allow(null),
    proof_of_address_url:  Joi.string().max(500).allow(null, ''),
    proof_of_address_name: Joi.string().max(200).allow(null, ''),
    is_primary:            Joi.boolean().default(false),
    effective_from:        Joi.date().iso().allow(null, ''),
    effective_to:          Joi.date().iso().allow(null, ''),
    created_by:            Joi.number().integer().allow(null),
});

const contactSchema = Joi.object({
    contact_id:         Joi.number().integer().allow(null),
    contact_type:       Joi.string().valid('OFFICE','MOBILE','FAX','HOME','EMAIL','OTHER').default('MOBILE'),
    phone_country_code: Joi.string().max(10).default('+65'),
    contact_value:      Joi.string().max(500).allow(null, ''),
    is_primary:         Joi.boolean().default(false),
    created_by:         Joi.number().integer().allow(null),
});

const officialCompanyContactSchema = Joi.object({
    contact_id:     Joi.number().integer().required(),
    email:          Joi.string().trim().email().max(500).allow(null, ''),
    mobile:         Joi.string().trim().max(30).allow(null, ''),
    mobile_code:    Joi.string().trim().max(30).allow(null, ''),
    telephone:      Joi.string().trim().max(30).allow(null, ''),
    telephone_code: Joi.string().trim().max(30).allow(null, ''),
    office:         Joi.string().trim().max(30).allow(null, ''),
    office_code:    Joi.string().trim().max(30).allow(null, ''),
    ext_no:         Joi.string().trim().max(30).allow(null, ''),
});

const relationshipSchema = Joi.object({
    related_name:      Joi.string().max(300).allow(null, ''),
    related_entity_id: Joi.number().integer().allow(null),
    relationship_type: Joi.string().valid('FATHER','MOTHER','SPOUSE','SIBLING','CHILD','OTHER').required(),
    created_by:        Joi.number().integer().allow(null),
});

// ─── Exported validators ───────────────────────────────────────────────────────

class EntityIndividualValidator {

    createValidator = validate(
        Joi.object({
            name:       Joi.string().trim().max(300).required(),
            client_no:  Joi.string().trim().max(50).allow(null, ''),
            status:     Joi.string().valid('ACTIVE','INACTIVE','PENDING').default('ACTIVE'),
            created_by: Joi.number().integer().allow(null),

            salutation_id:             Joi.number().integer().allow(null),
            former_name:               Joi.string().max(300).allow(null, ''),
            member_alias_name:         Joi.string().max(200).allow(null, ''),
            member_assessment_rating:  Joi.string().valid('LOW','MEDIUM','HIGH','VERY_HIGH').allow(null, ''),
            member_gender:             Joi.string().valid('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY').allow(null, ''),
            member_dob:                Joi.date().iso().allow(null, ''),
            country_of_birth:          Joi.string().max(100).allow(null, ''),
            country_of_birth_code:     Joi.string().max(3).allow(null, ''),
            member_nationality:        Joi.string().max(100).allow(null, ''),
            member_nationality_code:   Joi.string().max(3).allow(null, ''),
            race_id:                   Joi.number().integer().allow(null),
            additional_notes:          Joi.string().allow(null, ''),
            father_name:               Joi.string().max(300).allow(null, ''),
            mother_name:               Joi.string().max(300).allow(null, ''),
            spouse_name:               Joi.string().max(300).allow(null, ''),
            preferred_contact_mode:    Joi.string().valid('EMAIL','MOBILE','TELEPHONE','WHATSAPP','FAX').allow(null, ''),
            skype_id:                  Joi.string().max(100).allow(null, ''),
            alternate_email:           Joi.string().email().max(200).allow(null, ''),
            services_to_contact:       Joi.string().max(300).allow(null, ''),
            notice_from_email:         Joi.boolean().default(true),
            notice_from_mobile_notify: Joi.boolean().default(false),
            notice_from_whatsapp:      Joi.boolean().default(false),
            occupation:                Joi.string().max(200).allow(null, ''),
            employer_name:             Joi.string().max(300).allow(null, ''),
            tax_id:                    Joi.string().max(50).allow(null, ''),
            individual_admin_access:   Joi.object().allow(null),
            individual_group_access:   Joi.object().allow(null),
            is_pep:                    Joi.boolean().default(false),
            pep_details:               Joi.string().allow(null, ''),

            identifications: Joi.array().items(identificationSchema).default([]),
            addresses:        Joi.array().items(addressSchema).default([]),
            contacts:         Joi.array().items(contactSchema).default([]),
            relationships:    Joi.array().items(relationshipSchema).default([]),
            tag_ids:          Joi.array().items(Joi.number().integer()).default([]),
            port_name : Joi.string().optional(),
        })
    );

    updateValidator = validate(
        Joi.object({
            name:                      Joi.string().trim().max(300),
            client_no:                 Joi.string().trim().max(50).allow(null, ''),
            status:                    Joi.string().valid('ACTIVE','INACTIVE','PENDING'),
            updated_by:                Joi.number().integer().allow(null),
            created_by:                Joi.number().integer().allow(null),
            salutation_id:             Joi.number().integer().allow(null),
            former_name:               Joi.string().max(300).allow(null, ''),
            member_alias_name:         Joi.string().max(200).allow(null, ''),
            member_assessment_rating:  Joi.string().valid('LOW','MEDIUM','HIGH','VERY_HIGH').allow(null, ''),
            member_gender:             Joi.string().valid('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY').allow(null, ''),
            member_dob:                Joi.date().iso().allow(null, ''),
            country_of_birth:          Joi.string().max(100).allow(null, ''),
            country_of_birth_code:     Joi.string().max(3).allow(null, ''),
            member_nationality:        Joi.string().max(100).allow(null, ''),
            member_nationality_code:   Joi.string().max(3).allow(null, ''),
            race_id:                   Joi.number().integer().allow(null),
            additional_notes:          Joi.string().allow(null, ''),
            father_name:               Joi.string().max(300).allow(null, ''),
            mother_name:               Joi.string().max(300).allow(null, ''),
            spouse_name:               Joi.string().max(300).allow(null, ''),
            preferred_contact_mode:    Joi.string().valid('EMAIL','MOBILE','TELEPHONE','WHATSAPP','FAX').allow(null, ''),
            skype_id:                  Joi.string().max(100).allow(null, ''),
            alternate_email:           Joi.string().email().max(200).allow(null, ''),
            services_to_contact:       Joi.string().max(300).allow(null, ''),
            notice_from_email:         Joi.boolean(),
            notice_from_mobile_notify: Joi.boolean(),
            notice_from_whatsapp:      Joi.boolean(),
            occupation:                Joi.string().max(200).allow(null, ''),
            employer_name:             Joi.string().max(300).allow(null, ''),
            tax_id:                    Joi.string().max(50).allow(null, ''),
            individual_admin_access:   Joi.object().allow(null),
            individual_group_access:   Joi.object().allow(null),
            is_pep:                    Joi.boolean(),
            pep_details:               Joi.string().allow(null, ''),

            identifications: Joi.array().items(identificationSchema),
            addresses:       Joi.array().items(addressSchema),
            contacts:        Joi.array().items(contactSchema),
            official_company_contacts: Joi.array().items(officialCompanyContactSchema),
            relationships:   Joi.array().items(relationshipSchema),
            tag_ids:         Joi.array().items(Joi.number().integer()),
            port_name : Joi.string().optional(),
        })
    );

    createIdentificationValidator = validate(identificationSchema);
    updateIdentificationValidator  = validate(
        identificationSchema.fork(['id_number'], (s) => s.optional())
    );

    createAddressValidator = validate(addressSchema);
    updateAddressValidator = validate(addressSchema);

    createContactValidator = validate(contactSchema);
    updateContactValidator = validate(contactSchema);

    createRelationshipValidator = validate(relationshipSchema);
    updateRelationshipValidator = validate(
        relationshipSchema.fork(['relationship_type'], (s) => s.optional())
    );

}

module.exports = EntityIndividualValidator;
