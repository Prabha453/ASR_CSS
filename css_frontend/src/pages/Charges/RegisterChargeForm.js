import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Button, Spinner, Input, Label, FormFeedback,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import BreadCrumb          from '../../Components/Common/BreadCrumb';
import FormInput           from '../../pages/Settings/Components/FormInput';
import ReCaptchaDisclosure from '../../Components/Common/ReCaptchaDisclosure';
import { getLoggedinUser } from '../../helpers/api_helper';
import useCollapseSidebar  from '../../hooks/useCollapseSidebar';
import { loadRecaptcha, executeRecaptcha } from '../../helpers/recaptcha_helper';

import {
  getRegisterCharge,
  createRegisterCharge,
  updateRegisterCharge,
  getCountriesList,
  getEntityList,
  deleteDocumentStore,
  checkChargeNumber,
} from '../../helpers/backend_helper';

import {
  CHARGES_STATEMENT_LODGED_OPTS,
  CHARGES_PARTICULARS_OPTS,
  CHARGES_LODGEMENT_OPTS,
  CHARGES_INSTRUMENT_DESC_OPTS,
  CHARGES_INSTRUMENT_OPTS,
  CHARGE_NAME_OPTS,
  getFilledRegistrationFields,
} from '../../helpers/common_helper';

/* ─────────────────────────────────────────────────────────────────────────────
   ENTITY HELPER
   Gets company / individual details from the raw getEntityList() response.
   Works for both Corporate chargee (reads uen_no, addresses) and
   Individual chargee (reads id_number, nationality, address).
───────────────────────────────────────────────────────────────────────────── */

/**
 * Given the raw entity list and an entity_id, return the matching entity object.
 */
export const getEntityById = (entityList = [], entityId) =>
  entityList.find(e => String(e.entity_id) === String(entityId)) || null;

/**
 * Get the primary address from an entity's addresses array.
 * Falls back to the first address if none is marked primary.
 */
export const getEntityPrimaryAddress = (entity) => {
  if (!entity?.addresses?.length) return null;
  return entity.addresses.find(a => a.is_primary) ?? entity.addresses[0];
};

/**
 * Build a formatted single-line address string from an address object.
 */
export const formatAddress = (addr) => {
  if (!addr) return '';
  return [
    addr.block_no, addr.street_name, addr.building_name,
    addr.level_no, addr.unit_no, addr.city,
    addr.state, addr.postal_code, addr.country,
  ].filter(Boolean).join(', ');
};

/**
 * Get the primary identification from an entity.
 */
export const getEntityPrimaryIdentification = (entity) => {
  if (!entity?.identifications?.length) return null;
  return entity.identifications.find(i => i.is_primary) ?? entity.identifications[0];
};

/**
 * Get the country of incorporation for a COMPANY entity.
 * Reads from company_detail.country.
 */
export const getEntityCountry = (entity) =>
  entity?.company_detail?.country || '';

/**
 * Build the auto-fill data for a CORPORATE chargee from entity data.
 * These are display-only — NOT sent to the backend.
 */
export const getCorporateChargeeDisplay = (entity) => {
  const ident   = getEntityPrimaryIdentification(entity);
  const addr    = getEntityPrimaryAddress(entity);
  const country = getEntityCountry(entity);

  /* getFilledRegistrationFields returns [{ key, label, value }] filtered to non-empty */
  const regFields   = getFilledRegistrationFields(entity, country);
  /* For Singapore: show UEN. For others: show FBRN / UF No etc. */
  const primaryRegNo = regFields[0]?.value || '';

  return {
    display_reg_no:           primaryRegNo,
    display_reg_fields:       regFields,          // full array for rendering
    display_address:          formatAddress(addr),
    display_country_of_incorp: country,
  };
};

/**
 * Build the auto-fill data for an INDIVIDUAL chargee from entity data.
 * Returns display-only fields — NOT sent to the backend.
 */
export const getIndividualChargeeDisplay = (entity) => {
  const ident = getEntityPrimaryIdentification(entity);
  const addr  = getEntityPrimaryAddress(entity);

  return {
    display_id_number:   ident?.id_number || '',
    display_nationality: ident?.id_issued_country || addr?.country || '',
    display_address:     formatAddress(addr),
  };
};

