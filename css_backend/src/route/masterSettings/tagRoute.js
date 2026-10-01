const express = require('express');

const TagController = require('../../controllers/masterSettings/TagController');

const TagValidator = require('../../validator/masterSettings/TagValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new TagController();
const validator = new TagValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:tag_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:tag_id',
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