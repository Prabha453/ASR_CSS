'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(table('entity_company_details'), 'group_type', {
            type: Sequelize.STRING(20),
            allowNull: true,
            comment: 'Portfolio group, e.g. VIP / Basic / Individual',
        });

        await queryInterface.addColumn(table('entity_company_details'), 'referral_source', {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Referral partner slug',
        });

        await queryInterface.addColumn(table('entity_company_details'), 'company_referral_partner_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(table('entity_company_details'), 'individual_referral_partner_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(table('entity_company_details'), 'senior_partner_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(table('entity_company_details'), 'lawyer_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        await queryInterface.addColumn(table('entity_company_details'), 'manager_id', {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: true,
        });

        const fkColumns = [
            ['company_referral_partner_id',    'fk_ecd_company_referral_partner'],
            ['individual_referral_partner_id', 'fk_ecd_individual_referral_partner'],
            ['senior_partner_id',              'fk_ecd_senior_partner'],
            ['lawyer_id',                      'fk_ecd_lawyer'],
            ['manager_id',                     'fk_ecd_manager'],
        ];

        for (const [field, name] of fkColumns) {
            await queryInterface.addConstraint(table('entity_company_details'), {
                fields: [field],
                type: 'foreign key',
                name,
                references: { table: table('entities'), field: 'entity_id' },
                onDelete: 'SET NULL',
            });
        }
    },

    async down(queryInterface) {
        const fkNames = [
            'fk_ecd_company_referral_partner',
            'fk_ecd_individual_referral_partner',
            'fk_ecd_senior_partner',
            'fk_ecd_lawyer',
            'fk_ecd_manager',
        ];
        for (const name of fkNames) {
            await queryInterface.removeConstraint(table('entity_company_details'), name);
        }

        await queryInterface.removeColumn(table('entity_company_details'), 'group_type');
        await queryInterface.removeColumn(table('entity_company_details'), 'referral_source');
        await queryInterface.removeColumn(table('entity_company_details'), 'company_referral_partner_id');
        await queryInterface.removeColumn(table('entity_company_details'), 'individual_referral_partner_id');
        await queryInterface.removeColumn(table('entity_company_details'), 'senior_partner_id');
        await queryInterface.removeColumn(table('entity_company_details'), 'lawyer_id');
        await queryInterface.removeColumn(table('entity_company_details'), 'manager_id');
    },

};
