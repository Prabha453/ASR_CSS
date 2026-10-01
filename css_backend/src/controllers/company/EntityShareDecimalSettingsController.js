'use strict';

const httpStatus                          = require('http-status');
const EntityShareDecimalSettingsService   = require('../../service/company/EntityShareDecimalSettingsService');
const logger                              = require('../../config/logger');

class EntityShareDecimalSettingsController {

    constructor() {
        this.service = new EntityShareDecimalSettingsService();
    }

    get = async (req, res) => {
        try {
            const result = await this.service.get(req.params.entity_id);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    upsert = async (req, res) => {
        try {
            const result = await this.service.upsert(req.params.entity_id, req.body);
            res.status(result.statusCode).send(result.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = EntityShareDecimalSettingsController;
