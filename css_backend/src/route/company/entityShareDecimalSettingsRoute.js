const express    = require('express');
const auth       = require('../../middlewares/auth');
const controller = require('../../controllers/company/EntityShareDecimalSettingsController');

const router = express.Router();
const ctrl   = new controller();

router.get('/:entity_id',  auth(), ctrl.get);
router.post('/:entity_id', auth(), ctrl.upsert);

module.exports = router;
