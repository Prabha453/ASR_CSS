const httpStatus = require('http-status');
const logger = require('../../config/logger');
const EntityCompanyService = require('../../service/company/EntityCompanyService');

class EntityCompanyController {

    constructor() {
        this.service = new EntityCompanyService();
    }
    
    create = async (req, res) => {
        try {
            const userId = req.body?.created_by ?? null;
            const responseData = await this.service.create(
                req.body,
                req.files || [],   // ← add files
                userId,
                req                // ← add req
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    update = async (req, res) => {
        try {
            const userId = req.body?.updated_by ?? req.body?.created_by ?? null;
            const responseData = await this.service.update(
                req.params.entity_id,
                req.body,
                req.files || [],   // ← add files
                userId,
                req                // ← add req
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    checkEntityName = async (req, res) => {
        try {
            const responseData = await this.service.checkEntityName(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };


    list = async (req, res) => {
        try {
            const responseData = await this.service.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    get = async (req, res) => {
        try {
            const responseData = await this.service.get(req.params.entity_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    getAll = async (req, res) => {
        try {
            const responseData = await this.service.getAll(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    delete = async (req, res) => {
        try {
            const responseData = await this.service.delete(req.body.entity_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Address ──────────────────────────────────────────────────────────────

    createAddress = async (req, res) => {
        try {
            const responseData = await this.service.createAddress(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    updateAddress = async (req, res) => {
        try {
            const responseData = await this.service.updateAddress(req.params.address_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    deleteAddress = async (req, res) => {
        try {
            const responseData = await this.service.deleteAddress(req.body.address_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Contact ──────────────────────────────────────────────────────────────

    createContact = async (req, res) => {
        try {
            const responseData = await this.service.createContact(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    updateContact = async (req, res) => {
        try {
            const responseData = await this.service.updateContact(req.params.contact_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    deleteContact = async (req, res) => {
        try {
            const responseData = await this.service.deleteContact(req.body.contact_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // GET /individual/check-name?name=X&exclude_id=Y
    checkIndividualName = async (req, res) => {
        try {
            const responseData = await this.service.checkIndividualName(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Field Change History ─────────────────────────────────────────────────
    getFieldHistory = async (req, res) => {
        try {
            const responseData = await this.service.getFieldHistory(req.params.entity_id, req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Save Field Change ────────────────────────────────────────────────────
    saveFieldChange = async (req, res) => {
        try {
            const responseData = await this.service.saveFieldChange(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = EntityCompanyController;
