const express = require('express');

const RegisterFooterController =
    require('../../controllers/masterSettings/RegisterFooterController');

const RegisterFooterValidator =
    require('../../validator/masterSettings/RegisterFooterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new RegisterFooterController();

const validator =
    new RegisterFooterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:rf_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:rf_id',
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