const express = require('express');

const GroupMasterController =
    require('../../controllers/masterSettings/GroupMasterController');

const GroupMasterValidator =
    require('../../validator/masterSettings/GroupMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new GroupMasterController();

const validator =
    new GroupMasterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:group_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:group_id',
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
