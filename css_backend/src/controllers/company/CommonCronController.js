const httpStatus = require('http-status');
const logger = require('../../config/logger');
const CommonCronService = require('../../service/company/CommonCronService');

class CommonCronController {
    constructor() {
        this.service = new CommonCronService();
    }

    _userId = (req) => req.user?.user_id || req.user?.id || null;

    sendDue = async (req, res) => {
        try {
            const responseData = await this.service.sendDueReminders(req.body, this._userId(req), req);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };
}

module.exports = CommonCronController;
