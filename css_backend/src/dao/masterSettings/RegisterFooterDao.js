const SuperDao = require('../SuperDao');

class RegisterFooterDao extends SuperDao {

    constructor() {
        super('register_footer');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = RegisterFooterDao;