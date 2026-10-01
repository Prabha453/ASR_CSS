'use strict';

const httpStatus      = require('http-status');
const logger          = require('../../config/logger');
const OfficialService = require('../../service/official/OfficialService');

class OfficialController {

    constructor() {
        this.officialService = new OfficialService();
    }

    create = async (req, res) => {
        try {
            const userId = req.user?.user_id || null;
            const data   = await this.officialService.create(req.body, userId);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };

    list = async (req, res) => {
        try {
            const data = await this.officialService.list(req.query);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };

    get = async (req, res) => {
        try {
            const data = await this.officialService.get(req.params.official_id);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };

    update = async (req, res) => {
        try {
            const userId = req.user?.user_id || null;
            const data   = await this.officialService.update(req.params.official_id, req.body, userId);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };

    delete = async (req, res) => {
        try {
            const userId = req.user?.user_id || null;
            const data   = await this.officialService.delete(req.body.official_id, userId);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };

    getControllerDates = async (req, res) => {
        try {
            const { entity_id, official_entity_id, controller_master_id } = req.query;
            const data = await this.officialService.getControllerDates(entity_id, official_entity_id, controller_master_id || null);
            res.status(data.statusCode).send(data.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send({ status: false, message: e?.message || 'Internal server error' });
        }
    };
}

module.exports = OfficialController;
