'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('entity_identification')}\`
            MODIFY COLUMN \`id_issued_country\` VARCHAR(50) NULL
            AFTER \`acra_no\`
        `);

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.sequelize.query(`
            ALTER TABLE \`${table('entity_identification')}\`
            MODIFY COLUMN \`id_issued_country\` CHAR(3) NULL
            AFTER \`acra_no\`
        `);

    },

};