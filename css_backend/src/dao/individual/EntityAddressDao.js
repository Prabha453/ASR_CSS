const SuperDao = require('../SuperDao');

class EntityAddressDao extends SuperDao {

    constructor() {
        super('entity_address');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityAddressDao;
