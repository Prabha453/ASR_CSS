const SuperDao = require('../SuperDao');

class GroupMasterDao extends SuperDao {

    constructor() {
        super('group_master');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = GroupMasterDao;
