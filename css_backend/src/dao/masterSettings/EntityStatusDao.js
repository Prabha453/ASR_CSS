const SuperDao = require('../SuperDao');

class EntityStatusDao extends SuperDao {

    constructor() {
        super('entity_status');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = EntityStatusDao;