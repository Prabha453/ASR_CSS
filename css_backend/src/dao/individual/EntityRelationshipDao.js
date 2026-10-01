const SuperDao = require('../SuperDao');

class EntityRelationshipDao extends SuperDao {

    constructor() {
        super('entity_relationships');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityRelationshipDao;
