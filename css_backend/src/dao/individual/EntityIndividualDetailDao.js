const SuperDao = require('../SuperDao');

class EntityIndividualDetailDao extends SuperDao {

    constructor() {
        super('entity_individual_details');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = EntityIndividualDetailDao;
