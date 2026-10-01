'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { copyChecklistTemplateToEvent } = require('../../src/helper/documentChecklistHelper');

describe('Company event document checklist copy', () => {
    afterEach(() => sinon.restore());

    const payload = {
        companyEventId: 100,
        eventMasterId: 2,
        entityId: 31,
        eventId: 2,
        eventSlug: 'agm',
        userId: 7,
    };

    it('backfills only template items missing from an existing event', async () => {
        const bulkCreate = sinon.stub().resolves([]);
        const models = {
            compliance_document_checklist_template: {
                findAll: sinon.stub().resolves([
                    { checklist_template_id: 10, document_name: 'Existing document', is_mandatory: true, sort_order: 1 },
                    { checklist_template_id: 11, document_name: 'New document', is_mandatory: false, sort_order: 2 },
                ]),
            },
            company_event_document: {
                findAll: sinon.stub().resolves([{ checklist_template_id: 10 }]),
                bulkCreate,
            },
        };

        await copyChecklistTemplateToEvent(models, payload);

        expect(bulkCreate.calledOnce).to.equal(true);
        const rows = bulkCreate.firstCall.args[0];
        expect(rows).to.have.length(1);
        expect(rows[0].checklist_template_id).to.equal(11);
        expect(rows[0].status).to.equal('REQUIRED');
    });

    it('does not duplicate checklist items when all templates already exist', async () => {
        const bulkCreate = sinon.stub().resolves([]);
        const models = {
            compliance_document_checklist_template: {
                findAll: sinon.stub().resolves([
                    { checklist_template_id: 10, document_name: 'Document', is_mandatory: true, sort_order: 1 },
                ]),
            },
            company_event_document: {
                findAll: sinon.stub().resolves([{ checklist_template_id: 10 }]),
                bulkCreate,
            },
        };

        await copyChecklistTemplateToEvent(models, payload);

        expect(bulkCreate.called).to.equal(false);
    });
});
