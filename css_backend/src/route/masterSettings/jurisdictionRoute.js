const express = require('express');

const JurisdictionController = require('../../controllers/masterSettings/JurisdictionController');

const JurisdictionValidator = require('../../validator/masterSettings/JurisdictionValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new JurisdictionController();
const validator = new JurisdictionValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:jurisdiction_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:jurisdiction_id',
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
