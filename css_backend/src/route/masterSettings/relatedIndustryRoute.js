const express = require('express');

const RelatedIndustryController =
    require('../../controllers/masterSettings/RelatedIndustryController');

const RelatedIndustryValidator =
    require('../../validator/masterSettings/RelatedIndustryValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new RelatedIndustryController();

const validator =
    new RelatedIndustryValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:related_industry_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:related_industry_id',
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