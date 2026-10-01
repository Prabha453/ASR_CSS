const httpStatus = require('http-status');

const logger = require('../../config/logger');

const CompanyEventNameService =
    require('../../service/masterSettings/CompanyEventNameService');

class CompanyEventNameController {

    constructor() {

        this.companyEventNameService =
            new CompanyEventNameService();

    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.companyEventNameService.create(
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
                await this.companyEventNameService.update(
                    req.params.e_id,
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
                await this.companyEventNameService.get(
                    req.params.e_id
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
                await this.companyEventNameService.list(
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
                await this.companyEventNameService.delete(
                    req.body.e_id
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

module.exports = CompanyEventNameController;