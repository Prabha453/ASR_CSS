'use strict';

const { expect } = require('chai');
const { parseTemplateFields, hasUsableValue } = require('../../src/domain/formBuilder/templateFieldParser');
const FormPreviewService = require('../../src/service/formBuilder/FormPreviewService');

describe('Form preview readiness', () => {
    it('uses published templates by default and draft templates only when explicitly requested', async () => {
        const service = new FormPreviewService();
        const models = {
            form: {
                findOne: async () => ({
                    form_id: 10,
                    form_name: 'Annual Return',
                    form_content: 'editable draft',
                }),
            },
            form_template_version: {
                findOne: async () => ({
                    template_version_id: 21,
                    version_number: 3,
                    content_snapshot: 'published snapshot',
                    content_hash: 'abc',
                }),
            },
        };

        const published = await service._loadTemplate(models, 10, 'PUBLISHED');
        const draft = await service._loadTemplate(models, 10, 'DRAFT');

        expect(published.content).to.equal('published snapshot');
        expect(published.version.version_number).to.equal(3);
        expect(draft.content).to.equal('editable draft');
        expect(draft.version).to.equal(null);
    });

    it('blocks runtime preview when a form has no published version', async () => {
        const service = new FormPreviewService();
        const result = await service._loadTemplate({
            form: { findOne: async () => ({ form_id: 10 }) },
            form_template_version: { findOne: async () => null },
        }, 10, 'PUBLISHED');

        expect(result.error.statusCode).to.equal(409);
    });

    it('extracts unique scalar fields and their formatters', () => {
        expect(parseTemplateFields(`
            <p>{{company.name}}</p>
            <p>{{ event.due_date | date:DD-MMM-YYYY }}</p>
            <p>{{company.name}}</p>
        `)).to.deep.equal([
            { key: 'company.name', formatters: [], occurrences: 2, is_block: false },
            { key: 'event.due_date', formatters: ['date:DD-MMM-YYYY'], occurrences: 1, is_block: false },
        ]);
    });

    it('does not treat collection block controls as scalar fields', () => {
        expect(parseTemplateFields('{{#officials.directors}}{{company.name}}{{/officials.directors}}'))
            .to.deep.equal([
                { key: 'officials.directors', formatters: [], occurrences: 1, is_block: true },
                { key: 'company.name', formatters: [], occurrences: 1, is_block: false },
            ]);
    });

    it('treats empty required collections and addresses as unresolved', () => {
        expect(hasUsableValue([])).to.equal(false);
        expect(hasUsableValue({ formatted: '' })).to.equal(false);
        expect(hasUsableValue([{ name: 'Jane' }])).to.equal(true);
    });

    it('extracts a formatter format argument for allow-list validation', () => {
        expect(FormPreviewService.formatterFormat('date:DD-MMM-YYYY'))
            .to.equal('DD-MMM-YYYY');
        expect(FormPreviewService.formatterFormat('uppercase')).to.equal(null);
    });
});
