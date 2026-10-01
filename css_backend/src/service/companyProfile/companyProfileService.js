'use strict';

const httpStatus = require('http-status');
const { Op }     = require('sequelize');

const CompanyProfileDao        = require('../../dao/companyProfile/CompanyProfileDao');
const CompanyProfileContactDao = require('../../dao/companyProfile/CompanyProfileContactDao');
const EmailConfigurationDao    = require('../../dao/companyProfile/EmailConfigurationDao');
const AddressHistoryDao        = require('../../dao/companyProfile/AddressHistoryDao');
const DocumentStoreDaos        = require('../../dao/DocumentStoreDao');

const responseHandler      = require('../../helper/responseHandler');
const logger               = require('../../config/logger');
const { getCurrentModels, getSequelizeForDb } = require('../../models');

const config = require('../../config/config');

const table                = require('../../helper/dbTable');
const {
    uploadDocument,
    removeDocument,
} = require('../../helper/documentHelper');

// ─────────────────────────────────────────────────────────────────────────────
const ADDR_TYPE_COMPANY = 0;
const EFFECTIVE         = 1;

const IMAGE_FIELD_MAP = {
    cp_company_logo:   {
        urlKey:      'cp_company_logo_url',
        docCategory: 'company_logo',
        subFolder:   'company_profile/company_logo',
    },
    cp_port_logo:      {
        urlKey:      'cp_port_logo_url',
        docCategory: 'portal_logo',
        subFolder:   'company_profile/portal_logo',
    },
    cp_port_fav_icon:  {
        urlKey:      'cp_port_fav_icon_url',
        docCategory: 'portal_fav_icon',
        subFolder:   'company_profile/portal_fav_icon',
    },
    cp_login_bg_image: {
        urlKey:      'cp_login_bg_image_url',
        docCategory: 'login_bg_image',
        subFolder:   'company_profile/login_bg',
    },
};

// Maps document_store.sub_module_name → profile urlKey
const SUB_MODULE_TO_URL_KEY = {
    cp_company_logo:   'cp_company_logo_url',
    cp_port_logo:      'cp_port_logo_url',
    cp_port_fav_icon:  'cp_port_fav_icon_url',
    cp_login_bg_image: 'cp_login_bg_image_url',
};

// ─────────────────────────────────────────────────────────────────────────────
// Default image relative paths — converted to full URLs at runtime via req
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_IMAGE_PATHS = {
    cp_company_logo_url:   '/uploads/default_images/default_company_logo.png',
    cp_port_logo_url:      '/uploads/default_images/default_port_logo.png',
    cp_port_fav_icon_url:  '/uploads/default_images/favicon.ico',
    cp_login_bg_image_url: '/uploads/default_images/default_login_page_bg.jpg',
};

// ─────────────────────────────────────────────────────────────────────────────
// _getBaseUrl
//
// Builds the base URL (scheme + host) from the Express req object.
// Falls back to empty string if req is not available — callers get
// relative paths in that case, which is still safe for the frontend.
// ─────────────────────────────────────────────────────────────────────────────
const _getBaseUrl = (req) => {
    if (!req) return '';
    const protocol = req.protocol || 'http';
    const host     = req.get('host') || 'localhost:5000';
    return `${protocol}://${host}`;
};

const _isSuperAdminUser = (user = {}) => {
    const candidates = [
        user.user_role,
        user.role,
        user.role_name,
        user.user_type,
        user.roleName,
        user.user?.user_role,
        user.user?.role,
        ...(Array.isArray(user.roles) ? user.roles : []),
    ];

    return candidates
        .filter(Boolean)
        .some(value => String(value?.role_name || value?.name || value).trim().toUpperCase().replace(/[_-]+/g, ' ') === 'SUPER ADMIN');
};

const _stripSmtpSecrets = (rows = []) => (rows || []).map((row) => {
    const value = row?.toJSON ? row.toJSON() : { ...row };
    return {
        ...value,
        smtp_host: '',
        smtp_port: null,
        smtp_user: '',
        smtp_password: '',
        smtp_encryption: '',
    };
});

