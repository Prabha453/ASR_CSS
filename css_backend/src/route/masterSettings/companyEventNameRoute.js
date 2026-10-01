const express = require('express');

const CompanyEventNameController =
    require('../../controllers/masterSettings/CompanyEventNameController');

const CompanyEventNameValidator =
    require('../../validator/masterSettings/CompanyEventNameValidator');

const DocumentChecklistTemplateController =
    require('../../controllers/masterSettings/DocumentChecklistTemplateController');

const DocumentChecklistTemplateValidator =
    require('../../validator/masterSettings/DocumentChecklistTemplateValidator');

const auth = require('../../middlewares/auth');

const router = express.Router();

const controller =
    new CompanyEventNameController();

const validator =
    new CompanyEventNameValidator();

const checklistController =
    new DocumentChecklistTemplateController();

const checklistValidator =
    new DocumentChecklistTemplateValidator();

router.post(
    '/create',
    auth(),
    validator.createValidator,
    controller.create
);

router.put(
    '/update/:e_id',
    auth(),
    validator.createValidator,
    controller.update
);

router.get(
    '/get/:e_id',
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

router.get(
    '/checklist/:e_id',
    auth(),
    checklistController.list
);

router.post(
    '/checklist/save',
    auth(),
    checklistValidator.saveAll,
    checklistController.saveAll
);

module.exports = router;