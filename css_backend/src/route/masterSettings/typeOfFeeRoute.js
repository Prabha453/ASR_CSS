const express = require('express');

const TypeOfFeeController =
    require('../../controllers/masterSettings/TypeOfFeeController');

const TypeOfFeeValidator =
    require('../../validator/masterSettings/TypeOfFeeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new TypeOfFeeController();

const validator =
    new TypeOfFeeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:fee_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:fee_id',
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