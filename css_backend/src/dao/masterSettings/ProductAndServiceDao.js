const SuperDao = require('../SuperDao');

class ProductAndServiceDao extends SuperDao {

    constructor() {
        super('product_and_service');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = ProductAndServiceDao;