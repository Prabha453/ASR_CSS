const httpStatus = require('http-status');
const logger     = require('../../config/logger');

// FIX: was `new EntityCompanyService()` — wrong class name
const EntityChargeService = require('../../service/charges/EntityChargeService');

class EntityChargeController {

    constructor() {
        // FIX: was `new EntityCompanyService()` — must match the imported class
        this.service = new EntityChargeService();
    }

    // ── CREATE ───────────────────────────────────────────────────────────────
    create = async (req, res) => {
        try {
            const userId       = req.body?.created_by ?? null;
            const responseData = await this.service.create(
                req.body,
                req.files || [],
                userId,
                req,
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── UPDATE ───────────────────────────────────────────────────────────────
    update = async (req, res) => {
        try {
            const userId       = req.body?.updated_by ?? req.body?.created_by ?? null;

            // FIX: route param is :charge_id — was req.params.entity_id
            const responseData = await this.service.update(
                req.params.charge_id,
                req.body,
                req.files || [],
                userId,
                req,
            );
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── CHECK DUPLICATE CHARGE NUMBER ────────────────────────────────────────
    // GET /entity-charges/check-charge-number?company_id=&charge_number=&exclude_id=
    checkChargeNumber = async (req, res) => {
        try {
            const responseData = await this.service.checkChargeNumber(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── LIST ─────────────────────────────────────────────────────────────────
    list = async (req, res) => {
        try {
            const responseData = await this.service.list(req.query);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── GET SINGLE ───────────────────────────────────────────────────────────
    get = async (req, res) => {
        try {
            // FIX: route param is :charge_id — was req.params.entity_id
            const responseData = await this.service.get(req.params.charge_id);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ── SOFT DELETE ──────────────────────────────────────────────────────────
    delete = async (req, res) => {
        try {
            const userId = req.body?.updated_by ?? null;

            // FIX: was req.body.entity_id — field name must be charge_id
            const responseData = await this.service.delete(req.body.charge_id, userId);
            res.status(responseData.statusCode).send(responseData.response);
        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

}

module.exports = EntityChargeController;