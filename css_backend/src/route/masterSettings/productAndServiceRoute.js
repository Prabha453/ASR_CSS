'use strict';

const express = require('express');

const ProductAndServiceController =
    require('../../controllers/masterSettings/ProductAndServiceController');

const ProductAndServiceValidator =
    require('../../validator/masterSettings/ProductAndServiceValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new ProductAndServiceController();

const validator =
    new ProductAndServiceValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:product_service_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:product_service_id',
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