const SuperDao = require('../SuperDao');

class SalutationDao extends SuperDao {

    constructor() {
        super('salutation');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = SalutationDao;