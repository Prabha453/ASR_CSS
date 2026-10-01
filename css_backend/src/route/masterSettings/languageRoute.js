const express = require('express');

const LanguageController = require('../../controllers/masterSettings/LanguageController');

const LanguageValidator = require('../../validator/masterSettings/LanguageValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new LanguageController();
const validator = new LanguageValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:language_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:language_id',
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