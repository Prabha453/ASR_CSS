const express = require('express');

const CorpSecTypeController =
    require('../../controllers/masterSettings/CorpSecTypeController');

const CorpSecTypeValidator =
    require('../../validator/masterSettings/CorpSecTypeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new CorpSecTypeController();

const validator =
    new CorpSecTypeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:corp_sec_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:corp_sec_id',
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