// migrations/YYYYMMDD-add-port-id-to-document-store.js
'use strict';

const table = require('../../helper/dbTable');

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            table('document_store'),
            'port_number',
            {
                type:         Sequelize.BIGINT.UNSIGNED,
                allowNull:    true,
                defaultValue: null,
                comment:      'Port ID from logged-in user',
                after:        'doc_id',   // places it right after primary key
            }
        );

        // Index for fast port-scoped queries
        await queryInterface.addIndex(
            table('document_store'),
            ['port_number', 'module_record_id', 'entity_type'],
            { name: 'idx_doc_store_port_module' }
        );
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(
            table('document_store'),
            'idx_doc_store_port_module'
        );
        await queryInterface.removeColumn(table('document_store'), 'port_number');
    },
};