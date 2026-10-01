const express = require('express');

const CompanyProfileController =
    require('../../controllers/companyProfile/CompanyProfileController');

const companyProfileValidator =
    require('../../validator/companyProfile/companyProfileValidator');

const auth = require('../../middlewares/auth');

const {
    handleAnyUpload,
} = require('../../middlewares/uploadDocument');

const router = express.Router();

const controller =
    new CompanyProfileController();

const validator =
    new companyProfileValidator();

    router.put(
        '/update/:cp_id',
        auth(),
        async (req, res, next) => {
        try {
            await handleAnyUpload(
                req,
                res
            );
            next();
        } catch (err) {
            next(err);
        }
    },
        validator.companyProfileValidator,
        controller.update
    );

    router.get(
        '/get/:cp_id',
        auth(),
        controller.get
    );

    router.post('/address-create/:id', auth(), controller.updateAddress);
    router.get ('/address-history/:id', auth(), controller.getAddressHistory);
    router.post('/address-history-delete', auth(), controller.deleteAddressHistory);

module.exports = router;