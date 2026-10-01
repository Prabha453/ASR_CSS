const httpStatus = require('http-status');

const logger = require('../../config/logger');

const EntityStatusService =
    require('../../service/masterSettings/EntityStatusService');

class EntityStatusController {

    constructor() {

        this.entityStatusService =
            new EntityStatusService();

    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.entityStatusService.create(
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
                await this.entityStatusService.update(
                    req.params.e_status_id,
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
                await this.entityStatusService.get(
                    req.params.e_status_id
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
                await this.entityStatusService.list(
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
                await this.entityStatusService.delete(
                    req.body.e_status_id
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

module.exports = EntityStatusController;