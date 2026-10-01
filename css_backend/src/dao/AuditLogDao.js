const SuperDao = require('./SuperDao');
const { getCurrentModels } = require('../models');

class AuditLogDao extends SuperDao {

    constructor() {
        super('audit_log');
    }

    // ─── Write one log entry ───────────────────────────────────────────────
    async log(data) {
        return this.create(data);
    }

    // ─── Fetch latest N logs with user info (for Recent Activity feed) ────
    async getRecent(limit = 25) {
        try {
            const models = getCurrentModels();
            return await this.Model.findAll({
                include: [{
                    model:      models.user,
                    as:         'user',
                    attributes: ['user_id', 'user_name', 'first_name', 'last_name', 'profile_photo_url'],
                    required:   false,
                }],
                order:  [['created_at', 'DESC']],
                limit,
            });
        } catch (e) {
            const logger = require('../config/logger');
            logger.error('[AuditLogDao.getRecent]', e);
            return [];
        }
    }

    // ─── Fetch logs for a specific user ───────────────────────────────────
    async getByUser(userId, limit = 50) {
        return this.findByWhere(
            { user_id: userId },
            null,
            ['created_at', 'DESC'],
            limit,
            0,
        );
    }

    // ─── Fetch logs for a specific record (e.g. all changes on one company) ─
    async getByRecord(tableName, recordId, limit = 100) {
        return this.findByWhere(
            { table_name: tableName, record_id: recordId },
            null,
            ['created_at', 'DESC'],
            limit,
            0,
        );
    }

    // ─── Fetch logs by module (e.g. all COMPANY actions) ──────────────────
    async getByModule(module, limit = 100) {
        return this.findByWhere(
            { module },
            null,
            ['created_at', 'DESC'],
            limit,
            0,
        );
    }

    // ─── Fetch only failed actions ─────────────────────────────────────────
    async getFailedLogs(limit = 50) {
        return this.findByWhere(
            { status: 'FAILED' },
            null,
            ['created_at', 'DESC'],
            limit,
            0,
        );
    }

}

module.exports = AuditLogDao;
