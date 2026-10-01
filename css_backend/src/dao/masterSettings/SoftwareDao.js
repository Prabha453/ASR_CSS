const SuperDao = require('../SuperDao');

class SoftwareDao extends SuperDao {

    constructor() {
        super('softwares');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = SoftwareDao;