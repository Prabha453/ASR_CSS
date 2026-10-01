'use strict';

const httpStatus = require('http-status');
const UserGroupService = require('../service/UserGroupService');
const logger = require('../config/logger');

class UserGroupController {

    constructor() {
        this.userGroupService = new UserGroupService();
    }

    create = async (req, res) => {
        try {
            const responseData = await this.userGroupService.create(req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const responseData = await this.userGroupService.update(
                req.params.user_group_id,
                req.body
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {
            const responseData = await this.userGroupService.get(req.params.user_group_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {
            const responseData = await this.userGroupService.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    getAll = async (req, res) => {
        try {
            const responseData = await this.userGroupService.getAll();
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const responseData = await this.userGroupService.delete(req.body.user_group_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = UserGroupController;
