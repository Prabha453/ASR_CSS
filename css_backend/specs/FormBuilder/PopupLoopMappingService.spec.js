'use strict';

const { expect } = require('chai');
const { Op } = require('sequelize');
const PopupLoopMappingService = require('../../src/service/formBuilder/PopupLoopMappingService');

// Minimal fake models — only the finders the loop retrieval touches.
const fakeModels = () => ({
    officials: {
        findAll: async ({ where }) => {
            const ids = where.official_id[Op.in];
            const all = {
                OFF002: { official_id: 'OFF002', official_entity: { name: 'Bee' }, official_master: { official_master_name: 'Director' } },
                OFF005: { official_id: 'OFF005', official_entity: { name: 'Cee' }, official_master: { official_master_name: 'Secretary' } },
                OFF008: { official_id: 'OFF008', official_entity: { name: 'Dee' }, official_master: { official_master_name: 'Director' } },
            };
            return ids.map(id => all[id]).filter(Boolean);
        },
    },
    company_event: {
        findAll: async ({ where }) => {
            const ids = where.company_event_id[Op.in];
            const all = {
                EV1: { company_event_id: 'EV1', event_slug: 'agm', due_date: '2026-06-30', event: { event_name: 'AGM' } },
            };
            return ids.map(id => all[id]).filter(Boolean);
        },
    },
    entity_shares: {
        findAll: async ({ where }) => {
            const ids = where.id[Op.in];
            const all = { S1: { id: 'S1', number_of_shares: 100, share_class: { sc_name: 'Ordinary' } } };
            return ids.map(id => all[id]).filter(Boolean);
        },
    },
    share_ledger: {
        findAll: async ({ where }) => {
            const ids = where.id[Op.in];
            const all = {
                L1: {
                    id: 'L1', official_entity_id: 501, balance_after_qty: 40,
                    share_type: 'NORMAL', currency: 'SGD', share_cert_no: 'CERT-1',
                },
            };
            return ids.map(id => all[id]).filter(Boolean);
        },
    },
    entities: {
        findAll: async () => [{ entity_id: 501, name: 'Alice Tan' }],
    },
});

const officialsField = { field_key: 'popup_section_1', value_source: 'OFFICIALS' };

describe('PopupLoopMappingService', () => {
    it('maps a popup selection to officials in the picked order', async () => {
        const service = new PopupLoopMappingService(fakeModels());
        const values = await service.buildLoopValues(
            '{{#Popup_Section_1##officials}}{{Popup_Section_1##name}}{{/Popup_Section_1##officials}}',
            {
                entityId: 1,
                popupFields: [officialsField],
                popupValues: { popup_section_1: ['OFF008', 'OFF002', 'OFF005'] },
            }
        );
        expect(values['popup_section_1##officials'].map(o => o.name))
            .to.deep.equal(['Dee', 'Bee', 'Cee']);
        expect(values['popup_section_1##officials'][0].role_name).to.equal('Director');
    });

    it('returns an empty collection for an empty selection', async () => {
        const service = new PopupLoopMappingService(fakeModels());
        const values = await service.buildLoopValues(
            '{{#Popup_Section_1##officials}}x{{/Popup_Section_1##officials}}',
            { entityId: 1, popupFields: [officialsField], popupValues: { popup_section_1: [] } }
        );
        expect(values['popup_section_1##officials']).to.deep.equal([]);
    });

    it('returns an empty collection for an unknown popup field key', async () => {
        const service = new PopupLoopMappingService(fakeModels());
        const values = await service.buildLoopValues(
            '{{#Missing##officials}}x{{/Missing##officials}}',
            { entityId: 1, popupFields: [officialsField], popupValues: {} }
        );
        expect(values['missing##officials']).to.deep.equal([]);
    });

    it('dispatches officials / events / shares in one template', async () => {
        const service = new PopupLoopMappingService(fakeModels());
        const values = await service.buildLoopValues(
            '{{#P1##officials}}a{{/P1##officials}}{{#P2##events}}b{{/P2##events}}{{#P3##shares}}c{{/P3##shares}}',
            {
                entityId: 1,
                popupFields: [
                    { field_key: 'p1', value_source: 'OFFICIALS' },
                    { field_key: 'p2', value_source: 'EVENT' },
                    { field_key: 'p3', value_source: 'SHARES' },
                ],
                popupValues: { p1: ['OFF002'], p2: 'EV1', p3: ['S1'] },
            }
        );
        expect(values['p1##officials'][0].name).to.equal('Bee');
        expect(values['p2##events'][0].event_name).to.equal('AGM');
        expect(values['p3##shares'][0].share_class_name).to.equal('Ordinary');
    });

    it('dispatches shareholder_shares as a distinct loop type from shares', async () => {
        const service = new PopupLoopMappingService(fakeModels());
        const values = await service.buildLoopValues(
            '{{#p4##shareholder_shares}}x{{/p4##shareholder_shares}}',
            {
                entityId: 1,
                popupFields: [{ field_key: 'p4', value_source: 'SHARES', source_filter_1: 'SHAREHOLDER_LEVEL_SHARES' }],
                popupValues: { p4: ['L1'] },
            }
        );
        expect(values['p4##shareholder_shares']).to.have.length(1);
        expect(values['p4##shareholder_shares'][0]).to.deep.include({
            ledger_id: 'L1', shareholder_name: 'Alice Tan', number_of_shares: 40,
            share_certificate_number: 'CERT-1', number_of_shares_in_words: 'Forty',
        });
    });
});
