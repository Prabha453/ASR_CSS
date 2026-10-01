'use strict';

const { expect } = require('chai');
const { hashTemplateVersion } = require('../../src/domain/formBuilder/templateVersionHash');
const FormTemplateVersionService = require('../../src/service/formBuilder/FormTemplateVersionService');

describe('Immutable form template versions', () => {
    it('creates stable hashes independent of object property order', () => {
        expect(hashTemplateVersion({ content: 'A', layout: { left: 1, top: 2 } }))
            .to.equal(hashTemplateVersion({ layout: { top: 2, left: 1 }, content: 'A' }));
    });

    it('marks unknown fields as publication blockers', () => {
        const record = FormTemplateVersionService.buildFieldRecord({
            key: 'unknown.field', formatters: [], occurrences: 1, is_block: false,
        });
        expect(record).to.include({
            canonical_key: null,
            validation_status: 'UNKNOWN',
            is_required: true,
        });
    });

    it('accepts an allowed date format and preserves the canonical key', () => {
        const record = FormTemplateVersionService.buildFieldRecord({
            key: 'Due_date',
            formatters: ['date:DD-MMM-YYYY'],
            occurrences: 2,
            is_block: false,
        }, {
            shortcode_id: 5,
            shortcode_key: 'event.due_date',
            allowed_formats: ['DD-MMM-YYYY'],
        });
        expect(record).to.include({
            canonical_key: 'event.due_date',
            validation_status: 'VALID',
            occurrences: 2,
        });
    });

    it('drops popup-scoped loop keys from the shortcode field list', () => {
        const fields = FormTemplateVersionService.shortcodeFields(
            '{{company.name}}'
            + '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}}{{/Popup_Section_1##officials}}'
            + '{{director_1##official_record.name}}'
        );
        expect(fields.map(field => field.key)).to.deep.equal([
            'company.name',
            // field-scoped tokens (##<shortcode>) still validate; only loop
            // constructs are dropped.
            'director_1##official_record.name',
        ]);
    });

    it('blocks a formatter value outside the definition allow-list', () => {
        const record = FormTemplateVersionService.buildFieldRecord({
            key: 'event.due_date',
            formatters: ['date:MM-DD-YY'],
            occurrences: 1,
            is_block: false,
        }, {
            shortcode_id: 5,
            shortcode_key: 'event.due_date',
            allowed_formats: ['DD-MMM-YYYY'],
        });
        expect(record.validation_status).to.equal('INVALID_FORMAT');
    });

    it('accepts individual/corporate conditions for official shortcodes', () => {
        const official = {
            shortcode_id: 9,
            shortcode_key: 'official_record.name',
            source_domain: 'OFFICIAL',
            allowed_formats: [],
        };
        const individual = FormTemplateVersionService.buildFieldRecord({
            key: 'director_list##official_record.name',
            formatters: ['official_type:individual'],
            occurrences: 1,
            is_block: false,
        }, official);
        const corporate = FormTemplateVersionService.buildFieldRecord({
            key: 'director_list##official_record.name',
            formatters: ['official_type:corporate'],
            occurrences: 1,
            is_block: false,
        }, official);

        expect(individual.validation_status).to.equal('VALID');
        expect(corporate.validation_status).to.equal('VALID');
    });

    it('rejects official-type conditions on non-official shortcodes', () => {
        const record = FormTemplateVersionService.buildFieldRecord({
            key: 'company.name',
            formatters: ['official_type:individual'],
            occurrences: 1,
            is_block: false,
        }, {
            shortcode_id: 1,
            shortcode_key: 'company.name',
            source_domain: 'COMPANY',
            allowed_formats: [],
        });
        expect(record.validation_status).to.equal('INVALID_FORMAT');
    });
});
