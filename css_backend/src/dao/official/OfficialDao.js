const SuperDao = require('../SuperDao');

class OfficialDao extends SuperDao {
    constructor() { super('officials'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
}

module.exports = OfficialDao;
