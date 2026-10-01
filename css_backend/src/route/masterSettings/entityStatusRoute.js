const express = require('express');

const EntityStatusController =
    require('../../controllers/masterSettings/EntityStatusController');

const EntityStatusValidator =
    require('../../validator/masterSettings/EntityStatusValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new EntityStatusController();

const validator =
    new EntityStatusValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:e_status_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:e_status_id',
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