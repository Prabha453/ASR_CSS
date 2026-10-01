'use strict';

const express = require('express');

const OfficialSubRoleController =
    require('../../controllers/masterSettings/OfficialSubRoleController');

const OfficialMasterValidator = require('../../validator/masterSettings/OfficialMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new OfficialSubRoleController();

const validator =
    new OfficialMasterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:official_master_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:official_master_id',
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

router.get(
    '/next-order/:parent_id',
    auth(),
    controller.getNextOrderByParent
);

module.exports = router;