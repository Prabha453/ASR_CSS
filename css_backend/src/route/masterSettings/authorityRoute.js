const express = require('express');

const AuthorityController = require('../../controllers/masterSettings/AuthorityController');

const AuthorityValidator = require('../../validator/masterSettings/AuthorityValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new AuthorityController();
const validator = new AuthorityValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:authority_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:authority_id',
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
