const httpStatus = require('http-status');
const logger = require('../../config/logger');
const DocumentChecklistTemplateService = require('../../service/masterSettings/DocumentChecklistTemplateService');

class DocumentChecklistTemplateController {
    constructor() {
        this.service = new DocumentChecklistTemplateService();
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
        this._send(res, () => this.service.listByEventMaster(req.params.e_id));

    saveAll = async (req, res) =>
        this._send(res, () => this.service.saveAll(req.body.event_master_id, req.body.items, this._userId(req), req));
}

module.exports = DocumentChecklistTemplateController;
