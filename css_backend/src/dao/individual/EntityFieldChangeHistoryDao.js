const SuperDao = require('../SuperDao');

class EntityFieldChangeHistoryDao extends SuperDao {

    constructor() {

        super('entity_field_change_history');

    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = EntityFieldChangeHistoryDao;