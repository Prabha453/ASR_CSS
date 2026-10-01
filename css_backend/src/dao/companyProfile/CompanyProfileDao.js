const SuperDao = require('../SuperDao');

class CompanyProfileDao extends SuperDao {

    constructor() {
        super('company_profile');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CompanyProfileDao;
