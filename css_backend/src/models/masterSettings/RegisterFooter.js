'use strict';

const { Model } = require('sequelize');

const table = require('../../helper/dbTable');

module.exports = (sequelize, DataTypes) => {

    class RegisterFooter extends Model {

        static associate(models) {
            // no association
        }

    }

    RegisterFooter.init(
        {

            rf_id: {
                type: DataTypes.SMALLINT.UNSIGNED,
                primaryKey: true,
                autoIncrement: true,
            },

            re_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },

            re_text: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

        },
        {
            sequelize,

            modelName: 'register_footer',

            tableName: table('register_footer'),

            timestamps: false,

            underscored: true,

            indexes: [
                {
                    fields: ['re_type'],
                    name: 'idx_register_footer_type',
                },
            ],
        }
    );

    return RegisterFooter;

};