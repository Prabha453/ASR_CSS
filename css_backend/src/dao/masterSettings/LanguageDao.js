const SuperDao = require('../SuperDao');

class LanguageDao extends SuperDao {

    constructor() {
        super('language');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = LanguageDao;