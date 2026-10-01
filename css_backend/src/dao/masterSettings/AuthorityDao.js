const SuperDao = require('../SuperDao');

class AuthorityDao extends SuperDao {

    constructor() {
        super('authority');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

}

module.exports = AuthorityDao;
