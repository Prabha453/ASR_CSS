const httpStatus = require('http-status');
const logger = require('../config/logger');
const UserThemeSettingService = require('../service/UserThemeSettingService');

class UserThemeSettingController {

    constructor() {
        this.service = new UserThemeSettingService();
    }

    get = async (req, res) => {
        try {
            const userId = req.user.user_id;
            const responseData = await this.service.get(userId);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    save = async (req, res) => {
        try {
            const userId = req.user.user_id;
            const responseData = await this.service.save(userId, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = UserThemeSettingController;
