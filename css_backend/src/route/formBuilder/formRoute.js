'use strict';

const express = require('express');

const FormController = require('../../controllers/formBuilder/FormController');
const FormTemplateVersionController = require('../../controllers/formBuilder/FormTemplateVersionController');
const FormPopupOptionController = require('../../controllers/formBuilder/FormPopupOptionController');
const FormPopupSubmissionController = require('../../controllers/formBuilder/FormPopupSubmissionController');
const FormAiEditController = require('../../controllers/formBuilder/FormAiEditController');

const FormValidator = require('../../validator/formBuilder/FormValidator');

const auth = require('../../middlewares/auth');
const { rateLimit } = require('express-rate-limit');

const {
    handleAnyUpload,
} = require('../../middlewares/uploadDocument');

const router = express.Router();

const controller = new FormController();
const versionController = new FormTemplateVersionController();
const popupOptionController = new FormPopupOptionController();
const popupSubmissionController = new FormPopupSubmissionController();
const aiEditController = new FormAiEditController();
const validator = new FormValidator();

const aiEditRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        status: false,
        code: 429,
        message: 'Too many AI editing requests. Please wait a moment and try again.',
    },
});

router.post(
    '/create',
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
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:form_id',
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
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:form_id',
    auth(),
    controller.get
);

router.get(
    '/list',
    auth(),
    controller.list
);


router.post(
    '/preview/:form_id',
    auth(),
    validator.previewValidator,
    controller.preview
);

router.post(
    '/preview-draft/:form_id',
    auth(),
    validator.previewValidator,
    controller.previewDraft
);

router.post(
    '/ai/edit',
    auth(),
    aiEditRateLimiter,
    validator.aiEditValidator,
    aiEditController.edit
);

router.post('/version/create/:form_id', auth(), versionController.createDraft);
router.post('/version/validate', auth(), versionController.validateContent);
router.post('/version/publish/:template_version_id', auth(), versionController.publish);
router.get('/versions/:form_id', auth(), versionController.list);
router.put(
    '/version/:template_version_id/popup-schema',
    auth(),
    validator.popupSchemaValidator,
    versionController.updatePopupSchema
);
router.get('/popup-schema/:form_id', auth(), versionController.getPublishedPopupSchema);
router.post(
    '/popup-schema/merge',
    auth(),
    validator.popupSchemaMergeValidator,
    versionController.getMergedPublishedPopupSchema
);
router.get(
    '/popup-options/:form_id/:field_key',
    auth(),
    validator.popupOptionValidator,
    popupOptionController.list
);
router.post(
    '/popup-validate/:form_id',
    auth(),
    validator.popupSubmissionValidator,
    popupSubmissionController.validate
);

router.post(
    '/delete',
    auth(),
    controller.delete
);

module.exports = router;
