const httpStatus = require('http-status');
const logger = require('../config/logger');
const CommonService = require('../service/CommonService');

class CommonController {

    constructor() {
        this.commonService = new CommonService();
    }

    getCountry = async (req, res) => {
        try {

            const responseData =
                await this.commonService.getCountry(
                    req.params.id
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }
    };

    countryList = async (req, res) => {
        try {

            const responseData =
                await this.commonService.countryList(
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

}

module.exports = CommonController;