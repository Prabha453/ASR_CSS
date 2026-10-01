const express = require('express');

const RaceMasterController = require('../../controllers/masterSettings/RaceMasterController');

const RaceMasterValidator = require('../../validator/masterSettings/RaceMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new RaceMasterController();
const validator = new RaceMasterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:race_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:race_id',
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