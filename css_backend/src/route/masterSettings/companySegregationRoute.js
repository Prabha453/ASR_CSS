const express = require('express');

const CompanySegregationController =
    require('../../controllers/masterSettings/CompanySegregationController');

const CompanySegregationValidator =
    require('../../validator/masterSettings/CompanySegregationValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new CompanySegregationController();

const validator =
    new CompanySegregationValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:segregation_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:segregation_id',
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