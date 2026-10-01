'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(
            table('entity_field_change_history'),
            {

                change_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },

                entity_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                },

                ref_id : {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: true,
                },

                field_key: {
                    type: Sequelize.STRING(60),
                    allowNull: false,
                },

                field_type_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                },

                identification_id: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: true,
                },

                old_value: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                new_value: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },

                effective_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                },

                proposed_date: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                },

                is_proposed: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },

                cron_status: {
                    type: Sequelize.TINYINT.UNSIGNED,
                    allowNull: false,
                    defaultValue: 0,
                    comment: '0 = Pending, 1 = Applied',
                },

                changed_by: {
                    type: Sequelize.BIGINT.UNSIGNED,
                    allowNull: true,
                },

                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },

                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },

            }
        );

        await queryInterface.addIndex(
            table('entity_field_change_history'),
            ['entity_id'],
            { name: 'idx_efch_entity_id' }
        );

        await queryInterface.addIndex(
            table('entity_field_change_history'),
            ['field_type_id'],
            { name: 'idx_efch_field_type_id' }
        );

        await queryInterface.addIndex(
            table('entity_field_change_history'),
            ['field_key'],
            { name: 'idx_efch_field_key' }
        );

        await queryInterface.addIndex(
            table('entity_field_change_history'),
            ['cron_status'],
            { name: 'idx_efch_cron_status' }
        );

    },

    async down(queryInterface) {

        await queryInterface.dropTable(
            table('entity_field_change_history')
        );

    },

};