const SuperDao = require('../SuperDao');

class CompanySegregationDao extends SuperDao {

    constructor() {
        super('company_segregation');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CompanySegregationDao;