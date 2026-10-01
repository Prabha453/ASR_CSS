'use strict';

const { Op } = require('sequelize');
const { getCurrentModels } = require('../../models');
const { normalizeAliasKey } = require('../../domain/formBuilder/shortcodeDefinition');
const { orderBySelection } = require('../../domain/formBuilder/scopedLoopBlock');
const { isAllowedResolverPath } = require('../../config/formBuilder/shortcodeResolverRegistry');
const { mapAllotment } = require('../../domain/formBuilder/shareAllotmentMapping');
const { mapShareTransaction } = require('../../domain/formBuilder/shareTransactionMapping');
const { rowFieldKey } = require('../../domain/formBuilder/templateTokens');
const logger = require('../../config/logger');
const { handlers: customShortcodeHandlers } = require('../../config/formBuilder/customShortcodeHandlers');

const toPlain = value => (value?.toJSON ? value.toJSON() : value);

const getPath = (source, path) => path.split('.').reduce(
    (value, segment) => value == null ? undefined : value[segment],
    source
);

const pickRegistrationNumber = (identification) => {
    const row = toPlain(identification) || {};
    return row.uen_no || row.fbrn_reg_no || row.uf_no || row.domes_bus_no || row.acra_no || row.id_number || null;
};

const formatAddress = (address) => {
    const row = toPlain(address);
    if (!row) return null;
    const levelUnit = [
        row.level_no ? `#${row.level_no}` : null,
        row.unit_no || null,
    ].filter(Boolean).join('-');
    const formatted = [
        [row.block_no, row.street_name].filter(Boolean).join(' '),
        row.building_name,
        levelUnit,
        [row.city, row.state].filter(Boolean).join(' '),
        [row.country, row.postal_code].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');
    return { ...row, formatted };
};

const formatHistoryAddress = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return formatAddress(value);
    try {
        return formatAddress(JSON.parse(value));
    } catch (error) {
        return { formatted: String(value) };
    }
};

const changeEffectiveDate = (change) => {
    const row = toPlain(change) || {};
    return row.effective_date || row.proposed_date || null;
};

const formatPhone = (contact) => {
    const row = toPlain(contact);
    if (!row?.contact_value) return null;
    const code = String(row.phone_country_code || '').trim();
    const number = String(row.contact_value).trim();
    if (!code || number.startsWith(code)) return number;
    return `${code} ${number}`;
};

const partyEntityIncludes = models => {
    const includes = [];
    if (models.entity_individual_details) {
        includes.push({ model: models.entity_individual_details, as: 'individual_detail', required: false });
    }
    if (models.entity_identification) {
        includes.push({
            model: models.entity_identification,
            as: 'identifications',
            required: false,
            where: { is_deleted: false },
            include: models.member_id_type ? [{
                model: models.member_id_type,
                as: 'id_type',
                required: false,
            }] : [],
        });
    }
    if (models.entity_address) {
        includes.push({
            model: models.entity_address,
            as: 'addresses',
            required: false,
            where: { is_deleted: false },
        });
    }
    if (models.entity_contact) {
        includes.push({
            model: models.entity_contact,
            as: 'contacts',
            required: false,
            where: { is_deleted: false },
        });
    }
    return includes;
};

const shareTransactionIncludes = models => [
    {
        model: models.entities,
        as: 'official_entity',
        required: false,
        include: partyEntityIncludes(models),
    },
    {
        model: models.entities,
        as: 'transferor_entity',
        required: false,
        include: partyEntityIncludes(models),
    },
    {
        model: models.entities,
        as: 'transferee_entity',
        required: false,
        include: partyEntityIncludes(models),
    },
    { model: models.share_class_master, as: 'share_class', required: false },
];

const SMALL_NUMBER_WORDS = Object.freeze([
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
]);
const TENS_WORDS = Object.freeze([
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
]);
const SCALE_WORDS = Object.freeze([
    '', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion',
    'Quintillion', 'Sextillion', 'Septillion', 'Octillion',
]);

const threeDigitWords = value => {
    const words = [];
    let remainder = value;
    if (remainder >= 100) {
        words.push(SMALL_NUMBER_WORDS[Math.floor(remainder / 100)], 'Hundred');
        remainder %= 100;
    }
    if (remainder >= 20) {
        words.push(TENS_WORDS[Math.floor(remainder / 10)]);
        if (remainder % 10) words.push(SMALL_NUMBER_WORDS[remainder % 10]);
    } else if (remainder) {
        words.push(SMALL_NUMBER_WORDS[remainder]);
    }
    return words.join(' ');
};

const integerWords = digits => {
    let value = BigInt(digits || '0');
    if (value === 0n) return SMALL_NUMBER_WORDS[0];
    const groups = [];
    let scale = 0;
    while (value > 0n) {
        const group = Number(value % 1000n);
        if (group) groups.unshift([threeDigitWords(group), SCALE_WORDS[scale]].filter(Boolean).join(' '));
        value /= 1000n;
        scale += 1;
    }
    return groups.join(' ');
};

const numberToWords = value => {
    const normalized = String(value ?? '').replace(/,/g, '').trim();
    const match = normalized.match(/^(-)?(\d+)(?:\.(\d+))?$/);
    if (!match) return null;
    const [, negative, integerPart, rawDecimal = ''] = match;
    const decimalPart = rawDecimal.replace(/0+$/, '');
    const words = [negative ? 'Minus' : null, integerWords(integerPart)].filter(Boolean);
    if (decimalPart) {
        words.push('Point', ...decimalPart.split('').map(digit => SMALL_NUMBER_WORDS[Number(digit)]));
    }
    return words.join(' ');
};

