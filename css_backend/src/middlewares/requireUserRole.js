'use strict';

const httpStatus = require('http-status');
const ApiError = require('../helper/ApiError');

const requireUserRole = (...allowedRoles) => {
    const allowed = new Set(allowedRoles.map(role => String(role).toUpperCase()));
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
        }
        const role = String(req.user.user_role || '').toUpperCase();
        if (!allowed.has(role)) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Administrator access is required'));
        }
        return next();
    };
};

module.exports = requireUserRole;
