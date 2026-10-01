'use strict';

const SuperDao = require('../SuperDao');

class ShareDao extends SuperDao {
    constructor() { super('shares'); }
    findAndCountAll = (options) => this.Model.findAndCountAll(options);
}

module.exports = ShareDao;
