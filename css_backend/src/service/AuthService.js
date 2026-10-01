'use strict';

const bcrypt        = require('bcryptjs');
const httpStatus    = require('http-status');

const UserDao           = require('../dao/UserDao');
const UserGroupDao      = require('../dao/UserGroupDao');
const UserPermissionDao = require('../dao/UserPermissionDao');
const CompanyProfileDao = require('../dao/companyProfile/CompanyProfileDao');
const DocumentStoreDao  = require('../dao/DocumentStoreDao');
const TokenDao          = require('../dao/TokenDao');

const { tokenTypes }        = require('../config/tokens');
const responseHandler       = require('../helper/responseHandler');
const logger                = require('../config/logger');
const RedisService          = require('./RedisService');
const UserPermissionService = require('./UserPermissionService');
const logHelper             = require('../helper/LogHelper');

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const OMIT_FIELDS = [
    'user_password',
    'password_salt',
    'twofa_secret',
    'zoom_client_secret',
    'zoom_account_password',
];

// ✅ Default image URLs — used when no document_store row exists for that slot

const DEFAULT_IMAGES = {
    cp_company_logo_url:   '/uploads/default_images/default_company_logo.png',
    cp_port_logo_url:      '/uploads/default_images/default_port_logo.png',
    cp_port_fav_icon_url:  '/uploads/default_images/favicon.ico',
    cp_login_bg_image_url: '/uploads/default_images/default_login_page_bg.jpg',
};

// ✅ Maps document_store.sub_module_name → company_profile urlKey
const SUB_MODULE_TO_URL_KEY = {
    cp_company_logo:   'cp_company_logo_url',
    cp_port_logo:      'cp_port_logo_url',
    cp_port_fav_icon:  'cp_port_fav_icon_url',
    cp_login_bg_image: 'cp_login_bg_image_url',
};

const _getBaseUrl = (req) => {
    if (!req) return '';

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';

    return `${protocol}://${host}`;
};

const _buildDefaultImages = (req) => {
    const base = _getBaseUrl(req);

    return Object.fromEntries(
        Object.entries(DEFAULT_IMAGES).map(([key, relativePath]) => [
            key,
            base ? `${base}${relativePath}` : relativePath,
        ])
    );
};

const _ensureFullUrl = (url, req) => {
    if (!url) return url;

    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
    ) {
        return url;
    }

    const base = _getBaseUrl(req);

    if (!base) {
        return url;
    }

    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────────────────────────────────────
class AuthService {

    constructor() {
        this.userDao            = new UserDao();
        this.userGroupDao       = new UserGroupDao();
        this.userPermissionDao  = new UserPermissionDao();
        this.companyProfileDao  = new CompanyProfileDao();
        this.documentStoreDao   = new DocumentStoreDao();
        this.tokenDao           = new TokenDao();
        this.redisService       = new RedisService();
    }

    // ─────────────────────────────────────────────────────────────────────
    // _getCompanyProfileForLogin
    // ─────────────────────────────────────────────────────────────────────

