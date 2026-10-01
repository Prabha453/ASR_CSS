'use strict';

const crypto = require('crypto');

const stableValue = (value) => {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = stableValue(value[key]);
            return result;
        }, {});
    }
    return value;
};

const hashTemplateVersion = snapshot => crypto
    .createHash('sha256')
    .update(JSON.stringify(stableValue(snapshot)))
    .digest('hex');

module.exports = { stableValue, hashTemplateVersion };
