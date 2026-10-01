'use strict';

const table = require('../../helper/dbTable');

// These 7 columns are retired: their data was migrated into entity_status_date
// (see 20260722000002) and the Add/Edit Company form now reads/writes that
// table exclusively via the shared status_effective_date field.
const LEGACY_COLUMNS = {
    dormant_date:           { type: 'DATEONLY' },
    strike_off_date:        { type: 'DATEONLY' },
    terminate_date:         { type: 'DATEONLY' },
    liquidated_date:        { type: 'DATEONLY' },
    cancelled_date:         { type: 'DATEONLY' },
    amalgamated_date:       { type: 'DATEONLY' },
    liquid_strike_off_date: { type: 'DATEONLY' },
};

module.exports = {

    async up(queryInterface) {
        for (const column of Object.keys(LEGACY_COLUMNS)) {
            await queryInterface.removeColumn(table('entity_company_details'), column);
        }
    },

    async down(queryInterface, Sequelize) {
        for (const column of Object.keys(LEGACY_COLUMNS)) {
            await queryInterface.addColumn(table('entity_company_details'), column, {
                type: Sequelize.DATEONLY,
                allowNull: true,
            });
        }
    },

};
