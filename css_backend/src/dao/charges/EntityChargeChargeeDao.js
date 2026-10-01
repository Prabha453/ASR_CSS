'use strict';

const SuperDao = require('../SuperDao');

class EntityChargeChargeeDao extends SuperDao {

    constructor() {
        super('entity_charge_chargee');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = EntityChargeChargeeDao;