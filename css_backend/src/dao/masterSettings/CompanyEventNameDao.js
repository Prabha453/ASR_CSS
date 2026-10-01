const SuperDao = require('../SuperDao');

class CompanyEventNameDao extends SuperDao {

    constructor() {
        super('company_event_name');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CompanyEventNameDao;