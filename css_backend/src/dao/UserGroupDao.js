'use strict';

const SuperDao = require('./SuperDao');

class UserGroupDao extends SuperDao {

    constructor() {
        super('user_group');
    }

    findAndCountAll = (options) => this.Model.findAndCountAll(options);

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = UserGroupDao;
