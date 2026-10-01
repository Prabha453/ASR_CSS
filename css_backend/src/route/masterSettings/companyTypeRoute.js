const express = require('express');

const CompanyTypeController = require('../../controllers/masterSettings/CompanyTypeController');

const CompanyTypeValidator = require('../../validator/masterSettings/CompanyTypeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new CompanyTypeController();
const validator = new CompanyTypeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:company_type_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:company_type_id',
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