const mapParty = entity => {
    const row = toPlain(entity) || {};
    const detail = toPlain(row.individual_detail) || {};
    const identifications = (row.identifications || []).map(toPlain);
    const identification = identifications.find(item => item.is_primary) || identifications[0] || {};
    const idType = toPlain(identification.id_type) || {};
    const addresses = (row.addresses || []).map(toPlain);
    const address = addresses.find(item => (
        row.default_address_id && String(item.address_id) === String(row.default_address_id)
    )) || addresses.find(item => item.is_primary) || addresses[0] || null;
    const contacts = (row.contacts || []).map(toPlain);
    const mobile = contacts.find(item => item.contact_type === 'MOBILE' && item.is_primary)
        || contacts.find(item => item.contact_type === 'MOBILE');
    const phone = contacts.find(item => item.contact_type === 'OFFICE' && item.is_primary)
        || contacts.find(item => item.contact_type === 'HOME' && item.is_primary)
        || contacts.find(item => ['OFFICE', 'HOME'].includes(item.contact_type));
    return {
        name: row.name || null,
        address: formatAddress(address),
        identification_type: idType.id_name || null,
        identification_number: pickRegistrationNumber(identification),
        nationality: detail.member_nationality || null,
        phone: formatPhone(phone),
        mobile: formatPhone(mobile),
    };
};

const mapShareDetail = source => {
    const header = toPlain(source) || {};
    const lines = (header.transactions || []).map(toPlain);
    const main = lines.find(row => row.transaction_status === 'IN') || lines[0] || {};
    const transfer = lines.find(row => (
        row.transaction_status === 'OUT' && row.transferee_official_entity_id
    )) || lines.find(row => (
        row.transferor_official_entity_id || row.transferee_official_entity_id
    )) || {};
    const transferIn = lines.find(row => row.transaction_status === 'IN' && (
        !transfer.transferee_official_entity_id
        || String(row.official_entity_id) === String(transfer.transferee_official_entity_id)
    ));
    const shareholder = mapParty(main.official_entity);
    const transferor = mapParty(
        transfer.transferor_entity
        || (transfer.transaction_status === 'OUT' ? transfer.official_entity : null)
    );
    const transferee = mapParty(
        transfer.transferee_entity
        || transferIn?.official_entity
        || (transfer.transaction_status === 'IN' ? transfer.official_entity : null)
    );
    const numberOfShares = Number(main.no_of_shares || 0);
    const cashPaidUp = Number(main.cash || 0);
    const considerationPaidUp = Number(main.otherwise_cash || 0);
    const transferAmount = Number(
        transfer.transferee_no_of_shares
        || transfer.transferor_no_of_shares
        || transferIn?.no_of_shares
        || 0
    );
    return {
        shareholder_name: shareholder.name,
        shareholder_address: shareholder.address,
        shareholder_identification_type: shareholder.identification_type,
        shareholder_identification_number: shareholder.identification_number,
        currency: main.currency || null,
        shareholder_nationality: shareholder.nationality,
        shareholder_phone: shareholder.phone,
        shareholder_mobile: shareholder.mobile,
        share_certificate_number: main.share_cert_no || null,
        number_of_shares: numberOfShares,
        price_per_share: Number(main.per_share || main.issued_per_share || 0),
        number_of_shares_in_words: numberToWords(main.no_of_shares || 0),
        cash_paid_up_capital: cashPaidUp,
        cash_paid_up_capital_in_words: numberToWords(main.cash || 0),
        consideration_paid_up_capital: considerationPaidUp,
        consideration_paid_up_capital_in_words: numberToWords(main.otherwise_cash || 0),
        total_paid_up_capital: cashPaidUp + considerationPaidUp,
        transferor_name: transferor.name,
        transferor_identification_type: transferor.identification_type,
        transferor_identification_number: transferor.identification_number,
        transferor_address: transferor.address,
        transferee_name: transferee.name,
        transferee_identification_type: transferee.identification_type,
        transferee_identification_number: transferee.identification_number,
        transferee_address: transferee.address,
        transfer_amount_of_shares: transferAmount,
    };
};

const officialIncludes = (models) => {
    const entityIncludes = [];
    if (models.entity_individual_details) {
        entityIncludes.push({
            model: models.entity_individual_details,
            as: 'individual_detail',
            required: false,
        });
    }
    if (models.entity_company_details) {
        entityIncludes.push({
            model: models.entity_company_details,
            as: 'company_detail',
            required: false,
            where: { is_deleted: false },
        });
    }
    if (models.company_type) {
        entityIncludes.push({
            model: models.company_type,
            as: 'company_type',
            required: false,
            where: { is_deleted: false },
        });
    }
    if (models.entity_identification) {
        entityIncludes.push({
            model: models.entity_identification,
            as: 'identifications',
            required: false,
            where: { is_deleted: false },
            include: models.member_id_type ? [{
                model: models.member_id_type,
                as: 'id_type',
                required: false,
            }] : [],
        });
    }
    if (models.entity_address) {
        entityIncludes.push({
            model: models.entity_address,
            as: 'addresses',
            required: false,
            where: { is_deleted: false },
        });
    }
    if (models.entity_contact) {
        entityIncludes.push({
            model: models.entity_contact,
            as: 'contacts',
            required: false,
            where: { is_deleted: false },
        });
    }

    const includes = [
        {
            model: models.entities,
            as: 'official_entity',
            required: false,
            include: entityIncludes,
        },
        { model: models.official_master, as: 'official_master', required: false },
        { model: models.officials_date, as: 'date_record', required: false },
    ];
    if (models.entity_identification) {
        includes.push({
            model: models.entity_identification,
            as: 'identification',
            required: false,
            include: models.member_id_type ? [{
                model: models.member_id_type,
                as: 'id_type',
                required: false,
            }] : [],
        });
    }
    return includes;
};

