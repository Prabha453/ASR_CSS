'use strict';

const httpStatus        = require('http-status');
const SharePaymentService = require('../../service/company/SharePaymentService');
const logger            = require('../../config/logger');

class SharePaymentController {
    constructor() {
        this.service = new SharePaymentService();
    }

    list = async (req, res) => {
        try {
            const result = await this.service.list(req.params.txn_id);
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

    updateInstalment = async (req, res) => {
        try {
            const userId = req.user?.user_id;
            const result = await this.service.updateInstalment(req.params.txn_id, req.body.has_instalment, userId);
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
}

module.exports = SharePaymentController;
