const httpStatus = require('http-status');

const logger = require('../../config/logger');

const AuthorityService = require('../../service/masterSettings/AuthorityService');

class AuthorityController {

    constructor() {
        this.authorityService = new AuthorityService();
    }

    create = async (req, res) => {
        try {
            const responseData = await this.authorityService.create(req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const responseData = await this.authorityService.update(req.params.authority_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {
            const responseData = await this.authorityService.get(req.params.authority_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {
            const responseData = await this.authorityService.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const responseData = await this.authorityService.delete(req.body.authority_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = AuthorityController;
