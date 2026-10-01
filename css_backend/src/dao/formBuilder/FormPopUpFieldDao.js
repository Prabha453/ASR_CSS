'use strict';

const SuperDao = require('../SuperDao');

class FormPopUpFieldDao extends SuperDao {

    constructor() {
        super('form_pop_up_field');
    }

    findAndCountAll = (options) =>
        this.Model.findAndCountAll(options);

    destroyWhere = (where) =>
        this.Model.destroy({ where });

}

module.exports = FormPopUpFieldDao;