const SuperDao = require('../SuperDao');

class JurisdictionDao extends SuperDao {

    constructor() {
        super('jurisdiction');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

}

module.exports = JurisdictionDao;
