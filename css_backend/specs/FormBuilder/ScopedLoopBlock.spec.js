'use strict';

const { expect } = require('chai');
const {
    parseScopedBlockKey, parseScopedFieldToken, findScopedLoopBlocks,
    scopedLoopTemplateKeys, orderBySelection,
} = require('../../src/domain/formBuilder/scopedLoopBlock');
const { renderScopedLoopBlocks } = require('../../src/domain/formBuilder/scopedLoopRenderer');
const { renderHtmlTemplate } = require('../../src/domain/formBuilder/htmlTemplateRenderer');

describe('Popup-scoped loop blocks', () => {
    it('parses a block identifier into field key + loop type (lower-cased)', () => {
        expect(parseScopedBlockKey('Popup_Section_1##officials'))
            .to.deep.equal({ fieldKey: 'popup_section_1', loopType: 'officials' });
        expect(parseScopedBlockKey('Popup_Section_2##events'))
            .to.deep.equal({ fieldKey: 'popup_section_2', loopType: 'events' });
        expect(parseScopedBlockKey('no_separator')).to.equal(null);
    });

    it('parses an inner field token into field key + record path', () => {
        expect(parseScopedFieldToken('Popup_Section_1##appointment_date'))
            .to.deep.equal({ fieldKey: 'popup_section_1', path: 'appointment_date' });
    });

    it('finds every scoped loop block with its collection key', () => {
        const blocks = findScopedLoopBlocks(
            '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}}{{/Popup_Section_1##officials}}'
            + '{{#Popup_Section_3##events}}x{{/Popup_Section_3##events}}'
        );
        expect(blocks.map(b => b.valueKey)).to.deep.equal([
            'popup_section_1##officials', 'popup_section_3##events',
        ]);
    });

    it('rejects a mismatched open/close pair', () => {
        expect(() => findScopedLoopBlocks(
            '{{#Popup_Section_1##officials}}x{{/Popup_Section_2##officials}}'
        )).to.throw('Mismatched scoped loop block');
    });

    it('rejects an unknown loop type', () => {
        expect(() => findScopedLoopBlocks(
            '{{#Popup_Section_1##directors}}x{{/Popup_Section_1##directors}}'
        )).to.throw('Unknown scoped loop type "directors"');
    });

    it('accepts shareholder_shares as a distinct loop type from shares', () => {
        const blocks = findScopedLoopBlocks(
            '{{#company_shares##shares}}a{{/company_shares##shares}}'
            + '{{#holder_shares##shareholder_shares}}b{{/holder_shares##shareholder_shares}}'
        );
        expect(blocks.map(b => b.loopType)).to.deep.equal(['shares', 'shareholder_shares']);
    });

    it('collects block ids + inner tokens for shortcode validators to skip', () => {
        const keys = scopedLoopTemplateKeys(
            'Head {{company.name}}\n'
            + '{{#Popup_Section_1##officials}}'
            + '{{Popup_Section_1##name}} {{Popup_Section_1##appointment_date | date:DD-MMM-YYYY}}'
            + '{{/Popup_Section_1##officials}}'
        );
        expect([...keys].sort()).to.deep.equal([
            'Popup_Section_1##appointment_date',
            'Popup_Section_1##name',
            'Popup_Section_1##officials',
            'popup_section_1##officials',
        ]);
    });

    it('ignores a malformed block when collecting keys (no throw)', () => {
        expect([...scopedLoopTemplateKeys('{{#a##officials}}x{{/b##officials}}')]).to.deep.equal([]);
        expect([...scopedLoopTemplateKeys('{{#a##bogus}}x{{/a##bogus}}')]).to.deep.equal([]);
    });

    it('orders records by the selection order, dropping unmatched ids', () => {
        const records = [{ id: 'OFF002' }, { id: 'OFF005' }, { id: 'OFF008' }];
        expect(orderBySelection(records, ['OFF008', 'OFF002', 'OFF005'], r => r.id))
            .to.deep.equal([{ id: 'OFF008' }, { id: 'OFF002' }, { id: 'OFF005' }]);
        expect(orderBySelection(records, ['OFF999'], r => r.id)).to.deep.equal([]);
    });
});

