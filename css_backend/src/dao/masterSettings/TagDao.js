const SuperDao = require('../SuperDao');

class TagDao extends SuperDao {

    constructor() {
        super('tag');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = TagDao;