const express = require('express');

const TemplateCategoryController =
    require('../../controllers/masterSettings/TemplateCategoryController');

const TemplateCategoryValidator =
    require('../../validator/masterSettings/TemplateCategoryValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new TemplateCategoryController();

const validator =
    new TemplateCategoryValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:tc_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:tc_id',
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