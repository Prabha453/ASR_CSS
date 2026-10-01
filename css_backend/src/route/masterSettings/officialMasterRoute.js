const express = require('express');

const OfficialMasterController =
    require('../../controllers/masterSettings/OfficialMasterController');

const OfficialMasterValidator =
    require('../../validator/masterSettings/OfficialMasterValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller = new OfficialMasterController();
const validator  = new OfficialMasterValidator();

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

// ── Save Config ────────────────────────────────────────────────────────────
router.put(
    '/save-config/:official_master_id',
    auth(),
    controller.saveConfig
);

module.exports = router;