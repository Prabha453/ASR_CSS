'use strict';

const SuperDao = require('../SuperDao');

class FormDao extends SuperDao {

    constructor() {
        super('form');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = FormDao;