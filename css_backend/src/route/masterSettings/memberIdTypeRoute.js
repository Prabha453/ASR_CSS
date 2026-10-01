const express = require('express');

const MemberIdTypeController = require('../../controllers/masterSettings/MemberIdTypeController');

const MemberIdTypeValidator = require('../../validator/masterSettings/MemberIdTypeValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new MemberIdTypeController();
const validator = new MemberIdTypeValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:m_identification_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:m_identification_id',
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