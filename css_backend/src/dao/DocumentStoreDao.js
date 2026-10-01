'use strict';

const SuperDao = require('./SuperDao');

class DocumentStoreDao extends SuperDao {

    constructor() {
        super('document_store');
    }

    destroyWhere = (where) => this.Model.destroy({ where });

}

module.exports = DocumentStoreDao;
