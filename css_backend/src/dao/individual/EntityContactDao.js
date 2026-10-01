const SuperDao = require('../SuperDao');

class EntityContactDao extends SuperDao {

    constructor() {
        super('entity_contact');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityContactDao;
