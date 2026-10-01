const SuperDao = require('../SuperDao');

class CompanyEventReminderLogDao extends SuperDao {
    constructor() {
        super('company_event_reminder_log');
    }

    findOne = (options) => this.Model.findOne(options);

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    create = (values, options = {}) => this.Model.create(values, options);

    update = (values, options = {}) => this.Model.update(values, options);
}

module.exports = CompanyEventReminderLogDao;
