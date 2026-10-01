const SuperDao = require('../SuperDao');

class EntityDao extends SuperDao {

    constructor() {
        super('entities');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = EntityDao;
