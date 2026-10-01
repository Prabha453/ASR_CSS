const DB_PREFIX = process.env.DB_PREFIX || 'cs_';

module.exports = (tableName) => {
    return `${DB_PREFIX}${tableName}`;
};