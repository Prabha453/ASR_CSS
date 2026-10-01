const SuperDao = require('../SuperDao');

class CorpSecTypeDao extends SuperDao {

    constructor() {
        super('corp_sec_type');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CorpSecTypeDao;