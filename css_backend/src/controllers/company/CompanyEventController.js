const httpStatus = require('http-status');
const logger = require('../../config/logger');
const CompanyEventService = require('../../service/company/CompanyEventService');

class CompanyEventController {
    constructor() {
        this.service = new CompanyEventService();
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

    // ── Company events ──────────────────────────────────────────────────
    getEvents = async (req, res) =>
        this._send(res, () => this.service.getEvents(req.query));

    getEvent = async (req, res) =>
        this._send(res, () => this.service.getEvent(req.params.event_id));

    getCalculationTrace = async (req, res) =>
        this._send(res, () => this.service.getCalculationTrace(req.params.event_id));

    createEvent = async (req, res) =>
        this._send(res, () => this.service.createEvent(req.body, this._userId(req), req));

    createMultipleEvents = async (req, res) =>
        this._send(res, () => this.service.createMultipleEvents(req.body, this._userId(req), req));

    updateEvent = async (req, res) =>
        this._send(res, () => this.service.updateEvent(req.params.event_id, req.body, this._userId(req), req));

    extendEventDueDate = async (req, res) =>
        this._send(res, () => this.service.extendEventDueDate(req.params.event_id, req.body, this._userId(req), req));

    cancelEventDueDateExtension = async (req, res) =>
        this._send(res, () => this.service.cancelEventDueDateExtension(req.params.event_id, req.body, this._userId(req), req));

    updateEventWorkflowStatus = async (req, res) =>
        this._send(res, () => this.service.updateEventWorkflowStatus(req.params.event_id, req.body, this._userId(req), req));

    dispenseEvent = async (req, res) =>
        this._send(res, () => this.service.dispenseEvent(req.params.event_id, req.body, this._userId(req), req));

    cancelDispenseEvent = async (req, res) =>
        this._send(res, () => this.service.cancelDispenseEvent(req.params.event_id, req.body, this._userId(req), req));

    getEventExtensionLogs = async (req, res) =>
        this._send(res, () => this.service.getEventExtensionLogs(req.query));
        
    exemptEvent = async (req, res) =>
        this._send(res, () => this.service.exemptEvent(req.params.event_id, req.body, this._userId(req), req));

    cancelExemptEvent = async (req, res) =>
        this._send(res, () => this.service.cancelExemptEvent(req.params.event_id, req.body, this._userId(req), req));

    requestGeneralExtension = async (req, res) =>
        this._send(res, () => this.service.requestGeneralExtension(req.params.event_id, req.body, this._userId(req), req));

    requestGeneralWaiver = async (req, res) =>
        this._send(res, () => this.service.requestGeneralWaiver(req.params.event_id, req.body, this._userId(req), req));

    cancelGeneralWaiver = async (req, res) =>
        this._send(res, () => this.service.cancelGeneralWaiver(req.params.event_id, req.body, this._userId(req), req));

    getEventComplianceExtensions = async (req, res) =>
        this._send(res, () => this.service.getEventComplianceExtensions(req.params.event_id, req.query));

    getEventComplianceWaivers = async (req, res) =>
        this._send(res, () => this.service.getEventComplianceWaivers(req.params.event_id, req.query));

    getEventDocuments = async (req, res) =>
        this._send(res, () => this.service.getEventDocuments(req.params.event_id));

    updateEventDocumentStatus = async (req, res) =>
        this._send(res, () => this.service.updateEventDocumentStatus(req.params.event_document_id, req.body, this._userId(req), req));

    deleteEvent = async (req, res) =>
        this._send(res, () => this.service.deleteEvent(req.body.company_event_id, req.body, this._userId(req), req));

    validateActualFye = async (req, res) =>
        this._send(res, () => this.service.validateActualFye(req.params.entity_id, req.body));

    syncEvents = async (req, res) =>
        this._send(res, () => this.service.syncEvents(req.params.entity_id, req.body, this._userId(req), req));

    getEventDetails = async (req, res) =>
        this._send(res, () => this.service.getEventDetails(req.params.entity_id, req.query));

}

module.exports = CompanyEventController;
