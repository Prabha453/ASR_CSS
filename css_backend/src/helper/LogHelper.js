const logger = require('../config/logger');
const AuditLogDao    = require('../dao/AuditLogDao');
const LoginHistoryDao = require('../dao/LoginHistoryDao');

// ─── Module constants ──────────────────────────────────────────────────────────
const MODULES = {
    AUTH:        'AUTH',
    COMPANY:     'COMPANY',
    INDIVIDUAL:  'INDIVIDUAL',
    SHAREHOLDER: 'SHAREHOLDER',
    DIRECTOR:    'DIRECTOR',
    SECRETARY:   'SECRETARY',
    DOCUMENT:    'DOCUMENT',
    USER:        'USER',
    SETTINGS:    'SETTINGS',
    REPORT:      'REPORT',
    FORMS:       'FORMS',
    TEMPLATE:    'TEMPLATE',
    EVENT:       'EVENT',
    REMINDER:    'REMINDER',
    '3RD_PARTY':   '3RD_PARTY',
    '3RD_PARTY_API':'3RD_PARTY_API',
    SYSTEM:      'SYSTEM',
};

// ─── Action constants ──────────────────────────────────────────────────────────
const ACTIONS = {
    // Auth
    LOGIN:              'LOGIN',
    LOGOUT:             'LOGOUT',
    CHANGE_PASSWORD:    'CHANGE_PASSWORD',
    RESET_PASSWORD:     'RESET_PASSWORD',
    REFRESH_TOKEN:      'REFRESH_TOKEN',

    // Generic CRUD
    CREATE:             'CREATE',
    VIEW:               'VIEW',
    UPDATE:             'UPDATE',
    DELETE:             'DELETE',
    RESTORE:            'RESTORE',

    // Company
    CREATE_COMPANY:     'CREATE_COMPANY',
    UPDATE_COMPANY:     'UPDATE_COMPANY',
    DELETE_COMPANY:     'DELETE_COMPANY',
    ADD_DIRECTOR:       'ADD_DIRECTOR',
    REMOVE_DIRECTOR:    'REMOVE_DIRECTOR',
    ADD_SHAREHOLDER:    'ADD_SHAREHOLDER',
    REMOVE_SHAREHOLDER: 'REMOVE_SHAREHOLDER',
    FILE_AGM:           'FILE_AGM',
    FILE_AR:            'FILE_AR',
    FILE_CEI:           'FILE_CEI',

    // Document
    UPLOAD_DOCUMENT:    'UPLOAD_DOCUMENT',
    DELETE_DOCUMENT:    'DELETE_DOCUMENT',
    DOWNLOAD_DOCUMENT:  'DOWNLOAD_DOCUMENT',
    GENERATE_FORM:      'GENERATE_FORM',
    REGENERATE_FORM:    'REGENERATE_FORM',

    // User Management
    CREATE_USER:        'CREATE_USER',
    UPDATE_USER:        'UPDATE_USER',
    SUSPEND_USER:       'SUSPEND_USER',
    ACTIVATE_USER:      'ACTIVATE_USER',

    // Company Event
    CREATE_EVENT:       'CREATE_EVENT',
    UPDATE_EVENT:       'UPDATE_EVENT',
    DELETE_EVENT:       'DELETE_EVENT',
    EXTEND_EVENT_DUE_DATE: 'EXTEND_EVENT_DUE_DATE',
    CANCEL_EVENT_DUE_DATE_EXTENSION: 'CANCEL_EVENT_DUE_DATE_EXTENSION',
    DISPENSE_EVENT:     'DISPENSE_EVENT',
    CANCEL_DISPENSE_EVENT: 'CANCEL_DISPENSE_EVENT',
    EXEMPT_EVENT:        'EXEMPT_EVENT',
    CANCEL_EXEMPT_EVENT: 'CANCEL_EXEMPT_EVENT',
    SAVE_EVENT_RULE:    'SAVE_EVENT_RULE',
    DELETE_EVENT_RULE:  'DELETE_EVENT_RULE',
    SUBMIT_EVENT_RULE:  'SUBMIT_EVENT_RULE',
    APPROVE_EVENT_RULE: 'APPROVE_EVENT_RULE',
    PUBLISH_EVENT_RULE: 'PUBLISH_EVENT_RULE',
    RETIRE_EVENT_RULE:  'RETIRE_EVENT_RULE',
    UPDATE_EVENT_STATUS: 'UPDATE_EVENT_STATUS',
    REQUEST_GENERAL_EXTENSION: 'REQUEST_GENERAL_EXTENSION',
    REQUEST_GENERAL_WAIVER: 'REQUEST_GENERAL_WAIVER',
    CANCEL_GENERAL_WAIVER: 'CANCEL_GENERAL_WAIVER',
    UPDATE_EVENT_DOCUMENT_STATUS: 'UPDATE_EVENT_DOCUMENT_STATUS',
    SAVE_DOCUMENT_CHECKLIST_TEMPLATE: 'SAVE_DOCUMENT_CHECKLIST_TEMPLATE',

    // Reminder
    CREATE_REMINDER:            'CREATE_REMINDER',
    UPDATE_REMINDER:            'UPDATE_REMINDER',
    DELETE_REMINDER:            'DELETE_REMINDER',
    REMOVE_REMINDER_ATTACHMENT: 'REMOVE_REMINDER_ATTACHMENT',
};

