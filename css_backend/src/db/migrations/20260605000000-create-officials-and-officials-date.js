'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('officials'), {
            official_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'The company this official belongs to',
            },

            official_entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'The individual/company acting as official',
            },

            official_master_id: {
                type: Sequelize.SMALLINT.UNSIGNED,
                allowNull: false,
            },

            officer_type: {
                type: Sequelize.STRING(100),
                allowNull: false,
                comment: 'director, shareholder, ceo, secretary, etc.',
            },

            shareholder_type: {
                type: Sequelize.TINYINT.UNSIGNED,
                allowNull: true,
                comment: '1=individual, 2=corporate, 3=joint, 4=subfund, 5=trust',
            },

            shareholder_property_type: {
                type: Sequelize.ENUM('NOMINEE', 'NON_NOMINEE', 'TRUST', 'BENEFICIAL'),
                allowNull: true,
            },

            reference_official_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
                comment: 'Representative or proxy parent',
            },

            is_current: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
            },

            source_from: {
                type: Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('officials'), ['entity_id'], { name: 'idx_official_entity' });
        await queryInterface.addIndex(table('officials'), ['official_entity_id'], { name: 'idx_official_entity_ref' });
        await queryInterface.addIndex(table('officials'), ['official_master_id'], { name: 'idx_official_master' });
        await queryInterface.addIndex(table('officials'), ['officer_type'], { name: 'idx_official_type' });
        await queryInterface.addIndex(table('officials'), ['is_current'], { name: 'idx_official_current' });
        await queryInterface.addIndex(table('officials'), ['is_deleted'], { name: 'idx_official_deleted' });

        await queryInterface.addConstraint(table('officials'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_official_entity',
            references: {
                table: table('entities'),
                field: 'entity_id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        await queryInterface.addConstraint(table('officials'), {
            fields: ['official_entity_id'],
            type: 'foreign key',
            name: 'fk_official_ref_entity',
            references: {
                table: table('entities'),
                field: 'entity_id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        });

        await queryInterface.addConstraint(table('officials'), {
            fields: ['official_master_id'],
            type: 'foreign key',
            name: 'fk_official_master',
            references: {
                table: table('official_master'),
                field: 'official_master_id',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
        });

        await queryInterface.addConstraint(table('officials'), {
            fields: ['reference_official_id'],
            type: 'foreign key',
            name: 'fk_official_parent',
            references: {
                table: table('officials'),
                field: 'official_id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        });

        await queryInterface.createTable(table('officials_date'), {
            official_date_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            official_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
            },

            appointment_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            ceased_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            officials_appt_from: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Source page/form for appointment',
            },

            officials_ceased_from: {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Source page/form for cessation',
            },

            appt_manual: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
                comment: '0=system, 1=manual',
            },

            ceased_manual: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            source_from: {
                type: Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },

            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            is_deleted: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 0,
            },

            created_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },

            created_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },

            updated_date: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },

            updated_by: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: true,
            },
        });

        await queryInterface.addIndex(table('officials_date'), ['entity_id'], { name: 'idx_od_entity' });
        await queryInterface.addIndex(table('officials_date'), ['official_id'], { name: 'idx_od_official' });
        await queryInterface.addIndex(table('officials_date'), ['appointment_date'], { name: 'idx_od_appt_date' });
        await queryInterface.addIndex(table('officials_date'), ['ceased_date'], { name: 'idx_od_ceased_date' });
        await queryInterface.addIndex(table('officials_date'), ['is_deleted'], { name: 'idx_od_deleted' });

        await queryInterface.addConstraint(table('officials_date'), {
            fields: ['entity_id'],
            type: 'foreign key',
            name: 'fk_od_entity',
            references: {
                table: table('entities'),
                field: 'entity_id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

        await queryInterface.addConstraint(table('officials_date'), {
            fields: ['official_id'],
            type: 'foreign key',
            name: 'fk_od_official',
            references: {
                table: table('officials'),
                field: 'official_id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('officials_date'));
        await queryInterface.dropTable(table('officials'));
    },

};
