const express = require('express');

const SoftwareController =
    require('../../controllers/masterSettings/SoftwareController');

const SoftwareValidator =
    require('../../validator/masterSettings/SoftwareValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new SoftwareController();

const validator =
    new SoftwareValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:software_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:software_id',
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