// ─── Status constants ──────────────────────────────────────────────────────────
const STATUS = {
    SUCCESS: 'SUCCESS',
    FAILED:  'FAILED',
};

// ══════════════════════════════════════════════════════════════════════════════
class LogHelper {

    constructor() {
        this.auditLogDao      = new AuditLogDao();
        this.loginHistoryDao  = new LoginHistoryDao();
    }

    // ─── Extract IP / User-Agent / User from request ───────────────────────
    extractRequestMeta(req) {
        const ip =
            req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
            req?.headers?.['x-real-ip']                              ||
            req?.ip                                                  ||
            null;

        const userAgent = req?.headers?.['user-agent'] || null;

        // JWT middleware attaches decoded payload to req.user
        const userId = req?.user?.user_id || null;

        return { ip, userAgent, userId };
    }

    // ─── Async (awaitable) audit log writer ───────────────────────────────
    /**
     * Writes one row to cs_audit_log and returns the created record.
     *
     * @param {object}  req
     * @param {object}  options
     * @param {string}  options.action          Required — use ACTIONS constant
     * @param {string}  [options.module]        Use MODULES constant
     * @param {string}  [options.table_name]    DB table affected
     * @param {number}  [options.record_id]     PK of the affected row
     * @param {object}  [options.old_values]    Row state BEFORE the change
     * @param {object}  [options.new_values]    Row state AFTER the change
     * @param {string}  [options.status]        'SUCCESS' | 'FAILED'
     * @param {string}  [options.error_message] Populate when status = FAILED
     * @param {number}  [options.user_id]       Override the auto-detected user
     * @returns {Promise<object|null>}
     */
    async writeAuditLog(req, options = {}) {
        try {
            const { ip, userAgent, userId } = this.extractRequestMeta(req);

            const payload = {
                user_id:       options.user_id       ?? userId,
                module:        options.module        ?? null,
                action:        options.action,
                table_name:    options.table_name    ?? null,
                record_id:     options.record_id     ?? null,
                old_values:    options.old_values    ?? null,
                new_values:    options.new_values    ?? null,
                ip_address:    ip,
                user_agent:    userAgent,
                status:        options.status        ?? STATUS.SUCCESS,
                error_message: options.error_message ?? null,
                created_at:    new Date(),
            };

            return await this.auditLogDao.log(payload);

        } catch (err) {
            logger.error('[LogHelper.writeAuditLog] Failed to write audit log:', err);
            return null;
        }
    }

    // ─── Fire-and-forget (non-blocking) version ────────────────────────────
    /**
     * Same as writeAuditLog but does NOT block the caller.
     * Audit failure will never affect the API response.
     *
     * Usage: logHelper.auditLog(req, { action: ACTIONS.UPDATE_COMPANY, ... });
     */
    auditLog(req, options = {}) {
        this.writeAuditLog(req, options).catch((err) => {
            logger.error('[LogHelper.auditLog] Silent failure:', err);
        });
    }

    // ─── Convenience: log a FAILED action ─────────────────────────────────
    async writeFailedLog(req, options = {}, errorMessage = '') {
        return this.writeAuditLog(req, {
            ...options,
            status:        STATUS.FAILED,
            error_message: errorMessage,
        });
    }

    // ─── Write login_history row ───────────────────────────────────────────
    /**
     * @param {object} req
     * @param {object} options
     * @param {number}  options.user_id        Required
     * @param {string}  options.login_status   'SUCCESS' | 'FAILED' | 'LOCKED' | 'LOGOUT'
     * @param {string}  [options.failure_reason]
     * @param {string}  [options.session_id]   Access token — links to cs_tokens
     * @returns {Promise<object|null>}
     */
    async writeLoginHistory(req, options = {}) {
        try {
            const { ip, userAgent } = this.extractRequestMeta(req);

            const payload = {
                user_id:        options.user_id,
                login_status:   options.login_status,
                failure_reason: options.failure_reason ?? null,
                ip_address:     ip,
                user_agent:     userAgent,
                session_id:     options.session_id     ?? null,
                login_at:       new Date(),
                logout_at:      null,
                created_at:     new Date(),
            };

            return await this.loginHistoryDao.log(payload);

        } catch (err) {
            logger.error('[LogHelper.writeLoginHistory] Failed:', err);
            return null;
        }
    }

    // ─── Stamp logout_at on the open session row ───────────────────────────
    async markLogout(userId, sessionId = null) {
        try {
            return await this.loginHistoryDao.markLogout(userId, sessionId);
        } catch (err) {
            logger.error('[LogHelper.markLogout] Failed:', err);
            return null;
        }
    }

    // ─── Utility: serialize Sequelize instance for JSON storage ───────────
    /**
     * Converts a Sequelize model instance or plain object to a
     * clean JSON object safe to store in old_values / new_values.
     */
    toAuditJson(data) {
        if (!data) return null;
        if (typeof data.toJSON === 'function') return data.toJSON();
        return JSON.parse(JSON.stringify(data));
    }

}

// ─── Export singleton ─────────────────────────────────────────────────────────
const logHelper = new LogHelper();

module.exports         = logHelper;
module.exports.MODULES = MODULES;
module.exports.ACTIONS = ACTIONS;
module.exports.STATUS  = STATUS;
