const httpStatus = require('http-status');

const logger = require('../../config/logger');

const OfficialMasterService =
    require('../../service/masterSettings/OfficialMasterService');

class OfficialMasterController {

    constructor() {
        this.officialMasterService = new OfficialMasterService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.officialMasterService.create(req.body);

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.officialMasterService.update(
                    req.params.official_master_id,
                    req.body
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {

            const responseData =
                await this.officialMasterService.get(
                    req.params.official_master_id
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) => {
        try {

            const responseData =
                await this.officialMasterService.list(req.query);

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.officialMasterService.delete(
                    req.body.official_master_id
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── Save Config ───────────────────────────────────────────────────────────
    saveConfig = async (req, res) => {
        try {

            const id = req.params.official_master_id;
            
            const responseData =
                await this.officialMasterService.saveConfig(
                    Number(id),
                    req.body
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = OfficialMasterController;