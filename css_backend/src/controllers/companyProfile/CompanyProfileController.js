'use strict';

const httpStatus = require('http-status');
const logger     = require('../../config/logger');
const CompanyProfileService = require('../../service/companyProfile/CompanyProfileService');

class CompanyProfileController {

    constructor() {
        this.companyProfileService = new CompanyProfileService();
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET company profile
    // GET /company-profile/get/1?port_name=asr_css
    // ─────────────────────────────────────────────────────────────────────
    get = async (req, res) => {
        try {
            const portName = req.query?.port_name ?? null;

            const responseData = await this.companyProfileService.get(
                req.params.cp_id || 1,
                portName,
                req   // ✅ pass req so _ensureFullUrl can build absolute image URLs
            );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // UPDATE company profile
    // portName from req.body.port_name (FormData), req passed for image URLs
    // ─────────────────────────────────────────────────────────────────────
    update = async (req, res) => {
        try {
            const userId = req.user?.user_id || req.user?.id || req.body?.user_id || null;

            const responseData = await this.companyProfileService.update(
                req.params.cp_id || 1,
                req.body,
                req.files || [],
                userId,
                req   // ✅ already passed — no change needed here
            );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // UPDATE address
    // ─────────────────────────────────────────────────────────────────────
    updateAddress = async (req, res) => {
        try {
            const id     = Number(req.params.id) || 1;
            const result = await this.companyProfileService.updateAddress(id, req.body);
            res.status(result.statusCode).send(result.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // GET address history
    // ─────────────────────────────────────────────────────────────────────
    getAddressHistory = async (req, res) => {
        try {
            const id     = Number(req.params.id) || 1;
            const result = await this.companyProfileService.getAddressHistory(id);
            res.status(result.statusCode).send(result.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // DELETE address history
    // ─────────────────────────────────────────────────────────────────────
    deleteAddressHistory = async (req, res) => {
        try {
            const addr_history_id = req.body.addr_history_id;
            const responseData    = await this.companyProfileService.deleteAddressHistory(
                addr_history_id
            );
            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // DELETE document
    // doc_id   — req.body.doc_id
    // portName — req.query.port_name  ✅ fixed: was incorrectly reading
    //            from req.body; frontend sends it as a query param
    // ─────────────────────────────────────────────────────────────────────
    deleteDocument = async (req, res) => {
        try {
            const doc_id   = req.body?.doc_id   ?? req.params?.doc_id ?? null;
            const portName = req.query?.port_name ?? null;  // ✅ fixed: query not body

            if (!doc_id) {
                return res.status(httpStatus.BAD_REQUEST).send({
                    status:  false,
                    message: 'doc_id is required',
                });
            }

            const responseData = await this.companyProfileService.deleteDocument(
                doc_id,
                portName
            );

            res.status(responseData.statusCode).send(responseData.response);

        } catch (e) {
            logger.error(e);
            res.status(httpStatus.BAD_GATEWAY).send(e);
        }
    };
}

module.exports = CompanyProfileController;
