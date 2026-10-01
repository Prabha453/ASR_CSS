const express = require('express');

const EntityCompanyController = require('../../controllers/company/EntityCompanyController');
const EntityCompanyValidator  = require('../../validator/company/EntityCompanyValidator');
const auth = require('../../middlewares/auth');
const { handleAnyUpload } = require('../../middlewares/uploadDocument');

const router     = express.Router();
const controller = new EntityCompanyController();
const validator  = new EntityCompanyValidator();

// ─── Company entity ───────────────────────────────────────────────────────────
router.post(
    '/create',
    auth(),
    async (req, res, next) => {
        try { await handleAnyUpload(req, res); next(); }
        catch (err) { next(err); }
    },
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:entity_id',
    auth(),
    async (req, res, next) => {
        try { await handleAnyUpload(req, res); next(); }
        catch (err) { next(err); }
    },
    validator.updateValidator,
    controller.update
);

router.get( '/list',              auth(),                            controller.list);
router.get( '/get/:entity_id',    auth(),                            controller.get);
router.get( '/get_all',    auth(),                            controller.getAll);
router.post('/delete',            auth(),                            controller.delete);

// ─── Address ──────────────────────────────────────────────────────────────────

router.post('/:entity_id/address/create',  auth(), validator.createAddressValidator, controller.createAddress);
router.put( '/address/update/:address_id', auth(), validator.updateAddressValidator,  controller.updateAddress);
router.post('/address/delete',             auth(),                                    controller.deleteAddress);

// ─── Contact ──────────────────────────────────────────────────────────────────

router.post('/:entity_id/contact/create',  auth(), validator.createContactValidator, controller.createContact);
router.put( '/contact/update/:contact_id', auth(), validator.updateContactValidator,  controller.updateContact);
router.post('/contact/delete',             auth(),                                    controller.deleteContact);

router.post(   '/entity-field-change/:entity_id',                  auth(),                            controller.saveFieldChange);
router.get(    '/check-entity-name',                               auth(),                            controller.checkEntityName);
router.get(    '/field-history/:entity_id',                        auth(),                            controller.getFieldHistory);

module.exports = router;
