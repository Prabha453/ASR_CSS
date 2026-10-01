'use strict';

const SuperDao = require('../SuperDao');

class ShareTransactionDao extends SuperDao {
    constructor() { super('share_transactions'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
    bulkCreate     = (records, options) => this.Model.bulkCreate(records, options);
}

module.exports = ShareTransactionDao;
