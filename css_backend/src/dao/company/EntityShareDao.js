'use strict';

const SuperDao = require('../SuperDao');

class EntityShareDao extends SuperDao {
    constructor() { super('entity_shares'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
}

module.exports = EntityShareDao;
