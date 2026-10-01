const SuperDao = require('../SuperDao');

class CompanyEventDao extends SuperDao {
    constructor() {
        super('company_event');
    }

    findAll = (options) => this.Model.findAll(options);

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    create = (values, options = {}) => this.Model.create(values, options);

    update = (values, options = {}) => this.Model.update(values, options);

    destroyWhere = (where) => this.Model.destroy({ where });

    findOne = (options) => this.Model.findOne(options);
}

module.exports = CompanyEventDao;