const mapOfficial = (official) => {
    const row = toPlain(official) || {};
    const officialEntity = toPlain(row.official_entity) || {};
    const master = toPlain(row.official_master) || {};
    const dateRecord = toPlain(row.date_record) || {};
    const detail = toPlain(officialEntity.individual_detail) || {};
    const companyDetail = toPlain(officialEntity.company_detail) || {};
    const companyType = toPlain(officialEntity.company_type) || {};
    const officialType = row.official_type || officialEntity.entity_type || null;
    const isCorporate = ['COMPANY', 'CORPORATE'].includes(String(officialType || '').toUpperCase());
    const identifications = (officialEntity.identifications || []).map(toPlain);
    const primaryEntityIdentification = identifications.find(item => item.is_primary)
        || identifications[0]
        || {};
    const identification = toPlain(row.identification)
        || primaryEntityIdentification;
    const idType = toPlain(identification.id_type) || {};
    const addresses = (officialEntity.addresses || []).map(toPlain);
    const defaultAddress = addresses.find(item => (
        officialEntity.default_address_id
        && String(item.address_id) === String(officialEntity.default_address_id)
    )) || addresses.find(item => item.is_primary) || addresses[0] || null;
    const alternateAddress = addresses.find(item => (
        !defaultAddress || String(item.address_id) !== String(defaultAddress.address_id)
    )) || null;
    const registeredAddress = addresses.find(item => item.address_type === 'REGISTERED')
        || (isCorporate ? defaultAddress : null);
    const contacts = (officialEntity.contacts || []).map(toPlain);
    const mobile = contacts.find(item => item.contact_type === 'MOBILE' && item.is_primary)
        || contacts.find(item => item.contact_type === 'MOBILE');
    const telephone = contacts.find(item => item.contact_type === 'OFFICE' && item.is_primary)
        || contacts.find(item => item.contact_type === 'OFFICE');
    const roleName = master.official_master_name || null;
    return {
        official_id: row.official_id,
        official_entity_id: row.official_entity_id,
        name: officialEntity.name || null,
        client_number: officialEntity.client_no || null,
        official_type: officialType,
        entity_type: officialType,
        role: row.official_master_slug || master.official_master_slug || null,
        role_name: roleName,
        appointment_date: dateRecord.appointment_date || null,
        ceased_date: dateRecord.ceased_date || null,
        cessation_date: dateRecord.ceased_date || null,
        occupation: detail.occupation || null,
        date_of_birth: detail.member_dob || null,
        nationality: detail.member_nationality || null,
        identification_number: identification.id_number || null,
        identification_type: idType.id_name || null,
        default_address: formatAddress(defaultAddress),
        alternate_address: formatAddress(alternateAddress),
        contact_number: formatPhone(mobile),
        telephone: formatPhone(telephone),
        designation_or_occupation: roleName || detail.occupation || null,
        company_type: isCorporate
            ? companyType.company_type_name || officialEntity.company_reg_type || null
            : null,
        country: isCorporate ? companyDetail.country || registeredAddress?.country || null : null,
        incorporation_date: isCorporate ? companyDetail.company_incorporation_date || null : null,
        registered_company_address: isCorporate ? formatAddress(registeredAddress) : null,
        registration_number: isCorporate ? pickRegistrationNumber(primaryEntityIdentification) : null,
        shareholder_type: row.shareholder_type || null,
        shareholder_property_type: row.shareholder_property_type || null,
    };
};

const lastDateOfMonth = value => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-\d{2}$/);
    if (!match) return null;
    const [, year, month] = match;
    const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

const mapEvent = (event, chairmanName = null) => {
    const row = toPlain(event) || {};
    const name = toPlain(row.event) || {};
    const actualFye = row.actual_fye || row.fye_date || row.period_end || null;
    return {
        company_event_id: row.company_event_id,
        event_slug: row.event_slug || null,
        slug: row.event_slug || null,
        event_name: name.event_name || row.event_slug || null,
        period_start: row.period_start || null,
        period_end: row.period_end || null,
        fye_date: row.fye_date || null,
        due_date: row.due_date || null,
        extended_due_date: row.extended_due_date || null,
        held_date: row.held_date || null,
        filing_date: row.filing_date || null,
        status: row.status || null,
        venue: row.venue || null,
        date_of_agm: row.held_date || row.due_date || null,
        agm_held_date: row.held_date || null,
        actual_fye: actualFye,
        year_of_fye: row.year_of_fye || String(actualFye || '').slice(0, 4) || null,
        first_fye_date: row.period_start || null,
        last_fye_date: row.period_end || actualFye,
        last_date_of_month: lastDateOfMonth(actualFye),
        chairman_name: chairmanName || null,
    };
};

