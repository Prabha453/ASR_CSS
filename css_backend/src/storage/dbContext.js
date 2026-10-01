const { AsyncLocalStorage } = require('async_hooks');

const dbContext = new AsyncLocalStorage();

module.exports = dbContext;