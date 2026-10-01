const SuperDao = require('../SuperDao');

class RegionMasterDao extends SuperDao {

    constructor() {
        super('region_master');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = RegionMasterDao;