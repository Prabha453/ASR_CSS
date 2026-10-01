const SuperDao = require('../SuperDao');

class ReminderDao extends SuperDao {

    constructor() {
        super('reminder');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);
    
    findOne = (options) => this.Model.findOne(options);

    findAll = (options) => this.Model.findAll(options);

    create = (values, options = {}) => this.Model.create(values, options);

    update = (values, options = {}) => this.Model.update(values, options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = ReminderDao;
