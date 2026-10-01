// controllers/document/DocumentController.js

const httpStatus = require('http-status');

const logger =
    require('../config/logger');

const DocumentService =
    require('../service/DocumentStoreService');

class DocumentController {

    constructor() {

        this.documentService =
            new DocumentService();

    }

    uploadDocument = async (req, res) => {

        try {

            const responseData =
                await this.documentService.uploadDocument(
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    uploadMultipleDocuments = async (req, res) => {

        try {

            const responseData =
                await this.documentService.uploadMultipleDocuments(
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    documentList = async (req, res) => {

        try {

            const responseData =
                await this.documentService.documentList(
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    getDocument = async (req, res) => {

        try {

            const responseData =
                await this.documentService.getDocument(
                    req.params.id,
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    getDocumentUrl = async (req, res) => {

        try {

            const responseData =
                await this.documentService.getDocumentUrl(
                    req.params.id,
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    updateDocument = async (req, res) => {

        try {

            const responseData =
                await this.documentService.updateDocument(
                    req.params.id,
                    req.body,
                    req.user,
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    deleteDocument = async (req, res) => {

        try {

            const responseData =
                await this.documentService.deleteDocument(
                    req.params.id,
                    req.query,
                    req.user,
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    bulkDeleteDocuments = async (req, res) => {

        try {

            const responseData =
                await this.documentService.bulkDeleteDocuments(
                    req.body,
                    req.user,
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

    getStorageStats = async (req, res) => {

        try {

            const responseData =
                await this.documentService.getStorageStats(
                    req
                );

            res.status(responseData.statusCode)
                .send(responseData.response);

        } catch (e) {

            logger.error(e);

            res.status(httpStatus.BAD_GATEWAY)
                .send(e);

        }

    };

}

module.exports = DocumentController;
