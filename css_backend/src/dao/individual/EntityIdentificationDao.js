const SuperDao = require('../SuperDao');

class EntityIdentificationDao extends SuperDao {

    constructor() {
        super('entity_identification');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityIdentificationDao;
