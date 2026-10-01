const express = require('express');

const DocumentController =
    require('../controllers/DocumentStoreController');

const auth =
    require('../middlewares/auth');

const router = express.Router();

const controller =
    new DocumentController();

router.post(
    '/upload',
    auth(),
    controller.uploadDocument
);

router.post(
    '/upload-multiple',
    auth(),
    controller.uploadMultipleDocuments
);

router.get(
    '/',
    auth(),
    controller.documentList
);

router.get(
    '/stats',
    auth(),
    controller.getStorageStats
);

router.get(
    '/:id',
    auth(),
    controller.getDocument
);

router.get(
    '/:id/url',
    auth(),
    controller.getDocumentUrl
);

router.patch(
    '/:id',
    auth(),
    controller.updateDocument
);

router.delete(
    '/bulk/delete',
    auth(),
    controller.bulkDeleteDocuments
);

router.delete(
    '/:id',
    auth(),
    controller.deleteDocument
);

module.exports = router;