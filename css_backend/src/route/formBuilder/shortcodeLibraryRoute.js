'use strict';

const express = require('express');
const auth = require('../../middlewares/auth');
const requireUserRole = require('../../middlewares/requireUserRole');
const ShortcodeLibraryController = require('../../controllers/formBuilder/ShortcodeLibraryController');
const ShortcodeLibraryValidator = require('../../validator/formBuilder/ShortcodeLibraryValidator');

const router = express.Router();
const controller = new ShortcodeLibraryController();
const validator = new ShortcodeLibraryValidator();
const requireAdministrator = requireUserRole('SUPER_ADMIN', 'ADMIN');

router.get('/meta', auth(), requireAdministrator, controller.meta);
router.get('/list', auth(), controller.list);
router.get('/get/:shortcode_id', auth(), controller.get);
router.post('/create', auth(), requireAdministrator, validator.save, controller.create);
router.put('/update/:shortcode_id', auth(), requireAdministrator, validator.save, controller.update);
router.post('/retire/:shortcode_id', auth(), requireAdministrator, controller.retire);

module.exports = router;
