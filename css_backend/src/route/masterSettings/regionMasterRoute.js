const express = require('express');

const RegionMasterController = require('../../controllers/masterSettings/RegionMasterController');

const RegionMasterValidator = require('../../validator/masterSettings/RegionMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new RegionMasterController();
const validator = new RegionMasterValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:region_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:region_id',
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