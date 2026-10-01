const SuperDao = require('../SuperDao');

class EmailConfigurationDao extends SuperDao {

    constructor() {
        super('email_configuration');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = EmailConfigurationDao;
