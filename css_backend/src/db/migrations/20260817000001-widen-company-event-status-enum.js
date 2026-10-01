'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('company_event');

module.exports = {

    async up(queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.changeColumn(
                TABLE_NAME,
                'status',
                {
                    type: Sequelize.ENUM(
                        'PENDING', 'COMPLETED', 'WAIVED', 'DISPENSE', 'EXEMPT', 'CANCELLED',
                        'IN_PREPARATION', 'AWAITING_DOCUMENTS', 'AWAITING_CLIENT',
                        'AWAITING_APPROVAL', 'READY_TO_FILE', 'FILED', 'NOT_APPLICABLE'
                    ),
                    allowNull: false,
                    defaultValue: 'PENDING',
                },
                { transaction: t }
            );

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            // Fold new statuses back before shrinking the enum, otherwise the
            // ALTER TABLE will fail / truncate data.
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'PENDING' WHERE \`status\` IN
                 ('IN_PREPARATION','AWAITING_DOCUMENTS','AWAITING_CLIENT','AWAITING_APPROVAL','READY_TO_FILE','NOT_APPLICABLE')`,
                { transaction: t }
            );
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'COMPLETED' WHERE \`status\` = 'FILED'`,
                { transaction: t }
            );

            await queryInterface.changeColumn(
                TABLE_NAME,
                'status',
                {
                    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'WAIVED', 'DISPENSE', 'EXEMPT', 'CANCELLED'),
                    allowNull: false,
                    defaultValue: 'PENDING',
                },
                { transaction: t }
            );

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    },

};
