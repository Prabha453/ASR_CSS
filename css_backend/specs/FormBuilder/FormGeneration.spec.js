'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { hashTemplateVersion } = require('../../src/domain/formBuilder/templateVersionHash');
const FormGenerationService = require('../../src/service/formBuilder/FormGenerationService');

describe('Versioned shortcode generation context', () => {
    afterEach(() => sinon.restore());

    it('resolves a scoped shortcode against its own popup selection', async () => {
        const resolve = sinon.stub().callsFake(async (keys, options) => keys.map(key => ({
            requested_key: key,
            canonical_key: key,
            resolved: true,
            value: options.officialRecordId || 'plain',
        })));
        const service = new FormGenerationService({});
        sinon.stub(service, '_resolver').returns({ resolve });
        const results = await service._resolveShortcodes({}, [
            { original_key: 'company.name' },
            { original_key: 'director_name##official_record.name' },
        ], {
            entityId: 7,
            popupFields: [{
                field_key: 'director_name',
                value_source: 'OFFICIAL_RECORDS',
            }],
            popupValues: { director_name: 44 },
        });

        expect(resolve.callCount).to.equal(2);
        expect(resolve.secondCall.args[1]).to.include({
            officialRecordId: 44,
            scopeKey: 'director_name',
            selectedValue: 44,
        });
        expect(results[1]).to.deep.include({
            requested_key: 'director_name##official_record.name',
            canonical_key: 'director_name##official_record.name',
            value: 44,
        });
    });
});

describe('Immutable generation run identity', () => {
    const request = {
        form_id: 8,
        template_version_id: 4,
        template_content_hash: 'template-hash',
        entity_id: 12,
        company_event_id: null,
        popup_values: { shareholder: 10, effective_date: '2026-08-24' },
    };

    it('produces the same request hash regardless of object key order', () => {
        expect(hashTemplateVersion(request)).to.equal(hashTemplateVersion({
            popup_values: { effective_date: '2026-08-24', shareholder: 10 },
            company_event_id: null,
            entity_id: 12,
            template_content_hash: 'template-hash',
            template_version_id: 4,
            form_id: 8,
        }));
    });

    it('changes identity when a selection or template version changes', () => {
        expect(hashTemplateVersion(request)).not.to.equal(hashTemplateVersion({
            ...request, popup_values: { ...request.popup_values, shareholder: 11 },
        }));
        expect(hashTemplateVersion(request)).not.to.equal(hashTemplateVersion({
            ...request, template_version_id: 5,
        }));
    });
});

describe('Stored-snapshot regeneration', () => {
    const source = {
        generation_run_id: 41,
        request_hash: 'source-request-hash',
        form_id: 8,
        template_version_id: 4,
        entity_id: 12,
        template_content_hash: 'template-hash',
        selection_snapshot: { allotment: 9 },
        resolved_snapshot: { shortcodes: [{ canonical_key: 'company.name', value: 'Original Name' }] },
        popup_schema_snapshot: [{ section_key: 'main', fields: [] }],
        template_content_snapshot: '<p>{{company.name}}</p>',
        layout_snapshot: { page_size: 'A4' },
        template_fields_snapshot: [{ canonical_key: 'company.name' }],
    };

    it('copies only the immutable source run without reading current master data', async () => {
        let created;
        let findCount = 0;
        const models = { form_generation_run: {
            findOne: async options => {
                findCount += 1;
                return options.where.generation_run_id === 41 ? source : null;
            },
            create: async values => { created = values; return { generation_run_id: 42, ...values }; },
        } };
        const result = await new FormGenerationService(models).regenerate(41, 'regenerate-key-0001', 7);
        expect(result.statusCode).to.equal(201);
        expect(findCount).to.equal(2);
        expect(created).to.deep.include({
            source_generation_run_id: 41,
            form_id: 8,
            entity_id: 12,
            lifecycle_status: 'READY',
            created_by: 7,
            template_content_snapshot: source.template_content_snapshot,
        });
        expect(created.resolved_snapshot).to.equal(source.resolved_snapshot);
        expect(created.selection_snapshot).to.equal(source.selection_snapshot);
    });

    it('rejects a source that predates complete immutable snapshots', async () => {
        const models = { form_generation_run: {
            findOne: async () => ({ ...source, resolved_snapshot: null }),
        } };
        const result = await new FormGenerationService(models).regenerate(41, 'regenerate-key-0002', 7);
        expect(result.statusCode).to.equal(409);
        expect(result.response.message).to.include('complete immutable snapshot');
    });
});
