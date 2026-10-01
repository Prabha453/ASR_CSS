const SuperDao = require('../SuperDao');

class BusinessEntityDao extends SuperDao {

    constructor() {
        super('business_entity');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = BusinessEntityDao;