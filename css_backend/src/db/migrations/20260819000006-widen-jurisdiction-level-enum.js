'use strict';

const table = require('../../helper/dbTable');

const TABLE_NAME = table('jurisdictions');

module.exports = {

    async up(queryInterface, Sequelize) {
        const t = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.changeColumn(
                TABLE_NAME,
                'level',
                {
                    type: Sequelize.ENUM('COUNTRY_NATIONAL', 'STATE_PROVINCE', 'FREE_ZONE', 'MUNICIPALITY'),
                    allowNull: false,
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
            // Fold COUNTRY_NATIONAL rows back to STATE_PROVINCE before shrinking the
            // enum, otherwise the ALTER TABLE will fail / truncate data.
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE_NAME}\` SET \`level\` = 'STATE_PROVINCE' WHERE \`level\` = 'COUNTRY_NATIONAL'`,
                { transaction: t }
            );

            await queryInterface.changeColumn(
                TABLE_NAME,
                'level',
                {
                    type: Sequelize.ENUM('STATE_PROVINCE', 'FREE_ZONE', 'MUNICIPALITY'),
                    allowNull: false,
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
