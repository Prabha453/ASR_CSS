const express = require('express');

const SalutationController = require('../../controllers/masterSettings/SalutationController');

const SalutationValidator = require('../../validator/masterSettings/SalutationValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new SalutationController();
const validator = new SalutationValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:salutation_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:salutation_id',
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