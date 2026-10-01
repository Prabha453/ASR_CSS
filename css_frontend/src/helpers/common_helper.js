import {
  getCompanyEventNameList,
  getOfficialMasterList,
  getShareClassMasterList,
} from './backend_helper';

export const PRODUCT_SERVICE_UOM_OPTIONS = [
  { value: '1', label: 'Per Annum' },
  { value: '2', label: 'Per Manday' },
  { value: '3', label: 'Per Session' },
];

export const PRODUCT_SERVICE_TYPE_OPTIONS = [
  { value: '1', label: 'Package'      },
  { value: '2', label: 'Part'         },
  { value: '3', label: 'Cost Item'    },
  { value: '4', label: 'Expense Item' },
  { value: '5', label: 'Revenue'      },
];

export const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

export const PRODUCT_SERVICE_COMMISSION_TYPE_OPTIONS = [
  { value: 'FIXED',      label: '$', symbol: '$' },
  { value: 'PERCENTAGE', label: '%', symbol: '%' },
];

export const JURISDICTION_LEVEL_OPTIONS = [ 
  { value: 'STATE_PROVINCE',   label: 'State / Province' },
  { value: 'FREE_ZONE',        label: 'Free Zone' },
  { value: 'MUNICIPALITY',     label: 'Municipality' },
];

export const JURISDICTION_LEVEL_LABELS = JURISDICTION_LEVEL_OPTIONS.reduce(
  (acc, o) => { acc[o.value] = o.label; return acc; },
  {}
);

/* ══════════════════════════════════════════════════════════════════
   FIELD TYPES & TEMP PARAMS (from PHP get_select_type / get_temp_param)
══════════════════════════════════════════════════════════════════ */
export const POPUP_FIELD_TYPES = [
  { value: '1',  label: 'Dropdown' },
  { value: '2',  label: 'Radio button' },
  { value: '3',  label: 'Checkbox - Check All' },
  { value: '4',  label: 'Checkbox - Unchecked' },
  { value: '7',  label: 'Ajax - Attendee Dropdown' },
  { value: '8',  label: 'Ajax - Attendee Checkbox' },
  { value: '10', label: 'Dropdown (Ajax - Representative)' },
  { value: '29', label: 'Dropdown - (Ajax - Director)' },
  { value: '33', label: 'Dropdown (Ajax - Corp Representative)' },
  { value: '35', label: 'Ajax - Attendee Dropdown (Shareholder)' },
  { value: '39', label: 'Ajax - Attendee Checkbox (Director)' },
  { value: '42', label: 'Ajax - Attendee Dropdown (Secretary)' },
  { value: '52', label: 'Dropdown - Shareholder (Ajax - Director)' },
  { value: '57', label: 'Dropdown - All Controller (Unique name)' },
  { value: '62', label: 'Ajax - All Shares - Dropdown' },
  { value: '63', label: 'Ajax - All Shares - Checkbox' },
  { value: '65', label: 'Dropdown - All Director and Nominee Director' },
  { value: '70', label: 'Dropdown - Active Officials' },
  { value: '80', label: 'Dropdown UBO - Controller' },
  { value: '109', label: 'Dropdown - Active Controller' },
];

// SHAREHOLDERS was a separate "pick a shareholder person" source; it's no
// longer offered for new fields — OFFICIAL_RECORDS filtered to the
// "shareholders" role already picks the same people (plus a Current/Ceased
// filter SHAREHOLDERS never had), and SHARES (Shareholder Level Shares, with
// its own entity-type filter — SHAREHOLDER_ENTITY_TYPE_OPTIONS below) covers
// their holdings. MANUAL is likewise no longer offered for new fields.
// Existing templates that already use either keep rendering — they're still
// in the backend's VALUE_SOURCES / resolver; this list only controls what the
// builder offers for NEW fields.
export const POPUP_VALUE_SOURCES = [
  { value: 'OFFICIAL_RECORDS', label: 'Official records' },
  { value: 'COMPLAINANT', label: 'Complainants or Events' },
  { value: 'SHARES', label: 'Shares' },
  { value: 'DATES', label: 'Date' },
];

// Shares → Shareholder Level Shares → source_filter_4: which kind of
// shareholder entity to include (officials.official_type). Comma-joined,
// multi-select; empty/'all' = no filter.
export const SHAREHOLDER_ENTITY_TYPE_OPTIONS = [
  { value: 'COMPANY', label: 'Corporate' },
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'JOINT', label: 'Joint' },
  { value: 'SUB_FUND', label: 'Sub Fund' },
];

