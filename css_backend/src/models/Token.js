const { Model } = require('sequelize');
const table = require('../helper/dbTable');

module.exports = (sequelize, DataTypes) => {
    class Token extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    }

    Token.init(
        {
            token: DataTypes.STRING,
            user_id: DataTypes.INTEGER,
            type: DataTypes.STRING,
            expires: DataTypes.DATE,
            blacklisted: DataTypes.BOOLEAN,
        },
        {
            sequelize,

                modelName: 'token',

                tableName: table('tokens'),

                timestamps: false,

                createdAt: 'created_date',

                updatedAt: 'updated_date',

                underscored: true,
        },
    );
    return Token;
};