describe('Popup-scoped loop rendering', () => {
    const template =
        '{{#Popup_Section_1##officials}}'
        + '[{{Popup_Section_1##name}}|{{Popup_Section_1##role_name}}|'
        + '{{Popup_Section_1##appointment_date | date:DD-MMM-YYYY}}]'
        + '{{/Popup_Section_1##officials}}';

    it('iterates the block against its own popup collection, in order', () => {
        const html = renderHtmlTemplate(template, {
            'popup_section_1##officials': [
                { name: 'Cara', role_name: 'Director', appointment_date: '2026-01-02' },
                { name: 'Ана', role_name: 'Secretary', appointment_date: '2025-11-30' },
            ],
        });
        expect(html).to.equal('[Cara|Director|02-Jan-2026][Ана|Secretary|30-Nov-2025]');
    });

    it('resolves picker-style {{field##official_record.x}} tokens against each row', () => {
        const html = renderHtmlTemplate(
            '{{#all_officials##officials}}'
            + '{{all_officials##official_record.name}}/{{all_officials##official_record.role_name}} '
            + '{{/all_officials##officials}}',
            {
                'all_officials##officials': [
                    { name: 'Alice', role_name: 'Director' },
                    { name: 'Bob', role_name: 'Secretary' },
                ],
            }
        );
        expect(html).to.equal('Alice/Director Bob/Secretary ');
    });

    it('renders share catalogue fields and typed break tags for shareholder rows', () => {
        const html = renderHtmlTemplate(
            '{{#choose_shares##shareholder_shares}}'
            + '{{choose_shares##share.shareholder_name}} - '
            + '{{choose_shares##share.share_certificate_number}}&lt;br&gt;'
            + '{{/choose_shares##shareholder_shares}}',
            {
                'choose_shares##shareholder_shares': [
                    { shareholder_name: 'Pavithra', share_certificate_number: 'SC-1' },
                    { shareholder_name: 'Nivas', share_certificate_number: 'SC-2' },
                ],
            }
        );
        expect(html).to.equal('Pavithra - SC-1<br>Nivas - SC-2<br>');
    });

    it('renders nothing for an empty or missing selection (no throw)', () => {
        expect(renderHtmlTemplate(template, { 'popup_section_1##officials': [] })).to.equal('');
        expect(renderHtmlTemplate(template, {})).to.equal('');
    });

    it('keeps two official popup sections independent', () => {
        const html = renderHtmlTemplate(
            '{{#Popup_Section_1##officials}}A:{{Popup_Section_1##name}} {{/Popup_Section_1##officials}}'
            + '{{#Popup_Section_2##officials}}B:{{Popup_Section_2##name}} {{/Popup_Section_2##officials}}',
            {
                'popup_section_1##officials': [{ name: 'One' }],
                'popup_section_2##officials': [{ name: 'Two' }],
            }
        );
        expect(html).to.equal('A:One B:Two ');
    });

    it('resolves a global token used inside the loop body', () => {
        const html = renderHtmlTemplate(
            '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}} of {{company.name}}\n{{/Popup_Section_1##officials}}',
            { 'popup_section_1##officials': [{ name: 'Cara' }], 'company.name': 'ACME' }
        );
        expect(html).to.equal('Cara of ACME\n');
    });

    it('does not disturb a legacy {{#officials}} block or a plain field token', () => {
        const html = renderHtmlTemplate(
            '{{#officials.directors}}<p>{{name}}</p>{{/officials.directors}} {{company.name}} {{director_1##official_record.name}}',
            {
                'officials.directors': [{ name: 'Alice' }],
                'company.name': 'ACME',
                'director_1##official_record.name': 'Bob',
            }
        );
        expect(html).to.equal('<p>Alice</p> ACME Bob');
    });

    it('reports a mismatched scoped block from the renderer too', () => {
        expect(() => renderScopedLoopBlocks(
            '{{#a##officials}}x{{/b##officials}}', {}
        )).to.throw('Mismatched scoped loop block');
    });
});
