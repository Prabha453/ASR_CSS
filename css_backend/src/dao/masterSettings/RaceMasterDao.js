const SuperDao = require('../SuperDao');

class RaceMasterDao extends SuperDao {

    constructor() {
        super('race_master');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = RaceMasterDao;