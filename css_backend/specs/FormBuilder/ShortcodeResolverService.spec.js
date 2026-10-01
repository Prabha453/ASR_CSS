'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const ShortcodeResolverService = require('../../src/service/formBuilder/ShortcodeResolverService');

describe('Shortcode resolver helpers', () => {
    afterEach(() => sinon.restore());

    it('runs registered custom backend code with popup generation context', async () => {
        const service = new ShortcodeResolverService({}, {
            'company.special_value': {
                valueType: 'STRING',
                resolve: async ({ data, popupValues, selectedValue }) => (
                    `${data.entity.name}:${popupValues.shares}:${selectedValue}`
                ),
            },
        });
        const result = await service._resolveDefinition({
            shortcode_key: 'company.special_value',
            resolver_name: 'CUSTOM_BACKEND',
            resolver_path: 'company.special_value',
            value_type: 'STRING',
            is_collection: false,
        }, { entity: { name: 'Example Co' } }, new Date('2026-01-01'), {
            popupValues: { shares: 17 },
            selectedValue: 17,
        });

        expect(result).to.deep.include({
            resolved: true,
            value: 'Example Co:17:17',
            value_type: 'STRING',
        });
    });

    it('reports custom shortcodes whose backend code is still pending', async () => {
        const service = new ShortcodeResolverService({}, {});
        const result = await service._resolveDefinition({
            shortcode_key: 'company.pending_value',
            resolver_name: 'CUSTOM_BACKEND',
            resolver_path: 'company.pending_value',
        }, {}, new Date());

        expect(result).to.deep.equal({
            resolved: false,
            reason: 'CUSTOM_HANDLER_NOT_REGISTERED',
        });
    });

    it('selects the first available company registration identifier', () => {
        expect(ShortcodeResolverService.pickRegistrationNumber({
            uen_no: '202600001A',
            id_number: 'fallback',
        })).to.equal('202600001A');
        expect(ShortcodeResolverService.pickRegistrationNumber({
            fbrn_reg_no: 'FBRN-1',
            id_number: 'fallback',
        })).to.equal('FBRN-1');
    });

    it('formats a registered address while preserving components', () => {
        const value = ShortcodeResolverService.formatAddress({
            block_no: '10',
            street_name: 'Anson Road',
            building_name: 'International Plaza',
            level_no: '12',
            unit_no: '01',
            country: 'Singapore',
            postal_code: '079903',
        });
        expect(value.formatted).to.equal(
            '10 Anson Road, International Plaza, #12-01, Singapore 079903'
        );
    });

    it('formats an address stored as a company change-history JSON value', () => {
        const value = ShortcodeResolverService.formatHistoryAddress(JSON.stringify({
            block_no: '20',
            street_name: 'Cecil Street',
            country: 'Singapore',
            postal_code: '049705',
        }));
        expect(value.formatted).to.equal('20 Cecil Street, Singapore 049705');
    });

    it('uses the proposed date when a company change has no effective date yet', () => {
        expect(ShortcodeResolverService.changeEffectiveDate({
            effective_date: null,
            proposed_date: '2026-12-01',
        })).to.equal('2026-12-01');
    });

    it('builds company profile values from addresses, SSIC, status and change history', async () => {
        const addresses = {
            REGISTERED: { block_no: '1', street_name: 'Main Street', country: 'Singapore' },
            BUSINESS: { block_no: '2', street_name: 'Trade Street', country: 'Singapore' },
            FOREIGN: { street_name: 'Queen Street', city: 'London', country: 'United Kingdom' },
        };
        const models = {
            entities: { findOne: async () => ({ entity_id: 7, name: 'New Co', former_name: 'Old Co' }) },
            entity_company_details: { findOne: async () => ({
                ssic_id: 10,
                ssic_id_secondary: 20,
                bank_id: 3,
            }) },
            entity_identification: { findOne: async () => null },
            entity_address: {
                findOne: async ({ where }) => addresses[where.address_type] || null,
            },
            entity_contact: { findOne: async () => null },
            officials: { findAll: async () => [] },
            entity_shares: { findAll: async () => [] },
            company_ssic_code: { findAll: async () => [
                { ssic_id: 10, ssic_code: '62011', ssic_description: 'Software development' },
                { ssic_id: 20, ssic_code: '70201', ssic_description: 'Management consultancy' },
            ] },
            entity_field_change_history: {
                findOne: async ({ where }) => where.field_type_id === 4
                    ? { old_value: 'Old Co', new_value: 'New Co', effective_date: '2026-01-02' }
                    : {
                        old_value: JSON.stringify({ block_no: '9', street_name: 'Old Road' }),
                        new_value: JSON.stringify(addresses.REGISTERED),
                        effective_date: '2026-02-03',
                    },
            },
            entity_status: {},
            entity_status_date: { findOne: async () => ({ effective_date: '2026-03-04' }) },
            bank: { findOne: async () => ({
                bank_name: 'Example Bank',
                account_number: '123-456-789',
                account_type: 'Current',
            }) },
        };

        const context = await new ShortcodeResolverService(models)._loadContext(
            models, 7, null, null, null, null, null
        );

        expect(context.addresses.local.formatted).to.equal('2 Trade Street, Singapore');
        expect(context.addresses.foreign.formatted).to.equal(
            'Queen Street, London, United Kingdom'
        );
        expect(context.company_profile).to.deep.include({
            bank_name: 'Example Bank',
            ssic_code_1: '62011',
            ssic_description_1: 'Software development',
            ssic_code_2: '70201',
            ssic_description_2: 'Management consultancy',
            old_name: 'Old Co',
            new_name: 'New Co',
            old_name_effective_date: '2026-01-02',
            strike_off_or_dissolved_date: '2026-03-04',
        });
        expect(context.company_profile.old_registered_address.formatted).to.equal('9 Old Road');
        expect(context.common).to.deep.equal({
            bank_name: 'Example Bank',
            account_number: '123-456-789',
            account_type: 'Current',
        });
    });

    it('reads only the configured object path', () => {
        expect(ShortcodeResolverService.getPath({ event: { due_date: '2027-06-30' } }, 'event.due_date'))
            .to.equal('2027-06-30');
    });

    it('maps an official into a stable collection snapshot shape', () => {
        expect(ShortcodeResolverService.mapOfficial({
            official_id: 8,
            official_entity_id: 81,
            official_type: 'INDIVIDUAL',
            official_master_slug: 'directors',
            official_entity: { name: 'Jane Tan', client_no: 'I-81' },
            official_master: { official_master_name: 'Directors' },
            date_record: { appointment_date: '2025-01-02', ceased_date: null },
        })).to.deep.include({
            official_id: 8,
            name: 'Jane Tan',
            role: 'directors',
            role_name: 'Directors',
            appointment_date: '2025-01-02',
        });
    });

    it('maps an official individual profile into document-ready fields', () => {
        const value = ShortcodeResolverService.mapOfficial({
            official_id: 9,
            official_entity_id: 91,
            official_type: 'INDIVIDUAL',
            official_master_slug: 'directors',
            official_entity: {
                entity_id: 91,
                name: 'Asha Rao',
                default_address_id: 2,
                individual_detail: {
                    occupation: 'Accountant',
                    member_dob: '1988-04-05',
                    member_nationality: 'Singaporean',
                },
                identifications: [{
                    identification_id: 4,
                    id_number: 'S1234567A',
                    is_primary: true,
                    id_type: { id_name: 'NRIC' },
                }],
                addresses: [
                    { address_id: 1, street_name: 'Alternate Road', country: 'Singapore' },
                    { address_id: 2, street_name: 'Default Road', country: 'Singapore' },
                ],
                contacts: [
                    { contact_type: 'MOBILE', contact_value: '91234567', phone_country_code: '+65', is_primary: true },
                    { contact_type: 'OFFICE', contact_value: '61234567', phone_country_code: '+65' },
                ],
            },
            official_master: { official_master_name: 'Director' },
            date_record: { appointment_date: '2025-01-02' },
        });

        expect(value).to.deep.include({
            name: 'Asha Rao',
            official_type: 'INDIVIDUAL',
            occupation: 'Accountant',
            date_of_birth: '1988-04-05',
            nationality: 'Singaporean',
            identification_number: 'S1234567A',
            identification_type: 'NRIC',
            contact_number: '+65 91234567',
            telephone: '+65 61234567',
            appointment_date: '2025-01-02',
            designation_or_occupation: 'Director',
        });
        expect(value.default_address.formatted).to.equal('Default Road, Singapore');
        expect(value.alternate_address.formatted).to.equal('Alternate Road, Singapore');
    });

    it('maps a corporate official profile into document-ready fields', () => {
        const value = ShortcodeResolverService.mapOfficial({
            official_id: 10,
            official_entity_id: 101,
            official_type: 'COMPANY',
            official_master_slug: 'directors',
            official_entity: {
                entity_id: 101,
                entity_type: 'COMPANY',
                name: 'Example Pte Ltd',
                company_type: { company_type_name: 'Private Limited Company' },
                company_detail: {
                    country: 'Singapore',
                    company_incorporation_date: '2020-03-04',
                },
                identifications: [{
                    identification_id: 5,
                    uen_no: '202000001A',
                    is_primary: true,
                }],
                addresses: [{
                    address_id: 3,
                    address_type: 'REGISTERED',
                    block_no: '10',
                    street_name: 'Anson Road',
                    country: 'Singapore',
                    postal_code: '079903',
                }],
            },
            official_master: { official_master_name: 'Corporate Director' },
        });

        expect(value).to.deep.include({
            company_type: 'Private Limited Company',
            country: 'Singapore',
            incorporation_date: '2020-03-04',
            registration_number: '202000001A',
        });
        expect(value.registered_company_address.formatted)
            .to.equal('10 Anson Road, Singapore 079903');
    });

    it('maps AGM, FYE, month-end, and chairman event fields', () => {
        expect(ShortcodeResolverService.mapEvent({
            company_event_id: 12,
            event_slug: 'annual-general-meeting',
            due_date: '2026-06-30',
            held_date: '2026-06-25',
            actual_fye: '2025-02-15',
            year_of_fye: '2025',
            period_start: '2024-03-01',
            period_end: '2025-02-15',
        }, 'Asha Rao')).to.deep.include({
            date_of_agm: '2026-06-25',
            agm_held_date: '2026-06-25',
            actual_fye: '2025-02-15',
            year_of_fye: '2025',
            first_fye_date: '2024-03-01',
            last_fye_date: '2025-02-15',
            last_date_of_month: '2025-02-28',
            chairman_name: 'Asha Rao',
        });
    });

    it('maps company share capital without leaking ORM rows', () => {
        expect(ShortcodeResolverService.mapShare({
            id: 3,
            share_set_id: 'SHARE-3',
            currency: 'SGD',
            share_class_id: 1,
            share_type: 'NORMAL',
            number_of_shares: 1000,
            issued_share_capital: 1000,
            paid_up_capital: 1000,
            per_share: 1,
            issued_per_share: 1,
            date_of_transaction: '2026-01-10',
            share_class: { sc_name: 'Ordinary', sc_slug: 'ordinary' },
        })).to.deep.include({
            share_id: 3,
            share_class_name: 'Ordinary',
            number_of_shares: 1000,
            number_of_shares_in_words: 'One Thousand',
            price_per_share: 1,
            paid_up_capital: 1000,
        });
    });

    it('maps shareholder holdings to the active share shortcode names', () => {
        const value = ShortcodeResolverService.mapShareholderShare({
            id: 21,
            official_entity_id: 91,
            currency: 'SGD',
            balance_after_qty: '250.000000',
            balance_after_paidup_capital: '375.00',
            share_cert_no: 'SC-021',
            company_share: { id: 4, per_share: '1.50', share_class: { sc_name: 'Ordinary' } },
        }, {
            entity_id: 91,
            name: 'Pavithra',
            identifications: [{ id_number: 'S1234567A', is_primary: true, id_type: { id_name: 'NRIC' } }],
        });

        expect(value).to.deep.include({
            shareholder_name: 'Pavithra',
            shareholder_identification_type: 'NRIC',
            shareholder_identification_number: 'S1234567A',
            share_certificate_number: 'SC-021',
            certificate_number: 'SC-021',
            number_of_shares: 250,
            number_of_shares_in_words: 'Two Hundred Fifty',
            price_per_share: 1.5,
        });
    });

    it('resolves share.* tokens from the selected company-level popup record', async () => {
        const definitions = [
            {
                shortcode_key: 'share.currency', source_domain: 'SHARE',
                resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.currency', aliases: [],
            },
            {
                shortcode_key: 'share.number_of_shares_in_words', source_domain: 'SHARE',
                resolver_name: 'SHARE_DETAIL', resolver_path: 'share_detail.number_of_shares_in_words', aliases: [],
            },
        ];
        const service = new ShortcodeResolverService({});
        sinon.stub(service, '_loadDefinitions').resolves(definitions);
        sinon.stub(service, '_loadContext').resolves({
            share_detail: null,
            share_record: { currency: 'SGD', number_of_shares_in_words: 'One Thousand' },
        });

        const results = await service.resolve(definitions.map(item => item.shortcode_key), {
            entityId: 7,
            shareId: 4,
            popupField: { field_key: 'company_share', value_source: 'SHARES', source_filter_1: 'COMPANY_LEVEL_SHARES' },
            selectedValue: 4,
        });

        expect(results.map(item => item.value)).to.deep.equal(['SGD', 'One Thousand']);
        expect(results.every(item => item.resolved)).to.equal(true);
    });

    it('spells share quantities and capital amounts in words', () => {
        expect(ShortcodeResolverService.numberToWords('1250.50'))
            .to.equal('One Thousand Two Hundred Fifty Point Five');
        expect(ShortcodeResolverService.numberToWords(0)).to.equal('Zero');
    });

    it('maps a share transaction to the replacement share shortcode fields', () => {
        const party = (name, idNumber, street) => ({
            name,
            default_address_id: 1,
            individual_detail: { member_nationality: 'Singaporean' },
            identifications: [{
                id_number: idNumber,
                is_primary: true,
                id_type: { id_name: 'NRIC' },
            }],
            addresses: [{ address_id: 1, street_name: street, country: 'Singapore' }],
            contacts: [
                { contact_type: 'OFFICE', contact_value: '61234567', phone_country_code: '+65' },
                { contact_type: 'MOBILE', contact_value: '91234567', phone_country_code: '+65' },
            ],
        });
        const transferor = party('Alex Tan', 'S1111111A', 'Old Street');
        const transferee = party('Jamie Lim', 'S2222222B', 'New Street');
        const value = ShortcodeResolverService.mapShareDetail({
            transactions: [
                {
                    transaction_status: 'OUT',
                    official_entity_id: 10,
                    transferee_official_entity_id: 20,
                    transferee_no_of_shares: '250.000000',
                    official_entity: transferor,
                    transferee_entity: transferee,
                },
                {
                    transaction_status: 'IN',
                    official_entity_id: 20,
                    no_of_shares: '250.000000',
                    currency: 'SGD',
                    share_cert_no: 'SC-002',
                    per_share: '1.50',
                    cash: '300.00',
                    otherwise_cash: '75.00',
                    official_entity: transferee,
                },
            ],
        });

        expect(value).to.deep.include({
            shareholder_name: 'Jamie Lim',
            shareholder_identification_number: 'S2222222B',
            currency: 'SGD',
            share_certificate_number: 'SC-002',
            number_of_shares: 250,
            price_per_share: 1.5,
            number_of_shares_in_words: 'Two Hundred Fifty',
            cash_paid_up_capital: 300,
            cash_paid_up_capital_in_words: 'Three Hundred',
            consideration_paid_up_capital: 75,
            consideration_paid_up_capital_in_words: 'Seventy Five',
            total_paid_up_capital: 375,
            transferor_name: 'Alex Tan',
            transferee_name: 'Jamie Lim',
            transfer_amount_of_shares: 250,
        });
        expect(value.shareholder_address.formatted).to.equal('New Street, Singapore');
        expect(value.transferor_address.formatted).to.equal('Old Street, Singapore');
    });
});
