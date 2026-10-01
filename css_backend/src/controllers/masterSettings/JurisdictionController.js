const httpStatus = require('http-status');

const logger = require('../../config/logger');

const JurisdictionService = require('../../service/masterSettings/JurisdictionService');

class JurisdictionController {

    constructor() {
        this.jurisdictionService = new JurisdictionService();
    }

    create = async (req, res) => {
        try {
            const responseData = await this.jurisdictionService.create(req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const responseData = await this.jurisdictionService.update(req.params.jurisdiction_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {
            const responseData = await this.jurisdictionService.get(req.params.jurisdiction_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {
            const responseData = await this.jurisdictionService.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const responseData = await this.jurisdictionService.delete(req.body.jurisdiction_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = JurisdictionController;
