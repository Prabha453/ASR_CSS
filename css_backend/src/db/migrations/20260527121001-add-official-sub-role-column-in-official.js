'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            table('official_master'),
            'is_representative',
            {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: '0 = No, 1 = Yes',
            }
        );

        await queryInterface.addColumn(
            table('official_master'),
            'is_entity_type',
            {
                type: Sequelize.ENUM(
                    'COMPANY',
                    'INDIVIDUAL',
                    'ALL'
                ),
                allowNull: false,
                defaultValue: 'ALL',
            }
        );

        await queryInterface.addColumn(
            table('official_master'),
            'is_parent',
            {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: '0 = Parent Role, >0 = Parent Official ID',
            }
        );

        await queryInterface.addColumn(
            table('official_master'),
            'is_active',
            {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: false,
                defaultValue: 0,
                comment: '0 = Active, 1 = Inactive',
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            table('official_master'),
            'is_active'
        );

        await queryInterface.removeColumn(
            table('official_master'),
            'is_parent'
        );

        await queryInterface.removeColumn(
            table('official_master'),
            'is_entity_type'
        );

        await queryInterface.removeColumn(
            table('official_master'),
            'is_representative'
        );

    },

};