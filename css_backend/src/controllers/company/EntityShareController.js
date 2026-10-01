'use strict';

const httpStatus         = require('http-status');
const EntityShareService = require('../../service/company/EntityShareService');
const logger             = require('../../config/logger');

class EntityShareController {

    constructor() {
        this.service = new EntityShareService();
    }

    list = async (req, res) => {
        try {
            const result = await this.service.list({ ...req.query, entity_id: req.params.entity_id });
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {
            const result = await this.service.get(req.params.id);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    create = async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const result = await this.service.create(req.body, userId);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const result = await this.service.update(req.params.id, req.body, userId);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const result = await this.service.delete(req.body.id, userId);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    history = async (req, res) => {
        try {
            const result = await this.service.history({ ...req.query, entity_id: req.params.entity_id });
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };
}

module.exports = EntityShareController;
