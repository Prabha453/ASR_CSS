const express = require('express');

const ShareClassMasterController = require('../../controllers/masterSettings/ShareClassMasterController');

const ShareClassMasterValidator = require('../../validator/masterSettings/ShareClassMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new ShareClassMasterController();
const validator = new ShareClassMasterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:sc_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:sc_id',
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