const mapShare = (share) => {
    const row = toPlain(share) || {};
    const shareClass = toPlain(row.share_class) || {};
    const numberOfShares = Number(row.number_of_shares || 0);
    const paidUpCapital = Number(row.paid_up_capital || 0);
    return {
        share_id: row.id,
        share_set_id: row.share_set_id,
        currency: row.currency,
        share_class_id: row.share_class_id,
        share_class_name: shareClass.sc_name || null,
        share_class_slug: shareClass.sc_slug || null,
        share_type: row.share_type,
        number_of_shares: numberOfShares,
        number_of_shares_in_words: numberToWords(row.number_of_shares || 0),
        authorized_share_capital: row.authorized_share_capital,
        issued_share_capital: row.issued_share_capital,
        paid_up_capital: row.paid_up_capital,
        per_share: row.per_share,
        issued_per_share: row.issued_per_share,
        // The active SHARE catalogue uses the `share.*` vocabulary for every
        // share-backed popup. Keep the equivalent document fields on a
        // company-level share record so scoped tokens such as
        // `field##share.number_of_shares_in_words` resolve against the record
        // selected in that field instead of an unrelated transaction header.
        price_per_share: Number(row.per_share || row.issued_per_share || 0),
        cash_paid_up_capital: paidUpCapital,
        cash_paid_up_capital_in_words: numberToWords(row.paid_up_capital || 0),
        total_paid_up_capital: paidUpCapital,
        transaction_date: row.date_of_transaction,
    };
};

// One shareholder's holding of one company-level share (css_share_ledger row),
// as picked by a "Shareholder Level Shares" popup field — distinct from
// mapShare's company-level totals: this carries THAT shareholder's own
// quantity, not the class's company-wide number_of_shares.
const mapShareholderShare = (ledger, shareholderEntity = null) => {
    const row = toPlain(ledger) || {};
    const companyShare = toPlain(row.company_share) || {};
    const shareClass = toPlain(companyShare.share_class) || {};
    const shareholder = typeof shareholderEntity === 'string'
        ? { name: shareholderEntity }
        : mapParty(shareholderEntity);
    const numberOfShares = Number(row.balance_after_qty || 0);
    const cashPaidUp = Number(row.balance_after_paidup_capital || 0);
    const considerationPaidUp = Number(row.consideration_otherwise_cash || 0);
    return {
        ledger_id: row.id,
        share_id: companyShare.id ?? null,
        shareholder_entity_id: row.official_entity_id,
        shareholder_name: shareholder.name || null,
        shareholder_address: shareholder.address || null,
        shareholder_identification_type: shareholder.identification_type || null,
        shareholder_identification_number: shareholder.identification_number || null,
        shareholder_nationality: shareholder.nationality || null,
        shareholder_phone: shareholder.phone || null,
        shareholder_mobile: shareholder.mobile || null,
        share_class_id: row.share_class_id ?? companyShare.share_class_id ?? null,
        share_class_name: shareClass.sc_name || null,
        share_class_slug: shareClass.sc_slug || null,
        share_type: row.share_type,
        currency: row.currency,
        number_of_shares: numberOfShares,
        number_of_shares_in_words: numberToWords(row.balance_after_qty || 0),
        price_per_share: Number(companyShare.per_share || companyShare.issued_per_share || 0),
        cash_paid_up_capital: cashPaidUp,
        cash_paid_up_capital_in_words: numberToWords(row.balance_after_paidup_capital || 0),
        consideration_paid_up_capital: considerationPaidUp,
        consideration_paid_up_capital_in_words: numberToWords(row.consideration_otherwise_cash || 0),
        total_paid_up_capital: cashPaidUp + considerationPaidUp,
        transaction_date: row.transaction_date,
        folio_number: row.folio_no || null,
        share_certificate_number: row.share_cert_no || null,
        // Retain the old mapped name for templates authored before the active
        // share catalogue standardized this as share_certificate_number.
        certificate_number: row.share_cert_no || null,
    };
};

class ShortcodeResolverService {
    constructor(models = null, customHandlers = customShortcodeHandlers) {
        this.models = models;
        this.customHandlers = customHandlers;
    }

    _models = () => this.models || getCurrentModels();

    _loadDefinitions = async (models) => models.form_shortcode_definition.findAll({
        where: { status: 'ACTIVE', is_deleted: false },
        include: [{
            model: models.form_shortcode_alias,
            as: 'aliases',
            where: { is_deleted: false },
            required: false,
        }],
    });

