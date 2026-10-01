const httpStatus = require('http-status');

const { getCurrentModels } = require('../../models');
const responseHandler = require('../../helper/responseHandler');
const logger = require('../../config/logger');
const logHelper = require('../../helper/LogHelper');
const { MODULES, ACTIONS } = require('../../helper/LogHelper');

// Spec §15.1 "Document Checklist" — the compliance-type-level template that gets
// copied onto each generated event (see src/helper/documentChecklistHelper.js).
class DocumentChecklistTemplateService {

    listByEventMaster = async (eventMasterId) => {
        try {
            const models = getCurrentModels();
            const id = Number(eventMasterId);
            if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event master id is required');
            if (!models.compliance_document_checklist_template) {
                return responseHandler.returnSuccess(httpStatus.OK, 'Checklist template fetched', []);
            }

            const rows = await models.compliance_document_checklist_template.findAll({
                where: { event_master_id: id, is_deleted: false },
                order: [['sort_order', 'ASC'], ['checklist_template_id', 'ASC']],
            });

            return responseHandler.returnSuccess(
                httpStatus.OK,
                'Checklist template fetched',
                rows.map(row => (row.toJSON ? row.toJSON() : row))
            );
        } catch (err) {
            logger.error('List document checklist template error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error fetching checklist template');
        }
    };

    // Replace-set semantics (whole-config save, same as EventRuleService's builder
    // pattern) — not one endpoint per row. Rows omitted from `items` are soft-deleted,
    // not hard-deleted, so already-copied company_event_documents rows keep a valid
    // checklist_template_id reference for history.
    saveAll = async (eventMasterId, items = [], userId = null, req = null) => {
        const models = getCurrentModels();
        const id = Number(eventMasterId);
        if (!id) return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Event master id is required');
        if (!models.compliance_document_checklist_template) {
            return responseHandler.returnError(httpStatus.BAD_REQUEST, 'Checklist template model is unavailable');
        }

        const t = await models.sequelize.transaction();
        try {
            const existingRows = await models.compliance_document_checklist_template.findAll({
                where: { event_master_id: id, is_deleted: false },
                transaction: t,
            });
            const existingById = new Map(existingRows.map(row => [row.checklist_template_id, row]));
            const keepIds = new Set();
            const now = new Date();

            for (let index = 0; index < items.length; index += 1) {
                const item = items[index] || {};
                const documentName = String(item.document_name || '').trim();
                if (!documentName) continue;

                const payload = {
                    event_master_id: id,
                    document_name: documentName,
                    description: item.description || null,
                    is_mandatory: item.is_mandatory !== false,
                    sort_order: item.sort_order !== undefined ? Number(item.sort_order) || 0 : index,
                    is_deleted: false,
                    updated_date: now,
                    updated_by: userId,
                };

                const existingId = Number(item.checklist_template_id) || null;
                if (existingId && existingById.has(existingId)) {
                    await existingById.get(existingId).update(payload, { transaction: t });
                    keepIds.add(existingId);
                } else {
                    const created = await models.compliance_document_checklist_template.create({
                        ...payload,
                        created_date: now,
                        created_by: userId,
                    }, { transaction: t });
                    keepIds.add(created.checklist_template_id);
                }
            }

            const toRemove = existingRows.filter(row => !keepIds.has(row.checklist_template_id));
            for (const row of toRemove) {
                await row.update({ is_deleted: true, updated_date: now, updated_by: userId }, { transaction: t });
            }

            await t.commit();

            logHelper.auditLog(req, {
                module: MODULES.EVENT,
                action: ACTIONS.SAVE_DOCUMENT_CHECKLIST_TEMPLATE,
                user_id: userId,
                table_name: 'compliance_document_checklist_template',
                record_id: id,
                new_values: { event_master_id: id, item_count: keepIds.size, removed_count: toRemove.length },
            });

            return this.listByEventMaster(id);
        } catch (err) {
            await t.rollback();
            logger.error('Save document checklist template error:', err);
            return responseHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, err.message || 'Error saving checklist template');
        }
    };

}

module.exports = DocumentChecklistTemplateService;
