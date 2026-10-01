'use strict';

const httpStatus = require('http-status');
const UserPermissionService = require('../service/UserPermissionService');
const logger = require('../config/logger');

class UserPermissionController {

    constructor() {
        this.service = new UserPermissionService();
    }

    getByUser = async (req, res) => {
        try {
            const responseData = await this.service.getByUser(req.params.user_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    upsert = async (req, res) => {
        try {
            const responseData = await this.service.upsert(
                req.params.user_id,
                req.body.permissions_json,
                req.user?.user_id || null
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    clear = async (req, res) => {
        try {
            const responseData = await this.service.clear(req.params.user_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = UserPermissionController;
