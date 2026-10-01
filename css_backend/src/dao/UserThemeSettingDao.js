const SuperDao = require('./SuperDao');

class UserThemeSettingDao extends SuperDao {

    constructor() {
        super('user_theme_settings');
    }

    findByUserId(userId) {
        return this.findOneByWhere({ user_id: userId });
    }

    upsertByUserId(userId, data) {
        return this.updateOrCreate(
            { ...data, updated_date: new Date() },
            { user_id: userId }
        );
    }

}

module.exports = UserThemeSettingDao;
