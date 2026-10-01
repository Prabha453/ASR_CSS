const SuperDao = require('../SuperDao');

class CountriesDao extends SuperDao {

    constructor() {
        super('countries');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

}

module.exports = CountriesDao;