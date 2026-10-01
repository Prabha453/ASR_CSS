'use strict';

const express              = require('express');
const OfficialController   = require('../../controllers/official/OfficialController');
const auth                 = require('../../middlewares/auth');

const router     = express.Router();
const controller = new OfficialController();

router.post(  '/create',             auth(), controller.create);
router.get(   '/list',               auth(), controller.list);
router.get(   '/controller-dates',   auth(), controller.getControllerDates);
router.get(   '/get/:official_id',   auth(), controller.get);
router.put(   '/update/:official_id',auth(), controller.update);
router.post(  '/delete',             auth(), controller.delete);

module.exports = router;
