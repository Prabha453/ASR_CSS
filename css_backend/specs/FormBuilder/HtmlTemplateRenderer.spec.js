'use strict';

const { expect } = require('chai');
const {
    escapeHtml, formatDate, renderHtmlTemplate,
} = require('../../src/domain/formBuilder/htmlTemplateRenderer');
const FormHtmlRenderService = require('../../src/service/formBuilder/FormHtmlRenderService');

describe('Deterministic HTML template renderer', () => {
    it('escapes scalar values and applies date formatting', () => {
        expect(renderHtmlTemplate(
            '<h1>{{company.name}}</h1><p>{{event.due_date | date:DD-MMM-YYYY}}</p>',
            { 'company.name': '<ACME & Co>', 'event.due_date': '2026-08-24' }
        )).to.equal('<h1>&lt;ACME &amp; Co&gt;</h1><p>24-Aug-2026</p>');
        expect(formatDate('2026-08-24', 'DD/MM/YYYY')).to.equal('24/08/2026');
        expect(escapeHtml('"x"')).to.equal('&quot;x&quot;');
    });

    it('highlights resolved shortcode values only when HTML preview highlighting is requested', () => {
        const template = '<p>{{company.name}}</p><a title="{{company.name}}">Company</a>';
        const values = { 'company.name': '<ACME & Co>' };

        expect(renderHtmlTemplate(template, values, { highlightShortcodes: true })).to.equal(
            '<p><span class="form-shortcode-highlight" style="background-color:#ffeb3b;color:inherit;">'
            + '&lt;ACME &amp; Co&gt;</span></p><a title="&lt;ACME &amp; Co&gt;">Company</a>'
        );
        expect(renderHtmlTemplate(template, values)).to.equal(
            '<p>&lt;ACME &amp; Co&gt;</p><a title="&lt;ACME &amp; Co&gt;">Company</a>'
        );
    });

    it('highlights shortcode values rendered inside repeating blocks', () => {
        expect(renderHtmlTemplate(
            '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}} {{/Popup_Section_1##officials}}',
            { 'popup_section_1##officials': [{ name: 'Alice' }] },
            { highlightShortcodes: true }
        )).to.include('background-color:#ffeb3b;color:inherit;">Alice</span>');
    });

    it('expands collection blocks using local and global values', () => {
        expect(renderHtmlTemplate(
            '{{#officials.directors}}<p>{{name}} — {{company.name}}</p>{{/officials.directors}}',
            { 'officials.directors': [{ name: 'Alice' }, { name: 'Bob' }], 'company.name': 'ACME' }
        )).to.equal('<p>Alice — ACME</p><p>Bob — ACME</p>');
    });

    it('resolves scoped / domain-rooted body tokens against the current row', () => {
        // The picker emits {{<field>##official_record.name}} on a popup tab; the
        // same token inside {{#officials.all_list}} must read each row, not the
        // first selected record.
        expect(renderHtmlTemplate(
            '{{#officials.all_list}}{{all_officials##official_record.name}}='
            + '{{official_record.role_name}} {{/officials.all_list}}',
            {
                'officials.all_list': [
                    { name: 'Alice', role_name: 'Director' },
                    { name: 'Bob', role_name: 'Secretary' },
                ],
                // field-scoped global for the first record — must NOT leak into the loop
                'all_officials##official_record.name': 'Alice',
            }
        )).to.equal('Alice=Director Bob=Secretary ');
    });

    it('renders only the merge fields matching the selected official type', () => {
        const template = 'Individual: {{director_list##official_record.name | official_type:individual}} '
            + 'Corporate: {{director_list##official_record.name | official_type:corporate}}';

        expect(renderHtmlTemplate(template, {
            'director_list##official_record.name': 'Alice Tan',
            'director_list##official_type': 'INDIVIDUAL',
        })).to.equal('Individual: Alice Tan Corporate: ');

        // Corporate officials are stored as COMPANY in the current schema.
        expect(renderHtmlTemplate(template, {
            'director_list##official_record.name': 'Example Pte Ltd',
            'director_list##official_type': 'COMPANY',
        })).to.equal('Individual:  Corporate: Example Pte Ltd');
    });

    it('applies official-type conditions before date formatting', () => {
        expect(renderHtmlTemplate(
            '{{director_list##official_record.date_of_birth | date:DD-MMM-YYYY | official_type:individual}}',
            {
                'director_list##official_record.date_of_birth': '',
                'director_list##official_type': 'COMPANY',
            }
        )).to.equal('');
    });

    it('hides an unmapped shortcode only when it has an official-type condition', () => {
        expect(renderHtmlTemplate(
            'Alias: {{director_list##official_record.alias_name | official_type:individual}} '
            + 'Unknown: {{missing}}',
            { 'director_list##official_type': 'INDIVIDUAL' }
        )).to.equal('Alias:  Unknown: {{missing}}');
    });

    it('preserves unresolved placeholders and rejects active content', () => {
        expect(renderHtmlTemplate('{{missing}}', {})).to.equal('{{missing}}');
        expect(() => renderHtmlTemplate('<script>alert(1)</script>', {})).to.throw('unsafe active content');
        expect(() => renderHtmlTemplate('<img src=x onerror="bad()">', {})).to.throw('unsafe active content');
        expect(() => renderHtmlTemplate('<img src="file:///secret.txt">', {})).to.throw('unsafe active content');
    });

    it('builds scalar popup display values only from resolved snapshots', () => {
        const values = FormHtmlRenderService.buildRenderValues({
            shortcodes: [{ requested_key: 'company.name', canonical_key: 'company.name', value: 'ACME' }],
            popup: { shareholder: { value: 7, selected: [{ value: 7, label: 'Alice' }] } },
        });
        expect(values['company.name']).to.equal('ACME');
        expect(values.shareholder).to.equal('Alice');
        // Popup values are exposed only under their bare field key — the legacy
        // `popup.` alias was removed.
        expect(values).to.not.have.property('popup.shareholder');
    });

    it('exposes frozen popup-scoped loop collections under their block key', () => {
        const values = FormHtmlRenderService.buildRenderValues({
            shortcodes: [],
            loops: {
                'popup_section_1##officials': [
                    { name: 'Cara', role_name: 'Director' },
                    { name: 'Ben', role_name: 'Secretary' },
                ],
            },
        });
        expect(renderHtmlTemplate(
            '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}}={{Popup_Section_1##role_name}} {{/Popup_Section_1##officials}}',
            values
        )).to.equal('Cara=Director Ben=Secretary ');
    });

    it('restores official-type context from an immutable generation snapshot', () => {
        const values = FormHtmlRenderService.buildRenderValues({
            shortcodes: [{
                requested_key: 'director_list##official_record.name',
                canonical_key: 'director_list##official_record.name',
                value: 'Example Pte Ltd',
                selection_context: { official_type: 'COMPANY' },
            }],
        });

        expect(values['director_list##official_type']).to.equal('COMPANY');
        expect(renderHtmlTemplate(
            '{{director_list##official_record.name | official_type:corporate}}',
            values
        )).to.equal('Example Pte Ltd');
    });
});
