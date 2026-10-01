const httpStatus = require('http-status');
const ApiError = require('../helper/ApiError');
const { getSequelizeForDb } = require('../models');
const dbContext = require('../storage/dbContext');

const dbMiddleware = async (req, res, next) => {
    const { db: dbName } = req.params;

    try {
        // ✅ tries to connect with same host/user/pass, only db name changes
        const db = await getSequelizeForDb(dbName);

        if (!db) {
            return next(new ApiError(httpStatus.NOT_FOUND, `Database "${dbName}" not found`));
        }

        req.db = db.sequelize;
        req.models = db;

        dbContext.run({ models: db }, next);
    } catch (err) {
        return next(new ApiError(httpStatus.NOT_FOUND, `Databases "${err}" Error`));
    }
};

module.exports = dbMiddleware;
