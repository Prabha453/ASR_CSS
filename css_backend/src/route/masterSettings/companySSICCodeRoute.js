const express = require('express');

const CompanySSICCodeController =
    require('../../controllers/masterSettings/CompanySSICCodeController');

const CompanySSICCodeValidator =
    require('../../validator/masterSettings/CompanySSICCodeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new CompanySSICCodeController();

const validator =
    new CompanySSICCodeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:ssic_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:ssic_id',
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