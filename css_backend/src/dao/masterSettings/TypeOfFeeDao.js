const SuperDao = require('../SuperDao');

class TypeOfFeeDao extends SuperDao {

    constructor() {
        super('type_of_fee');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = TypeOfFeeDao;