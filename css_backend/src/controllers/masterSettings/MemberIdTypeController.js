const httpStatus = require('http-status');
const logger = require('../../config/logger');

const MemberIdTypeService = require('../../service/masterSettings/MemberIdTypeService');

class MemberIdTypeController {

    constructor() {
        this.memberIdTypeService = new MemberIdTypeService();
    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.memberIdTypeService.create(req.body);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {

            const responseData =
                await this.memberIdTypeService.update(
                    req.params.m_identification_id,
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
                await this.memberIdTypeService.get(
                    req.params.m_identification_id
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
                await this.memberIdTypeService.list(req.query);

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {

            const responseData =
                await this.memberIdTypeService.delete(
                    req.body.m_identification_id
                );

            res.status(responseData.statusCode).send(responseData.response);
            
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = MemberIdTypeController;