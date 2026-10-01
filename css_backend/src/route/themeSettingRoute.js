const express = require('express');
const auth    = require('../middlewares/auth');

const UserThemeSettingController = require('../controllers/UserThemeSettingController');

const router     = express.Router();
const controller = new UserThemeSettingController();

router.get('/get',  auth(), controller.get);
router.put('/save', auth(), controller.save);

module.exports = router;
