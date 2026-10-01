'use strict';

const table = require('../../helper/dbTable');

module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.createTable(table('official_representaive'), {
            official_representaive_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },

            entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Company where the represented official belongs',
                references: {
                    model: table('entities'),
                    key: 'entity_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },

            official_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Represented official',
                references: {
                    model: table('officials'),
                    key: 'official_id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },

            representative_entity_id: {
                type: Sequelize.BIGINT.UNSIGNED,
                allowNull: false,
                comment: 'Entity acting as representative',
                references: {
                    model: table('entities'),
                    key: 'entity_id',
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE',
            },

            representative_role: {
                type: Sequelize.ENUM('REPRESENTATIVE', 'ALTERNATE', 'PROXY', 'NOMINEE'),
                allowNull: false,
                defaultValue: 'REPRESENTATIVE',
            },

            appointment_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            ceased_date: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },

            remarks: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            source_from: {
                type: Sequelize.ENUM('MANUAL', 'DM', 'BIZINSITE', 'WORKFLOW', 'API'),
                allowNull: false,
                defaultValue: 'MANUAL',
            },

            is_current: {
                type: Sequelize.TINYINT(1),
                allowNull: false,
                defaultValue: 1,
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

        await queryInterface.addIndex(table('official_representaive'), ['entity_id'], {
            name: 'idx_or_entity',
        });

        await queryInterface.addIndex(table('official_representaive'), ['official_id'], {
            name: 'idx_or_official',
        });

        await queryInterface.addIndex(table('official_representaive'), ['representative_entity_id'], {
            name: 'idx_or_rep_entity',
        });

        await queryInterface.addIndex(table('official_representaive'), ['representative_role'], {
            name: 'idx_or_role',
        });

        await queryInterface.addIndex(table('official_representaive'), ['is_current'], {
            name: 'idx_or_current',
        });

        await queryInterface.addIndex(table('official_representaive'), ['is_deleted'], {
            name: 'idx_or_deleted',
        });

    },

    async down(queryInterface) {
        await queryInterface.dropTable(table('official_representaive'));
    },

};
