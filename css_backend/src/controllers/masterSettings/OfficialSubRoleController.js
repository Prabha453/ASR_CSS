const httpStatus = require('http-status');

const logger = require('../../config/logger');

const OfficialSubRoleService =
    require('../../service/masterSettings/OfficialSubRoleService');

class OfficialSubRoleController {

    constructor() {
        this.officialSubRoleService = new OfficialSubRoleService();
    }

    create = async (req, res) => {
        try {
            const responseData =
                await this.officialSubRoleService.create(req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const responseData =
                await this.officialSubRoleService.update(
                    req.params.official_master_id,
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
                await this.officialSubRoleService.get(
                    req.params.official_master_id
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
                await this.officialSubRoleService.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const responseData =
                await this.officialSubRoleService.delete(
                    req.body.official_master_id
                );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── Get next auto order number by parent ───────────────────
    getNextOrderByParent = async (req, res) => {
        try {
            const { parent_id } = req.params;

            const responseData =
                await this.officialSubRoleService.getNextOrderByParent(
                    Number(parent_id)
                );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = OfficialSubRoleController;