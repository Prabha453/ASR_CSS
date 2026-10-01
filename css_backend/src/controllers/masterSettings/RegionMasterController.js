const httpStatus = require('http-status');

const logger = require('../../config/logger');

const RegionMasterService = require('../../service/masterSettings/RegionMasterService');

class RegionMasterController {

    constructor() {
        this.regionMasterService = new RegionMasterService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.regionMasterService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.regionMasterService.update(
                    req.params.region_id,
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
                await this.regionMasterService.get(
                    req.params.region_id
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
                await this.regionMasterService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.regionMasterService.delete(
                    req.body.region_id
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = RegionMasterController;