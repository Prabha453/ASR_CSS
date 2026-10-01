const SuperDao = require('../SuperDao');

class CompanyTypeDao extends SuperDao {

    constructor() {
        super('company_type');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = CompanyTypeDao;