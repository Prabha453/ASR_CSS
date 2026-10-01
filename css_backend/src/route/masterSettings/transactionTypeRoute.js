const express = require('express');

const TransactionTypeController =
    require('../../controllers/masterSettings/TransactionTypeController');

const TransactionTypeValidator =
    require('../../validator/masterSettings/TransactionTypeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new TransactionTypeController();

const validator =
    new TransactionTypeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:t_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:t_id',
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