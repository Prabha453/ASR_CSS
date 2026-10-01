'use strict';

const SuperDao = require('../SuperDao');

class EntityShareHistoryDao extends SuperDao {
    constructor() { super('entity_share_history'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
}

module.exports = EntityShareHistoryDao;
