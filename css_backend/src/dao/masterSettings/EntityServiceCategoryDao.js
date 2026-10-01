const SuperDao = require('../SuperDao');

class EntityServiceCategoryDao extends SuperDao {

    constructor() {
        super('entity_service_category');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = EntityServiceCategoryDao;