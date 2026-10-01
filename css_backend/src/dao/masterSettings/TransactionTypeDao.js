const SuperDao = require('../SuperDao');

class TransactionTypeDao extends SuperDao {

    constructor() {
        super('transaction_type');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = TransactionTypeDao;