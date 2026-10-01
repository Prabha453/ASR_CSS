const httpStatus = require('http-status');

const logger = require('../../config/logger');

const ShareClassMasterService = require('../../service/masterSettings/ShareClassMasterService');

class ShareClassMasterController {

    constructor() {
        this.shareClassMasterService =
            new ShareClassMasterService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.shareClassMasterService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY).send(e);

        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.shareClassMasterService.update(
                    req.params.sc_id,
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

            const responseData =
                await this.shareClassMasterService.get(
                    req.params.sc_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY).send(e);

        }
    };

    list = async (req, res) => {
        try {

            const responseData =
                await this.shareClassMasterService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY).send(e);

        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.shareClassMasterService.delete(
                    req.body.sc_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY).send(e);

        }
    };

}

module.exports = ShareClassMasterController;