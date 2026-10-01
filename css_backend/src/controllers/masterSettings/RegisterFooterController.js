const httpStatus = require('http-status');

const logger = require('../../config/logger');

const RegisterFooterService =
    require('../../service/masterSettings/RegisterFooterService');

class RegisterFooterController {

    constructor() {

        this.registerFooterService =
            new RegisterFooterService();

    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.registerFooterService.create(
                    req.body
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.registerFooterService.update(
                    req.params.rf_id,
                    req.body
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

    get = async (req, res) => {
        try {

            const responseData =
                await this.registerFooterService.get(
                    req.params.rf_id
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

    list = async (req, res) => {
        try {

            const responseData =
                await this.registerFooterService.list(
                    req.query
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.registerFooterService.delete(
                    req.body.rf_id
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

}

module.exports = RegisterFooterController;