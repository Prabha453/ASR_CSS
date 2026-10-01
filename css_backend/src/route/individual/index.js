const express = require('express');

const EntityIndividualController =
    require('../../controllers/individual/EntityIndividualController');

const EntityIndividualValidator =
    require('../../validator/individual/EntityIndividualValidator');

const auth = require('../../middlewares/auth');

const { handleAnyUpload } = require('../../middlewares/uploadDocument');

const router     = express.Router();
const controller = new EntityIndividualController();
const validator  = new EntityIndividualValidator();

// ─── Individual (entity) ──────────────────────────────────────────────────────
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

router.get(    '/list',                auth(),                            controller.list);
router.get(    '/get/:entity_id',      auth(),                            controller.get);
router.post(   '/delete',              auth(),                            controller.delete);

// ─── Identification ───────────────────────────────────────────────────────────

router.post(   '/:entity_id/identification/create',                auth(), validator.createIdentificationValidator, controller.createIdentification);
router.put(    '/identification/update/:identification_id',         auth(), validator.updateIdentificationValidator,  controller.updateIdentification);
router.post(   '/identification/delete',                           auth(),                                           controller.deleteIdentification);

// ─── Address ──────────────────────────────────────────────────────────────────

router.post(   '/:entity_id/address/create',                       auth(), validator.createAddressValidator, controller.createAddress);
router.put(    '/address/update/:address_id',                      auth(), validator.updateAddressValidator,  controller.updateAddress);
router.post(   '/address/delete',                                  auth(),                                    controller.deleteAddress);

// ─── Contact ──────────────────────────────────────────────────────────────────

router.post(   '/:entity_id/contact/create',                       auth(), validator.createContactValidator, controller.createContact);
router.put(    '/contact/update/:contact_id',                      auth(), validator.updateContactValidator,  controller.updateContact);
router.post(   '/contact/delete',                                  auth(),                                    controller.deleteContact);

// ─── Relationship ─────────────────────────────────────────────────────────────

router.post(   '/:entity_id/relationship/create',                  auth(), validator.createRelationshipValidator, controller.createRelationship);
router.put(    '/relationship/update/:relationship_id',            auth(), validator.updateRelationshipValidator,  controller.updateRelationship);
router.post(   '/relationship/delete',                             auth(),                                        controller.deleteRelationship);


router.post(   '/entity-field-change/:entity_id',                  auth(),                            controller.saveFieldChange);
router.get(    '/check-individual-name',                           auth(),                            controller.checkIndividualName);
router.get(    '/check-id-number',                                 auth(),                            controller.checkIdNumber);
router.get(    '/field-history/:entity_id',                        auth(),                            controller.getFieldHistory);

module.exports = router;
