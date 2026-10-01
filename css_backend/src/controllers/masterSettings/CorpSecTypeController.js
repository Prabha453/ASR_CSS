const httpStatus = require('http-status');

const logger = require('../../config/logger');

const CorpSecTypeService =
    require('../../service/masterSettings/CorpSecTypeService');

class CorpSecTypeController {

    constructor() {

        this.corpSecTypeService =
            new CorpSecTypeService();

    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.corpSecTypeService.create(
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
                await this.corpSecTypeService.update(
                    req.params.corp_sec_id,
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
                await this.corpSecTypeService.get(
                    req.params.corp_sec_id
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
                await this.corpSecTypeService.list(
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
                await this.corpSecTypeService.delete(
                    req.body.corp_sec_id
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

module.exports = CorpSecTypeController;