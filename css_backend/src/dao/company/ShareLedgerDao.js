'use strict';

const SuperDao = require('../SuperDao');

class ShareLedgerDao extends SuperDao {
    constructor() { super('share_ledger'); }
    bulkCreate = (records, options) => this.Model.bulkCreate(records, options);
    sumCol     = (col, where) => this.Model.sum(col, { where }) || 0;
}

module.exports = ShareLedgerDao;
