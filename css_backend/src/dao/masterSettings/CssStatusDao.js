const SuperDao = require('../SuperDao');

class CssStatusDao extends SuperDao {

    constructor() {
        super('css_status');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = CssStatusDao;