const SuperDao = require('../SuperDao');

class CompanyProfileContactDao extends SuperDao {

    constructor() {
        super('company_profile_contact');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) => {
        return this.Model.destroy({ where });
    }

}

module.exports = CompanyProfileContactDao;