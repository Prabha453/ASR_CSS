const express = require('express');
const CommonController = require('../controllers/CommonController');
const auth = require('../middlewares/auth');
const router = express.Router();

const controller =
    new CommonController();

router.get(
    '/get_country/:id',
    auth(),
    controller.getCountry
);

router.get(
    '/country_list',
    auth(),
    controller.countryList
);

module.exports = router;