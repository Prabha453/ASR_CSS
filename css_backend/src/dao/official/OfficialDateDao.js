const SuperDao = require('../SuperDao');

class OfficialDateDao extends SuperDao {
    constructor() { super('officials_date'); }
}

module.exports = OfficialDateDao;
