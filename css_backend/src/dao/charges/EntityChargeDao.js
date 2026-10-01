'use strict';

const SuperDao = require('../SuperDao');

class EntityChargeDao extends SuperDao {

    constructor() {
        super('entity_charge');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = EntityChargeDao;