'use strict';

const express = require('express');
const auth = require('../../middlewares/auth');
const FormGenerationController = require('../../controllers/formBuilder/FormGenerationController');
const FormGenerationValidator = require('../../validator/formBuilder/FormGenerationValidator');

const router = express.Router();
const controller = new FormGenerationController();
const validator = new FormGenerationValidator();

router.post('/direct/:format/:form_id', auth(), controller.direct);

router.post('/create/:form_id', auth(), validator.create, controller.create);
router.post('/render-html/:generation_run_id', auth(), controller.renderHtml);
router.post('/render-pdf/:generation_run_id', auth(), controller.renderPdf);
router.post('/render-docx/:generation_run_id', auth(), controller.renderDocx);
router.post('/regenerate/:generation_run_id', auth(), validator.regenerate, controller.regenerate);
router.get('/history/:form_id', auth(), controller.list);
router.get('/download/:artifact_id', auth(), controller.download);
router.get('/:generation_run_id', auth(), controller.get);

module.exports = router;
