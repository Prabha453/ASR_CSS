'use strict';

const { Model } = require('sequelize');
const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class FormPopUpField extends Model {

        static associate(models) {
            // no association
        }

    }

    FormPopUpField.init(
        {

            form_pop_up_field_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            form_pop_up_field_name: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },

            form_pop_up_field_slug: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            is_deleted: {
                type: DataTypes.TINYINT,
                allowNull: true,
                defaultValue: 0,
                comment: '0- Active, 1- Deleted',
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

            modelName: 'form_pop_up_field',

            tableName: table('form_pop_up_fields'),

            timestamps: false,

            createdAt: false,

            updatedAt: 'updated_date',
            
        }
    );

    return FormPopUpField;
};