// option_label_fields — which pieces make up a field's option label (in the
// picked order), instead of the data source's fixed default. Must mirror
// OPTION_LABEL_CATALOG in css_backend/src/domain/formBuilder/optionLabelFormat.js.
const OFFICIAL_LABEL_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'role_name', label: 'Role' },
  { value: 'client_number', label: 'Client Number' },
  { value: 'status', label: 'Status' },
  { value: 'appointment_date', label: 'Appointment Date' },
  { value: 'cessation_date', label: 'Cessation Date' },
];
export const OPTION_LABEL_FIELDS_BY_SOURCE = {
  OFFICIAL_RECORDS: OFFICIAL_LABEL_FIELDS,
  OFFICIALS: OFFICIAL_LABEL_FIELDS,
  SHAREHOLDERS: OFFICIAL_LABEL_FIELDS,
  SHARES: [
    { value: 'shareholder_name', label: 'Shareholder Name' },
    { value: 'share_class_name', label: 'Share Class' },
    { value: 'currency', label: 'Currency' },
    { value: 'share_type', label: 'Share Type' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'official_type', label: 'Shareholder Type' },
  ],
};

export const MODERN_CONTROL_TYPES = [
  { value: 'SELECT', label: 'Select' },
  { value: 'MULTISELECT', label: 'Multi Select' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'RADIO', label: 'Radio' },
  { value: 'DATE', label: 'Date' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Textarea' },
  { value: 'RADIO_SWITCH', label: 'Radio Switch' },
];

export const OFFICIAL_FILTER_OPTIONS = [];

export const loadOfficialFilterOptions = async () => {
  const res = await getOfficialMasterList({
    page: 1,
    limit: 1000,
    is_parent: 0,
    order: 'official_order:ASC',
  });
  const list = res?.data?.data ?? res?.data ?? res;
  const options = (Array.isArray(list) ? list : [])
    .filter(item => item.official_master_name && item.official_master_slug)
    .map(item => ({
      value: String(item.official_master_slug).trim(),
      label: String(item.official_master_name).trim(),
    }));

  // Keep the same array reference used by POPUP_SOURCE_FILTERS.
  OFFICIAL_FILTER_OPTIONS.splice(0, OFFICIAL_FILTER_OPTIONS.length, ...options);
  return OFFICIAL_FILTER_OPTIONS;
};

export const SHARES_FILTER_OPTIONS = [{ value: 'COMPANY_LEVEL_SHARES', label: 'Company Level Shares' },{ value: 'SHAREHOLDER_LEVEL_SHARES', label: 'Shareholder Level Shares' }];

export const EVENT_FILTER_OPTIONS = [{ value: 'all', label: 'All events' }];

export const loadEventFilterOptions = async () => {
  const res = await getCompanyEventNameList({
    page: 1,
    limit: 1000,
    event_type: 'EVENT',
    // Query-string values are compared directly by the backend; use 1 for
    // the database BOOLEAN/TINYINT column instead of the string "true".
    active: 1,
    order: 'e_id:ASC',
  });
  const list = res?.data?.data ?? res?.data ?? res;
  const options = (Array.isArray(list) ? list : [])
    .filter(item => item.event_name && item.event_slug)
    .map(item => ({
      value: String(item.event_slug).trim(),
      label: String(item.event_name).trim(),
    }));

  EVENT_FILTER_OPTIONS.splice(
    0,
    EVENT_FILTER_OPTIONS.length,
    { value: 'all', label: 'All events' },
    ...options
  );
  return EVENT_FILTER_OPTIONS;
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'current', label: 'Current' },
  { value: 'ceased', label: 'Ceased' },
  { value: 'both', label: 'Both' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'leave_empty', label: 'Leave Empty' },
];

