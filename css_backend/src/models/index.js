const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const configs = require(`${__dirname}/../config/database.js`);
const dbContext = require('../storage/dbContext');

const connectionCache = {};

/**
 * Get Sequelize instance dynamically by database name
 */
async function getSequelizeForDb(dbName) {

    // Return cached connection if already loaded
    if (connectionCache[dbName]) {
        return connectionCache[dbName];
    }

    // Base config
    const baseConfig = configs[env];

    // Replace database dynamically
    const config = {
        ...baseConfig,
        database: dbName,
    };

    // Create sequelize instance
    const sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            dialect: config.dialect,
            port: config.port,
            logging: false,
            timezone: config.timezone || '+00:00',
            pool: config.pool || {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        }
    );

    // Check database connection
    try {

        await sequelize.authenticate();

        console.log(`Connected to DB: ${dbName}`);

    } catch (err) {

        console.log(`Database connection failed: ${dbName}`);
        console.log(err.message);

        return null;
    }

    const db = {};

    /**
     * Collect all model .js files recursively from __dirname and its subdirectories.
     * Skips index.js (this file) and dotfiles.
     */
    const collectModelFiles = (dir) => {
        const results = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...collectModelFiles(fullPath));
            } else if (
                !entry.name.startsWith('.') &&
                entry.name !== basename &&
                entry.name.endsWith('.js')
            ) {
                results.push(fullPath);
            }
        }
        return results;
    };

    /**
     * Load all model files
     */
    collectModelFiles(__dirname)
        .forEach((file) => {

            try {

                const modelFile = require(file);

                // Ensure export is function
                if (typeof modelFile !== 'function') {
                    //console.log(`Skipped non-model file: ${file}`);
                    return;
                }

                // Initialize model
                const model = modelFile(
                    sequelize,
                    Sequelize.DataTypes
                );

                // Ensure valid Sequelize model
                if (
                    model &&
                    (
                        model.prototype instanceof Sequelize.Model ||
                        model instanceof Sequelize.Model
                    )
                ) {

                    db[model.name] = model;

                    //console.log(`Loaded model: ${model.name}`);

                } else {

                    console.log(`Invalid Sequelize model: ${file}`);

                }

            } catch (err) {

                console.log(`Error loading model file: ${file}`);
                console.log(err);

            }

        });

    /**
     * Setup model associations
     */
    Object.keys(db).forEach((modelName) => {

        if (typeof db[modelName].associate === 'function') {

            try {

                db[modelName].associate(db);

              //  console.log(`Associated model: ${modelName}`);

            } catch (err) {

                console.log(`Association error in model: ${modelName}`);
                console.log(err);

            }

        }

    });

    // Attach sequelize
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    // Cache connection
    connectionCache[dbName] = db;

    return db;
}

/**
 * Get models from request context
 */
function getCurrentModels() {

    const store = dbContext.getStore();

    if (!store) {
        throw new Error('Called outside of a request context');
    }

    return store.models;
}

module.exports = {
    getSequelizeForDb,
    getCurrentModels,
};