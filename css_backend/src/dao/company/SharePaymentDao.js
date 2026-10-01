'use strict';

const SuperDao = require('../SuperDao');

class SharePaymentDao extends SuperDao {
    constructor() { super('share_payments'); }
    bulkCreate = (records, options) => this.Model.bulkCreate(records, options);
}

module.exports = SharePaymentDao;
