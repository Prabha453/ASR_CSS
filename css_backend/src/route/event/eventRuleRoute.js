const express = require('express');
const EventRuleController = require('../../controllers/company/EventRuleController');
const EventRuleValidator = require('../../validator/company/EventRuleValidator');
const auth = require('../../middlewares/auth');

const router = express.Router();
const controller = new EventRuleController();
const validator = new EventRuleValidator();

router.get('/', auth(), controller.list);
router.get('/versions', auth(), controller.versions);
router.post('/save', auth(), validator.save, controller.save);
router.post('/delete', auth(), validator.delete, controller.delete);
router.post('/submit', auth(), validator.submitForReview, controller.submit);
router.post('/approve', auth(), validator.approve, controller.approve);
router.post('/publish', auth(), validator.publish, controller.publish);
router.post('/retire', auth(), validator.retire, controller.retire);

module.exports = router;