    _loadContext = async (models, entityId, eventId, allotmentId, shareTransactionId, officialRecordId, shareId) => {
        const entity = entityId ? await models.entities.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false },
        }) : null;
        const companyDetail = entityId ? await models.entity_company_details.findOne({
            where: { entity_id: entityId, is_deleted: false },
        }) : null;
        const identification = entityId ? await models.entity_identification.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', is_deleted: false },
            order: [['is_primary', 'DESC'], ['identification_id', 'ASC']],
        }) : null;
        const registeredAddress = entityId ? await models.entity_address.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', address_type: 'REGISTERED', is_deleted: false },
            order: [['is_primary', 'DESC'], ['address_id', 'ASC']],
        }) : null;
        const businessAddress = entityId ? await models.entity_address.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', address_type: 'BUSINESS', is_deleted: false },
            order: [['is_primary', 'DESC'], ['address_id', 'ASC']],
        }) : null;
        const mailingAddress = entityId ? await models.entity_address.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', address_type: 'MAILING', is_deleted: false },
            order: [['is_primary', 'DESC'], ['address_id', 'ASC']],
        }) : null;
        const foreignAddress = entityId ? await models.entity_address.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', address_type: 'FOREIGN', is_deleted: false },
            order: [['is_primary', 'DESC'], ['address_id', 'ASC']],
        }) : null;
        const contact = entityId ? await models.entity_contact.findOne({
            where: { entity_id: entityId, entity_type: 'COMPANY', contact_type: 'EMAIL', is_deleted: false },
            order: [['is_primary', 'DESC'], ['contact_id', 'ASC']],
        }) : null;
        const event = eventId ? await models.company_event.findOne({
            where: { company_event_id: eventId, entity_id: entityId, is_deleted: false },
        }) : null;
        const officials = entityId ? await models.officials.findAll({
            where: { entity_id: entityId, is_current: 1, is_deleted: 0 },
            include: officialIncludes(models),
            order: [['official_master_id', 'ASC'], ['official_id', 'ASC']],
        }) : [];
        const shares = entityId ? await models.entity_shares.findAll({
            where: { entity_id: entityId, is_deleted: 0 },
            include: [{ model: models.share_class_master, as: 'share_class', required: false }],
            order: [['share_class_id', 'ASC'], ['id', 'ASC']],
        }) : [];
        const allotment = entityId && allotmentId ? await models.shares.findOne({
            where: { share_id: allotmentId, entity_id: entityId, status: 'VALID', is_deleted: 0 },
            include: [{
                model: models.share_transactions,
                as: 'transactions',
                where: { transaction_status: 'IN', status: 'VALID', is_deleted: 0 },
                required: true,
                include: shareTransactionIncludes(models),
            }],
        }) : null;
        const shareTransaction = entityId && shareTransactionId ? await models.shares.findOne({
            where: { share_id: shareTransactionId, entity_id: entityId, status: 'VALID', is_deleted: 0 },
            include: [{
                model: models.share_transactions,
                as: 'transactions',
                where: { status: 'VALID', is_deleted: 0 },
                required: true,
                include: shareTransactionIncludes(models),
            }],
        }) : null;
        const selectedOfficial = entityId && officialRecordId ? await models.officials.findOne({
            where: { official_id: officialRecordId, entity_id: entityId, is_deleted: 0 },
            include: officialIncludes(models),
        }) : null;
        // A single share picked in a SHARES popup field — the company-level
        // structure row (css_entity_shares.id). Shareholder-level ledger picks
        // use a different id space and will simply not resolve here.
        const selectedShare = entityId && shareId ? await models.entity_shares.findOne({
            where: { id: shareId, entity_id: entityId, is_deleted: 0 },
            include: [{ model: models.share_class_master, as: 'share_class', required: false }],
        }) : null;
        const detail = toPlain(companyDetail) || {};
        const ssicIds = [detail.ssic_id, detail.ssic_id_secondary].filter(Boolean);
        const ssicRows = entityId && ssicIds.length && models.company_ssic_code?.findAll
            ? await models.company_ssic_code.findAll({
                where: { ssic_id: { [Op.in]: ssicIds }, is_deleted: false },
            })
            : [];
        const ssicById = new Map(ssicRows.map(raw => {
            const row = toPlain(raw);
            return [String(row.ssic_id), row];
        }));
        const primarySsic = ssicById.get(String(detail.ssic_id || '')) || {};
        const secondarySsic = ssicById.get(String(detail.ssic_id_secondary || '')) || {};
        const nameChange = entityId && models.entity_field_change_history?.findOne
            ? await models.entity_field_change_history.findOne({
                where: { entity_id: entityId, field_type_id: 4, cron_status: { [Op.ne]: 2 } },
                order: [['change_id', 'DESC']],
            })
            : null;
        const registeredAddressChange = entityId && models.entity_field_change_history?.findOne
            ? await models.entity_field_change_history.findOne({
                where: { entity_id: entityId, field_type_id: 1, cron_status: { [Op.ne]: 2 } },
                order: [['change_id', 'DESC']],
            })
            : null;
        const statusDate = entityId && models.entity_status_date?.findOne && models.entity_status
            ? await models.entity_status_date.findOne({
                where: { entity_id: entityId, is_deleted: false },
                include: [{
                    model: models.entity_status,
                    as: 'entity_status',
                    required: true,
                    where: {
                        e_status_name: { [Op.in]: ['Striking Off', 'Dissolved', 'Struck-Off'] },
                        is_deleted: false,
                    },
                }],
                order: [['effective_date', 'DESC'], ['history_id', 'DESC']],
            })
            : null;
        const bankModel = models.bank || models.company_bank || models.bank_master;
        const bank = entityId && detail.bank_id && bankModel?.findOne
            ? await bankModel.findOne({
                where: { bank_id: detail.bank_id, is_deleted: false },
            })
            : null;
        const entityRow = toPlain(entity) || {};
        const nameChangeRow = toPlain(nameChange) || {};
        const addressChangeRow = toPlain(registeredAddressChange) || {};
        const bankRow = toPlain(bank) || {};
        const officialGroups = { directors: [], secretaries: [], shareholders: [] };
        const officialsAll = [];
        for (const official of officials) {
            const mapped = mapOfficial(official);
            officialsAll.push(mapped);
            if (officialGroups[mapped.role]) officialGroups[mapped.role].push(mapped);
        }
        const eventRow = toPlain(event) || {};
        const chairman = officials.find(official => (
            String(toPlain(official)?.official_id) === String(eventRow.meeting_chairman || '')
        ));
        const chairmanEntity = toPlain(toPlain(chairman)?.official_entity) || {};
        const storedChairman = String(eventRow.meeting_chairman || '').trim();
        const chairmanName = chairmanEntity.name
            || (storedChairman && !/^\d+$/.test(storedChairman) ? storedChairman : null);

        return {
            entity: entityRow,
            company_detail: detail,
            identification: toPlain(identification),
            addresses: {
                registered: formatAddress(registeredAddress),
                local: formatAddress(businessAddress || mailingAddress || registeredAddress),
                foreign: formatAddress(foreignAddress),
            },
            company_profile: {
                strike_off_or_dissolved_date: toPlain(statusDate)?.effective_date || null,
                bank_name: bankRow.bank_name || bankRow.name || bankRow.bank || null,
                ssic_code_1: primarySsic.ssic_code || null,
                ssic_description_1: primarySsic.ssic_description || detail.ssic_user_description || null,
                ssic_code_2: secondarySsic.ssic_code || null,
                ssic_description_2: secondarySsic.ssic_description || detail.ssic_user_description_secondary || null,
                new_name: nameChangeRow.new_value || entityRow.name || null,
                old_name: nameChangeRow.old_value || entityRow.former_name || null,
                old_name_effective_date: changeEffectiveDate(nameChange),
                new_registered_address: formatHistoryAddress(addressChangeRow.new_value)
                    || formatAddress(registeredAddress),
                old_registered_address: formatHistoryAddress(addressChangeRow.old_value),
                old_registered_address_effective_date: changeEffectiveDate(registeredAddressChange),
            },
            common: {
                bank_name: bankRow.bank_name || bankRow.name || bankRow.bank
                    || detail.bank_name || null,
                account_number: bankRow.account_number || bankRow.account_no
                    || detail.account_number || detail.account_no || null,
                account_type: bankRow.account_type || bankRow.type
                    || detail.account_type || null,
            },
            primary_email: toPlain(contact)?.contact_value || null,
            event: event ? mapEvent(event, chairmanName) : null,
            officials: { ...officialGroups, all: officialsAll },
            shares: shares.map(mapShare),
            share_allotment: allotment ? mapAllotment(allotment) : null,
            share_transaction: shareTransaction ? (() => {
                const mapped = mapShareTransaction(shareTransaction);
                return { ...mapped, type: mapped.transaction_type, date: mapped.transaction_date };
            })() : null,
            share_detail: shareTransaction || allotment
                ? mapShareDetail(shareTransaction || allotment)
                : null,
            official_record: selectedOfficial ? (() => {
                const row = toPlain(selectedOfficial);
                const mapped = mapOfficial(selectedOfficial);
                return {
                    ...mapped,
                    cessation_date: mapped.ceased_date,
                    status: row.is_current ? 'CURRENT' : 'CEASED',
                };
            })() : null,
            share_record: selectedShare ? mapShare(selectedShare) : null,
        };
    };

    // ── Popup-scoped loop retrieval ────────────────────────────────────────
    // Each method takes the ids a single popup section selected, fetches the
    // real records with the SAME include shape the single-record resolvers use
    // above, maps them through the shared mappers, and returns them in the
    // user's selection order. An empty id list short-circuits to `[]` so an
    // empty popup selection renders nothing.

    fetchOfficialsByIds = async (entityId, ids = []) => {
        const list = [...new Set((ids || []).map(String).filter(Boolean))];
        if (!entityId || !list.length) return [];
        const models = this._models();
        const rows = await models.officials.findAll({
            where: { official_id: { [Op.in]: list }, entity_id: entityId, is_deleted: 0 },
            include: officialIncludes(models),
        });
        return orderBySelection(rows.map(mapOfficial), list, record => record.official_id);
    };

    fetchEventsByIds = async (entityId, ids = []) => {
        const list = [...new Set((ids || []).map(String).filter(Boolean))];
        if (!entityId || !list.length) return [];
        const models = this._models();
        const rows = await models.company_event.findAll({
            where: { company_event_id: { [Op.in]: list }, entity_id: entityId, is_deleted: false },
            include: [{ model: models.company_event_name, as: 'event', required: false }],
        });
        const chairmanIds = [...new Set(rows
            .map(row => String(toPlain(row)?.meeting_chairman || '').trim())
            .filter(value => /^\d+$/.test(value)))];
        const chairmen = chairmanIds.length && models.officials?.findAll && models.entities
            ? await models.officials.findAll({
                where: { official_id: { [Op.in]: chairmanIds }, entity_id: entityId, is_deleted: 0 },
                include: [{ model: models.entities, as: 'official_entity', required: false }],
            })
            : [];
        const chairmanNameById = new Map(chairmen.map(raw => {
            const official = toPlain(raw) || {};
            return [String(official.official_id), toPlain(official.official_entity)?.name || null];
        }));
        const mapped = rows.map(row => {
            const event = toPlain(row) || {};
            const storedChairman = String(event.meeting_chairman || '').trim();
            const chairmanName = chairmanNameById.get(storedChairman)
                || (storedChairman && !/^\d+$/.test(storedChairman) ? storedChairman : null);
            return mapEvent(row, chairmanName);
        });
        return orderBySelection(mapped, list, record => record.company_event_id);
    };

    fetchSharesByIds = async (entityId, ids = []) => {
        const list = [...new Set((ids || []).map(String).filter(Boolean))];
        if (!entityId || !list.length) return [];
        const models = this._models();
        const rows = await models.entity_shares.findAll({
            where: { id: { [Op.in]: list }, entity_id: entityId, is_deleted: 0 },
            include: [{ model: models.share_class_master, as: 'share_class', required: false }],
        });
        return orderBySelection(rows.map(mapShare), list, record => record.share_id);
    };

    // Shareholder-level holdings — ids are css_share_ledger rows (what a
    // "Shareholder Level Shares" popup field's options carry), NOT
    // css_entity_shares rows, so this is a distinct loop type from
    // fetchSharesByIds rather than an alternate id space on the same one.
    fetchShareholderSharesByIds = async (entityId, ids = []) => {
        const list = [...new Set((ids || []).map(String).filter(Boolean))];
        if (!entityId || !list.length) return [];
        const models = this._models();
        const rows = await models.share_ledger.findAll({
            where: { id: { [Op.in]: list }, entity_id: entityId, ledger_scope: 'SHAREHOLDER', is_deleted: 0 },
            include: [{
                model: models.entity_shares,
                as: 'company_share',
                required: false,
                include: [{ model: models.share_class_master, as: 'share_class', required: false }],
            }],
        });
        const shareholderIds = [...new Set(rows.map(row => row.official_entity_id).filter(Boolean))];
        const shareholders = shareholderIds.length ? await models.entities.findAll({
            where: { entity_id: { [Op.in]: shareholderIds }, is_deleted: false },
            include: partyEntityIncludes(models),
        }) : [];
        const shareholderById = new Map(shareholders.map(raw => {
            const row = toPlain(raw);
            return [String(row.entity_id), row];
        }));
        const mapped = rows.map(row => mapShareholderShare(
            row,
            shareholderById.get(String(row.official_entity_id)) || null
        ));
        return orderBySelection(mapped, list, record => record.ledger_id);
    };

    // Resolve a shortcode against the exact record selected by a popup field.
    // This is deliberately separate from the ordinary resolver context: a
    // SHARES popup may point to css_entity_shares or css_share_ledger, whereas
    // the legacy SHARE_DETAIL resolver points to a transaction header.
    _scopedPopupRecord = async (context, entityId, popupField, selectedValue) => {
        if (!popupField) return null;
        const raw = Array.isArray(selectedValue) ? selectedValue[0] : selectedValue;
        const selectedId = raw && typeof raw === 'object' ? raw.value : raw;
        if (selectedId === undefined || selectedId === null || selectedId === '') return null;

        switch (popupField.value_source) {
        case 'OFFICIALS':
        case 'OFFICIAL_RECORDS':
        case 'SHAREHOLDERS':
            return context.official_record
                || (await this.fetchOfficialsByIds(entityId, [selectedId]))[0]
                || null;
        case 'EVENT':
        case 'COMPLAINANT':
            return context.event
                || (await this.fetchEventsByIds(entityId, [selectedId]))[0]
                || null;
        case 'SHARES':
            if (String(popupField.source_filter_1 || '').toUpperCase() === 'SHAREHOLDER_LEVEL_SHARES') {
                return (await this.fetchShareholderSharesByIds(entityId, [selectedId]))[0] || null;
            }
            return context.share_record
                || (await this.fetchSharesByIds(entityId, [selectedId]))[0]
                || null;
        default:
            return null;
        }
    };

    _resolveDefinition = async (definition, context, now, runtime = {}) => {
        if (definition.resolver_name === 'CUSTOM_BACKEND') {
            const key = normalizeAliasKey(definition.shortcode_key);
            const registration = this.customHandlers[key] || null;
            const handler = typeof registration === 'function' ? registration : registration?.resolve;
            if (typeof handler !== 'function') {
                return { resolved: false, reason: 'CUSTOM_HANDLER_NOT_REGISTERED' };
            }
            try {
                const handlerResult = await handler({
                    definition,
                    data: context,
                    now,
                    models: this._models(),
                    ...runtime,
                });
                if (handlerResult && typeof handlerResult === 'object'
                    && Object.prototype.hasOwnProperty.call(handlerResult, 'resolved')) {
                    return {
                        value_type: registration?.valueType || definition.value_type,
                        is_collection: registration?.isCollection ?? definition.is_collection,
                        ...handlerResult,
                    };
                }
                if (handlerResult === null || handlerResult === undefined || handlerResult === '') {
                    return { resolved: false, reason: 'VALUE_NOT_FOUND', value: null };
                }
                return {
                    resolved: true,
                    value: handlerResult,
                    value_type: registration?.valueType || definition.value_type,
                    is_collection: registration?.isCollection ?? definition.is_collection,
                };
            } catch (error) {
                logger.error(`Custom shortcode handler failed for ${definition.shortcode_key}:`, error);
                return { resolved: false, reason: 'CUSTOM_HANDLER_ERROR' };
            }
        }

        if (!isAllowedResolverPath(definition.resolver_name, definition.resolver_path)) {
            return { resolved: false, reason: 'UNREGISTERED_RESOLVER_PATH' };
        }

        // Field-scoped tokens bind to the selected popup record first. The
        // canonical shortcode still supplies validation, formatting and the
        // stable public name, while the selected record supplies the value.
        // This makes one SHARE catalogue work consistently for company-level
        // shares, shareholder holdings and transaction/allotment contexts.
        const popupDomain = ({
            OFFICIALS: 'OFFICIAL', OFFICIAL_RECORDS: 'OFFICIAL', SHAREHOLDERS: 'OFFICIAL',
            EVENT: 'EVENT', COMPLAINANT: 'EVENT', SHARES: 'SHARE',
        })[runtime.popupField?.value_source];
        if (context.popup_record && popupDomain === definition.source_domain) {
            const scopedValue = getPath(context.popup_record, rowFieldKey(definition.shortcode_key));
            if (scopedValue !== null && scopedValue !== undefined && scopedValue !== '') {
                return { resolved: true, value: scopedValue };
            }
        }

        let value;
        switch (definition.resolver_name) {
        case 'ENTITY_FIELD':
        case 'COMPANY_DETAIL_FIELD':
        case 'COMPANY_PROFILE':
        case 'EVENT_FIELD':
            value = getPath(context, definition.resolver_path);
            break;
        case 'PRIMARY_IDENTIFICATION':
            value = pickRegistrationNumber(context.identification);
            break;
        case 'ENTITY_ADDRESS':
            value = getPath(context, definition.resolver_path);
            break;
        case 'ENTITY_CONTACT':
            value = context.primary_email;
            break;
        case 'COMMON_FIELD':
            value = getPath(context, definition.resolver_path);
            break;
        case 'SYSTEM_DATE':
            value = new Date(now).toISOString().slice(0, 10);
            break;
        case 'CURRENT_OFFICIALS':
            value = getPath(context, definition.resolver_path) || [];
            break;
        case 'CURRENT_SHARES':
            value = context.shares || [];
            break;
        case 'SHARE_ALLOTMENT':
            value = getPath(context, definition.resolver_path);
            break;
        case 'SHARE_TRANSACTION':
            value = getPath(context, definition.resolver_path);
            break;
        case 'SHARE_DETAIL':
            value = getPath(context, definition.resolver_path);
            break;
        case 'SELECTED_OFFICIAL':
            value = getPath(context, definition.resolver_path);
            break;
        case 'SELECTED_SHARE':
            value = getPath(context, definition.resolver_path);
            break;
        default:
            return { resolved: false, reason: 'RESOLVER_NOT_IMPLEMENTED' };
        }

        if (value === null || value === undefined || value === '') {
            return { resolved: false, reason: 'VALUE_NOT_FOUND', value: null };
        }
        return { resolved: true, value };
    };

    resolve = async (requestedKeys = [], options = {}) => {
        const {
            entityId, eventId = null, allotmentId = null, shareTransactionId = null,
            officialRecordId = null, shareId = null, now = new Date(),
            ...runtime
        } = options;
        const models = this._models();
        const definitions = await this._loadDefinitions(models);
        const byKey = new Map();
        for (const definitionRow of definitions) {
            const definition = toPlain(definitionRow);
            byKey.set(normalizeAliasKey(definition.shortcode_key), definition);
            for (const aliasRow of definition.aliases || []) {
                const alias = toPlain(aliasRow);
                byKey.set(normalizeAliasKey(alias.alias_key), definition);
            }
        }

        const context = await this._loadContext(
            models, entityId, eventId, allotmentId, shareTransactionId, officialRecordId, shareId
        );
        context.popup_record = await this._scopedPopupRecord(
            context, entityId, runtime.popupField, runtime.selectedValue
        );
        const selectedOfficial = context.popup_record || context.official_record;
        const selectedOfficialType = selectedOfficial?.official_type
            || selectedOfficial?.entity_type
            || null;
        return Promise.all(requestedKeys.map(async requestedKey => {
            const normalizedKey = normalizeAliasKey(requestedKey);
            const definition = byKey.get(normalizedKey);
            if (!definition) {
                return {
                    requested_key: requestedKey,
                    canonical_key: null,
                    resolved: false,
                    reason: 'UNKNOWN_SHORTCODE',
                };
            }
            const result = await this._resolveDefinition(definition, context, now, {
                entityId,
                eventId,
                allotmentId,
                shareTransactionId,
                officialRecordId,
                shareId,
                ...runtime,
            });
            return {
                requested_key: requestedKey,
                canonical_key: definition.shortcode_key,
                resolver: definition.resolver_name,
                source: definition.source_domain,
                value_type: definition.value_type,
                allowed_formats: definition.allowed_formats || [],
                ...(definition.source_domain === 'OFFICIAL' && selectedOfficialType ? {
                    selection_context: { official_type: selectedOfficialType },
                } : {}),
                ...result,
            };
        }));
    };
}

ShortcodeResolverService.getPath = getPath;
ShortcodeResolverService.pickRegistrationNumber = pickRegistrationNumber;
ShortcodeResolverService.formatAddress = formatAddress;
ShortcodeResolverService.formatHistoryAddress = formatHistoryAddress;
ShortcodeResolverService.changeEffectiveDate = changeEffectiveDate;
ShortcodeResolverService.mapOfficial = mapOfficial;
ShortcodeResolverService.mapEvent = mapEvent;
ShortcodeResolverService.mapShare = mapShare;
ShortcodeResolverService.mapShareholderShare = mapShareholderShare;
ShortcodeResolverService.mapShareDetail = mapShareDetail;
ShortcodeResolverService.numberToWords = numberToWords;

module.exports = ShortcodeResolverService;
