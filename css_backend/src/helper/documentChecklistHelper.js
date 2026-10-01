'use strict';

const logger = require('../config/logger');

// Spec §15.1 "Document Checklist" — copies a compliance type's checklist template
// onto a newly-created company_event, one row per active template item, all starting
// as REQUIRED. Lives in its own module (not CompanyEventService.js) so it can be
// called from both CompanyEventService.js and EntityCompanyService.js without either
// requiring the other — the same reasoning src/config/companyEventStatus.js was
// extracted for in an earlier increment.
//
// Only ever called when a NEW company_event row is created — never on resync/update,
// so a manually-progressed checklist item is never clobbered. Best-effort: a failure
// here must never block event creation, same discipline as calculation-trace writes.
const copyChecklistTemplateToEvent = async (models, payload = {}, transaction = null) => {
    const { companyEventId, eventMasterId, entityId, eventId, eventSlug, userId } = payload;
    if (!companyEventId || !eventMasterId) return;

    try {
        if (!models.compliance_document_checklist_template || !models.company_event_document) return;

        const templates = await models.compliance_document_checklist_template.findAll({
            where: { event_master_id: eventMasterId, is_deleted: false },
            order: [['sort_order', 'ASC'], ['checklist_template_id', 'ASC']],
            transaction,
        });
        if (!templates.length) return;

        const existing = await models.company_event_document.findAll({
            where: { company_event_id: companyEventId, is_deleted: false },
            attributes: ['checklist_template_id'],
            transaction,
        });
        const existingTemplateIds = new Set(existing
            .map(row => Number((row.toJSON ? row.toJSON() : row).checklist_template_id))
            .filter(Boolean));

        const now = new Date();
        const rows = templates.filter(template => {
            const plain = template.toJSON ? template.toJSON() : template;
            return !existingTemplateIds.has(Number(plain.checklist_template_id));
        }).map(template => {
            const plain = template.toJSON ? template.toJSON() : template;
            return {
                company_event_id: companyEventId,
                entity_id: entityId,
                event_id: eventId,
                event_slug: eventSlug,
                checklist_template_id: plain.checklist_template_id,
                document_name: plain.document_name,
                is_mandatory: plain.is_mandatory,
                status: 'REQUIRED',
                sort_order: plain.sort_order,
                is_deleted: false,
                created_date: now,
                created_by: userId || null,
                updated_date: now,
                updated_by: userId || null,
            };
        });

        if (rows.length) await models.company_event_document.bulkCreate(rows, { transaction });
    } catch (err) {
        logger.warn('Copy document checklist template to event error:', err?.message || err);
    }
};

module.exports = { copyChecklistTemplateToEvent };
