'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class CompanyEvent extends Model {
        static associate(models) {
            CompanyEvent.belongsTo(models.entities, {
                foreignKey: 'entity_id',
                as: 'entity',
            });

            CompanyEvent.belongsTo(models.company_event_name, {
                foreignKey: 'event_id',
                as: 'event',
            });

            CompanyEvent.belongsTo(models.company_event_rule, {
                foreignKey: 'rule_id',
                as: 'rule',
            });

            CompanyEvent.belongsTo(models.compliance_rule_calculation_log, {
                foreignKey: 'calculation_trace_id',
                as: 'calculation_trace',
            });
        }
    }

    CompanyEvent.init(
        {
            company_event_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },
            entity_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: false,
            },
            event_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                allowNull: false,
            },
            event_slug: {
                type: DataTypes.STRING(80),
                allowNull: false,
            },
            rule_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            year_of_fye: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            period_start: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            period_end: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            actual_year: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            actual_fye: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            fye_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            base_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            sent_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            received_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            held_time: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            held_time_end: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            venue_type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            venue: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            meeting_chairman: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            type_shareholder: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            meeting_corporate_shareholder_rep: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            meeting_agenda: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            sender_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            reply_to_email: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            agm_status_details: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            group_to_recipient: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            email_config_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            recurring_period: {
                type: DataTypes.INTEGER.UNSIGNED,
                allowNull: true,
            },
            recurring_duration: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            extended_due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            reminder_date_basis: {
                type: DataTypes.ENUM('ACTUAL_DUE_DATE', 'EXTENDED_DUE_DATE'),
                allowNull: false,
                defaultValue: 'EXTENDED_DUE_DATE',
            },
            calculation_trace_id: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            remarks: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            due_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            held_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            filing_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM(
                    'PENDING', 'COMPLETED', 'WAIVED', 'DISPENSE', 'EXEMPT', 'CANCELLED',
                    'IN_PREPARATION', 'AWAITING_DOCUMENTS', 'AWAITING_CLIENT',
                    'AWAITING_APPROVAL', 'READY_TO_FILE', 'FILED', 'NOT_APPLICABLE'
                ),
                allowNull: false,
                defaultValue: 'PENDING',
            },
            operational_target_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            grace_end_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            penalty_start_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            source_from: {
                type: DataTypes.ENUM('AUTO_RULE', 'MANUAL', 'IMPORT'),
                allowNull: false,
                defaultValue: 'AUTO_RULE',
            },
            source_basis: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            generated_from_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            attendees: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            receiving_parties: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            reminders: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            uploaded_files: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            is_deleted: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            created_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
            updated_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            updated_by: {
                type: DataTypes.BIGINT.UNSIGNED,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'company_event',
            tableName: table('company_event'),
            timestamps: false,
            underscored: true,
            indexes: [
                { fields: ['entity_id'], name: 'idx_cse_entity_id' },
                { fields: ['event_id'], name: 'idx_cse_event_id' },
                { fields: ['event_slug'], name: 'idx_cse_event_slug' },
                { fields: ['due_date'], name: 'idx_cse_due_date' },
                { fields: ['status'], name: 'idx_cse_status' },
                { fields: ['is_deleted'], name: 'idx_cse_deleted' },
                { fields: ['calculation_trace_id'], name: 'idx_cse_calculation_trace_id' },
                { fields: ['operational_target_date'], name: 'idx_cse_operational_target_date' },
                { fields: ['penalty_start_date'], name: 'idx_cse_penalty_start_date' },
            ],
        }
    );

    return CompanyEvent;
};
