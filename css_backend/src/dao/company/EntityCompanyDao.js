const SuperDao = require('../SuperDao');

class EntityCompanyDao extends SuperDao {

    constructor() {
        super('entities');
    }

    findAll = (options) =>
        this.Model.findAll(options);

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityCompanyDao;
