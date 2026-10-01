'use strict';

const { expect } = require('chai');
const {
    parseTemplateFields, parseScopedKey,
} = require('../../src/domain/formBuilder/templateFieldParser');
const { renderHtmlTemplate } = require('../../src/domain/formBuilder/htmlTemplateRenderer');

describe('Field-scoped merge tokens', () => {
    it('splits {{<field key>##<shortcode>}} into scope and shortcode key', () => {
        expect(parseScopedKey('director_1##official_record.name'))
            .to.deep.equal({ scope: 'director_1', key: 'official_record.name' });
        // No separator → ordinary shortcode.
        expect(parseScopedKey('company.name')).to.deep.equal({ scope: null, key: 'company.name' });
        // Scope is lower-cased so it matches the normalised popup field key.
        expect(parseScopedKey('Director_2##official_record.name').scope).to.equal('director_2');
    });

    it('keeps the whole scoped token as one parsed key with its formatters', () => {
        const fields = parseTemplateFields(
            'A {{director_1##official_record.name}} '
            + 'B {{director_1##official_record.appointment_date | date:DD-MMM-YYYY}}'
        );
        expect(fields.map(field => field.key)).to.deep.equal([
            'director_1##official_record.name',
            'director_1##official_record.appointment_date',
        ]);
        expect(fields[1].formatters).to.deep.equal(['date:DD-MMM-YYYY']);
    });

    it('renders each scoped token from its own resolved value', () => {
        const content = 'D1: {{director_1##official_record.name}}\n'
            + 'D2: {{director_2##official_record.name}}\n'
            + 'D1 appt: {{director_1##official_record.appointment_date | date:DD-MMM-YYYY}}\n'
            + 'Plain: {{company.name}}';
        const html = renderHtmlTemplate(content, {
            'director_1##official_record.name': 'Alice Tan',
            'director_2##official_record.name': 'Bob Lee',
            'director_1##official_record.appointment_date': '2026-09-01',
            'company.name': 'Test Both',
        });
        expect(html).to.equal(
            'D1: Alice Tan\nD2: Bob Lee\nD1 appt: 01-Sep-2026\nPlain: Test Both'
        );
    });

    it('leaves an unknown scoped shortcode literal but empties a known-unresolved one', () => {
        // Mirrors DirectFormRenderService: known-but-unresolved keys are written
        // as '' by the caller; unknown keys are simply never added to `values`.
        const html = renderHtmlTemplate(
            'known: {{director_1##official_record.name}} unknown: {{director_1##made.up}}',
            { 'director_1##official_record.name': '' }
        );
        expect(html).to.equal('known:  unknown: {{director_1##made.up}}');
    });
});
