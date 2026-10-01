'use strict';

const express = require('express');

const EntityChargeController = require('../../controllers/charges/EntityChargeController');

// FIX: was importing EntityCompanyValidator (wrong file) and
//      instantiating EntityChargeValidator (which didn't exist yet).
//      Now both the import and the instantiation match the new validator file.
const EntityChargeValidator  = require('../../validator/charges/EntityChargeValidator');

const auth             = require('../../middlewares/auth');
const { handleAnyUpload } = require('../../middlewares/uploadDocument');
const verifyRecaptcha  = require('../../middlewares/recaptchaMiddleware');

const router     = express.Router();
const controller = new EntityChargeController();
const validator  = new EntityChargeValidator();

// ── Shared upload middleware ──────────────────────────────────────────────────
// Extracted so it isn't repeated inline on every route.
const upload = async (req, res, next) => {
    try   { await handleAnyUpload(req, res); next(); }
    catch (err) { next(err); }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
router.post(
    '/create',
    auth(),
    upload,
    validator.createValidator,
    verifyRecaptcha('register_charge_submit'),
    controller.create,
);

// ── UPDATE ───────────────────────────────────────────────────────────────────
// FIX: param was :entity_id — must be :charge_id to match controller + service
router.put(
    '/update/:charge_id',
    auth(),
    upload,
    validator.updateValidator,
    verifyRecaptcha('register_charge_submit'),
    controller.update,
);

// ── READ ─────────────────────────────────────────────────────────────────────
router.get('/list',            auth(), controller.list);

// FIX: param was :entity_id — must be :charge_id
router.get('/get/:charge_id',  auth(), controller.get);

// ── CHECK DUPLICATE CHARGE NUMBER ────────────────────────────────────────────
// GET /check-charge-number?company_id=&charge_number=&exclude_id=
router.get('/check-charge-number', auth(), controller.checkChargeNumber);

// ── DELETE ───────────────────────────────────────────────────────────────────
// FIX: kept as POST (matches original); body must send `charge_id` (not `entity_id`)
router.post('/delete', auth(), controller.delete);


module.exports = router;