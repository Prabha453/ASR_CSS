const httpStatus = require('http-status');

const logger = require('../../config/logger');

const CompanySegregationService =
    require('../../service/masterSettings/CompanySegregationService');

class CompanySegregationController {

    constructor() {

        this.companySegregationService =
            new CompanySegregationService();

    }

    create = async (req, res) => {
        try {

            const responseData =
                await this.companySegregationService.create(
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
                await this.companySegregationService.update(
                    req.params.segregation_id,
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
                await this.companySegregationService.get(
                    req.params.segregation_id
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
                await this.companySegregationService.list(
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
                await this.companySegregationService.delete(
                    req.body.segregation_id
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

module.exports = CompanySegregationController;