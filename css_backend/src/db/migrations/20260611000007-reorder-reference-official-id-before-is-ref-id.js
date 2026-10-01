'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {
        // Move reference_official_id to sit right after official_entity_id
        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('officials')}\`
            MODIFY COLUMN \`reference_official_id\` BIGINT UNSIGNED NULL COMMENT 'Representative or proxy parent'
            AFTER \`official_entity_id\`
        `);

        // Move is_ref_id to sit right after reference_official_id
        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('officials')}\`
            MODIFY COLUMN \`is_ref_id\` TINYINT(1) NOT NULL DEFAULT 0
            AFTER \`reference_official_id\`
        `);
    },

    async down(queryInterface) {
        // Restore original positions
        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('officials')}\`
            MODIFY COLUMN \`is_ref_id\` TINYINT(1) NOT NULL DEFAULT 0
            AFTER \`official_entity_id\`
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('officials')}\`
            MODIFY COLUMN \`reference_official_id\` BIGINT UNSIGNED NULL COMMENT 'Representative or proxy parent'
            AFTER \`shareholder_property_type\`
        `);
    },

};
