const httpStatus = require('http-status');
const logger = require('../../config/logger');
const EntityIndividualService = require('../../service/individual/EntityIndividualService');

class EntityIndividualController {

    constructor() {
        this.service = new EntityIndividualService();
    }

    // ─── Individual ───────────────────────────────────────────────────────────
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

    delete = async (req, res) => {
        try {
            const responseData = await this.service.delete(req.body.entity_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Check Name ───────────────────────────────────────────────────────────
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

    // ─── Check ID Number ──────────────────────────────────────────────────────
    // GET /individual/check-id-number?id_type=X&id_number=Y&exclude_entity_id=Z

    checkIdNumber = async (req, res) => {
        try {
            const responseData = await this.service.checkIdNumber(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Field Change History ─────────────────────────────────────────────────
    // GET /individual/:entity_id/field-history?type_id=X&identification_id=Y

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
    // POST /individual/:entity_id/field-change

    saveFieldChange = async (req, res) => {
        try {
            const responseData = await this.service.saveFieldChange(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─── Identification ───────────────────────────────────────────────────────

    createIdentification = async (req, res) => {
        try {
            const responseData = await this.service.createIdentification(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    updateIdentification = async (req, res) => {
        try {
            const responseData = await this.service.updateIdentification(req.params.identification_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    deleteIdentification = async (req, res) => {
        try {
            const responseData = await this.service.deleteIdentification(req.body.identification_id);
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

    // ─── Relationship ─────────────────────────────────────────────────────────

    createRelationship = async (req, res) => {
        try {
            const responseData = await this.service.createRelationship(req.params.entity_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    updateRelationship = async (req, res) => {
        try {
            const responseData = await this.service.updateRelationship(req.params.relationship_id, req.body);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    deleteRelationship = async (req, res) => {
        try {
            const responseData = await this.service.deleteRelationship(req.body.relationship_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = EntityIndividualController;