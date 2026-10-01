const httpStatus = require('http-status');
const logger = require('../../config/logger');
const ReminderService = require('../../service/company/ReminderService');

class ReminderController {
    constructor() {
        this.service = new ReminderService();
    }

    _userId = (req) => req.user?.user_id || req.user?.id || null;

    _send = async (res, callback) => {
        try {
            const responseData = await callback();
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    list = async (req, res) =>
        this._send(res, () => this.service.getReminders(req.query));

    get = async (req, res) =>
        this._send(res, () => this.service.getReminder(req.params.reminder_id));

    create = async (req, res) =>
        this._send(res, () => this.service.createReminder(req.body, req.files || [], this._userId(req), req));

    update = async (req, res) =>
        this._send(res, () => this.service.updateReminder(req.params.reminder_id, req.body, req.files || [], this._userId(req), req));

    delete = async (req, res) =>
        this._send(res, () => this.service.deleteReminder(req.params.reminder_id, this._userId(req), req));

    logs = async (req, res) =>
        this._send(res, () => this.service.getReminderLogs(req.query));
}

module.exports = ReminderController;
