'use strict';

const express = require('express');

const FormPopUpFieldController = require('../../controllers/formBuilder/FormPopUpFieldController');

const FormPopUpFieldValidator = require('../../validator/formBuilder/FormPopUpFieldValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new FormPopUpFieldController();
const validator = new FormPopUpFieldValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:form_pop_up_field_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:form_pop_up_field_id',
    auth(),
    controller.get
);

router.get(
    '/list',
    auth(),
    controller.list
);

router.post(
    '/delete',
    auth(),
    controller.delete
);

module.exports = router;