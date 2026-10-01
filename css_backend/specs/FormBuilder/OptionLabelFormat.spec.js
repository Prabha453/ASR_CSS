'use strict';

const { expect } = require('chai');
const { formatOptionLabel, OPTION_LABEL_CATALOG } = require('../../src/domain/formBuilder/optionLabelFormat');

describe('Popup option label formatting', () => {
    it('falls back to the default label when no pieces are configured', () => {
        expect(formatOptionLabel('OFFICIAL_RECORDS', [], { name: 'Alice' }, 'Alice - directors'))
            .to.equal('Alice - directors');
        expect(formatOptionLabel('OFFICIAL_RECORDS', undefined, {}, 'Alice - directors'))
            .to.equal('Alice - directors');
    });

    it('builds the label from the chosen pieces, in the chosen order', () => {
        expect(formatOptionLabel('OFFICIAL_RECORDS', ['role_name', 'name'], {
            name: 'Alice', role_name: 'Director', appointment_date: '2026-09-01',
        }, 'fallback')).to.equal('Director - Alice');
    });

    it('formats a date piece and a number piece', () => {
        expect(formatOptionLabel('OFFICIAL_RECORDS', ['name', 'appointment_date'], {
            name: 'Alice', appointment_date: '2026-09-01',
        }, 'fallback')).to.equal('Alice - 01-Sep-2026');
        expect(formatOptionLabel('SHARES', ['shareholder_name', 'quantity'], {
            shareholder_name: 'Pavithra', quantity: 2000,
        }, 'fallback')).to.equal('Pavithra - 2,000');
    });

    it('skips a piece the option has no value for, without breaking the label', () => {
        expect(formatOptionLabel('SHARES', ['shareholder_name', 'share_class_name', 'quantity'], {
            shareholder_name: 'Pavithra', quantity: 2000,
        }, 'fallback')).to.equal('Pavithra - 2,000');
    });

    it('falls back to the default label when every configured piece is empty', () => {
        expect(formatOptionLabel('SHARES', ['share_class_name'], { quantity: 5 }, 'fallback'))
            .to.equal('fallback');
    });

    it('shares the same catalogue across OFFICIAL_RECORDS / OFFICIALS / SHAREHOLDERS', () => {
        expect(OPTION_LABEL_CATALOG.OFFICIALS).to.equal(OPTION_LABEL_CATALOG.OFFICIAL_RECORDS);
        expect(OPTION_LABEL_CATALOG.SHAREHOLDERS).to.equal(OPTION_LABEL_CATALOG.OFFICIAL_RECORDS);
    });
});
