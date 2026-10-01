const SuperDao = require('../SuperDao');

class AddressHistoryDao extends SuperDao {

    constructor() {
        super('address_history');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = AddressHistoryDao;
