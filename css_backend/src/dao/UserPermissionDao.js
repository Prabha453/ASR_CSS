'use strict';

const SuperDao = require('./SuperDao');

class UserPermissionDao extends SuperDao {

    constructor() {
        super('user_permission');
    }

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = UserPermissionDao;
