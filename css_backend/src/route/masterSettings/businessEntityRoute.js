const express = require('express');

const BusinessEntityController =
    require('../../controllers/masterSettings/BusinessEntityController');

const BusinessEntityValidator =
    require('../../validator/masterSettings/BusinessEntityValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new BusinessEntityController();

const validator =
    new BusinessEntityValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:bn_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:bn_id',
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