    async _getCompanyProfileForLogin(portNumber = null, req = null) {
        try {

            // ── Fetch company profile (cp_id = 1 always) ─────────────────
            const profile = await this.companyProfileDao.findOneByWhere({
                cp_id:      1,
                is_deleted: 0,
            });

            if (!profile) {
                return {
                    cp_port_title: '',
                    cp_company_name: '',
                    cp_theme_style: 'custom',
                    cp_timezone_user: 'Asia/Singapore',
                    cp_currency: 'SGD',
                    cp_caps_proper: 0,
                    ..._buildDefaultImages(req),
                };
            }

            const profileJson = profile.toJSON();

            // ── Fetch port-scoped document_store rows ─────────────────────
            // portNumber scopes documents so each port sees only its uploads
            const docWhere = {
                module_record_id: 1,
                entity_type:      'company',
                module_name:      'company_profile',
                is_deleted:       0,
                ...(portNumber ? { port_number: portNumber } : {}),
            };

            const docRows = await this.documentStoreDao.findByWhere(docWhere);

            // ── Build image URL map — start from defaults ─────────────────
            // Override each slot only if a real document_store URL exists
            const imageUrls = _buildDefaultImages(req);

            (docRows || []).forEach((doc) => {
                const urlKey = SUB_MODULE_TO_URL_KEY[doc.sub_module_name];
                if (urlKey) {
                    const url = doc.cdn_url || doc.file_path || null;
                    if (url) {
                        // ✅ Build full URL from req if stored URL is relative
                        imageUrls[urlKey] = _ensureFullUrl(url, req);
                    }
                    // If url is null/empty → keep default for this slot
                }
            });

            // ── Return branding fields + image URLs ───────────────────────
            return {
                cp_port_title:    profileJson.cp_port_title    || '',
                cp_company_name:  profileJson.cp_company_name  || '',
                cp_theme_style:   profileJson.cp_theme_style   || 'custom',
                cp_timezone_user: profileJson.cp_timezone_user || 'Asia/Singapore',
                cp_currency:      profileJson.cp_currency      || 'SGD',
                cp_caps_proper:   profileJson.cp_caps_proper   || 0,
                ...imageUrls,   // ✅ real URLs or defaults
            };

        } catch (err) {
            logger.warn(`[_getCompanyProfileForLogin] Error: ${err.message}`);
            // ✅ Never block login — return safe defaults
            return {
                cp_port_title: '',
                cp_company_name: '',
                cp_theme_style: 'custom',
                cp_timezone_user: 'Asia/Singapore',
                cp_currency: 'SGD',
                cp_caps_proper: 0,
                ..._buildDefaultImages(req),
            };
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // loginWithEmailPassword
    // ─────────────────────────────────────────────────────────────────────
    loginWithEmailPassword = async (email, password, portNumber = null, req = null) => {
        try {

            // ── 1. Find user ──────────────────────────────────────────────
            const user = await this.userDao.findOneByWhere({
                email:      email,
                is_deleted: 0,
            });

            if (!user) {
                // User not found — no user_id to log against; audit_log covers this
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Invalid email or password'
                );
            }

            // ── 1a. Check account status ──────────────────────────────────
            if (user.user_status !== 'ACTIVE') {
                const reasonMap = {
                    INACTIVE:  'ACCOUNT_INACTIVE',
                    SUSPENDED: 'ACCOUNT_SUSPENDED',
                };
                const failureReason = reasonMap[user.user_status] ?? 'ACCOUNT_INACTIVE';

                // ✅ Write FAILED login_history — account not active
                await logHelper.writeLoginHistory(req, {
                    user_id:        user.user_id,
                    login_status:   'FAILED',
                    failure_reason: failureReason,
                });

                return responseHandler.returnError(
                    httpStatus.UNAUTHORIZED,
                    'Your account is not active. Please contact the administrator.'
                );
            }

            // ── 2. Verify password ────────────────────────────────────────
            const passwordMatch = bcrypt.compareSync(password, user.user_password);
            if (!passwordMatch) {
                // ✅ Write FAILED login_history — wrong password (user_id is known)
                await logHelper.writeLoginHistory(req, {
                    user_id:        user.user_id,
                    login_status:   'FAILED',
                    failure_reason: 'WRONG_PASSWORD',
                });

                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Invalid email or password'
                );
            }

            // ── 3. Build user data — strip sensitive fields ───────────────
            const data = user.toJSON();
            OMIT_FIELDS.forEach((field) => delete data[field]);

            // ── 4. Build permissions ──────────────────────────────────────
            let groupPerms = {};
            if (user.user_group_id) {
                const group = await this.userGroupDao.findOneByWhere({
                    user_group_id: user.user_group_id,
                    is_deleted:    0,
                });
                if (group) {
                    groupPerms = typeof group.permissions_json === 'string'
                        ? JSON.parse(group.permissions_json)
                        : (group.permissions_json || {});
                }
            }

            const permRecord = await this.userPermissionDao.findOneByWhere({
                user_id:    user.user_id,
                is_deleted: 0,
            });
            const userOverrides = permRecord
                ? (typeof permRecord.permissions_json === 'string'
                    ? JSON.parse(permRecord.permissions_json)
                    : (permRecord.permissions_json || {}))
                : {};

            data.group_permissions = groupPerms;
            data.user_overrides    = userOverrides;
            data.permissions       = UserPermissionService.getEffectivePermissions(
                groupPerms,
                userOverrides
            );

            // ── 5. Fetch company profile + port-scoped images ─────────────
            // portNumber scopes document_store so each port sees its own uploads
            // Defaults used for any slot with no upload yet
            const companyProfile = await this._getCompanyProfileForLogin(portNumber, req);

            // ── 6. Return final response ──────────────────────────────────
            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Login successful',
                {
                    ...data,
                    // ✅ company_profile embedded — frontend stores in localStorage
                    company_profile: companyProfile,
                }
            );

        } catch (err) {
            logger.error('Login error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Login failed'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // changePassword
    // ─────────────────────────────────────────────────────────────────────
    changePassword = async (user_id, oldPassword, newPassword) => {
        try {

            const user = await this.userDao.findOneByWhere({
                user_id,
                is_deleted: 0,
            });

            if (!user) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'User not found'
                );
            }

            const passwordMatch = bcrypt.compareSync(oldPassword, user.user_password);
            if (!passwordMatch) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'Current password is incorrect'
                );
            }

            await this.userDao.updateWhere(
                {
                    user_password: bcrypt.hashSync(newPassword, 10),
                    updated_date:  new Date(),
                },
                { user_id }
            );

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Password changed successfully'
            );

        } catch (err) {
            logger.error('Change password error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error changing password'
            );
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // logout
    // ─────────────────────────────────────────────────────────────────────
    logout = async (req, res) => {
        try {

            const refreshTokenDoc = await this.tokenDao.findOne({
                token:       req.body.refresh_token,
                type:        tokenTypes.REFRESH,
                blacklisted: false,
            });

            if (!refreshTokenDoc) {
                return responseHandler.returnError(
                    httpStatus.BAD_REQUEST,
                    'User not found!'
                );
            }

            await this.tokenDao.remove({
                token:       req.body.refresh_token,
                type:        tokenTypes.REFRESH,
                blacklisted: false,
            });

            await this.tokenDao.remove({
                token:       req.body.access_token,
                type:        tokenTypes.ACCESS,
                blacklisted: false,
            });

            await this.redisService.removeToken(req.body.access_token,  'access_token');
            await this.redisService.removeToken(req.body.refresh_token, 'refresh_token');

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Logged out successfully'
            );

        } catch (err) {
            logger.error('Logout error:', err);
            return responseHandler.returnError(
                httpStatus.INTERNAL_SERVER_ERROR,
                'Error during logout'
            );
        }
    };

}

module.exports = AuthService;