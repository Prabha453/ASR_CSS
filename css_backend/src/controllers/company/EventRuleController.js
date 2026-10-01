const httpStatus = require('http-status');
const logger = require('../../config/logger');
const EventRuleService = require('../../service/company/EventRuleService');

class EventRuleController {
    constructor() {
        this.service = new EventRuleService();
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
        this._send(res, () => this.service.getEventRules(req.query));

    save = async (req, res) =>
        this._send(res, () => this.service.saveEventRule(req.body, this._userId(req), req));

    delete = async (req, res) =>
        this._send(res, () => this.service.deleteEventRule(req.body.rule_id, req.body, this._userId(req), req));

    versions = async (req, res) =>
        this._send(res, () => this.service.listRuleVersions(req.query.rule_id));

    submit = async (req, res) =>
        this._send(res, () => this.service.submitForReview(req.body.rule_id, req.body, this._userId(req), req));

    approve = async (req, res) =>
        this._send(res, () => this.service.approveRule(req.body.rule_id, req.body, this._userId(req), req));

    publish = async (req, res) =>
        this._send(res, () => this.service.publishRule(req.body.rule_id, req.body, this._userId(req), req));

    retire = async (req, res) =>
        this._send(res, () => this.service.retireRule(req.body.rule_id, req.body, this._userId(req), req));
}

module.exports = EventRuleController;
