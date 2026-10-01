'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        // 1. Add contact_value column
        await queryInterface.addColumn(table('entity_contact'), 'contact_value', {
            type:      Sequelize.STRING(500),
            allowNull: true,
            after:     'phone_country_code',
        });

        // 2. Migrate existing data into contact_value
        await queryInterface.sequelize.query(`
            UPDATE ${table('entity_contact')}
            SET contact_value = COALESCE(email, phone_number, fax, website)
        `);

        // 3. Drop the 4 old columns
        await queryInterface.removeColumn(table('entity_contact'), 'phone_number');
        await queryInterface.removeColumn(table('entity_contact'), 'email');
        await queryInterface.removeColumn(table('entity_contact'), 'website');
        await queryInterface.removeColumn(table('entity_contact'), 'fax');
    },

    async down(queryInterface, Sequelize) {

        // Restore old columns
        await queryInterface.addColumn(table('entity_contact'), 'phone_number', { type: Sequelize.STRING(30),  allowNull: true });
        await queryInterface.addColumn(table('entity_contact'), 'email',        { type: Sequelize.STRING(200), allowNull: true });
        await queryInterface.addColumn(table('entity_contact'), 'website',      { type: Sequelize.STRING(500), allowNull: true });
        await queryInterface.addColumn(table('entity_contact'), 'fax',          { type: Sequelize.STRING(30),  allowNull: true });

        // Restore data from contact_value
        await queryInterface.sequelize.query(`
            UPDATE ${table('entity_contact')} SET
                phone_number = CASE WHEN contact_type IN ('MOBILE','OFFICE') THEN contact_value END,
                email        = CASE WHEN contact_type = 'EMAIL' THEN contact_value END,
                fax          = CASE WHEN contact_type = 'FAX'   THEN contact_value END,
                website      = CASE WHEN contact_type = 'OTHER' THEN contact_value END
        `);

        await queryInterface.removeColumn(table('entity_contact'), 'contact_value');
    },

};