export const EVENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PREPARATION', label: 'In Preparation' },
  { value: 'AWAITING_DOCUMENTS', label: 'Awaiting Documents' },
  { value: 'AWAITING_CLIENT', label: 'Awaiting Client' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
  { value: 'READY_TO_FILE', label: 'Ready to File' },
  { value: 'FILED', label: 'Filed' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DISPENSE', label: 'Dispense' },
  { value: 'WAIVED', label: 'Waived' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
  { value: 'EXEMPT', label: 'Exempt' },
  { value: 'EXEMPTED', label: 'Exempted' },
];

export const SHARES_TRANSACTION_FILTER_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Valid', label: 'Valid' },
  { value: 'Invalid', label: 'Invalid' },
];
export const SHARES_TRANSACTION_FILTER_OPTIONS3 = [
  { value: 'All', label: 'All' },
  { value: 'Allotment', label: 'Allotment' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Redemption', label: 'Redemption' },
];

export const POPUP_SOURCE_FILTERS = {
  OFFICIAL_RECORDS: {
    primary: { label: 'Role', options: OFFICIAL_FILTER_OPTIONS },
    secondary: { label: 'Status', options: STATUS_FILTER_OPTIONS },
  },
  SHAREHOLDERS: {
    primary: { label: 'Role', options: OFFICIAL_FILTER_OPTIONS },
    secondary: { label: 'Status', options: SHARES_TRANSACTION_FILTER_OPTIONS },
    third: { label: 'Shares Transaction Type', options: SHARES_TRANSACTION_FILTER_OPTIONS3 },
  },
  COMPLAINANT: {
    primary: { label: 'Event', options: EVENT_FILTER_OPTIONS },
    secondary: { label: 'Status', options: EVENT_STATUS_FILTER_OPTIONS },
  },
  SHARES: {
    primary: { label: 'Event', options: SHARES_FILTER_OPTIONS },
    secondary: { label: 'Status', options: SHARES_TRANSACTION_FILTER_OPTIONS },
    third: { label: 'Shares Transaction Type', options: SHARES_TRANSACTION_FILTER_OPTIONS3 },
  },
   DATES: {
    primary: { label: 'Date', options: DATE_FILTER_OPTIONS }
  },
};

export const loadPopupSourceFilters = async () => {
  await Promise.all([
    loadOfficialFilterOptions(),
    loadEventFilterOptions(),
    loadShareClassTempParams(),
  ]);
  return POPUP_SOURCE_FILTERS;
};

export const TEMP_PARAMS = [
  { value: 'select', label: '- Select -' },
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'grouped', label: 'Grouped' },
  { value: 'individual-corporate', label: 'Individual / Corporate' },
  { value: 'nominee-director', label: 'Nominee Director' },
  { value: 'group-by-shareholder', label: 'Group By Shareholder' },
  { value: 'director-fee', label: 'Director Fee' },
  { value: 'director-remuneration', label: 'Director Remuneration' },
];

export const TEMP_SHAREHOLDERS_PARAMS = [
  { value: 'select', label: '- Select -' },
  { value: 'all', label: 'All' },
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'grouped', label: 'Grouped' },
  { value: 'individual-corporate', label: 'Individual / Corporate' },
  { value: 'director-shareholder', label: 'Director & Shareholder' },
  { value: 'ceo-shareholder', label: 'CEO & Shareholder' },
];

export const TEMP_PARAMS2 = [{ value: '0', label: '- Select -' }];

export const loadShareClassTempParams = async () => {
  const res = await getShareClassMasterList({
    page: 1,
    limit: 1000,
    order: 'sc_id:ASC',
  });
  const list = res?.data?.data ?? res?.data ?? res;
  const options = (Array.isArray(list) ? list : [])
    .filter(item => item.sc_id != null && item.sc_name)
    .map(item => ({
      value: String(item.sc_id),
      label: String(item.sc_name).trim(),
    }));

  TEMP_PARAMS2.splice(
    0,
    TEMP_PARAMS2.length,
    { value: '0', label: '- Select -' },
    ...options
  );
  return TEMP_PARAMS2;
};

export const DEFAULT_TEMP_PARAMS = [
  { value: '0', label: '- Select -' },
];

export const TEMP_PARAMS_BY_SOURCE = {
  OFFICIAL_RECORDS: TEMP_PARAMS,
  SHAREHOLDERS: TEMP_SHAREHOLDERS_PARAMS,
  SHARES: TEMP_PARAMS2,
  COMPLAINANT: DEFAULT_TEMP_PARAMS,
};
//========================================================================================== //
export const CHARGES_LODGEMENT_OPTS = [
  { value: '1', label: 'Statement Containing Particulars of Charge' },
  { value: '2', label: 'Statement Containing Particulars of a Series of Debentures' },
  { value: '3', label: 'Statement Containing Particulars When More Than One Issue is Made of Debentures in Series' },
  { value: '4', label: 'Statement in Respect of Property Acquired by Company While Property is Subject To a Charge' },
];

export const CHARGES_INSTRUMENT_OPTS = [
  { value: '1', label: 'There is no instrument by which the charge is created or evidenced' },
  { value: '2', label: 'There is instrument by which the charge is created or evidenced' },
];

export const CHARGES_INSTRUMENT_DESC_OPTS = [
  { value: '1', label: 'Mortgage' }, { value: '2', label: 'Mortgage over vessel' },
  { value: '3', label: 'Mortgage over vessel with a collateral Deed of Covenants' },
  { value: '4', label: 'Charge over motor-vehicle' }, { value: '5', label: 'Charge over deposits' },
  { value: '6', label: 'Assignment of Proceeds' }, { value: '7', label: 'Assignment of Construction Contracts' },
  { value: '8', label: 'Assignment of Contract Guarantees' }, { value: '9', label: 'Assignment of Insurance' },
  { value: '10', label: 'Assignment of Performance Bond' }, { value: '11', label: 'Assignment of Rental Proceeds' },
  { value: '12', label: 'Assignment of Lease and Mortgage in Escrow' }, { value: '13', label: 'Assignment of Building Agreements' },
  { value: '14', label: 'Assignment of Building Contract and Performance Bonds' }, { value: '15', label: 'Assignment of Sale Proceeds' },
  { value: '16', label: 'Deed of Assignment of Contract Proceeds and Charge on Accounts' }, { value: '17', label: 'Deed of Debenture' },
  { value: '18', label: 'Letter of Set-Off and Charge' }, { value: '19', label: 'Security Agreement to Secure Liabilities to Third Party' },
  { value: '20', label: 'Others' },
];

