const SuperDao = require('../SuperDao');

class CompanySSICCodeDao extends SuperDao {

    constructor() {
        super('company_ssic_code');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CompanySSICCodeDao;