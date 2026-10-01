const express = require('express');
const CommonCronController = require('../../controllers/company/CommonCronController');
const CommonCronValidator = require('../../validator/company/CommonCronValidator');
const auth = require('../../middlewares/auth');

const router = express.Router();
const controller = new CommonCronController();
const validator = new CommonCronValidator();

router.post('/send-due', auth(), validator.sendDue, controller.sendDue);

module.exports = router;
