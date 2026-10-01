const express = require('express');

const CssStatusController =
    require('../../controllers/masterSettings/CssStatusController');

const CssStatusValidator =
    require('../../validator/masterSettings/CssStatusValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new CssStatusController();

const validator =
    new CssStatusValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:css_status_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:css_status_id',
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