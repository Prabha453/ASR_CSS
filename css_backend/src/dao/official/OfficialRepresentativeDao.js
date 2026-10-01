const SuperDao = require('../SuperDao');

class OfficialRepresentativeDao extends SuperDao {
    constructor() { super('official_representaive'); }  // matches migration spelling
}

module.exports = OfficialRepresentativeDao;