/* ─────────────────────────────────────────────────────────────────────────────
   SCOPED CSS
───────────────────────────────────────────────────────────────────────────── */
const CSS = `
  .rca-section {
    border: 1px solid var(--vz-border-color);
    border-radius: 8px; overflow: hidden; margin-bottom: 10px;
    background: var(--vz-card-bg, #fff);
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
  }
  .rca-section:last-child { margin-bottom: 0; }
  .rca-hdr {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; background: var(--vz-light);
    border-bottom: 1px solid transparent;
    cursor: pointer; user-select: none; transition: background .15s;
  }
  .rca-hdr:hover { background: rgba(64,81,137,.04); }
  .rca-hdr.open  { border-bottom-color: var(--vz-border-color); }
  .rca-step {
    width: 22px; height: 22px; border-radius: 50%;
    background: #405189; color: #fff; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rca-hdr-icon {
    width: 22px; height: 22px; border-radius: 5px;
    background: rgba(64,81,137,.1); color: #405189;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0;
  }
  .rca-hdr-text { flex: 1; min-width: 0; }
  .rca-hdr-title {
    font-size: 12px; font-weight: 700; color: var(--vz-body-color);
    margin: 0; text-transform: uppercase; letter-spacing: .02em;
  }
  .rca-hdr-sub { font-size: 11px; color: var(--vz-secondary-color, #878a99); margin: 0; margin-top: 1px; }
  .rca-chevron { font-size: 16px; color: var(--vz-secondary-color, #878a99); transition: transform .2s; flex-shrink: 0; }
  .rca-chevron.open { transform: rotate(180deg); }
  .rca-done {
    font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 600;
    background: rgba(10,179,156,.12); color: #0ab39c;
    border: 1px solid rgba(10,179,156,.2);
  }
  .rca-body { padding: 14px 16px; }
  .rca-divider { height: 1px; background: var(--vz-border-color); margin: 12px 0; }

  /* Radio pills */
  .rca-radio-grp { display: flex; gap: 6px; flex-wrap: wrap; }
  .rca-radio-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 13px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 500; user-select: none;
    border: 1px solid var(--vz-border-color);
    background: var(--vz-card-bg, #fff); color: var(--vz-body-color);
    transition: all .15s;
  }
  .rca-radio-pill.active { background: rgba(64,81,137,.08); border-color: #405189; color: #405189; font-weight: 600; }
  .rca-radio-pill input { display: none; }

  /* Chargee card */
  .rca-chargee {
    border: 1px solid var(--vz-border-color); border-left: 3px solid #405189;
    border-radius: 7px; margin-bottom: 10px; overflow: hidden;
    background: var(--vz-card-bg, #fff);
  }
  .rca-chargee:last-of-type { margin-bottom: 6px; }
  .rca-chargee-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: rgba(64,81,137,.04);
    border-bottom: 1px solid var(--vz-border-color);
  }
  .rca-chargee-title {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 700; color: #405189; margin: 0;
  }
  .rca-badge { font-size: 10px; padding: 1px 7px; border-radius: 20px; font-weight: 700; letter-spacing: .03em; }
  .rca-badge-corp { background: rgba(64,81,137,.1); color: #405189; border: 1px solid rgba(64,81,137,.2); }
  .rca-badge-ind  { background: rgba(10,179,156,.1); color: #0ab39c; border: 1px solid rgba(10,179,156,.2); }
  .rca-chargee-body { padding: 12px 14px; }
  .rca-type-row { display: flex; gap: 6px; }
  .rca-type-pill {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px 10px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600; user-select: none;
    border: 1.5px solid var(--vz-border-color);
    background: var(--vz-card-bg, #fff); color: var(--vz-secondary-color, #878a99);
    transition: all .15s;
  }
  .rca-type-pill.active-corp { background: rgba(64,81,137,.07); border-color: #405189; color: #405189; }
  .rca-type-pill.active-ind  { background: rgba(10,179,156,.07); border-color: #0ab39c; color: #0ab39c; }
  .rca-type-pill i { font-size: 14px; }

  /* Reg fields display box — read-only info, not stored */
  .rca-reg-box {
    padding: 8px 10px; border-radius: 6px; margin-top: 6px;
    background: rgba(64,81,137,.04); border: 1px solid rgba(64,81,137,.12);
  }
  .rca-reg-box-title {
    font-size: 10px; font-weight: 700; color: #405189;
    text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px;
  }
  .rca-reg-row { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 4px; }
  .rca-reg-row:last-child { margin-bottom: 0; }
  .rca-reg-label { color: var(--vz-secondary-color,#878a99); min-width: 80px; font-weight: 500; }
  .rca-reg-value { font-weight: 600; color: var(--vz-body-color); }

  /* Readonly input style */
  .rca-readonly {
    background: rgba(64,81,137,.03) !important;
    color: #405189 !important;
    cursor: default !important;
  }

  /* Monies box */
  .rca-monies {
    padding: 10px 12px; border-radius: 6px;
    background: rgba(64,81,137,.03); border: 1px solid rgba(64,81,137,.1);
    margin-top: 4px;
  }
  .rca-monies-title { font-size: 11px; font-weight: 700; color: #405189; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; }
  .rca-amt-box { padding: 10px 12px; border-radius: 6px; margin-top: 8px; background: rgba(251,191,36,.04); border: 1px solid rgba(251,191,36,.25); }
  .rca-amt-title { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 8px; }

  .rca-del {
    width: 26px; height: 26px; border-radius: 5px;
    border: 1px solid rgba(240,101,72,.2); background: rgba(240,101,72,.06);
    color: #f06548; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; transition: all .12s;
  }
  .rca-del:hover { background: rgba(240,101,72,.15); border-color: rgba(240,101,72,.4); }
  .rca-add-chargee {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px; border-radius: 7px; border: 1.5px dashed var(--vz-border-color);
    background: transparent; cursor: pointer; color: var(--vz-secondary-color, #878a99);
    font-size: 12px; font-weight: 600; transition: all .15s; width: 100%; margin-top: 4px;
  }
  .rca-add-chargee:hover { border-color: #405189; color: #405189; background: rgba(64,81,137,.03); }

  .rca-dup {
    display: flex; align-items: center; gap: 5px; font-size: 11px; color: #d97706;
    font-weight: 600; padding: 5px 9px; border-radius: 5px; margin-top: 4px;
    background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.3);
  }

  /* Upload */
  .rca-upload {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border: 2px dashed var(--vz-border-color);
    border-radius: 8px; cursor: pointer; transition: all .2s;
  }
  .rca-upload:hover { border-color: #405189; background: rgba(64,81,137,.02); }
  .rca-upload-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: rgba(64,81,137,.08); color: #405189;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; flex-shrink: 0;
  }
  .rca-upload-text strong { font-size: 12px; font-weight: 700; color: var(--vz-body-color); display: block; }
  .rca-upload-text span   { font-size: 11px; color: var(--vz-secondary-color, #878a99); }
  .rca-file-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 5px 9px; border-radius: 5px; font-size: 12px;
    border: 1px solid var(--vz-border-color); margin-top: 5px;
    background: var(--vz-light);
  }
  .rca-file-info { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .rca-file-info i { color: #405189; font-size: 14px; flex-shrink: 0; }
  .rca-file-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
  .rca-file-size { color: var(--vz-secondary-color, #878a99); font-size: 11px; }
  .rca-file-acts { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .rca-file-view {
    width: 22px; height: 22px; border-radius: 4px;
    border: 1px solid rgba(64,81,137,.2); background: rgba(64,81,137,.06);
    color: #405189; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; text-decoration: none; transition: background .12s;
  }
  .rca-file-view:hover { background: rgba(64,81,137,.15); }
  .rca-file-del {
    width: 22px; height: 22px; border-radius: 4px;
    border: 1px solid rgba(240,101,72,.2); background: rgba(240,101,72,.06);
    color: #f06548; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; transition: background .12s;
  }
  .rca-file-del:hover { background: rgba(240,101,72,.15); }
  .rca-files-lbl {
    font-size: 11px; font-weight: 700; color: var(--vz-secondary-color, #878a99);
    text-transform: uppercase; letter-spacing: .05em;
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 2px; margin-top: 10px;
  }
  .rca-files-lbl span { background: #405189; color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 10px; }

  .rca-footer {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-top: 1px solid var(--vz-border-color);
    background: var(--vz-light);
  }
  .rcl-del-ring {
    width: 54px; height: 54px; border-radius: 50%;
    background: #FCEBEB; color: #A32D2D;
    font-size: 26px; display: flex; align-items: center;
    justify-content: center; margin: 0 auto 14px;
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const CHARGE_NO_PATTERN = /^[1-9][0-9]*$/;
const ALLOWED_EXTS      = ['xlsx', 'xls', 'docx', 'pdf', 'txt'];
const MAX_FILE_MB       = 5;
const user              = getLoggedinUser();

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const toInputDate = (d) => {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
    const [day, mon, yr] = d.split('/');
    return `${yr}-${mon}-${day}`;
  }
  const dt = new Date(d);
  return isNaN(dt) ? '' : dt.toISOString().slice(0, 10);
};

/**
 * Build multipart/form-data.
 *
 * IMPORTANT: display-only chargee fields (display_*) are intentionally
 * EXCLUDED from the payload — they are never stored in the DB.
 * Only the entity IDs are sent; the backend joins for display on read.
 */
const buildFormData = (values, files = [], userId, recaptchaToken) => {
  const fd = new FormData();

  const scalarKeys = [
    'company_id', 'charge_number', 'registration_date', 'lodgement_type',
    'instrument_executed_location', 'charge_creation_date', 'instrument_option',
    'instrument_description', 'instrument_date', 'instrument_executed_presence',
    'property_description', 'restrictions_prohibitions', 'salient_covenants',
    'statement_lodged_behalf_of', 'type_of_charge', 'satisfaction_date',
    'nature_of_satisfaction', 'remarks',
  ];
  scalarKeys.forEach(k => fd.append(k, values[k] ?? ''));

  /* Chargees — only DB-stored fields, strip all display_* keys */
  values.chargees.forEach((chargee, i) => {
    const DB_CHARGEE_KEYS = [
      'chargee_id',
      'chargee_type',
      'chargee_company_entity_id',
      'chargee_individual_entity_id',
      'chargee_secures_all_monies',
      'chargee_currency',
      'chargee_amount_secured',
    ];
    DB_CHARGEE_KEYS.forEach(key => {
      fd.append(`chargees[${i}][${key}]`, chargee[key] ?? '');
    });
  });

  files.forEach(file => fd.append('charge_document', file));
  fd.append('created_by',      String(userId ?? ''));
  fd.append('recaptcha_token', recaptchaToken ?? '');
  const portName = user?.portName || user?.port_name || null;
  if (portName) fd.append('port_name', portName);
  return fd;
};

/**
 * New chargee skeleton.
 * display_* fields are UI-only — they populate inputs but are NOT sent to DB.
 */
const newChargee = () => ({
  chargee_id:                  '',

  /* DB fields */
  chargee_type:                '',   // '1' Corporate | '2' Individual
  chargee_company_entity_id:   '',   // FK → entities (corporate)
  chargee_individual_entity_id:'',   // FK → entities (individual)
  chargee_secures_all_monies:  '',   // '1' Yes | '2' No
  chargee_currency:            '',
  chargee_amount_secured:      '',

  /* Display-only — populated from entity data, never sent to DB */
  display_reg_no:              '',   // UEN / FBRN etc.
  display_reg_fields:          [],   // [{ key, label, value }] from getFilledRegistrationFields
  display_address:             '',   // formatted address string
  display_country_of_incorp:   '',   // company_detail.country
  display_id_number:           '',   // individual id_number
  display_nationality:         '',   // individual nationality
  display_ind_address:         '',   // individual address
});

/* ─────────────────────────────────────────────────────────────────────────────
   YUP SCHEMA
───────────────────────────────────────────────────────────────────────────── */
const buildSchema = (chargeNoDup) =>
  Yup.object({
    company_id:           Yup.string().required('Company is required'),
    charge_number:        Yup.string()
      .required('Charge number is required')
      .matches(CHARGE_NO_PATTERN, 'Must be numeric e.g. 1001')
      .test('no-dup', 'Charge number already exists for this company', () => !chargeNoDup),
    registration_date:    Yup.string().required('Registration date is required'),
    charge_creation_date: Yup.string().required('Creation date is required'),
    instrument_date:      Yup.string().required('Date of instrument is required'),
    satisfaction_date:    Yup.string().test(
      'after-reg', 'Must be after registration date',
      function (val) {
        const reg = this.parent.registration_date;
        if (!val || !reg) return true;
        return val > reg;
      }
    ),
    chargees: Yup.array().of(Yup.object({
      chargee_company_entity_id:    Yup.string().when('chargee_type', {
        is:   '1',
        then: s => s.required('Please select the company'),
      }),
      chargee_individual_entity_id: Yup.string().when('chargee_type', {
        is:   '2',
        then: s => s.required('Please select the individual'),
      }),
      chargee_amount_secured: Yup.string().when('chargee_secures_all_monies', {
        is:   '2',
        then: s => s.required('Amount is required'),
      }),
    })),
  });

/* ─────────────────────────────────────────────────────────────────────────────
   ACCORDION SECTION
───────────────────────────────────────────────────────────────────────────── */
const AccSection = ({ step, icon, title, sub, isOpen, onToggle, right, done, children }) => (
  <div className="rca-section">
    <div className={`rca-hdr ${isOpen ? 'open' : ''}`} onClick={onToggle}>
      <div className="rca-step">{step}</div>
      <div className="rca-hdr-icon"><i className={icon} /></div>
      <div className="rca-hdr-text">
        <p className="rca-hdr-title">{title}</p>
        {sub && <p className="rca-hdr-sub">{sub}</p>}
      </div>
      {done && !isOpen && <span className="rca-done"><i className="ri-checkbox-circle-fill me-1" />Filled</span>}
      {right && isOpen && <div onClick={e => e.stopPropagation()}>{right}</div>}
      <i className={`rca-chevron ri-arrow-down-s-line ${isOpen ? 'open' : ''}`} />
    </div>
    {isOpen && <div className="rca-body">{children}</div>}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   RADIO PILL GROUP
───────────────────────────────────────────────────────────────────────────── */
const RadioPills = ({ name, options, value, onChange }) => (
  <div className="rca-radio-grp">
    {options.map(opt => (
      <label
        key={opt.value}
        className={`rca-radio-pill ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        <input type="radio" name={name} value={opt.value} readOnly checked={value === opt.value} />
        {opt.label}
      </label>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   REGISTRATION FIELDS DISPLAY BOX
   Renders the read-only registration info (UEN, FBRN etc.) from entity data.
   NOT stored in DB — display only.
