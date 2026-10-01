const SuperDao = require('../SuperDao');

class OfficialCompanyContactDao extends SuperDao {
    constructor() { super('official_company_contact'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
}

module.exports = OfficialCompanyContactDao;
