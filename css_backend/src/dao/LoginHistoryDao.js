const SuperDao = require('./SuperDao');

class LoginHistoryDao extends SuperDao {

    constructor() {
        super('login_history');
    }

    // ─── Write one login/logout event ──────────────────────────────────────
    async log(data) {
        return this.create(data);
    }

    // ─── Mark session as logged out ────────────────────────────────────────
    // Stamps logout_at on the most recent open SUCCESS row for this user.
    // session_id is included in the WHERE only when provided (extra precision).
    async markLogout(userId, sessionId = null) {
        const { Op } = require('sequelize');

        const where = {
            user_id:      userId,
            login_status: 'SUCCESS',
            logout_at:    null,
        };

        if (sessionId) {
            where.session_id = sessionId;
        }

        return this.updateWhere(
            { logout_at: new Date() },
            where,
        );
    }

    // ─── Fetch login history for a user (for profile / audit screen) ───────
    async getByUser(userId, limit = 50) {
        return this.findByWhere(
            { user_id: userId },
            null,
            ['login_at', 'DESC'],
            limit,
            0,
        );
    }

    // ─── Count failed attempts in the last N minutes (for brute-force check) ─
    async countRecentFailed(userId, withinMinutes = 30) {
        const { Op } = require('sequelize');
        const since  = new Date(Date.now() - withinMinutes * 60 * 1000);

        return this.getCountByWhere({
            user_id:      userId,
            login_status: 'FAILED',
            login_at:     { [Op.gte]: since },
        });
    }

    // ─── Get the most recent active session for a user ─────────────────────
    async getActiveSession(userId) {
        return this.findOneByWhere(
            { user_id: userId, login_status: 'SUCCESS', logout_at: null },
            null,
            ['login_at', 'DESC'],
        );
    }

}

module.exports = LoginHistoryDao;