───────────────────────────────────────────────────────────────────────────── */
const RegFieldsDisplay = ({ regFields = [], country = '' }) => {
  if (!regFields.length) return null;
  return (
    <div className="rca-reg-box">
      <div className="rca-reg-box-title">
        <i className="ri-shield-check-line me-1" />
        Registration details ({country || 'Unknown country'})
      </div>
      {regFields.map(f => (
        <div key={f.key} className="rca-reg-row">
          <span className="rca-reg-label">{f.label}</span>
          <span className="rca-reg-value">{f.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   CHARGEE CARD
   Reads directly from formik.values.chargees[index] — always in sync.
   display_* fields are set from entity data but NEVER sent to the backend.
───────────────────────────────────────────────────────────────────────────── */
const ChargeeCard = ({
  index, remove, replace,
  countryOpts, currencyOpts,
  memberOpts, members,      // INDIVIDUAL entities
  corpMembers,              // COMPANY entities (raw, with addresses/identifications)
  formik,
}) => {
  const c       = formik.values.chargees[index];
  const err     = formik.errors?.chargees?.[index] || {};
  const touched = formik.touched?.chargees?.[index] || {};

  const isCorp  = c.chargee_type === '1';
  const isInd   = c.chargee_type === '2';
  const showAmt = c.chargee_secures_all_monies === '2';

  const path     = (field) => `chargees[${index}].${field}`;
  const fChange  = formik.handleChange;
  const fBlur    = formik.handleBlur;
  const setField = (field, val) => formik.setFieldValue(path(field), val);

  /* Type change — wipe type-specific fields, keep monies state */
  const onTypeChange = (val) => {
    replace(index, {
      ...newChargee(),
      chargee_type:               val,
      chargee_secures_all_monies: c.chargee_secures_all_monies,
      chargee_currency:           c.chargee_currency,
      chargee_amount_secured:     c.chargee_amount_secured,
    });
  };

  const onSecureChange = (val) => {
    replace(index, {
      ...c,
      chargee_secures_all_monies: val,
      ...(val === '1' ? { chargee_currency: '', chargee_amount_secured: '' } : {}),
    });
  };

  /**
   * Corporate entity selected:
   * → Set chargee_company_entity_id (DB field)
   * → Populate display_* fields from entity data using helpers
   * → display_reg_fields: country-aware from getFilledRegistrationFields
   */
  const onCorpChange = (e) => {
    const entityId = e.target.value;
    if (!entityId) {
      setField('chargee_company_entity_id', '');
      setField('display_reg_no',           '');
      setField('display_reg_fields',       []);
      setField('display_address',          '');
      setField('display_country_of_incorp','');
      return;
    }

    const entity  = getEntityById(corpMembers, entityId);
    const display = getCorporateChargeeDisplay(entity);

    setField('chargee_company_entity_id',    entityId);
    setField('display_reg_no',               display.display_reg_no);
    setField('display_reg_fields',           display.display_reg_fields);
    setField('display_address',              display.display_address);
    setField('display_country_of_incorp',    display.display_country_of_incorp);
  };

  /**
   * Individual entity selected:
   * → Set chargee_individual_entity_id (DB field)
   * → Populate display_id_number, display_nationality, display_ind_address
   */
  const onMemberChange = (e) => {
    const entityId = e.target.value;
    if (!entityId) {
      setField('chargee_individual_entity_id', '');
      setField('display_id_number',            '');
      setField('display_nationality',          '');
      setField('display_ind_address',          '');
      return;
    }

    const entity  = getEntityById(members, entityId);
    const display = getIndividualChargeeDisplay(entity);

    setField('chargee_individual_entity_id', entityId);
    setField('display_id_number',            display.display_id_number);
    setField('display_nationality',          display.display_nationality);
    setField('display_ind_address',          display.display_address);
  };

  return (
    <div className="rca-chargee">
      {/* Header */}
      <div className="rca-chargee-hdr">
        <p className="rca-chargee-title">
          <i className="ri-user-line" />
          Chargee {index + 1}
          {c.chargee_type === '1' && <span className="rca-badge rca-badge-corp">Corporate</span>}
          {c.chargee_type === '2' && <span className="rca-badge rca-badge-ind">Individual</span>}
        </p>
        <button type="button" className="rca-del" onClick={() => remove(index)}>
          <i className="ri-delete-bin-line" />
        </button>
      </div>

      <div className="rca-chargee-body">

        {/* Type selector */}
        <div className="mb-3">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--vz-secondary-color,#878a99)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4 }}>
            Chargee type
          </span>
          <div className="rca-type-row">
            <button type="button"
              className={`rca-type-pill ${c.chargee_type === '1' ? 'active-corp' : ''}`}
              onClick={() => onTypeChange('1')}>
              <i className="ri-building-line" /> Corporate
            </button>
            <button type="button"
              className={`rca-type-pill ${c.chargee_type === '2' ? 'active-ind' : ''}`}
              onClick={() => onTypeChange('2')}>
              <i className="ri-user-line" /> Individual
            </button>
          </div>
        </div>

        {/* ── CORPORATE fields ── */}
        {isCorp && (
          <>
            <div className="rca-divider" />
            <Row className="g-2">
              {/* Entity name dropdown — sets DB field + cascades display */}
              <Col md={6}>
                <Label className="form-label fs-12">
                  Entity name <span className="text-danger">*</span>
                </Label>
                <Input
                  bsSize="sm" type="select"
                  name={path('chargee_company_entity_id')}
                  value={c.chargee_company_entity_id}
                  onChange={onCorpChange}
                  onBlur={fBlur}
                  invalid={touched.chargee_company_entity_id && !!err.chargee_company_entity_id}
                >
                  <option value="">Select company</option>
                  {corpMembers.map(m => (
                    <option key={m.entity_id} value={m.entity_id}>{m.name}</option>
                  ))}
                </Input>
                {touched.chargee_company_entity_id && err.chargee_company_entity_id && (
                  <FormFeedback>{err.chargee_company_entity_id}</FormFeedback>
                )}
              </Col>

              {/* Country of incorporation — display-only, auto-filled */}
              <Col md={6}>
                <Label className="form-label fs-12">Country of incorporation</Label>
                <Input
                  bsSize="sm" type="text"
                  value={c.display_country_of_incorp}
                  readOnly placeholder="Auto-filled from company"
                  className="rca-readonly"
                />
              </Col>

              {/* Address — display-only, auto-filled */}
              <Col md={12}>
                <Label className="form-label fs-12">Address</Label>
                <Input
                  bsSize="sm" type="textarea" rows={2}
                  value={c.display_address}
                  readOnly placeholder="Auto-filled from company"
                  className="rca-readonly"
                />
              </Col>
            </Row>

            {/* Registration fields box — country-aware display using getFilledRegistrationFields */}
            {c.display_reg_fields?.length > 0 && (
              <RegFieldsDisplay
                regFields={c.display_reg_fields}
                country={c.display_country_of_incorp}
              />
            )}
          </>
        )}

        {/* ── INDIVIDUAL fields ── */}
        {isInd && (
          <>
            <div className="rca-divider" />
            <Row className="g-2">
              {/* Individual name dropdown */}
              <Col md={6}>
                <Label className="form-label fs-12">
                  Individual name <span className="text-danger">*</span>
                </Label>
                <Input
                  bsSize="sm" type="select"
                  name={path('chargee_individual_entity_id')}
                  value={c.chargee_individual_entity_id}
                  onChange={onMemberChange}
                  onBlur={fBlur}
                  invalid={touched.chargee_individual_entity_id && !!err.chargee_individual_entity_id}
                >
                  <option value="">Select individual</option>
                  {memberOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </Input>
                {touched.chargee_individual_entity_id && err.chargee_individual_entity_id && (
                  <FormFeedback>{err.chargee_individual_entity_id}</FormFeedback>
                )}
              </Col>

              {/* ID number — display-only, auto-filled from identifications[primary].id_number */}
              <Col md={6}>
                <Label className="form-label fs-12">ID number</Label>
                <Input
                  bsSize="sm" type="text"
                  value={c.display_id_number}
                  readOnly placeholder="Auto-filled from member"
                  className="rca-readonly"
                />
              </Col>

              {/* Address — display-only */}
              <Col md={6}>
                <Label className="form-label fs-12">Address</Label>
                <Input
                  bsSize="sm" type="textarea" rows={2}
                  value={c.display_ind_address}
                  readOnly placeholder="Auto-filled from member"
                  className="rca-readonly"
                />
              </Col>

              {/* Nationality — display-only, from identifications[primary].id_issued_country */}
              <Col md={6}>
                <Label className="form-label fs-12">Nationality</Label>
                <Input
                  bsSize="sm" type="text"
                  value={c.display_nationality}
                  readOnly placeholder="Auto-filled from member"
                  className="rca-readonly"
                />
              </Col>
            </Row>
          </>
        )}

        {/* ── Secure all monies ── */}
        <div className="rca-divider" />
        <div className="rca-monies">
          <div className="rca-monies-title">Did this charge secure all monies owing?</div>
          <RadioPills
            name={path('chargee_secures_all_monies')}
            options={[
              { value: '1', label: 'Yes — all monies' },
              { value: '2', label: 'No — specific amount' },
            ]}
            value={c.chargee_secures_all_monies}
            onChange={onSecureChange}
          />

          {showAmt && (
            <div className="rca-amt-box">
              <div className="rca-amt-title">Amount secured</div>
              <Row className="g-2">
                <Col md={6}>
                  <Label className="form-label fs-12">Currency</Label>
                  <Input
                    bsSize="sm" type="select"
                    name={path('chargee_currency')}
                    value={c.chargee_currency}
                    onChange={fChange} onBlur={fBlur}
                  >
                    <option value="">Select currency</option>
                    {currencyOpts.map((o, i) => (
                      <option key={`${i}-${o.value}`} value={o.value}>{o.label}</option>
                    ))}
                  </Input>
                </Col>
                <Col md={6}>
                  <Label className="form-label fs-12">
                    Amount secured <span className="text-danger">*</span>
                  </Label>
                  <Input
                    bsSize="sm" type="text"
                    name={path('chargee_amount_secured')}
                    value={c.chargee_amount_secured}
                    onChange={fChange} onBlur={fBlur}
                    placeholder="Enter amount"
                    invalid={touched.chargee_amount_secured && !!err.chargee_amount_secured}
                  />
                  {touched.chargee_amount_secured && err.chargee_amount_secured && (
                    <FormFeedback>{err.chargee_amount_secured}</FormFeedback>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const RegisterChargeForm = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const fileRef        = useRef(null);
  const chargeNoTimer  = useRef(null);
  const chargeNoDupRef = useRef(false);

  const [loading,      setLoading]      = useState(isEdit);
  const [chargeNoDup,  setChargeNoDup]  = useState(false);
  const [dupChecking,  setDupChecking]  = useState(false);
  const [allEntities,  setAllEntities]  = useState([]);   // raw full entity list
  const [companies,    setCompanies]    = useState([]);   // COMPANY raw entities
  const [countries,    setCountries]    = useState([]);
  const [currencies,   setCurrencies]   = useState([]);
  const [members,      setMembers]      = useState([]);   // INDIVIDUAL raw entities
  const [existingDocs, setExistingDocs] = useState([]);
  const [newFiles,     setNewFiles]     = useState([]);
  const [deleteTarget, setDelTarget]    = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const [openSections, setOpenSections] = useState({ s1: true, s2: true, s3: true, s4: true, s5: true });
  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  document.title = `${isEdit ? 'Edit' : 'Add'} Register Charge | ASR CSS`;

  useEffect(() => { loadRecaptcha(); }, []);

  /* ── Load dropdowns ── */
  useEffect(() => {
    (async () => {
      try {
        const [cntRes, entRes] = await Promise.all([
          getCountriesList({ page: 1, limit: 300 }),
          getEntityList(),
        ]);
        const extract     = r => r?.data?.data ?? r?.data ?? r ?? [];
        const countryList = extract(cntRes);
        const entityList  = extract(entRes);

        setAllEntities(entityList);
        setCountries(countryList.map(c => ({ value: c.id || c.name, label: c.name })));
        setCurrencies(countryList.filter(c => c.currency_code).map(c => ({
          value: c.currency_code, label: c.currency_code,
        })));
        setMembers(entityList.filter(e => e.entity_type === 'INDIVIDUAL'));
        setCompanies(entityList.filter(e => e.entity_type === 'COMPANY'));
      } catch (err) {
        toast.error('Failed to load dropdown data');
        console.error(err);
      }
    })();
  }, []);

  /* ── Formik ── */
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      company_id: '', charge_number: '', registration_date: '', lodgement_type: '',
      instrument_executed_location: '', charge_creation_date: '',
      instrument_option: '', instrument_description: '', instrument_date: '',
      instrument_executed_presence: '', property_description: '',
      restrictions_prohibitions: '', salient_covenants: '',
      statement_lodged_behalf_of: '', type_of_charge: '',
      satisfaction_date: '', nature_of_satisfaction: '',
      remarks: '',
      chargees: [newChargee()],
    },
    validationSchema: buildSchema(chargeNoDup),
    validateOnChange: false,
    validateOnBlur:   true,

    onSubmit: async (values, { setSubmitting }) => {
      if (chargeNoDup) {
        toast.error('Charge number already exists for this company');
        setSubmitting(false);
        return;
      }
      try {
        let recaptchaToken = '';
        try { recaptchaToken = await executeRecaptcha('register_charge_submit'); }
        catch { toast.error('reCAPTCHA failed. Please refresh.'); setSubmitting(false); return; }

        const fd = buildFormData(values, newFiles, user?.user_id || user?.id || 1, recaptchaToken);
        if (isEdit) await updateRegisterCharge(id, fd);
        else        await createRegisterCharge(fd);

        toast.success(isEdit ? 'Charge updated' : 'Charge created');
        navigate('/entity/register-charges-list');
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to save charge');
      } finally {
        setSubmitting(false);
      }
    },
  });

  /* ── Load charge for edit ──
     After the entity list loads, re-populate display_* fields from entity data
     so read-only boxes show correctly without sending them to the backend.      */
  useEffect(() => {
    if (!isEdit || !allEntities.length) return;
    (async () => {
      try {
        const res  = await getRegisterCharge(id);
        const data = res?.data?.data ?? res?.data ?? res;

        const chargees = (data.chargees?.length ? data.chargees : [newChargee()]).map(c => {
          const base = {
            chargee_id:                   c.chargee_id                   || '',
            chargee_type:                 c.chargee_type                 || '',
            chargee_company_entity_id:    c.chargee_company_entity_id    || '',
            chargee_individual_entity_id: c.chargee_individual_entity_id || '',
            chargee_secures_all_monies:   c.chargee_secures_all_monies   || '',
            chargee_currency:             c.chargee_currency             || '',
            chargee_amount_secured:       c.chargee_amount_secured       || '',
            /* init display fields empty — will populate below */
            display_reg_no:              '',
            display_reg_fields:          [],
            display_address:             '',
            display_country_of_incorp:   '',
            display_id_number:           '',
            display_nationality:         '',
            display_ind_address:         '',
          };

          /* Re-populate display fields from entity list so read-only boxes show on edit */
          if (c.chargee_type === '1' && c.chargee_company_entity_id) {
            const entity  = getEntityById(allEntities, c.chargee_company_entity_id);
            if (entity) {
              const display = getCorporateChargeeDisplay(entity);
              base.display_reg_no            = display.display_reg_no;
              base.display_reg_fields        = display.display_reg_fields;
              base.display_address           = display.display_address;
              base.display_country_of_incorp = display.display_country_of_incorp;
            }
          }

          if (c.chargee_type === '2' && c.chargee_individual_entity_id) {
            const entity = getEntityById(allEntities, c.chargee_individual_entity_id);
            if (entity) {
              const display = getIndividualChargeeDisplay(entity);
              base.display_id_number   = display.display_id_number;
              base.display_nationality = display.display_nationality;
              base.display_ind_address = display.display_address;
            }
          }

          return base;
        });

        await formik.setValues({
          company_id:                   data.company_id                   || '',
          charge_number:                data.charge_number                || '',
          registration_date:            toInputDate(data.registration_date),
          lodgement_type:               data.lodgement_type               || '',
          instrument_executed_location: data.instrument_executed_location || '',
          charge_creation_date:         toInputDate(data.charge_creation_date),
          instrument_option:            data.instrument_option            || '',
          instrument_description:       data.instrument_description       || '',
          instrument_date:              toInputDate(data.instrument_date),
          instrument_executed_presence: data.instrument_executed_presence || '',
          property_description:         data.property_description         || '',
          restrictions_prohibitions:    data.restrictions_prohibitions    || '',
          salient_covenants:            data.salient_covenants            || '',
          statement_lodged_behalf_of:   data.statement_lodged_behalf_of   || '',
          type_of_charge:               data.type_of_charge               || '',
          satisfaction_date:            toInputDate(data.satisfaction_date),
          nature_of_satisfaction:       data.nature_of_satisfaction       || '',
          remarks:                      data.remarks                      || '',
          chargees,
        });
        setExistingDocs(data.documents || []);
        setOpenSections({ s1: true, s2: true, s3: true, s4: true, s5: true });
      } catch {
        toast.error('Failed to load charge details');
        navigate('/entity/register-charges-list');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, allEntities.length]); // re-run once entities are loaded

  /* ── Duplicate check ── */
  const runDupCheck = useCallback(async (chargeNumber, companyId) => {
    if (!chargeNumber || !companyId || !CHARGE_NO_PATTERN.test(chargeNumber)) {
      setChargeNoDup(false); chargeNoDupRef.current = false; return;
    }
    setDupChecking(true);
    try {
      const res   = await checkChargeNumber({
        company_id:    companyId,
        charge_number: chargeNumber,
        ...(isEdit && id ? { exclude_id: id } : {}),
      });
      const isDup = res?.data?.result_val === 'YES' || res?.data?.exists === true;
      setChargeNoDup(isDup); chargeNoDupRef.current = isDup;
      if (isDup) formik.setFieldError('charge_number', 'Charge number already exists for this company');
      else       formik.setFieldError('charge_number', undefined);
    } catch { /* ignore */ }
    finally { setDupChecking(false); }
  }, [isEdit, id]); 

  useEffect(() => {
    clearTimeout(chargeNoTimer.current);
    setChargeNoDup(false); chargeNoDupRef.current = false;
    const { charge_number, company_id } = formik.values;
    if (!charge_number || !company_id) return;
    chargeNoTimer.current = setTimeout(() => runDupCheck(charge_number, company_id), 400);
    return () => clearTimeout(chargeNoTimer.current);
  }, [formik.values.charge_number, formik.values.company_id]); 

  const handleChargeNumberBlur = (e) => {
    formik.handleBlur(e);
    runDupCheck(e.target.value, formik.values.company_id);
  };

  /* ── File handling ── */
  const handleFileChange = (e) => {
    const chosen   = Array.from(e.target.files || []);
    const badExt   = chosen.filter(f => !ALLOWED_EXTS.includes(f.name.split('.').pop().toLowerCase()));
    const overSize = chosen.filter(f => f.size > MAX_FILE_MB * 1024 * 1024);
    if (badExt.length)   { toast.error('Invalid format. Allowed: XLSX, XLS, DOCX, PDF, TXT'); if (fileRef.current) fileRef.current.value = ''; return; }
    if (overSize.length) { toast.error(`Max ${MAX_FILE_MB} MB per file`); if (fileRef.current) fileRef.current.value = ''; return; }
    setNewFiles(prev => [...prev, ...chosen]);
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeNewFile = (idx) => setNewFiles(prev => prev.filter((_, i) => i !== idx));

  const confirmDocDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocumentStore(deleteTarget.doc_id);
      setExistingDocs(prev => prev.filter(d => (d.doc_id || d.id) !== deleteTarget.doc_id));
      toast.success('Document deleted successfully');
      setDelTarget(null);
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Derived options ── */
  const countryOpts  = countries;
  const currencyOpts = currencies;
  const memberOpts   = members.map(m => ({ value: m.entity_id, label: m.name }));
  const companyOpts  = companies.map(e => ({ value: String(e.entity_id), label: e.name }));

  /* ── FormInput configs ── */
  const basicConfig = [
    { name: 'company_id',        label: 'Company name',      type: 'select', required: true, col: { md: 6 }, options: companyOpts,          placeholder: 'Choose company' },
    { name: 'registration_date', label: 'Registration date', type: 'date',   required: true, col: { md: 6 } },
    { name: 'lodgement_type',    label: 'Type of lodgement', type: 'select',                 col: { md: 6 }, options: CHARGES_LODGEMENT_OPTS, placeholder: 'Select' },
  ];
  const instrumentConfig = [
    { name: 'charge_creation_date',         label: 'Creation date',                                                          type: 'date',     required: true, col: { md: 6 } },
    { name: 'instrument_option',             label: 'Instrument option',                                                     type: 'select',                   col: { md: 6 }, options: CHARGES_INSTRUMENT_OPTS,      placeholder: 'Select' },
    { name: 'instrument_description',        label: 'Description of instrument',                                             type: 'select',                   col: { md: 6 }, options: CHARGES_INSTRUMENT_DESC_OPTS, placeholder: 'Select' },
    { name: 'instrument_date',               label: 'Date of instrument',                                                    type: 'date',     required: true, col: { md: 6 } },
    { name: 'instrument_executed_presence',  label: 'Executed in the presence of',                                          type: 'textarea', rows: 2,        col: { md: 6 }, placeholder: 'Enter details' },
    { name: 'property_description',          label: 'Short description of property securing the charge (if any)',           type: 'textarea', rows: 2,        col: { md: 6 }, placeholder: 'Enter description' },
    { name: 'restrictions_prohibitions',     label: 'Restrictions / Prohibitions (if any)',                                 type: 'textarea', rows: 2,        col: { md: 6 }, placeholder: 'Enter restrictions' },
    { name: 'salient_covenants',             label: 'Salient covenants of terms and conditions in the debentures (if any)', type: 'textarea', rows: 2,        col: { md: 12 }, placeholder: 'Enter details' },
  ];
  const lodgementConfig = [
    { name: 'statement_lodged_behalf_of', label: 'Statement lodged on behalf of', type: 'select', col: { md: 6 }, options: CHARGES_STATEMENT_LODGED_OPTS, placeholder: 'Select' },
    { name: 'type_of_charge',             label: 'Type of charge',                type: 'select', col: { md: 6 }, options: CHARGE_NAME_OPTS,               placeholder: 'Select' },
    { name: 'satisfaction_date',          label: 'Date of satisfaction',          type: 'date',   col: { md: 6 } },
    { name: 'nature_of_satisfaction',     label: 'Nature of satisfaction',        type: 'select', col: { md: 6 }, options: CHARGES_PARTICULARS_OPTS,        placeholder: 'Select' },
  ];

  const s1Done = !!(formik.values.company_id && formik.values.charge_number && formik.values.registration_date);
  const s2Done = !!(formik.values.charge_creation_date && formik.values.instrument_date);
  const s3Done = formik.values.chargees.some(c => c.chargee_type);
  const s4Done = !!(formik.values.statement_lodged_behalf_of || formik.values.type_of_charge);
  const s5Done = !!(formik.values.remarks || newFiles.length || existingDocs.length);

  const chargeNoHasError = formik.touched.charge_number && !!formik.errors.charge_number;

  if (loading) return (
    <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <Spinner color="primary" />
    </div>
  );

  return (
    <div className="page-content">
      <style>{CSS}</style>
      <Container fluid>
        <BreadCrumb
          title={isEdit ? 'Edit Register Charge' : 'Add Register Charge'}
          pageTitle="Register Charge"
        />
        <Row>
          <Col lg={12}>
            <Card className="p-0 overflow-hidden">
              <FormikProvider value={formik}>
                <CardBody className="p-3">

                  {/* 1 · BASIC */}
                  <AccSection step="1" icon="ri-file-text-line" title="Register charge"
                    sub="Company, charge number, registration date"
                    isOpen={openSections.s1} onToggle={() => toggleSection('s1')} done={s1Done}
                    right={
                      <Link to="/entity/register-charges-list"
                        className="btn btn-warning btn-sm d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                        <i className="ri-list-unordered" /> All charges
                      </Link>
                    }
                  >
                    <Row className="g-2">
                      <FormInput config={[basicConfig[0]]} formik={formik} />
                      <Col md={6}>
                        <Label className="form-label fs-12">
                          Charge number <span className="text-danger">*</span>
                        </Label>
                        <div className="position-relative">
                          <Input bsSize="sm" name="charge_number" placeholder="e.g. 1001"
                            value={formik.values.charge_number}
                            onChange={formik.handleChange}
                            onBlur={handleChargeNumberBlur}
                            invalid={chargeNoHasError || chargeNoDup}
                          />
                          {dupChecking && (
                            <Spinner size="sm" className="position-absolute"
                              style={{ right: 30, top: '50%', transform: 'translateY(-50%)' }} />
                          )}
                        </div>
                        {chargeNoHasError && (
                          <div style={{ fontSize: 11, color: '#f06548', marginTop: 3 }}>
                            {formik.errors.charge_number}
                          </div>
                        )}
                        {!chargeNoHasError && chargeNoDup && (
                          <div className="rca-dup">
                            <i className="ri-error-warning-fill" />
                            Charge number already exists for this company
                          </div>
                        )}
                      </Col>
                      <FormInput config={[basicConfig[1], basicConfig[2]]} formik={formik} />
                    </Row>
                  </AccSection>

                  {/* 2 · INSTRUMENT */}
                  <AccSection step="2" icon="ri-file-list-3-line" title="Instrument and its execution"
                    sub="Instrument details, dates, property and covenants"
                    isOpen={openSections.s2} onToggle={() => toggleSection('s2')} done={s2Done}
                  >
                    <Row className="g-2">
                      <Col md={6}>
                        <Label className="form-label fs-12">Charge instrument executed</Label>
                        <RadioPills
                          name="instrument_executed_location"
                          options={[
                            { value: '1', label: 'In Singapore' },
                            { value: '2', label: 'Outside Singapore' },
                          ]}
                          value={formik.values.instrument_executed_location}
                          onChange={(val) => formik.setFieldValue('instrument_executed_location', val)}
                        />
                      </Col>
                      <FormInput config={instrumentConfig} formik={formik} />
                    </Row>
                  </AccSection>

                  {/* 3 · CHARGEES */}
                  <AccSection step="3" icon="ri-group-line" title="Chargee details"
                    sub="Parties and amounts secured by this charge"
                    isOpen={openSections.s3} onToggle={() => toggleSection('s3')} done={s3Done}
                    right={
                      <Button color="success" size="sm" type="button"
                        className="d-flex align-items-center gap-1" style={{ fontSize: 11 }}
                        onClick={() => formik.setFieldValue('chargees', [...formik.values.chargees, newChargee()])}>
                        <i className="ri-add-circle-line" /> Add chargee
                      </Button>
                    }
                  >
                    <FieldArray name="chargees">
                      {({ remove, replace }) => (
                        <>
                          {formik.values.chargees.map((_, idx) => (
                            <ChargeeCard
                              key={idx} index={idx}
                              remove={(i) => {
                                if (formik.values.chargees.length <= 1) {
                                  toast.warning('At least one chargee is required');
                                  return;
                                }
                                remove(i);
                              }}
                              replace={replace}
                              countryOpts={countryOpts}
                              currencyOpts={currencyOpts}
                              memberOpts={memberOpts}
                              members={members}
                              corpMembers={companies}
                              formik={formik}
                            />
                          ))}
                          <button type="button" className="rca-add-chargee"
                            onClick={() => formik.setFieldValue('chargees', [...formik.values.chargees, newChargee()])}>
                            <i className="ri-add-circle-line" style={{ fontSize: 15 }} />
                            Add another chargee
                          </button>
                        </>
                      )}
                    </FieldArray>
                  </AccSection>

                  {/* 4 · LODGEMENT */}
                  <AccSection step="4" icon="ri-inbox-archive-line" title="Lodgement information"
                    sub="Who lodged, type of charge, satisfaction details"
                    isOpen={openSections.s4} onToggle={() => toggleSection('s4')} done={s4Done}
                  >
                    <Row className="g-2">
                      <FormInput config={lodgementConfig} formik={formik} />
                    </Row>
                  </AccSection>

                  {/* 5 · DOCUMENTS */}
                  <AccSection step="5" icon="ri-attachment-2" title="Documents &amp; remarks"
                    sub="Supporting files and additional notes"
                    isOpen={openSections.s5} onToggle={() => toggleSection('s5')} done={s5Done}
                  >
                    <Row className="g-2">
                      <Col md={12}>
                        <div className="rca-upload" onClick={() => fileRef.current?.click()}>
                          <div className="rca-upload-icon"><i className="ri-upload-cloud-2-line" /></div>
                          <div className="rca-upload-text">
                            <strong>Click to upload documents</strong>
                            <span>XLSX, XLS, DOCX, PDF, TXT — max {MAX_FILE_MB} MB each</span>
                          </div>
                          <Button color="primary" size="sm" outline type="button"
                            className="ms-auto flex-shrink-0" style={{ fontSize: 11, fontWeight: 600 }}
                            onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                            <i className="ri-folder-open-line me-1" /> Browse
                          </Button>
                        </div>
                        <input ref={fileRef} type="file" name="charge_document" multiple
                          style={{ display: 'none' }} accept=".xlsx,.xls,.docx,.pdf,.txt"
                          onChange={handleFileChange} />

                        {newFiles.length > 0 && (
                          <>
                            <div className="rca-files-lbl">New files <span>{newFiles.length}</span></div>
                            {newFiles.map((file, idx) => (
                              <div key={idx} className="rca-file-row">
                                <div className="rca-file-info">
                                  <i className="ri-file-line" />
                                  <span className="rca-file-name">{file.name}</span>
                                  <span className="rca-file-size">({(file.size/1024).toFixed(1)} KB)</span>
                                </div>
                                <div className="rca-file-acts">
                                  <button type="button" className="rca-file-del" onClick={() => removeNewFile(idx)}>
                                    <i className="ri-close-line" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}

                        {existingDocs.length > 0 && (
                          <>
                            <div className="rca-files-lbl">
                              Saved documents <span style={{ background: '#0ab39c' }}>{existingDocs.length}</span>
                            </div>
                            {existingDocs.map((doc, idx) => (
                              <div key={idx} className="rca-file-row">
                                <div className="rca-file-info">
                                  <i className="ri-file-pdf-line" style={{ color: '#f06548' }} />
                                  <span className="rca-file-name">
                                    {doc.document_original_name || doc.document_name || doc.doc_name || 'Unnamed'}
                                  </span>
                                  {doc.document_size && (
                                    <span className="rca-file-size">({(doc.document_size/1024).toFixed(1)} KB)</span>
                                  )}
                                </div>
                                <div className="rca-file-acts">
                                  {(doc.document_url || doc.file_path) && (
                                    <a href={doc.document_url || doc.file_path}
                                      target="_blank" rel="noopener noreferrer"
                                      className="rca-file-view" onClick={e => e.stopPropagation()}>
                                      <i className="ri-eye-line" />
                                    </a>
                                  )}
                                  <button type="button" className="rca-file-del"
                                    onClick={() => setDelTarget(doc)}>
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </Col>

                      <Col md={12}>
                        <Label className="form-label fs-12">Remarks</Label>
                        <Input bsSize="sm" type="textarea" rows={3} name="remarks"
                          value={formik.values.remarks}
                          onChange={formik.handleChange} onBlur={formik.handleBlur}
                          placeholder="Enter any additional remarks (optional)" />
                      </Col>
                    </Row>
                    <ReCaptchaDisclosure className="mt-2" />
                  </AccSection>

                </CardBody>

                <div className="rca-footer">
                  <Button size="sm" type="button"
                    className="d-flex align-items-center gap-1 btn-danger"
                    onClick={() => navigate('/entity/register-charges-list')}
                    disabled={formik.isSubmitting}>
                    <i className="ri-arrow-left-line" /> Back
                  </Button>
                  <Button color="success" size="sm" type="button"
                    className="ms-auto d-flex align-items-center gap-1"
                    onClick={formik.handleSubmit}
                    disabled={formik.isSubmitting || chargeNoDup || dupChecking}>
                    {formik.isSubmitting
                      ? <><Spinner size="sm" /> {isEdit ? 'Updating…' : 'Saving…'}</>
                      : <><i className="ri-save-3-line" /> {isEdit ? 'Update charge' : 'Save charge'}</>
                    }
                  </Button>
                </div>

              </FormikProvider>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Document delete modal */}
      <Modal isOpen={!!deleteTarget} toggle={() => !deleting && setDelTarget(null)}
        centered size="sm" modalClassName="zoomIn">
        <ModalHeader toggle={() => !deleting && setDelTarget(null)} className="border-0 pb-0" />
        <ModalBody className="text-center pt-1 pb-2">
          <div className="rcl-del-ring"><i className="ri-delete-bin-5-line" /></div>
          <h5 className="mb-2 fw-semibold">Delete document?</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            <strong className="text-dark">"{deleteTarget?.doc_name}"</strong>{' '}
            will be permanently removed.<br />This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter className="border-0 justify-content-center gap-2 pt-0">
          <Button color="light" size="sm" onClick={() => setDelTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="danger" size="sm" onClick={confirmDocDelete} disabled={deleting}
            className="d-flex align-items-center gap-1">
            {deleting
              ? <><Spinner size="sm" /> Deleting…</>
              : <><i className="ri-delete-bin-line" /> Delete</>
            }
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RegisterChargeForm;