// ─────────────────────────────────────────────────────────────────────────────
// _ensureFullUrl
//
// Already a full URL  → return as-is
// Relative path + req → prefix with base URL
// Relative path, no req → return as-is (relative)
// ─────────────────────────────────────────────────────────────────────────────
const _ensureFullUrl = (url, req) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = _getBaseUrl(req);
    if (!base) return url;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// _buildDefaultImages
//
// Returns the DEFAULT_IMAGE_PATHS map with each value converted to a
// full absolute URL using the current request's base URL.
// This means default images get the same http://host/... treatment as
// uploaded images — no hardcoded host anywhere.
// ─────────────────────────────────────────────────────────────────────────────
const _buildDefaultImages = (req) => {
    const base = _getBaseUrl(req);
    return Object.fromEntries(
        Object.entries(DEFAULT_IMAGE_PATHS).map(([key, relativePath]) => [
            key,
            base ? `${base}${relativePath}` : relativePath,
        ])
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// _resolveImageUrls
//
// Starts from dynamic defaults (full URLs built from req),
// then overrides each slot where a real document_store row exists.
// ─────────────────────────────────────────────────────────────────────────────
const _resolveImageUrls = (docRows = [], req = null) => {
    // ✅ Defaults are now full URLs based on req — not hardcoded strings
    const imageUrls = _buildDefaultImages(req);

    (docRows || []).forEach((doc) => {
        const urlKey = SUB_MODULE_TO_URL_KEY[doc.sub_module_name];
        if (urlKey) {
            const url = doc.cdn_url || doc.file_path || null;
            if (url) {
                // ✅ Uploaded paths also get full URL treatment
                imageUrls[urlKey] = _ensureFullUrl(url, req);
            }
            // No url → keep the dynamic default for this slot
        }
    });

    return imageUrls;
};

class CompanyProfileService {

    constructor() {
        this.companyProfileDao        = new CompanyProfileDao();
        this.companyProfileContactDao = new CompanyProfileContactDao();
        this.emailConfigurationDao    = new EmailConfigurationDao();
        this.addressHistoryDao        = new AddressHistoryDao();
        this.documentStoreDao         = new DocumentStoreDaos();
    }

    async _checkExists(id = 1) {
        return this.companyProfileDao.findOneByWhere({ cp_id: id, is_deleted: false });
    }

    async _resolvePort(portName) {
        if (!portName) throw new Error('portName is required');

        try {
            const db = await getSequelizeForDb(config.portDbName);
            if (!db) {
                logger.error(`[_resolvePort] Failed to connect db port="${portName}"`);
            }

            const [results] = await db.sequelize.query(
                'SELECT port_number, port_db FROM ports WHERE port_db = ? LIMIT 1',
                { replacements: [portName] }
            );

            if (!results || results.length === 0) {
                throw new Error(`Port not found for portName: "${portName}"`);
            }

            return {
                port_number: results[0].port_number,
                port_name:   results[0].port_db,
            };
        } catch (err) {
            logger.error(`[_resolvePort] Failed to resolve portName="${portName}":`, err.message);
            throw err;
        }
    }

    _trimObj(obj) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        );
    }

    _buildAddressArr(body) {
        return this._trimObj({
            block:       body.a_other_add_block        || '',
            address:     body.a_other_add_address_text || '',
            building:    body.a_other_add_building     || '',
            level:       body.a_other_add_level        || '',
            unit:        body.a_other_add_unit         || '',
            country:     body.a_other_add_country      || '',
            postal_code: body.a_other_add_pcode        || '',
            state: '', city: '',
        });
    }

    _buildOldAddressArr(profile) {
        return this._trimObj({
            block:       profile.cp_reg_add_block      || '',
            address:     profile.cp_registered_address || '',
            building:    profile.cp_reg_add_building   || '',
            level:       profile.cp_reg_add_level      || '',
            unit:        profile.cp_reg_add_unit       || '',
            country:     profile.cp_country            || '',
            postal_code: profile.cp_reg_add_pcode      || '',
            state: '', city: '',
        });
    }

    async _processImageUploads(files = [], recordId, userId, portId, portName, req) {
        const urlUpdates = {};
        if (!Array.isArray(files) || files.length === 0) return urlUpdates;

        for (const file of files) {
            const mapping = IMAGE_FIELD_MAP[file.fieldname];
            if (!mapping) continue;

            try {
                const doc = await uploadDocument({
                    file,
                    userId,
                    port_number:      portId,
                    port_name:        portName,
                    entity_id:        0,
                    entity_type:      'company',
                    module_name:      'company_profile',
                    sub_module_name:  file.fieldname,
                    module_record_id: recordId,
                    doc_category:     mapping.docCategory,
                    doc_name:         file.originalname || file.fieldname,
                    sub_folder:       mapping.subFolder,
                    replace_existing: true,
                    delete_old_file:  true,
                    existing_where: {
                        module_record_id: recordId,
                        entity_type:      'company',
                        sub_module_name:  file.fieldname,
                    },
                    req,
                });

                if (doc) {
                    urlUpdates[mapping.urlKey] = doc.file_path || '';
                    logger.info(
                        `[CompanyProfileService] port=${portName}(${portId}) ` +
                        `"${file.fieldname}" → ${urlUpdates[mapping.urlKey]}`
                    );
                }
            } catch (imgErr) {
                logger.error(
                    `[CompanyProfileService] upload failed "${file.fieldname}": ${imgErr.message}`
                );
            }
        }

        return urlUpdates;
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET company profile
    // ─────────────────────────────────────────────────────────────────────
    get = async (id = 1, portName = null, req = null) => {
        try {
            const profile = await this._checkExists(id);
            if (!profile) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company profile not found'
                );
            }

            const contacts     = await this.companyProfileContactDao.findByWhere({ cp_id: id });
            const emailConfigs = await this.emailConfigurationDao.findByWhere({ is_deleted: false });
            const canManageSmtp = _isSuperAdminUser(req?.user || {});

            let portId = null;
            if (portName) {
                try {
                    const resolved = await this._resolvePort(portName);
                    portId = resolved.port_number;
                } catch (portErr) {
                    logger.warn(`[get] Could not resolve port: ${portErr.message}`);
                }
            }

            const docWhere = {
                module_record_id: id,
                entity_type:      'company',
                module_name:      'company_profile',
                is_deleted:       false,
                ...(portId ? { port_number: portId } : {}),
            };

            const docRows = await this.documentStoreDao.findByWhere(docWhere);

            const documents = (docRows || []).map((d) => ({
                doc_id:          d.doc_id,
                sub_module_name: d.sub_module_name,
                port_number:     d.port_number,
                cdn_url:         d.cdn_url   || d.file_path || null,
                file_path:       d.file_path || null,
            }));

            // ✅ Defaults AND uploaded URLs are now full absolute URLs from req
            const imageUrls = _resolveImageUrls(docRows, req);

            const rawProfile = profile.toJSON();
            let authorizedCountries = [];
            try { authorizedCountries = JSON.parse(rawProfile.cp_authorized_captial_countries || '[]'); } catch (_) {}

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Company profile fetched successfully',
                {
                    profile: {
                        ...rawProfile,
                        cp_authorized_captial_countries: authorizedCountries,
                        ...imageUrls,
                        documents,
                    },
                    contacts:     contacts     || [],
                    emailConfigs: canManageSmtp ? (emailConfigs || []) : _stripSmtpSecrets(emailConfigs),
                }
            );

        } catch (err) {
            logger.error('Get company profile error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching company profile'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // UPDATE company profile
    // ─────────────────────────────────────────────────────────────────────
    update = async (id, body, files = [], userId = null, req = null) => {
        try {
            const existingProfile = await this._checkExists(id);
            const canManageSmtp = _isSuperAdminUser(req?.user || {});

            const portName = body.port_name || null;
            let portId     = null;

            if (portName) {
                try {
                    const resolved = await this._resolvePort(portName);
                    portId = resolved.port_number;
                    logger.info(`[update] Resolved port: ${portName} → port_number=${portId}`);
                } catch (portErr) {
                    logger.warn(`[update] Could not resolve port "${portName}": ${portErr.message}`);
                }
            }

            const imageUrlUpdates = await this._processImageUploads(
                files, id, userId, portId, portName, req
            );

            const profileData = {
                cp_company_name:      body.cp_company_name,
                cp_registration_no:   body.cp_registration_no,
                cp_country:           body.cp_country,
                cp_registered_client: body.cp_registered_client || 0,
                cp_mailling_address:  body.cp_mailling_address  || 0,

                cp_reg_add_block:      body.cp_reg_add_block      || '',
                cp_registered_address: body.cp_registered_address || '',
                cp_reg_add_building:   body.cp_reg_add_building   || '',
                cp_reg_add_level:      body.cp_reg_add_level      || '',
                cp_reg_add_unit:       body.cp_reg_add_unit       || '',
                cp_reg_add_pcode:      body.cp_reg_add_pcode      || '',

                cp_profile_image:     body.cp_profile_image,
                cp_profile_image_url: body.cp_profile_image_url  || '',

                cp_currency:                body.cp_currency                || 'SGD',
                cp_gst:                     body.cp_gst                     || '0',
                cp_default_level_held_time: body.cp_default_level_held_time || '',
                cp_theme_style:             body.cp_theme_style             || 'custom',
                cp_caps_proper:             body.cp_caps_proper             || 0,
                cp_port_title:              body.cp_port_title              || '',

                cp_share_certificate_payment:            body.cp_share_certificate_payment            || 0,
                cp_allotment_partial_payment_share_cert: body.cp_allotment_partial_payment_share_cert || 0,
                cp_transfer_partial_payment_share_cert:  body.cp_transfer_partial_payment_share_cert  || 0,
                cp_each_partial_payment_share_cert:      body.cp_each_partial_payment_share_cert      || 0,

                cp_authorized_captial_countries: (() => {
                    const v = body.cp_authorized_captial_countries;
                    if (!v || (Array.isArray(v) && v.length === 0)) return null;
                    return JSON.stringify(Array.isArray(v) ? v : (typeof v === 'string' ? v : '[]'));
                })(),

                cp_no_of_share_decimal_place:
                    body.cp_no_of_share_decimal_place != null && body.cp_no_of_share_decimal_place !== ''
                        ? Number(body.cp_no_of_share_decimal_place) : 0,
                cp_paid_up_share_decimal_place:
                    body.cp_paid_up_share_decimal_place != null && body.cp_paid_up_share_decimal_place !== ''
                        ? Number(body.cp_paid_up_share_decimal_place) : 0,
                cp_issued_share_decimal_place:
                    body.cp_issued_share_decimal_place != null && body.cp_issued_share_decimal_place !== ''
                        ? Number(body.cp_issued_share_decimal_place) : 0,

                cp_timezone_user: body.cp_timezone_user || 'Asia/Singapore',
                updated_date:     new Date(),
                is_deleted:       false,

                ...imageUrlUpdates,

                ...Object.fromEntries(
                    Object.values(IMAGE_FIELD_MAP)
                        .filter(({ urlKey }) => !(urlKey in imageUrlUpdates))
                        .map(({ urlKey }) => [urlKey, body[urlKey] || ''])
                ),
            };

            if (Array.isArray(body.cp_email_config) && body.cp_email_config.length > 0) {
                const defaultConfig = body.cp_email_config.find(
                    (c) => c.sending_default_email === true
                );
                if (defaultConfig) {
                    profileData.cp_smtp_email         = defaultConfig.smtp_email;
                    profileData.cp_aws_ses            = defaultConfig.aws_ses || 0;
                    profileData.cp_from_name          = defaultConfig.from_name;
                    profileData.cp_reply_email        = defaultConfig.reply_email;
                    profileData.cp_group_to_recipient = defaultConfig.group_to_recipient || 0;
                }
            }

            if (existingProfile) {
                await this.companyProfileDao.updateWhere(profileData, { cp_id: id });
            } else {
                profileData.cp_id        = id;
                profileData.created_date = new Date();
                await this.companyProfileDao.create(profileData);
            }

            await this._handleContactDetails(id, body);
            await this._handleEmailConfigurations(body, canManageSmtp);

            const updatedProfile = await this.companyProfileDao.findOneByWhere({ cp_id: id });
            const contacts       = await this.companyProfileContactDao.findByWhere({ cp_id: id });
            const emailConfigs   = await this.emailConfigurationDao.findByWhere({ is_deleted: false });

            const updatedDocWhere = {
                module_record_id: id,
                entity_type:      'company',
                module_name:      'company_profile',
                is_deleted:       false,
                ...(portId ? { port_number: portId } : {}),
            };
            const updatedDocRows = await this.documentStoreDao.findByWhere(updatedDocWhere);
            const updatedDocs    = (updatedDocRows || []).map((d) => ({
                doc_id:          d.doc_id,
                sub_module_name: d.sub_module_name,
                port_number:     d.port_number,
                cdn_url:         d.cdn_url   || d.file_path || null,
                file_path:       d.file_path || null,
            }));

            // ✅ Defaults AND uploaded URLs are now full absolute URLs from req
            const updatedImageUrls = _resolveImageUrls(updatedDocRows, req);

            return responseHandler.returnSuccess(
                httpStatus.OK,
                existingProfile
                    ? 'Company profile updated successfully'
                    : 'Company profile created successfully',
                {
                    profile: {
                        ...updatedProfile.toJSON(),
                        ...updatedImageUrls,
                        documents: updatedDocs,
                    },
                    contacts:     contacts     || [],
                    emailConfigs: canManageSmtp ? (emailConfigs || []) : _stripSmtpSecrets(emailConfigs),
                }
            );

        } catch (err) {
            logger.error('Update company profile error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating company profile'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // UPDATE address
    // ─────────────────────────────────────────────────────────────────────
    updateAddress = async (id, body) => {
        try {
            const { proposed_or_effective, address_effective_date, changed_by } = body;

            const existingProfile = await this._checkExists(id);
            if (!existingProfile) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Company profile not found'
                );
            }

            const newAddressArr = this._buildAddressArr(body);
            const oldAddressArr = this._buildOldAddressArr(existingProfile);
            const isEffective   = String(proposed_or_effective) === String(EFFECTIVE);

            let effectiveDate = '';
            let proposedDate  = '';

            if (address_effective_date && address_effective_date !== 'NULL') {
                if (isEffective) effectiveDate = address_effective_date;
                else             proposedDate  = address_effective_date;
            }

            const lastRecord = await this.addressHistoryDao.findOneByWhere(
                { type: ADDR_TYPE_COMPANY, ref_id: id },
                null,
                [['addr_history_id', 'DESC']]
            );

            const newDetailsJson = JSON.stringify(newAddressArr);
            let changeId = null;

            if (!lastRecord || newDetailsJson !== lastRecord.new_details) {
                const newRecord = await this.addressHistoryDao.create({
                    type:                  ADDR_TYPE_COMPANY,
                    ref_id:                id,
                    category:              'company_reg_Office_address',
                    proposed_or_effective: Number(proposed_or_effective),
                    proposed_date:         proposedDate,
                    effective_date:        effectiveDate || null,
                    old_details:           JSON.stringify(oldAddressArr),
                    new_details:           newDetailsJson,
                    changed_by:            changed_by || 0,
                    cron_status:           0,
                });
                changeId = newRecord.addr_history_id;
            } else {
                await this.addressHistoryDao.updateWhere(
                    {
                        proposed_or_effective: Number(proposed_or_effective),
                        effective_date:        effectiveDate || null,
                        proposed_date:         proposedDate || lastRecord.proposed_date || '',
                        changed_by:            changed_by   || lastRecord.changed_by,
                    },
                    { addr_history_id: lastRecord.addr_history_id }
                );
                changeId = lastRecord.addr_history_id;
            }

            if (isEffective && effectiveDate) {
                await this.companyProfileDao.updateWhere(
                    {
                        cp_reg_add_block:      body.a_other_add_block        || '',
                        cp_registered_address: body.a_other_add_address_text || '',
                        cp_reg_add_building:   body.a_other_add_building     || '',
                        cp_reg_add_level:      body.a_other_add_level        || '',
                        cp_reg_add_unit:       body.a_other_add_unit         || '',
                        cp_country:            body.a_other_add_country_id   || '',
                        cp_reg_add_pcode:      body.a_other_add_pcode        || '',
                        updated_date:          new Date(),
                    },
                    { cp_id: id }
                );
                if (changeId) {
                    await this.addressHistoryDao.updateWhere(
                        { cron_status: 1 },
                        { addr_history_id: changeId }
                    );
                }
            }

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Address change saved successfully',
                {
                    change_id:      changeId,
                    effective_date: effectiveDate || null,
                    proposed_date:  proposedDate  || null,
                }
            );

        } catch (err) {
            logger.error('Update company address error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error updating company address'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // GET address history
    // ─────────────────────────────────────────────────────────────────────
    getAddressHistory = async (id) => {
        try {
            const rows = await this.addressHistoryDao.findByWhere({
                type:   ADDR_TYPE_COMPANY,
                ref_id: id,
            });

            const history = (rows || []).map((row, index) => {
                let oldDetails = {};
                let newDetails = {};
                try { oldDetails = JSON.parse(row.old_details || '{}'); } catch (_) {}
                try { newDetails = JSON.parse(row.new_details || '{}'); } catch (_) {}

                const fmt = (d = {}) =>
                    [d.block, d.address,
                     d.level && d.unit ? `#${d.level}-${d.unit}` : '',
                     d.building, d.state, d.city, d.country, d.postal_code]
                    .filter(Boolean).join(' ');

                return {
                    sno:            index + 1,
                    id:             row.addr_history_id,
                    old_address:    fmt(oldDetails),
                    new_address:    fmt(newDetails),
                    proposed_date:  row.proposed_date  || '-',
                    effective_date: row.effective_date || '-',
                    type:           Number(row.proposed_or_effective) === EFFECTIVE
                        ? 'Effective' : 'Proposed',
                    cron_status:    row.cron_status,
                };
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Address history fetched successfully',
                history
            );

        } catch (err) {
            logger.error('Get address history error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error fetching address history'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // DELETE address history
    // ─────────────────────────────────────────────────────────────────────
    deleteAddressHistory = async (id) => {
        try {
            const record = await this.addressHistoryDao.findOneByWhere({
                addr_history_id: id,
            });
            if (!record) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Address history record not found'
                );
            }
            await this.addressHistoryDao.destroyWhere({ addr_history_id: id });
            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Address history record deleted successfully',
                { id }
            );
        } catch (err) {
            logger.error('deleteAddressHistory error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting address history'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // DELETE document
    // ─────────────────────────────────────────────────────────────────────
    deleteDocument = async (doc_id, portName = null) => {
        try {
            let portId = null;
            if (portName) {
                try {
                    const resolved = await this._resolvePort(portName);
                    portId = resolved.port_number;
                } catch (portErr) {
                    logger.warn(`[deleteDocument] Could not resolve port: ${portErr.message}`);
                }
            }

            const doc = await this.documentStoreDao.findOneByWhere({
                doc_id,
                is_deleted: false,
                ...(portId ? { port_number: portId } : {}),
            });

            if (!doc) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Document not found or does not belong to this port'
                );
            }

            const deleted = await removeDocument({
                doc_id,
                port_number: portId,
                userId:      null,
                hard_delete: true,
            });

            if (deleted) {
                return responseHandler.returnSuccess(
                    httpStatus.OK,
                    'Document deleted successfully',
                    { doc_id }
                );
            }

            return responseHandler.returnError(
                httpStatus.BAD_REQUEST,
                'Error while deleting document'
            );

        } catch (err) {
            logger.error('deleteDocument error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                err.message || 'Error deleting document'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Private: contact details
    // ─────────────────────────────────────────────────────────────────────
    async _handleContactDetails(id, body) {
        try {
            await this.companyProfileContactDao.destroyWhere({ cp_id: id });

            const db = getCurrentModels();
            await db.sequelize.query(
                `ALTER TABLE \`${table('company_profile_contact')}\` AUTO_INCREMENT = 1`
            );

            const emailIds       = body.cp_email_id       || [];
            const replyIds       = body.cp_reply_id       || [];
            const contactNumbers = body.cp_contact_number || [];
            const maxLength      = Math.max(
                emailIds.length,
                replyIds.length,
                contactNumbers.length
            );

            for (let i = 0; i < maxLength; i++) {
                const contactData = {
                    cp_id:        id,
                    email_id:     emailIds[i]       || '',
                    reply_id:     replyIds[i]       || '',
                    phone_no:     contactNumbers[i] || '',
                    created_date: new Date(),
                    is_deleted:   false,
                };
                if (contactData.email_id || contactData.reply_id || contactData.phone_no) {
                    await this.companyProfileContactDao.create(contactData);
                }
            }
        } catch (err) {
            logger.error('Handle contact details error:', err);
            throw err;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private: email configurations
    // ─────────────────────────────────────────────────────────────────────
    async _handleEmailConfigurations(body, canManageSmtp = false) {
        try {
            const emailConfigs = body.cp_email_config || [];
            const incomingIds  = emailConfigs
                .map(c => c.email_config_id)
                .filter(id => id && id !== '0');

            if (incomingIds.length > 0) {
                await this.emailConfigurationDao.updateWhere(
                    { is_deleted: 1, updated_date: new Date() },
                    {
                        email_config_id: { [Op.notIn]: incomingIds },
                        is_deleted: 0,
                    }
                );
            } else {
                await this.emailConfigurationDao.updateWhere(
                    { is_deleted: 1, updated_date: new Date() },
                    { is_deleted: 0 }
                );
            }

            for (const config of emailConfigs) {
                const configData = {
                    from_name:          config.from_name   || '',
                    sending_email:      config.smtp_email  || '',
                    reply_email:        config.reply_email || '',
                    aws_ses:            config.aws_ses ? 1 : 0,
                    group_to_recipient: config.group_to_recipient || 0,
                    is_default:         config.sending_default_email ? 1 : 0,
                    updated_date:       new Date(),
                };

                if (canManageSmtp) {
                    configData.smtp_host = config.smtp_host || '';
                    configData.smtp_port = config.smtp_port || 587;
                    configData.smtp_user = config.smtp_user || '';
                    configData.smtp_encryption = config.smtp_encryption || 'TLS';

                    if (config.smtp_password) {
                        configData.smtp_password = config.smtp_password;
                    }
                }

                if (config.email_config_id && config.email_config_id !== '0') {
                    await this.emailConfigurationDao.updateWhere(
                        configData,
                        { email_config_id: config.email_config_id }
                    );
                    if (config.sending_default_email) {
                        await this.emailConfigurationDao.updateWhere(
                            { is_default: 0 },
                            {
                                is_deleted:      0,
                                email_config_id: { [Op.ne]: config.email_config_id },
                            }
                        );
                    }
                } else {
                    configData.created_date = new Date();
                    configData.is_deleted   = false;
                    const newConfig = await this.emailConfigurationDao.create(configData);
                    if (config.sending_default_email) {
                        await this.emailConfigurationDao.updateWhere(
                            { is_default: 0 },
                            {
                                is_deleted:      0,
                                email_config_id: { [Op.ne]: newConfig.email_config_id },
                            }
                        );
                    }
                }
            }
        } catch (err) {
            logger.error('Handle email configurations error:', err);
            throw err;
        }
    }
}

module.exports = CompanyProfileService;
