const express = require('express');
const CompanyEventController = require('../../controllers/company/CompanyEventController');
const CompanyEventStatusValidator = require('../../validator/company/CompanyEventStatusValidator');
const CompanyEventComplianceValidator = require('../../validator/company/CompanyEventComplianceValidator');
const CompanyEventDocumentValidator = require('../../validator/company/CompanyEventDocumentValidator');
const eventRuleRoute = require('./eventRuleRoute');
const reminderRoute = require('./reminderRoute');
const commonCronRoute = require('./commonCronRoute');
const auth = require('../../middlewares/auth');

const router = express.Router();
const controller = new CompanyEventController();
const statusValidator = new CompanyEventStatusValidator();
const complianceValidator = new CompanyEventComplianceValidator();
const documentValidator = new CompanyEventDocumentValidator();

// Company events
router.get('/list', auth(), controller.getEvents);
router.get('/get/:event_id', auth(), controller.getEvent);
router.get('/calculation-trace/:event_id', auth(), controller.getCalculationTrace);
router.post('/create', auth(), controller.createEvent);
router.post('/create-multiple', auth(), controller.createMultipleEvents);
router.put('/update/:event_id', auth(), controller.updateEvent);
router.get('/extension-logs', auth(), controller.getEventExtensionLogs);
router.post('/extend/:event_id', auth(), controller.extendEventDueDate);
router.post('/cancel-extension/:event_id', auth(), controller.cancelEventDueDateExtension);
router.post('/status/:event_id', auth(), statusValidator.updateStatus, controller.updateEventWorkflowStatus);
router.post('/dispense/:event_id', auth(), controller.dispenseEvent);
router.post('/cancel-dispense/:event_id', auth(), controller.cancelDispenseEvent);
router.post('/exempt/:event_id', auth(), controller.exemptEvent);
router.post('/cancel-exempt/:event_id', auth(), controller.cancelExemptEvent);
router.post('/request-extension/:event_id', auth(), complianceValidator.requestExtension, controller.requestGeneralExtension);
router.post('/request-waiver/:event_id', auth(), complianceValidator.requestWaiver, controller.requestGeneralWaiver);
router.post('/cancel-waiver/:event_id', auth(), controller.cancelGeneralWaiver);
router.get('/extensions/:event_id', auth(), controller.getEventComplianceExtensions);
router.get('/waivers/:event_id', auth(), controller.getEventComplianceWaivers);
router.get('/documents/:event_id', auth(), controller.getEventDocuments);
router.post('/document-status/:event_document_id', auth(), documentValidator.updateStatus, controller.updateEventDocumentStatus);
router.post('/delete', auth(), controller.deleteEvent);

router.post('/:entity_id/validate-fye', auth(), controller.validateActualFye);
router.post('/:entity_id/sync', auth(), controller.syncEvents);
router.get('/:entity_id/details', auth(), controller.getEventDetails);

// Event rules, reminder master/logs, and common cron endpoints.
router.use('/rules', eventRuleRoute);
router.use('/reminders', reminderRoute);
router.use('/reminders', commonCronRoute);

module.exports = router;