export const CHARGE_NAME_OPTS = [
  { value: '1',  label: 'A charge to secure any issue of debentures' },
  { value: '2',  label: 'A charge on uncalled share capital of a company' },
  { value: '3',  label: 'A charge on shares of a subsidiary of a company which are owned by the company' },
  { value: '4',  label: 'A charge created or evidenced by an instrument which if executed by an individual, would require registration as a bill of sale' },
  { value: '5',  label: 'A charge on land wherever situates or any interest therein' },
  { value: '6',  label: 'A charge on book debts of the company' },
  { value: '7',  label: 'A floating charge on the undertaking or property of a company' },
  { value: '8',  label: 'A charge on calls made but not paid' },
  { value: '9',  label: 'A charge on a ship or any share in a ship, or an aircraft' },
  { value: '10', label: 'A charge on goodwill, patent, trade mark, copyright or registered design' },
];

export const CHARGES_STATEMENT_LODGED_OPTS = [
  { value: '1', label: 'Chargee (Lender)' },
  { value: '2', label: 'Chargor (Borrower)' },
  { value: '3', label: 'Person interested in the document' },
];

export const CHARGES_PARTICULARS_OPTS = [
  { value: '1', label: 'Total satisfaction and removal from the Register' },
  { value: '2', label: 'Partial Satisfaction and remain in the Register' },
  { value: '3', label: 'Partial Satisfaction and remove from the Register' },
  { value: '4', label: 'Partial discharge and remove from the Register' },
  { value: '5', label: 'Partial discharge and remain in the Register' },
  { value: '6', label: 'Total discharge and remove from the Register' },
];


const normalise = (country) => (country || '').trim().toLowerCase();

const readField = (entity, key) => {
  if (!entity) return '';
  return (
    entity[key] ||
    entity?.company_detail?.[key] ||
    entity?.identifications?.[0]?.[key] ||
    ''
  );
};

/**
 * Return the registration fields that apply to the given country.
 * Singapore fields:
 *   UEN No.  — entity.uen_no  / company_detail.uen_no
 *   ACRA ID  — entity.acra_no / company_detail.acra_no
 *
 * Other countries:
 *   FBRN             — fbrn_reg_no
 *   UF No.           — uf_no
 *   Domestic Bus. No — domes_bus_no
 *   ACRA ID          — acra_no  (shown as fallback registration number)
 */
export const getRegistrationFields = (entity, country) => {
  const isSingapore = normalise(country) === 'singapore';

  if (isSingapore) {
    return [
      {
        key:   'uen_no',
        label: 'UEN No.',
        value: readField(entity, 'uen_no') || '—',
      },
      {
        key:   'acra_no',
        label: 'ACRA ID',
        value: readField(entity, 'acra_no') || '—',
      },
    ];
  }

  /* Non-Singapore — show all foreign registration fields.
     Only include ACRA ID if it has a value (used as fallback reg no). */
  const fields = [
    {
      key:   'fbrn_reg_no',
      label: 'FBRN',
      value: readField(entity, 'fbrn_reg_no') || '—',
    },
    {
      key:   'uf_no',
      label: 'UF No.',
      value: readField(entity, 'uf_no') || '—',
    },
    {
      key:   'domes_bus_no',
      label: 'Domestic Bus. No.',
      value: readField(entity, 'domes_bus_no') || '—',
    },
  ];

  const acra = readField(entity, 'acra_no');
  if (acra) {
    fields.push({ key: 'acra_no', label: 'ACRA ID', value: acra });
  }

  return fields;
};

/**
 * Convenience: same as getRegistrationFields but returns only non-empty values.
 * Useful for summary displays where you don't want to show "UF No. — ".
 */
export const getFilledRegistrationFields = (entity, country) =>
  getRegistrationFields(entity, country).filter(f => f.value && f.value !== '—');

/* ──────────────────────────────────────────────────────────────────
   HMR: this module exports only constants/helpers (no React
   components). A partial hot-apply can re-render consumers before the
   new `const` exports finish binding, throwing "Cannot access
   'TEMP_PARAMS_BY_SOURCE' before initialization". Force a full reload
   on change instead.
────────────────────────────────────────────────────────────────── */
if (typeof module !== 'undefined' && module.hot) {
  module.hot.decline();
}
