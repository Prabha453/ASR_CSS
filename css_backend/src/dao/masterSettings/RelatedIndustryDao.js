const SuperDao = require('../SuperDao');

class RelatedIndustryDao extends SuperDao {

    constructor() {
        super('related_industry');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = RelatedIndustryDao;