const httpStatus = require('http-status');

const logger = require('../../config/logger');

const LanguageService = require('../../service/masterSettings/LanguageService');

class LanguageController {

    constructor() {
        this.languageService = new LanguageService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.languageService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.languageService.update(
                    req.params.language_id,
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
                await this.languageService.get(
                    req.params.language_id
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
                await this.languageService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.languageService.delete(
                    req.body.language_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = LanguageController;