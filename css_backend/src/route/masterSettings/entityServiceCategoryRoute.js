const express = require('express');

const EntityServiceController =
    require('../../controllers/masterSettings/EntityServiceCategoryController');

const EntityServiceValidator =
    require('../../validator/masterSettings/EntityServiceCategoryValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new EntityServiceController();

const validator =
    new EntityServiceValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:service_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:service_id',
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