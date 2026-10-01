import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Label,
  Row,
  Spinner,
} from 'reactstrap';
import { FieldArray, FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { getLoggedinUser } from '../../helpers/api_helper';
import {
  createCompanyEvent,
  getCompanyEvent,
  getCompanyEventNameList,
  getCompanyList,
  getCompanyProfile,
  getCompany,
  getUserList,
  updateCompanyEvent,
} from '../../helpers/backend_helper';

const CSS = `
  .cef-section { border: 1px solid var(--vz-border-color); border-radius: 8px; margin-bottom: 12px; background: var(--vz-card-bg,#fff); }
  .cef-section-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: var(--vz-light); border-bottom: 1px solid var(--vz-border-color); border-top-left-radius: 8px; border-top-right-radius: 8px; }
  .cef-section-title { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--vz-body-color); }
  .cef-section-sub { margin: 1px 0 0; font-size: 11px; color: var(--vz-secondary-color,#878a99); }
  .cef-section-body { padding: 14px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
  .cef-row-card { border: 1px solid var(--vz-border-color); border-radius: 7px; padding: 10px; margin-bottom: 8px; background: var(--vz-card-bg,#fff); }
  .cef-row-card:last-child { margin-bottom: 0; }
  .cef-add { border: 1px dashed var(--vz-border-color); background: transparent; border-radius: 7px; width: 100%; padding: 8px; color: var(--vz-secondary-color,#878a99); font-weight: 600; font-size: 12px; transition: all .15s; }
  .cef-add:hover:not(:disabled) { border-color: #405189; color: #405189; background: rgba(64,81,137,.03); }
  .cef-add:disabled { opacity: .5; cursor: not-allowed; }
  .cef-footer { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--vz-border-color); background: var(--vz-light); }
  .cef-mini-label { font-size: 11px; font-weight: 600; color: var(--vz-secondary-color,#878a99); margin-bottom: 4px; }
  .cef-role-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
  .cef-role-panel { border: 1px solid var(--vz-border-color); border-radius: 10px; overflow: hidden; background: var(--vz-card-bg,#fff); box-shadow: 0 1px 2px rgba(0,0,0,.03); }
  .cef-role-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; background: linear-gradient(180deg, rgba(64,81,137,.06), rgba(64,81,137,.02)); border-bottom: 1px solid var(--vz-border-color); }
  .cef-role-head.clickable { cursor: pointer; }
  .cef-role-head.clickable:hover { background: linear-gradient(180deg, rgba(64,81,137,.1), rgba(64,81,137,.04)); }
  .cef-role-title { margin: 0; font-size: 12px; font-weight: 700; color: #405189; display: flex; align-items: center; gap: 8px; }
  .cef-role-count { font-size: 10px; font-weight: 700; border-radius: 10px; padding: 2px 8px; background: rgba(64,81,137,.12); color: #405189; }
  .cef-select-all { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: #405189; cursor: pointer; padding: 3px 8px; border-radius: 5px; background: rgba(64,81,137,.06); user-select: none; white-space: nowrap; transition: background .15s; }
  .cef-select-all:hover { background: rgba(64,81,137,.14); }
  .cef-select-all input { accent-color: #405189; width: 13px; height: 13px; cursor: pointer; }
  .cef-select-all input:disabled { cursor: not-allowed; opacity: .5; }
  .cef-official-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px; border-bottom: 1px solid var(--vz-border-color); transition: background .12s; }
  .cef-official-row:hover { background: rgba(64,81,137,.02); }
  .cef-official-row:last-child { border-bottom: 0; }
  .cef-official-row.user-row { background: rgba(64,81,137,.015); }
  .cef-official-row .d-flex { flex: 1; min-width: 0; }
  .cef-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; background: #405189; flex-shrink: 0; text-transform: uppercase; }
  .cef-avatar.user { background: #6c757d; }
  .cef-official-name { font-size: 12.5px; font-weight: 600; color: var(--vz-body-color); word-break: break-word; line-height: 1.3; }
  .cef-official-meta { font-size: 11px; color: var(--vz-secondary-color,#878a99); margin-top: 1px; word-break: break-all; }
  .cef-empty-box { border: 1px dashed var(--vz-border-color); border-radius: 8px; padding: 18px; text-align: center; color: var(--vz-secondary-color,#878a99); font-size: 12px; background: var(--vz-light); }

  .cef-channel-selectall-row { display: flex; align-items: center; gap: 14px; padding: 6px 12px; border-bottom: 1px solid var(--vz-border-color); background: rgba(64,81,137,.03); flex-wrap: wrap; }
  .cef-channel-selectall-label { font-size: 10px; font-weight: 700; color: var(--vz-secondary-color,#878a99); text-transform: uppercase; letter-spacing: .03em; }
  .cef-channel-selectall { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: #405189; cursor: pointer; user-select: none; }
  .cef-channel-selectall input { accent-color: #405189; width: 13px; height: 13px; cursor: pointer; }
  .cef-channel-selectall input:disabled { cursor: not-allowed; opacity: .4; }
  .cef-channel-selectall:has(input:disabled) { opacity: .4; }

  .cef-channel-checks { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .cef-channel-check { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; color: var(--vz-secondary-color,#878a99); cursor: pointer; user-select: none; }
  .cef-channel-check input { accent-color: #405189; width: 13px; height: 13px; cursor: pointer; }
  .cef-channel-check input:disabled { cursor: not-allowed; opacity: .4; }
  .cef-channel-check:has(input:checked) { color: #405189; }

  .ms-wrap    { position:relative; }
  .ms-trigger { display:flex; align-items:center; justify-content:space-between; padding:.25rem .5rem;
                border:1px solid var(--vz-input-border-color,#ced4da); border-radius:.25rem;
                background:var(--vz-input-bg); cursor:pointer; font-size:.765625rem;
                min-height:calc(1.5em + .5rem + 2px); line-height:1.5; user-select:none; gap:6px; }
  .ms-trigger:hover { border-color:#405189; }
  .ms-trigger.open  { border-color:#405189; box-shadow:0 0 0 .15rem rgba(64,81,137,.15); }
  .ms-chips   { display:flex; flex-wrap:wrap; align-items:center; gap:3px; flex:1; min-height:16px; }
  .ms-chip    { display:inline-flex; align-items:center; gap:3px; padding:0 6px; border-radius:9px;
                line-height:16px; font-size:10.5px; font-weight:600; background:rgba(64,81,137,.1); color:#405189;
                border:1px solid rgba(64,81,137,.2); white-space:nowrap; }
  .ms-chip-x  { cursor:pointer; font-size:11px; line-height:1; margin-left:2px; opacity:.7; }
  .ms-chip-x:hover { opacity:1; }
  .ms-placeholder { color:#aaa; font-size:.765625rem; }
  .ms-counter { font-size:10.5px; color:#405189; font-weight:700; background:rgba(64,81,137,.1);
                border-radius:9px; padding:0 6px; line-height:16px; white-space:nowrap; flex-shrink:0; }
  .ms-arrow   { font-size:13px; color:#878a99; flex-shrink:0; }

  .ms-panel   { position:absolute; top:calc(100% + 3px); left:0; right:0; z-index:9999;
                 background:var(--vz-card-bg,#fff); border:1px solid var(--vz-border-color);
                 border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,.12);
                 display:flex; flex-direction:column; overflow:hidden; max-height:300px; }
  .ms-search-row { padding:8px; border-bottom:1px solid var(--vz-border-color); flex-shrink:0; }
  .ms-search  { width:100%; padding:5px 8px; font-size:12px; border:1px solid var(--vz-border-color);
                 border-radius:4px; background:var(--vz-input-bg); outline:none; }
  .ms-search:focus { border-color:#405189; }
  .ms-actions { display:flex; gap:6px; padding:4px 8px; border-bottom:1px solid var(--vz-border-color); flex-shrink:0; }
  .ms-act-btn { font-size:11px; color:#405189; cursor:pointer; padding:2px 6px; border-radius:3px; transition:background .1s; }
  .ms-act-btn:hover { background:rgba(64,81,137,.08); }
  .ms-list    { overflow-y:auto; flex:1; }
  .ms-item    { display:flex; align-items:center; gap:8px; padding:6px 12px; font-size:12px;
                 cursor:pointer; transition:background .1s; }
  .ms-item:hover    { background:rgba(64,81,137,.04); }
  .ms-item.selected { background:rgba(64,81,137,.08); }
  .ms-item input { accent-color:#405189; width:13px; height:13px; flex-shrink:0; }
  .ms-empty { padding:12px; font-size:12px; color:#878a99; text-align:center; }

  .cef-status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
  .cef-status-badge.pending { background: #fff3cd; color: #856404; }
  .cef-status-badge.completed { background: #d1e7dd; color: #0f5132; }
  .cef-status-badge.dispense { background: #f8d7da; color: #842029; }
  .cef-status-badge.exempt { background: #cfe2ff; color: #084298; }
`;

const CHANNELS = ['TO', 'CC', 'BCC'];
const YES_NO_OPTIONS = ['Yes', 'No'];
const ACCOUNT_STATUS_OPTIONS = ['Done/Completed', 'Pending Client', 'Pending Accounts Team'];
const XBRL_STATUS_OPTIONS = ['Yes', 'No', 'Pending Client', 'Pending Auditor', 'Pending Accounts Team'];
const FINANCIAL_STATEMENT_STATUS_OPTIONS = [
  { value: 'done', label: 'Done' },
  { value: 'notdone', label: 'Not Done' },
  { value: 'Pending Client', label: 'Pending Client' },
  { value: 'Pending Audit Team', label: 'Pending Audit Team' },
];
const AUDITED_FS_STATUS_OPTIONS = ['Audited', 'Unaudited'];
const AGM_DOCUMENT_OPTIONS = ['Pending Client', 'Prepared', 'Not Prepared', 'Signed', 'Not Signed'];

// Event types that show AR Status section
const AGM_AR_EVENT_TYPES = ['agm', 'ar', 'egm'];

// Event name mapping for AR Status section label
const getEventStatusLabel = (eventSlug) => {
  const labels = {
    agm: 'AGM',
    ar: 'AR',
    egm: 'EGM',
  };
  return labels[eventSlug] || 'Event';
};

const emptyCustomParty = () => ({ party_type: 'Other', name: '', email: '', channel: 'TO', remarks: '' });

const getRecurringLabel = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const number = Number(value);
  if (!number) return 'No';
  return String(value);
};

const ADDRESS_TYPE_LABELS = {
  0: 'Registered Office Address',
  1: 'Registered Office Address',
  2: 'Mailing Address',
  3: 'Business Address',
  4: 'Foreign Address',
  5: 'Other Address',
  6: 'Register of Member Address',
  REGISTERED: 'Registered Office Address',
  REGISTERED_OFFICE: 'Registered Office Address',
  BUSINESS: 'Business Address',
  MAILING: 'Mailing Address',
  RESIDENTIAL: 'Residential Address',
};

const getAddressTypeLabel = value => ADDRESS_TYPE_LABELS[String(value || '').toUpperCase()] || value || 'Address';

const formatCompanyAddress = (address = {}) => [
  address.block_no,
  address.street_name,
  address.level_no,
  address.unit_no,
  address.building_name,
  address.country,
  address.postal_code,
].filter(Boolean).join(' ');

const getEventDisplayName = (eventData) => eventData?.event_name || eventData?.name || eventData?.event_slug || 'Event';

const initialValues = {
  entity_id: '',
  event_id: '',
  event_slug: '',
  period_start: '',
  period_end: '',
  fye_date: '',
  recurring_period: '',
  recurring_duration: '',
  due_date: '',
  held_date: '',
  filing_date: '',
  sent_date: '',
  received_date: '',
  source_basis: 'Manual Event',
  status: 'PENDING',
  held_time: '',
  held_time_end: '',
  venue_type: '',
  venue: '',
  meeting_chairman: '',
  type_shareholder: '',
  meeting_corporate_shareholder_rep: '',
  meeting_agenda: '',
  sender_email: '',
  reply_to_email: '',
  group_to_recipient: 'SEPARATE',
  email_config_id: '',
  prepared_date: '',
  dormant_status: '',
  solvent_status: '',
  accounts_status: '',
  xbrl: '',
  financial_statements_status: '',
  audited_fs_status: '',
  fs_signed_by: [],
  financial_statement_date: '',
  agm_documents: '',
  extended_due_date: '',
  remarks: '',
  reminders: [],
  uploaded_files: [],
  attendees: [],
  receiving_parties: [],
  custom_receiving_parties: [],
};

const schema = Yup.object({
  entity_id: Yup.string().required('Company is required'),
  event_id: Yup.string().required('Event type is required'),
  due_date: Yup.string().required('Due date is required'),
});

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const unwrapOne = (res) => res?.data?.data ?? res?.data ?? res ?? {};
const toDateInput = (value) => value ? String(value).slice(0, 10) : '';
const hasToRecipient = (rows = []) => rows.some(row => String(row?.channel || '').toUpperCase() === 'TO');
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
const isAfterDate = (first, second) => Boolean(first && second && new Date(first) > new Date(second));

const getEventFormValidationError = (values, { isEdit = false, receivingParties = [], selectedChairman = null } = {}) => {
  if (!values.entity_id) return 'Company is required';
  if (!values.event_id) return 'Event type is required';
  if (!values.due_date) return 'Due date is required';
  if (!values.sender_email) return 'Default sending email is required';
  if (!isValidEmail(values.sender_email)) return 'Default sending email is invalid';
  if (!values.reply_to_email) return 'Reply email is required';
  if (!isValidEmail(values.reply_to_email)) return 'Reply email is invalid';
  if (!values.group_to_recipient) return 'To recipient option is required';
  if (!receivingParties.length) return 'Select at least one recipient';
  if (!hasToRecipient(receivingParties)) return 'Select at least one To recipient';

  const invalidCustomParty = (values.custom_receiving_parties || [])
    .filter(row => row?.name || row?.email || row?.party_type)
    .find(row => !row?.email || !isValidEmail(row.email));
  if (invalidCustomParty) return 'Enter a valid email for external recipient';

  const hasMeetingDetails = Boolean(
    values.held_date ||
    values.held_time ||
    values.held_time_end ||
    values.venue ||
    values.meeting_agenda
  );
  if (hasMeetingDetails && !values.venue) return 'Venue is required for meeting details';
  // if (hasMeetingDetails && !values.meeting_chairman) return 'Chairman is required for meeting details';
  if (selectedChairman?.isCorporate && !values.meeting_corporate_shareholder_rep) {
    return 'Corporate shareholder representative is required';
  }
  if (values.held_time && values.held_time_end && values.held_time_end < values.held_time) {
    return 'End time must be after start time';
  }

  if (isEdit && isAfterDate(values.period_start, values.period_end)) {
    return 'Period To must be after Period From';
  }
  if (isEdit && isAfterDate(values.due_date, values.extended_due_date)) {
    return 'Extended due date must be after due date';
  }

  return '';
};

const buildAttendeesPayload = (attendees = []) => {
  const officials = attendees
    .filter(a => !a.user_id && a.attendee_type !== 'USER')
    .map(a => ({
      official_id: a.official_id || a.id || '',
      official_date_id: a.official_date_id || '',
      official_entity_id: a.official_entity_id || '',
      official_entity_name: a.official_entity_name || a.name || '',
      role: a.role || a.attendee_type || '',
      email: a.email || '',
      is_present: a.is_present || false,
      status: 'active',
      type: 'official',
    }));

  const users = attendees
    .filter(a => a.user_id || a.attendee_type === 'USER')
    .map(a => ({
      user_id: a.user_id || a.id || '',
      name: a.name || a.display_name || '',
      email: a.email || '',
      is_present: a.is_present || false,
      status: 'active',
      type: 'user',
    }));

  return { officials, users };
};

const buildReceivingPartiesPayload = (parties = []) => {
  const officials = parties
    .filter(p => !p.user_id && p.party_type !== 'USER')
    .map(p => ({
      official_id: p.official_id || p.id || '',
      official_date_id: p.official_date_id || '',
      official_entity_id: p.official_entity_id || '',
      official_entity_name: p.official_entity_name || p.name || '',
      role: p.role || p.party_type || '',
      email: p.email || '',
      channel: p.channel || 'TO',
      remarks: p.remarks || '',
      status: 'active',
      type: 'official',
    }));

  const users = parties
    .filter(p => p.user_id || p.party_type === 'USER')
    .map(p => ({
      user_id: p.user_id || p.id || '',
      name: p.name || p.display_name || '',
      email: p.email || '',
      channel: p.channel || 'TO',
      remarks: p.remarks || '',
      status: 'active',
      type: 'user',
    }));

  const custom = parties
    .filter(p => !p.official_id && !p.user_id && p.party_type !== 'USER')
    .map(p => ({
      name: p.name || '',
      email: p.email || '',
      channel: p.channel || 'TO',
      party_type: p.party_type || 'Other',
      remarks: p.remarks || '',
      status: 'active',
      type: 'custom',
    }));

  return { officials, users, custom };
};

const partyKey = (roleName, official = {}) =>
  [
    official.official_id || '',
    official.official_date_id || '',
    String(roleName || '').toLowerCase(),
  ].join('-');

const userPartyKey = (user = {}) => `USER-${user.user_id || user.id || ''}`;
const storedUserPartyKey = (party = {}) => `USER-${party.user_id || party.id || ''}`;
const userAttendeeKey = userPartyKey;
const storedUserAttendeeKey = storedUserPartyKey;

const officialToAttendee = (roleName, official = {}) => ({
  attendee_type: roleName || 'Other',
  name: official.official_entity_name || official.name || '',
  email: official.email || '',
  role: roleName || official.role_name || '',
  entity_id: official.official_entity_id || '',
  official_entity_id: official.official_entity_id || '',
  official_entity_name: official.official_entity_name || official.name || '',
  official_id: official.official_id || '',
  official_date_id: official.official_date_id || '',
  is_present: false,
});

const officialToReceivingParty = (roleName, official = {}, channel) => ({
  party_type: roleName || 'Other',
  name: official.official_entity_name || official.name || '',
  email: official.email || '',
  role: roleName || official.role_name || '',
  entity_id: official.official_entity_id || '',
  official_entity_id: official.official_entity_id || '',
  official_entity_name: official.official_entity_name || official.name || '',
  official_id: official.official_id || '',
  official_date_id: official.official_date_id || '',
  channel,
  remarks: '',
});

const userToReceivingParty = (user = {}, channel = 'TO') => ({
  party_type: 'USER',
  name: getUserDisplayName(user),
  email: user.email || '',
  user_id: user.user_id || user.id || '',
  channel,
  remarks: '',
});

const userToAttendee = (user = {}) => ({
  attendee_type: 'USER',
  name: getUserDisplayName(user),
  email: user.email || '',
  role: 'User',
  user_id: user.user_id || user.id || '',
  is_present: false,
});

const getUserDisplayName = (user = {}) => {
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.user_name || user.email || `User #${user.user_id || user.id || ''}`;
};

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const appendUniqueByKey = (existing = [], next = [], keyFn) => {
  const cleanExisting = existing.filter(row => row.name || row.email || row.role || row.official_id);
  const keys = new Set(cleanExisting.map(keyFn));
  const merged = [...cleanExisting];
  next.forEach((row) => {
    const key = keyFn(row);
    if (!keys.has(key)) { keys.add(key); merged.push(row); }
  });
  return merged;
};

const mapEmailConfigs = (rows = []) => rows
  .map(row => ({
    email_config_id: row.email_config_id || row.id || '',
    label: row.from_name
      ? `${row.from_name} <${row.sending_email || row.smtp_email || ''}>`
      : (row.sending_email || row.smtp_email || ''),
    from_name: row.from_name || '',
    sender_email: row.sending_email || row.smtp_email || '',
    reply_to_email: row.reply_email || '',
    group_to_recipient: Number(row.group_to_recipient) === 1 ? 'TOGETHER' : 'SEPARATE',
    is_default: Boolean(row.is_default || row.sending_default_email),
    aws_ses: Boolean(row.aws_ses),
  }))
  .filter(row => row.sender_email || row.reply_to_email);

const getDefaultEmailConfig = (configs = []) => configs.find(item => item.is_default) || configs[0] || null;

const getOfficialRoleEntries = (officialRoles = {}) => {
  if (!officialRoles || typeof officialRoles !== 'object' || Array.isArray(officialRoles)) return [];
  return Object.entries(officialRoles)
    .map(([roleName, records]) => ({ roleName, records: Array.isArray(records) ? records : [] }))
    .filter(group => group.roleName && group.records.length);
};

const splitPartyPayload = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      officials: Array.isArray(value.officials) ? value.officials : [],
      users: Array.isArray(value.users) ? value.users : [],
      custom: Array.isArray(value.custom) ? value.custom : [],
    };
  }

  const rows = Array.isArray(value) ? value : [];
  return {
    officials: rows.filter(row => row?.official_id && !(row?.user_id || row?.party_type === 'USER' || row?.attendee_type === 'USER')),
    users: rows.filter(row => row?.user_id || row?.party_type === 'USER' || row?.attendee_type === 'USER'),
    custom: rows.filter(row => !row?.official_id && !row?.user_id && row?.party_type !== 'USER' && row?.attendee_type !== 'USER'),
  };
};

const toArrayValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(item => item?.official_id ?? item?.value ?? item)
      .filter(item => item !== null && item !== undefined && item !== '')
      .map(String);
  }
  if (value === null || value === undefined || value === '') return [];
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => item?.official_id ?? item?.value ?? item)
          .filter(item => item !== null && item !== undefined && item !== '')
          .map(String);
      }
    } catch {
      return [];
    }
  }
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

const selectedSignerRecords = (selectedIds = [], options = []) => {
  const optionById = new Map(options.map(option => [String(option.id), option]));
  return (selectedIds || [])
    .map(id => {
      const option = optionById.get(String(id));
      if (!option) return null;
      return {
        official_id: Number(option.id) || option.id,
        name: option.label,
        role: option.roleName || 'Director',
      };
    })
    .filter(Boolean);
};

const Field = ({ formik, name, label, type = 'text', md = 4, required = false, disabled = false, children, ...props }) => {
  const touched = formik.touched[name];
  const error = formik.errors[name];
  const invalid = Boolean(touched && error);
  const commonProps = {
    bsSize: 'sm',
    name,
    value: formik.values[name] ?? '',
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    invalid,
    disabled,
    ...props,
  };

  return (
    <Col md={md}>
      <Label className="form-label fs-12">{label} {required && <span className="text-danger">*</span>}</Label>
      {type === 'date' ? (
        <DatePickerInput {...commonProps} />
      ) : (
        <Input type={type} {...commonProps}>
          {children}
        </Input>
      )}
      {invalid && <div className="text-danger" style={{ fontSize: 11, marginTop: 3 }}>{error}</div>}
    </Col>
  );
};

const Section = ({ title, sub, children, right }) => (
  <div className="cef-section">
    <div className="cef-section-head">
      <div>
        <h6 className="cef-section-title">{title}</h6>
        {sub && <p className="cef-section-sub">{sub}</p>}
      </div>
      {right}
    </div>
    <div className="cef-section-body">{children}</div>
  </div>
);

// ── Per-channel (TO / CC / BCC) select-all row ──
// FIX: onSelectAll now delegates to a bulk group function that reads
// formik state exactly once and calls setFieldValue exactly once —
// no more per-record looped setFieldValue calls (which were clobbering
// each other due to stale closures across the loop iterations).
const ChannelSelectAllRow = ({ records, getChannelFor, onSelectAll, disabled }) => {
  const emailRecords = records.filter(r => r.email);

  return (
    <div className="cef-channel-selectall-row">
      <span className="cef-channel-selectall-label">Select all:</span>
      {CHANNELS.map(ch => {
        const allChecked = emailRecords.length > 0 && emailRecords.every(r => getChannelFor(r) === ch);
        const someChecked = !allChecked && emailRecords.some(r => getChannelFor(r) === ch);
        const isDisabled = disabled || emailRecords.length === 0;

        return (
          <label key={ch} className="cef-channel-selectall">
            <input
              type="checkbox"
              checked={allChecked}
              disabled={isDisabled}
              ref={el => { if (el) el.indeterminate = someChecked; }}
              onChange={(e) => onSelectAll(ch, e.target.checked)}
            />
            <span>{ch}</span>
          </label>
        );
      })}
    </div>
  );
};

// ── Per-row TO / CC / BCC checkboxes ──
const ChannelCheckboxes = ({ value, onChange, disabled }) => (
  <div className="cef-channel-checks">
    {CHANNELS.map(ch => (
      <label key={ch} className="cef-channel-check" title={disabled ? 'No email' : `Set as ${ch}`}>
        <input
          type="checkbox"
          checked={value === ch}
          disabled={disabled}
          onChange={() => onChange(value === ch ? '' : ch)}
        />
        <span>{ch}</span>
      </label>
    ))}
  </div>
);

// ── Select All Checkbox ──
const SelectAllCheckbox = ({ checked, indeterminate, onChange, disabled }) => (
  <label className="cef-select-all" style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      ref={el => { if (el) el.indeterminate = indeterminate; }}
      onChange={e => onChange(e.target.checked)}
    />
    <span>Select All</span>
  </label>
);

const MultiSelect = ({ items, selected, onChange, placeholder = 'Select…', loading = false, hasError = false }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const filtered = q ? items.filter(c => c.label.toLowerCase().includes(q.toLowerCase())) : items;
  const toggle = (id, e) => { e.stopPropagation(); onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]); };
  const removeOne = (id, e) => { e.stopPropagation(); onChange(selected.filter(x => x !== id)); };
  const selObjs = selected.map(id => items.find(c => String(c.id) === String(id))).filter(Boolean);
  const visible = selObjs.slice(0, 3);
  const hidden = selObjs.length - 3;

  return (
    <div className="ms-wrap" ref={wrapRef}>
      <div
        className={`ms-trigger ${open ? 'open' : ''}`}
        style={hasError ? { borderColor: 'var(--vz-form-invalid-color)' } : {}}
        onClick={() => setOpen(v => !v)}
      >
        <div className="ms-chips">
          {selObjs.length === 0
            ? <span className="ms-placeholder">{placeholder}</span>
            : <>
                {visible.map(c => (
                  <span key={c.id} className="ms-chip">
                    {c.label}
                    <span className="ms-chip-x" onMouseDown={e => removeOne(c.id, e)}>×</span>
                  </span>
                ))}
                {hidden > 0 && <span className="ms-chip" style={{ background: 'rgba(64,81,137,.05)', color: '#878a99' }}>+{hidden} more</span>}
              </>
          }
        </div>
        {selected.length > 0 && <span className="ms-counter">{selected.length}</span>}
        <i className={`ms-arrow ri-arrow-${open ? 'up' : 'down'}-s-line`} />
      </div>
      {open && (
        <div className="ms-panel">
          <div className="ms-search-row">
            <input className="ms-search" placeholder="Search…" autoFocus value={q}
              onChange={e => setQ(e.target.value)} onClick={e => e.stopPropagation()} />
          </div>
          <div className="ms-actions">
            <span className="ms-act-btn" onMouseDown={e => { e.stopPropagation(); onChange(items.map(c => c.id)); }}>Select All</span>
            <span className="ms-act-btn" onMouseDown={e => { e.stopPropagation(); onChange([]); }}>Clear All</span>
          </div>
          <div className="ms-list">
            {loading
              ? <div className="ms-empty"><Spinner size="sm" color="primary" /></div>
              : filtered.length === 0
                ? <div className="ms-empty">No results</div>
                : filtered.map(item => {
                    const isSel = selected.map(String).includes(String(item.id));
                    return (
                      <div key={item.id} className={`ms-item ${isSel ? 'selected' : ''}`} onMouseDown={e => toggle(item.id, e)}>
                        <input type="checkbox" readOnly checked={isSel} />
                        <span>
                          {item.label}
                          {item.roleName && <span className="cef-official-meta d-block">{item.roleName}</span>}
                        </span>
                      </div>
                    );
                  })
            }
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Attendee role panel ── */
// FIX: toggleAll now calls onToggleAll (bulk) instead of looping toggleAttendee per record.
const AttendeeRolePanel = ({ group, isAttendeeChecked, toggleAttendee, onToggleAll, isEventReadOnly }) => {
  const allChecked = group.records.length > 0 && group.records.every(record => isAttendeeChecked(group.roleName, record));
  const someChecked = !allChecked && group.records.some(record => isAttendeeChecked(group.roleName, record));

  return (
    <div className="cef-role-panel">
      <div className="cef-role-head">
        <h6 className="cef-role-title">
          {group.roleName}
          <span className="cef-role-count">{group.records.length}</span>
        </h6>
        <SelectAllCheckbox checked={allChecked} indeterminate={someChecked} onChange={onToggleAll} disabled={isEventReadOnly} />
      </div>
      {group.records.map((record, recordIndex) => (
        <label
          className="cef-official-row mb-0"
          key={`${group.roleName}-${record.official_id || record.official_date_id || record.official_entity_id || recordIndex}`}
        >
          <div className="d-flex align-items-center gap-2">
            <Input
              type="checkbox"
              className="form-check-input m-0"
              checked={isAttendeeChecked(group.roleName, record)}
              onChange={e => toggleAttendee(group.roleName, record, e.target.checked)}
              disabled={isEventReadOnly}
            />
            <span className="cef-avatar">{getInitials(record.official_entity_name || record.name)}</span>
            <div>
              <div className="cef-official-name">{record.official_entity_name || '-'}</div>
              <div className="cef-official-meta">({record.email || 'No email'})</div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

/* ── Attendee user panel ── */
// FIX: toggleAll now calls onToggleAll (bulk) instead of looping toggleUserAttendee per user.
const AttendeeUserPanel = ({ userOptions, isUserAttendeeChecked, toggleUserAttendee, onToggleAll, isEventReadOnly }) => {
  const allChecked = userOptions.length > 0 && userOptions.every(user => isUserAttendeeChecked(user));
  const someChecked = !allChecked && userOptions.some(user => isUserAttendeeChecked(user));

  return (
    <div className="cef-role-panel">
      <div className="cef-role-head">
        <h6 className="cef-role-title">
          System Users
          <span className="cef-role-count">{userOptions.length}</span>
        </h6>
        <SelectAllCheckbox checked={allChecked} indeterminate={someChecked} onChange={onToggleAll} disabled={isEventReadOnly} />
      </div>
      {userOptions.map(user => (
        <label className="cef-official-row user-row mb-0" key={`user-attendee-${user.user_id || user.id}-${user.email || ''}`}>
          <div className="d-flex align-items-center gap-2">
            <Input
              type="checkbox"
              className="form-check-input m-0"
              checked={isUserAttendeeChecked(user)}
              onChange={e => toggleUserAttendee(user, e.target.checked)}
              disabled={isEventReadOnly}
            />
            <span className="cef-avatar user">{getInitials(user.display_name)}</span>
            <div>
              <div className="cef-official-name">{user.display_name}</div>
              <div className="cef-official-meta">({user.email || 'No email'})</div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
};

/* ── Receiving-party role panel ── */
// FIX: onSelectAll delegates to bulk setChannelForGroup instead of ChannelSelectAllRow
// looping raw setChannel calls per record.
const ReceivingPartyRolePanel = ({ group, getChannel, setChannel, onSelectAll, isEventReadOnly }) => (
  <div className="cef-role-panel">
    <div className="cef-role-head">
      <h6 className="cef-role-title">
        {group.roleName}
        <span className="cef-role-count">{group.records.length}</span>
      </h6>
    </div>
    <ChannelSelectAllRow
      records={group.records}
      getChannelFor={record => getChannel(group.roleName, record)}
      onSelectAll={onSelectAll}
      disabled={isEventReadOnly}
    />
    {group.records.map((record, recordIndex) => (
      <div
        className="cef-official-row"
        key={`rp-${group.roleName}-${record.official_id || record.official_date_id || record.official_entity_id || recordIndex}`}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="cef-avatar">{getInitials(record.official_entity_name || record.name)}</span>
          <div>
            <div className="cef-official-name">{record.official_entity_name || '-'}</div>
            <div className="cef-official-meta">({record.email || 'No email'})</div>
          </div>
        </div>
        <ChannelCheckboxes
          value={getChannel(group.roleName, record)}
          disabled={!record.email || isEventReadOnly}
          onChange={ch => setChannel(group.roleName, record, ch)}
        />
      </div>
    ))}
  </div>
);

/* ── Receiving-party user panel ── */
// FIX: onSelectAll delegates to bulk setUserChannelForGroup.
const ReceivingPartyUserPanel = ({ userOptions, getUserChannel, setUserChannel, onSelectAll, isEventReadOnly }) => (
  <div className="cef-role-panel">
    <div className="cef-role-head">
      <h6 className="cef-role-title">
        System Users
        <span className="cef-role-count">{userOptions.length}</span>
      </h6>
    </div>
    <ChannelSelectAllRow
      records={userOptions}
      getChannelFor={getUserChannel}
      onSelectAll={onSelectAll}
      disabled={isEventReadOnly}
    />
    {userOptions.map(user => (
      <div className="cef-official-row user-row" key={`user-recipient-${user.user_id || user.id}-${user.email || ''}`}>
        <div className="d-flex align-items-center gap-2">
          <span className="cef-avatar user">{getInitials(user.display_name)}</span>
          <div>
            <div className="cef-official-name">{user.display_name}</div>
            <div className="cef-official-meta">({user.email || 'No email'})</div>
          </div>
        </div>
        <ChannelCheckboxes
          value={getUserChannel(user)}
          disabled={!user.email || isEventReadOnly}
          onChange={ch => setUserChannel(user, ch)}
        />
      </div>
    ))}
  </div>
);

const EventForm = () => {
  useCollapseSidebar();
  const navigate = useNavigate();
  const { id, companyId } = useParams();
  const isEdit = Boolean(id);
  const loggedUser = getLoggedinUser();
  const userId = loggedUser?.user_id ?? loggedUser?.id ?? 1;

  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [eventNames, setEventNames] = useState([]);
  const [emailConfigs, setEmailConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyDetail, setCompanyDetail] = useState(null);
  const [rolesLoading, setRolesLoading] = useState(false);

  document.title = `${isEdit ? 'Edit' : 'Add'} Event | ASR CSS`;

  const companyOptions = useMemo(() => companies
    .map(item => ({ value: String(item.entity_id), label: item.name || `Company #${item.entity_id}` }))
    .sort((a, b) => a.label.localeCompare(b.label)), [companies]);

  const eventOptions = useMemo(() => eventNames
    .map(item => ({
      value: String(item.e_id),
      label: item.event_name || item.event_slug || `Event #${item.e_id}`,
      slug: item.event_slug || item.slug || '',
      is_recurring: Boolean(item.is_recurring),
      is_system_event: Boolean(item.is_system_event),
      recurring_period: item.recurring_period,
      recurring_duration: item.recurring_duration,
    }))
    .filter(item => isEdit || !item.is_system_event)
    .sort((a, b) => a.label.localeCompare(b.label)), [eventNames, isEdit]);

  const userOptions = useMemo(() => users
    .map(user => ({ ...user, display_name: getUserDisplayName(user) }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name)), [users]);

  const formik = useFormik({
    initialValues: { ...initialValues, entity_id: companyId || '' },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, helpers) => {
      try {
        const selectedEvent = eventOptions.find(opt => String(opt.value) === String(values.event_id));
        const eventSlug = selectedEvent?.slug || '';

        const attendeesPayload = buildAttendeesPayload(values.attendees);
        const receivingPartiesPayload = buildReceivingPartiesPayload(values.receiving_parties);

        const customParties = (values.custom_receiving_parties || [])
          .filter(p => p.name || p.email)
          .map(p => ({
            name: p.name || '',
            email: p.email || '',
            channel: p.channel || 'TO',
            party_type: p.party_type || 'Other',
            remarks: p.remarks || '',
            status: 'active',
            type: 'custom',
          }));

        const allReceivingParties = {
          officials: receivingPartiesPayload.officials,
          users: receivingPartiesPayload.users,
          custom: [...receivingPartiesPayload.custom, ...customParties],
        };

        const fsSignedBy = selectedSignerRecords(values.fs_signed_by, financialSignerOptions);

        const validationError = getEventFormValidationError(values, {
          isEdit,
          receivingParties: [...allReceivingParties.officials, ...allReceivingParties.users, ...allReceivingParties.custom],
          selectedChairman,
        });

        if (validationError) {
          toast.error(validationError);
          helpers.setSubmitting(false);
          return;
        }

        const payload = {
          entity_id: values.entity_id,
          event_id: values.event_id,
          event_slug: eventSlug,
          period_start: values.period_start || '',
          period_end: values.period_end || '',
          fye_date: values.fye_date || '',
          recurring_period: selectedEvent?.is_recurring ? (selectedEvent?.recurring_period ?? values.recurring_period ?? '') : '',
          recurring_duration: selectedEvent?.is_recurring ? (selectedEvent?.recurring_duration ?? values.recurring_duration ?? '') : '',
          due_date: values.due_date || '',
          held_date: values.held_date || '',
          filing_date: values.filing_date || '',
          sent_date: values.sent_date || '',
          received_date: values.received_date || '',
          source_basis: values.source_basis || 'Manual Event',
          status: values.status || 'PENDING',
          held_time: values.held_time || '',
          held_time_end: values.held_time_end || '',
          venue_type: values.venue_type || '',
          venue: values.venue || '',
          meeting_chairman: values.meeting_chairman || '',
          type_shareholder: values.type_shareholder || '',
          meeting_corporate_shareholder_rep: values.meeting_corporate_shareholder_rep || '',
          meeting_agenda: values.meeting_agenda || '',
          sender_email: values.sender_email || '',
          reply_to_email: values.reply_to_email || '',
          group_to_recipient: values.group_to_recipient || 'SEPARATE',
          email_config_id: values.email_config_id || '',
          agm_status_details: {
            prepared_date: values.prepared_date || '',
            dormant_status: values.dormant_status || '',
            solvent_status: values.solvent_status || '',
            accounts_status: values.accounts_status || '',
            xbrl: values.xbrl || '',
            financial_statements_status: values.financial_statements_status || '',
            audited_fs_status: values.audited_fs_status || '',
            fs_signed_by: fsSignedBy.length ? fsSignedBy : null,
            financial_statement_date: values.financial_statement_date || '',
            agm_documents: values.agm_documents || '',
          },
          extended_due_date: values.extended_due_date || '',
          remarks: values.remarks || '',
          attendees: attendeesPayload,
          receiving_parties: allReceivingParties,
          created_by: userId,
          updated_by: userId,
          source_from: 'MANUAL',
        };

        if (isEdit) await updateCompanyEvent(id, payload);
        else await createCompanyEvent(payload);

        toast.success(isEdit ? 'Event updated successfully' : 'Event created successfully');
        navigate(values.entity_id ? `/compliance/events/company/${values.entity_id}` : '/compliance/events/list');
      } catch (err) {
        toast.error(err?.message || `Failed to ${isEdit ? 'update' : 'create'} event`);
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  const selectedEmailConfig = useMemo(() => {
    if (!formik.values.sender_email) return null;
    return emailConfigs.find(config => config.sender_email === formik.values.sender_email) || null;
  }, [emailConfigs, formik.values.sender_email]);

  const applyEmailConfig = useCallback((config) => {
    if (!config) return;
    formik.setFieldValue('sender_email', config.sender_email || '');
    formik.setFieldValue('reply_to_email', config.reply_to_email || '');
    formik.setFieldValue('group_to_recipient', config.group_to_recipient || 'SEPARATE');
  }, [formik]);

  const selectedCompany = useMemo(() => {
    if (companyDetail && String(companyDetail.entity_id) === String(formik.values.entity_id)) return companyDetail;
    return companies.find(item => String(item.entity_id) === String(formik.values.entity_id)) || null;
  }, [companies, companyDetail, formik.values.entity_id]);

  const selectedEventOption = useMemo(() => (
    eventOptions.find(option => String(option.value) === String(formik.values.event_id)) || null
  ), [eventOptions, formik.values.event_id]);

  const eventSlug = selectedEventOption?.slug || '';
  const isSystemEvent = Boolean(isEdit && selectedEventOption?.is_system_event);
  const isAnnualLockedEvent = Boolean(isEdit && ['agm', 'ar', 'egm'].includes(String(eventSlug || '').toLowerCase()));

  const venueOptions = useMemo(() => {
    const rows = Array.isArray(selectedCompany?.addresses) ? selectedCompany.addresses : [];
    return rows
      .map(address => ({
        value: address.address_type || address.address_id,
        label: `${getAddressTypeLabel(address.address_type)}${address.is_primary ? ' (Primary)' : ''}`,
        address: formatCompanyAddress(address),
        address_id: address.address_id,
        is_primary: Boolean(address.is_primary),
      }))
      .filter(option => option.value && option.address);
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedEventOption) return;
    formik.setFieldValue('recurring_period', selectedEventOption.is_recurring ? (selectedEventOption.recurring_period ?? '') : '');
    formik.setFieldValue('recurring_duration', selectedEventOption.is_recurring ? (selectedEventOption.recurring_duration || '') : '');
  }, [selectedEventOption?.value]);

  useEffect(() => {
    if (!venueOptions.length || formik.values.venue || formik.values.venue_type) return;

    const defaultAddress = venueOptions.find(option =>
      selectedCompany?.default_address_id
      && String(option.address_id) === String(selectedCompany.default_address_id)
    ) || venueOptions.find(option => option.is_primary) || venueOptions[0];

    if (defaultAddress) {
      formik.setFieldValue('venue_type', defaultAddress.value);
      formik.setFieldValue('venue', defaultAddress.address);
    }
  }, [venueOptions, selectedCompany?.default_address_id, formik.values.venue, formik.values.venue_type]);

  const officialRoleGroups = useMemo(() => getOfficialRoleEntries(selectedCompany?.official_roles), [selectedCompany]);

  // ---- Attendees (single-record toggles) ----
  const selectedAttendeeKeys = useMemo(
    () => new Set((formik.values.attendees || [])
      .filter(a => !a.user_id)
      .map(a => partyKey(a.role, a))),
    [formik.values.attendees]
  );
  const selectedUserAttendeeKeys = useMemo(
    () => new Set((formik.values.attendees || [])
      .filter(a => a.user_id || a.attendee_type === 'USER')
      .map(storedUserAttendeeKey)),
    [formik.values.attendees]
  );
  const isAttendeeChecked = (roleName, record) => selectedAttendeeKeys.has(partyKey(roleName, record));
  const isUserAttendeeChecked = user => selectedUserAttendeeKeys.has(userAttendeeKey(user));
  const toggleAttendee = (roleName, record, checked) => {
    const next = officialToAttendee(roleName, record);
    if (checked) {
      formik.setFieldValue('attendees', appendUniqueByKey(formik.values.attendees, [next], a => partyKey(a.role, a)));
    } else {
      const removeKey = partyKey(roleName, record);
      formik.setFieldValue('attendees', (formik.values.attendees || []).filter(a => partyKey(a.role, a) !== removeKey));
    }
  };
  const toggleUserAttendee = (user, checked) => {
    const next = userToAttendee(user);
    const key = userAttendeeKey(user);
    if (checked) {
      formik.setFieldValue('attendees', appendUniqueByKey(formik.values.attendees, [next], a => (
        a.user_id || a.attendee_type === 'USER' ? storedUserAttendeeKey(a) : partyKey(a.role, a)
      )));
    } else {
      formik.setFieldValue('attendees', (formik.values.attendees || []).filter(a => storedUserAttendeeKey(a) !== key));
    }
  };

  // ---- Attendees (bulk "select all" — computes the whole array once) ----
  const toggleAttendeeGroup = (roleName, records, checked) => {
    const keys = new Set(records.map(record => partyKey(roleName, record)));
    let next = (formik.values.attendees || []).filter(a => !keys.has(partyKey(a.role, a)));
    if (checked) {
      const additions = records.map(record => officialToAttendee(roleName, record));
      next = appendUniqueByKey(next, additions, a => partyKey(a.role, a));
    }
    formik.setFieldValue('attendees', next);
  };

  const toggleUserAttendeeGroup = (userList, checked) => {
    const keys = new Set(userList.map(userAttendeeKey));
    let next = (formik.values.attendees || []).filter(a => {
      const isUserRow = a.user_id || a.attendee_type === 'USER';
      return !(isUserRow && keys.has(storedUserAttendeeKey(a)));
    });
    if (checked) {
      const additions = userList.map(userToAttendee);
      next = appendUniqueByKey(next, additions, a => storedUserAttendeeKey(a));
    }
    formik.setFieldValue('attendees', next);
  };

  // ---- Receiving parties (single-record toggles) ----
  const receivingPartyMap = useMemo(() => {
    const map = new Map();
    (formik.values.receiving_parties || [])
      .filter(rp => rp.official_id)
      .forEach(rp => map.set(partyKey(rp.role, rp), rp));
    return map;
  }, [formik.values.receiving_parties]);

  const getChannel = (roleName, record) => receivingPartyMap.get(partyKey(roleName, record))?.channel || '';

  const setChannel = (roleName, record, channel) => {
    const key = partyKey(roleName, record);
    const rest = (formik.values.receiving_parties || []).filter(rp => partyKey(rp.role, rp) !== key);
    if (channel) {
      rest.push(officialToReceivingParty(roleName, record, channel));
    }
    formik.setFieldValue('receiving_parties', rest);
  };

  const selectedUserPartyMap = useMemo(() => {
    const map = new Map();
    (formik.values.receiving_parties || [])
      .filter(party => party.party_type === 'USER' || party.user_id)
      .forEach(party => map.set(storedUserPartyKey(party), party));
    return map;
  }, [formik.values.receiving_parties]);

  const getUserChannel = user => selectedUserPartyMap.get(userPartyKey(user))?.channel || '';

  const setUserChannel = (user, channel) => {
    const key = userPartyKey(user);
    const rest = (formik.values.receiving_parties || []).filter(party => storedUserPartyKey(party) !== key);
    if (channel) rest.push(userToReceivingParty(user, channel));
    formik.setFieldValue('receiving_parties', rest);
  };

  // ---- Receiving parties (bulk "select all" per channel — computes the whole array once) ----
  // checked=true  → assign `channel` to every eligible (has-email) record in the group.
  // checked=false → clear only the records currently on `channel` (leave others as-is),
  //                 matching the old behaviour where unchecking "select all TO" doesn't
  //                 wipe out records someone had individually set to CC/BCC.
  const setChannelForGroup = (roleName, records, channel, checked) => {
    const updates = new Map(); // key -> next channel value ('' means clear)
    records.forEach(record => {
      if (!record.email) return;
      const key = partyKey(roleName, record);
      const current = getChannel(roleName, record);
      if (checked) {
        updates.set(key, channel);
      } else if (current === channel) {
        updates.set(key, '');
      }
    });
    if (!updates.size) return;

    let next = (formik.values.receiving_parties || []).filter(rp => !updates.has(partyKey(rp.role, rp)));
    records.forEach(record => {
      const key = partyKey(roleName, record);
      if (updates.has(key)) {
        const newChannel = updates.get(key);
        if (newChannel) next.push(officialToReceivingParty(roleName, record, newChannel));
      }
    });
    formik.setFieldValue('receiving_parties', next);
  };

  const setUserChannelForGroup = (userList, channel, checked) => {
    const updates = new Map();
    userList.forEach(user => {
      if (!user.email) return;
      const key = userPartyKey(user);
      const current = getUserChannel(user);
      if (checked) {
        updates.set(key, channel);
      } else if (current === channel) {
        updates.set(key, '');
      }
    });
    if (!updates.size) return;

    let next = (formik.values.receiving_parties || []).filter(party => {
      const isUserParty = party.party_type === 'USER' || party.user_id;
      if (!isUserParty) return true;
      return !updates.has(storedUserPartyKey(party));
    });
    userList.forEach(user => {
      const key = userPartyKey(user);
      if (updates.has(key)) {
        const newChannel = updates.get(key);
        if (newChannel) next.push(userToReceivingParty(user, newChannel));
      }
    });
    formik.setFieldValue('receiving_parties', next);
  };

  // Chairman options
  const chairmanOptions = useMemo(() => {
    const wanted = officialRoleGroups.filter(g => /director|member|shareholder/i.test(g.roleName));
    return wanted.flatMap(g => g.records.map(r => ({
      value: r.official_id,
      label: r.official_entity_name || r.name,
      roleName: g.roleName,
      isCorporate: /corporate/i.test(r.entity_type || r.type || ''),
      reps: (r.sub_roles?.Representative || r.sub_roles?.representatives || []),
    })));
  }, [officialRoleGroups]);

  const financialSignerOptions = useMemo(() => {
    const wanted = officialRoleGroups.filter(g => /director/i.test(g.roleName));
    const seen = new Set();
    return wanted.flatMap(g => g.records.map(r => ({
      id: String(r.official_id),
      label: r.official_entity_name || r.name || `Official #${r.official_id}`,
      roleName: g.roleName,
    }))).filter(option => {
      if (!option.id || seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }, [officialRoleGroups]);

  const selectedChairman = chairmanOptions.find(c => String(c.value) === String(formik.values.meeting_chairman));

  useEffect(() => {
    if (!selectedChairman) return;
    formik.setFieldValue('type_shareholder', selectedChairman.isCorporate ? 'CORPORATE' : 'INDIVIDUAL');
    if (!selectedChairman.isCorporate) formik.setFieldValue('meeting_corporate_shareholder_rep', '');
  }, [formik.values.meeting_chairman]);

  const isEventCompleted = formik.values.status === 'COMPLETED';
  const isEventReadOnly = isEventCompleted
    || formik.values.status === 'WAIVED'
    || formik.values.status === 'EXEMPT'
    || formik.values.status === 'CANCELLED'
    || formik.values.status === 'NOT_APPLICABLE';

  // Check if this is an AGM/AR/EGM event for AR Status section
  const showArStatus = AGM_AR_EVENT_TYPES.includes(eventSlug);

  // Get event label for AR Status section
  const eventStatusLabel = getEventStatusLabel(eventSlug);

  // Check if Prepared Date should be shown
  const showPreparedDate = formik.values.agm_documents === 'Prepared';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [companyRes, eventRes, profileRes, detailRes] = await Promise.all([
        getCompanyList({ page: 1, limit: 1000, order: 'name:ASC' }),
        getCompanyEventNameList({ page: 1, limit: 1000, event_type: 'EVENT', order: 'event_name:ASC' }),
        getCompanyProfile(1),
        isEdit ? getCompanyEvent(id) : Promise.resolve(null),
      ]);

      setCompanies(unwrapList(companyRes));
      setEventNames(unwrapList(eventRes));
      const profilePayload = profileRes?.data ?? profileRes ?? {};
      const mappedEmailConfigs = mapEmailConfigs(profilePayload.emailConfigs || []);
      const defaultEmailConfig = getDefaultEmailConfig(mappedEmailConfigs);
      setEmailConfigs(mappedEmailConfigs);

      if (isEdit && detailRes) {
        const data = unwrapOne(detailRes);
        const agmStatusDetails = data.agm_status_details || {};
        const partyPayload = splitPartyPayload(data.receiving_parties);
        const attendeePayload = splitPartyPayload(data.attendees);
        const selectedParties = [...partyPayload.officials, ...partyPayload.users];
        const selectedAttendees = [...attendeePayload.officials, ...attendeePayload.users];

        formik.setValues({
          ...initialValues,
          entity_id: String(data.entity_id || data.company_id || ''),
          event_id: String(data.event_id || ''),
          event_slug: data.event_slug || '',
          period_start: toDateInput(data.period_start),
          period_end: toDateInput(data.period_end),
          fye_date: toDateInput(data.fye_date || data.period_end),
          recurring_period: data.recurring_period ?? data.event?.recurring_period ?? '',
          recurring_duration: data.recurring_duration || data.event?.recurring_duration || '',
          due_date: toDateInput(data.due_date),
          held_date: toDateInput(data.held_date),
          filing_date: toDateInput(data.filing_date),
          sent_date: toDateInput(data.sent_date),
          received_date: toDateInput(data.received_date),
          source_basis: data.source_basis || 'Manual Event',
          status: data.status || 'PENDING',
          held_time: data.held_time || '',
          held_time_end: data.held_time_end || '',
          venue_type: data.venue_type || '',
          venue: data.venue || '',
          meeting_chairman: data.meeting_chairman || '',
          type_shareholder: data.type_shareholder || '',
          meeting_corporate_shareholder_rep: data.meeting_corporate_shareholder_rep || '',
          meeting_agenda: data.meeting_agenda || '',
          sender_email: data.sender_email || defaultEmailConfig?.sender_email || '',
          reply_to_email: data.reply_to_email || defaultEmailConfig?.reply_to_email || '',
          group_to_recipient: data.group_to_recipient || defaultEmailConfig?.group_to_recipient || 'SEPARATE',
          email_config_id: data.email_config_id || defaultEmailConfig?.email_config_id || '',
          prepared_date: toDateInput(data.prepared_date || agmStatusDetails.prepared_date),
          dormant_status: data.dormant_status || agmStatusDetails.dormant_status || '',
          solvent_status: data.solvent_status || agmStatusDetails.solvent_status || '',
          accounts_status: data.accounts_status || agmStatusDetails.accounts_status || '',
          xbrl: data.xbrl || agmStatusDetails.xbrl || '',
          financial_statements_status: data.financial_statements_status || agmStatusDetails.financial_statements_status || '',
          audited_fs_status: data.audited_fs_status || agmStatusDetails.audited_fs_status || '',
          fs_signed_by: toArrayValue(data.fs_signed_by || agmStatusDetails.fs_signed_by),
          financial_statement_date: toDateInput(data.financial_statement_date || agmStatusDetails.financial_statement_date),
          agm_documents: data.agm_documents || agmStatusDetails.agm_documents || '',
          extended_due_date: toDateInput(data.extended_due_date),
          remarks: data.remarks || '',
          reminders: data.reminders || [],
          uploaded_files: data.uploaded_files || [],
          attendees: selectedAttendees,
          receiving_parties: selectedParties,
          custom_receiving_parties: partyPayload.custom.length ? partyPayload.custom : [],
        });
      } else if (defaultEmailConfig) {
        formik.setValues({
          ...initialValues,
          entity_id: companyId || '',
          sender_email: defaultEmailConfig.sender_email || '',
          reply_to_email: defaultEmailConfig.reply_to_email || '',
          group_to_recipient: defaultEmailConfig.group_to_recipient || 'SEPARATE',
          email_config_id: defaultEmailConfig.email_config_id || '',
        });
      }
    } catch {
      toast.error('Failed to load event form data');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    getUserList({ page: 1, limit: 1000, order: 'first_name:ASC' })
      .then(res => { if (!cancelled) setUsers(unwrapList(res)); })
      .catch(() => { if (!cancelled) setUsers([]); });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const entityId = formik.values.entity_id;
    if (!entityId) { setCompanyDetail(null); return; }
    let cancelled = false;
    setRolesLoading(true);
    getCompany(entityId)
      .then((res) => { if (!cancelled) setCompanyDetail(unwrapOne(res)); })
      .catch(() => { if (!cancelled) setCompanyDetail(null); })
      .finally(() => { if (!cancelled) setRolesLoading(false); });
    return () => { cancelled = true; };
  }, [formik.values.entity_id]);

  const currentEventDisplayName = useMemo(() => getEventDisplayName(selectedEventOption), [selectedEventOption]);

  if (loading) {
    return (
      <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 320 }}>
        <Spinner color="primary" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <style>{CSS}</style>
      <Container fluid>
        <BreadCrumb title={isEdit ? `Edit ${currentEventDisplayName || 'Event'}` : 'Add Event'} pageTitle="Compliance" />

        <Card>
          <FormikProvider value={formik}>
            <CardBody className="p-3">
              <Section
                title="Event Details"
                sub={isEdit ? 'Entity, event type, FYE and event dates' : 'Entity, event type and key event dates'}
                right={<Link to={formik.values.entity_id ? `/compliance/events/company/${formik.values.entity_id}` : '/compliance/events/list'} className="btn btn-warning btn-sm"><i className="ri-list-unordered me-1" /> Events</Link>}
              >
                <Row className="g-2">
                  <Field formik={formik} name="entity_id" label="Entity Name" type="select" required disabled={Boolean(companyId) || isEdit}>
                    <option value="">Choose company</option>
                    {companyOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Field>

                  <Field formik={formik} name="event_id" label="Event Type" type="select" required disabled={isEdit || isEventReadOnly || isSystemEvent || isAnnualLockedEvent}>
                    <option value="">Choose event</option>
                    {eventOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>

                  <Field formik={formik} name="fye_date" label="FYE Date" type="date" disabled={isEventReadOnly || isSystemEvent || (isAnnualLockedEvent && Boolean(formik.values.fye_date))} />
                  <Field formik={formik} name="period_start" label="Period From" type="date" disabled={isEventReadOnly} />
                  <Field formik={formik} name="period_end" label="Period To" type="date" disabled={isEventReadOnly} />
                  <Field formik={formik} name="due_date" label="Due Date" type="date" required disabled={isEventReadOnly || isSystemEvent || (isAnnualLockedEvent && Boolean(formik.values.due_date))} />
                  <Field formik={formik} name="held_date" label="Held Date" type="date" disabled={isEventReadOnly} />
                  {isEdit && formik?.values?.extended_due_date && <Field formik={formik} name="extended_due_date" label="Extended Due Date" type="date" disabled={true} />}
                  <Field formik={formik} name="filing_date" label="Filling/Completed Date" type="date" disabled={isEventReadOnly} />
                  <Field formik={formik} name="sent_date" label="Notice Date" type="date" disabled={isEventReadOnly} />
                  <Field formik={formik} name="received_date" label="Received Date" type="date" disabled={isEventReadOnly} />
                  <Col md={4}>
                    <Label className="form-label fs-12">Recurring</Label>
                    <Input bsSize="sm" value={selectedEventOption?.is_recurring ? getRecurringLabel(selectedEventOption?.recurring_period ?? formik.values.recurring_period) : 'No'} readOnly />
                  </Col>
                  <Col md={4}>
                    <Label className="form-label fs-12">Recurring Duration</Label>
                    <Input bsSize="sm" value={selectedEventOption?.is_recurring ? (selectedEventOption?.recurring_duration || formik.values.recurring_duration || '') : ''} readOnly />
                  </Col>

                </Row>
              </Section>

              {/* Meeting Details - Always show for all event types */}
              <Section title="Meeting Details" sub="Chairman, venue, timing and agenda">
                <Row className="g-2">
                  <Field formik={formik} name="held_time" label="Start Time" type="time" disabled={isEventReadOnly} />
                  <Field formik={formik} name="held_time_end" label="End Time" type="time" disabled={isEventReadOnly} />
                  <Field formik={formik} name="meeting_chairman" label="Chairman" type="select" disabled={isEventReadOnly}>
                    <option value="">Choose Director</option>
                    {chairmanOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.roleName}{opt.isCorporate ? ' - Corporate' : ''})
                      </option>
                    ))}
                  </Field>
                  <Col md={6}>
                    <Label className="form-label fs-12">Venue</Label>
                    <Input
                      bsSize="sm"
                      type="select"
                      name="venue_type"
                      value={formik.values.venue_type || ''}
                      onChange={(event) => {
                        const option = venueOptions.find(item => String(item.value) === String(event.target.value));
                        formik.setFieldValue('venue_type', event.target.value);
                        if (option) formik.setFieldValue('venue', option.address);
                      }}
                      onBlur={formik.handleBlur}
                      disabled={isEventReadOnly}
                    >
                      <option value="">Select address</option>
                      {venueOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                      {formik.values.venue_type && !venueOptions.some(option => String(option.value) === String(formik.values.venue_type)) && (
                        <option value={formik.values.venue_type}>{formik.values.venue_type}</option>
                      )}
                    </Input>
                  </Col>
                  
                  <Field formik={formik} name="venue" label={getAddressTypeLabel(formik.values.venue_type) || 'Venue Address'} md={6} type="textarea" rows={2} placeholder="Enter venue / meeting link" disabled={isEventReadOnly} />
                  
                  {selectedChairman?.isCorporate && (
                    <Field formik={formik} name="meeting_corporate_shareholder_rep" label="Shareholder Representative" type="select" disabled={isEventReadOnly}>
                      <option value="">Select representative</option>
                      {(selectedChairman.reps || []).map(rep => (
                        <option key={rep.official_id} value={rep.official_id}>{rep.official_entity_name || rep.name}</option>
                      ))}
                    </Field>
                  )}
                  <Field formik={formik} name="meeting_agenda" label="Agenda" type="textarea" md={6} rows={3} disabled={isEventReadOnly} />
                  <Field formik={formik} name="remarks" label="Remarks" type="textarea" md={6} rows={3} disabled={isEventReadOnly} />
                </Row>
              </Section>

              {/* AR Status - Only for AGM, AR, EGM events with dynamic label */}
              {isEdit && showArStatus && (
                <Section title={`${eventStatusLabel} Status`} sub={`Optional filing and document status details for ${eventStatusLabel}`}>
                  <Row className="g-2">
                    <Field formik={formik} name="dormant_status" label="Dormant Status" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {YES_NO_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    <Field formik={formik} name="solvent_status" label="Solvent Status" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {YES_NO_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    <Field formik={formik} name="accounts_status" label="Accounts Status" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {ACCOUNT_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    <Field formik={formik} name="xbrl" label="XBRL" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {XBRL_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    <Field formik={formik} name="financial_statements_status" label="Financial Statement Status" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {FINANCIAL_STATEMENT_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Field>
                    <Field formik={formik} name="audited_fs_status" label="Financial Statement Type" type="select" disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {AUDITED_FS_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    <Col md={4}>
                      <Label className="form-label fs-12">F.S. Signed by</Label>
                      <MultiSelect
                        items={financialSignerOptions}
                        selected={formik.values.fs_signed_by}
                        onChange={next => formik.setFieldValue('fs_signed_by', next)}
                        placeholder="Select F.S. signers..."
                      />
                      {financialSignerOptions.length === 0 && (
                        <div className="text-muted fs-11 mt-1">No directors available for this company.</div>
                      )}
                    </Col>
                    <Field formik={formik} name="financial_statement_date" label="Financial Statement Date" type="date" disabled={isEventReadOnly} />
                    <Field formik={formik} name="agm_documents" label="AGM Documents" type="select" md={4} disabled={isEventReadOnly}>
                      <option value="">Select</option>
                      {AGM_DOCUMENT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </Field>
                    {/* Prepared Date - Only show when AGM Documents is "Prepared" */}
                    {showPreparedDate && (
                      <Field formik={formik} name="prepared_date" label="Prepared Date" type="date" disabled={isEventReadOnly} />
                    )}
                  </Row>
                </Section>
              )}

              <Section title="Email Settings" sub="Default sending address and recipient grouping">
                <Row className="g-2">
                  <Col md={4}>
                    <Label className="form-label fs-12">Default Sending Email</Label>
                    <Input
                      bsSize="sm"
                      type="select"
                      value={selectedEmailConfig?.email_config_id || ''}
                      onChange={(e) => {
                        const config = emailConfigs.find(item => String(item.email_config_id) === String(e.target.value));
                        formik.setFieldValue('email_config_id', config?.email_config_id || '');
                        applyEmailConfig(config);
                      }}
                      disabled={isEventReadOnly}
                    >
                      <option value="">Select email configuration</option>
                      {emailConfigs.map(config => (
                        <option key={config.email_config_id || config.sender_email} value={config.email_config_id}>
                          {config.label}{config.is_default ? ' (Default)' : ''}
                        </option>
                      ))}
                    </Input>
                    {!emailConfigs.length && (
                      <div className="text-muted fs-11 mt-1">No email configuration found in Company Profile.</div>
                    )}
                  </Col>
                  <Col md={4}>
                    <Label className="form-label fs-12">Reply Email</Label>
                    <Input
                      bsSize="sm"
                      type="select"
                      name="reply_to_email"
                      value={formik.values.reply_to_email || ''}
                      onChange={formik.handleChange}
                      disabled={isEventReadOnly}
                    >
                      <option value="">Select reply email</option>
                      {[...new Set(emailConfigs.map(config => config.reply_to_email).filter(Boolean))]
                        .map(email => <option key={email} value={email}>{email}</option>)}
                    </Input>
                  </Col>
                  <Col md={4}>
                    <Label className="form-label fs-12">To Recipients</Label>
                    <div className="d-flex gap-3 mt-1">
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="group_to_recipient" id="grp-sep" checked={formik.values.group_to_recipient === 'SEPARATE'} onChange={() => formik.setFieldValue('group_to_recipient', 'SEPARATE')} disabled={isEventReadOnly} />
                        <label className="form-check-label fs-12" htmlFor="grp-sep">Separate</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="group_to_recipient" id="grp-tog" checked={formik.values.group_to_recipient === 'TOGETHER'} onChange={() => formik.setFieldValue('group_to_recipient', 'TOGETHER')} disabled={isEventReadOnly} />
                        <label className="form-check-label fs-12" htmlFor="grp-tog">Together</label>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Section>

              <Section
                title="Attendees"
                sub="Tick the company officials and users who should attend this event"
              >
                {officialRoleGroups.length > 0 || userOptions.length > 0 ? (
                  <div className="cef-role-grid">
                    {officialRoleGroups.map(group => (
                      <AttendeeRolePanel
                        key={group.roleName}
                        group={group}
                        isAttendeeChecked={isAttendeeChecked}
                        toggleAttendee={toggleAttendee}
                        onToggleAll={checked => toggleAttendeeGroup(group.roleName, group.records, checked)}
                        isEventReadOnly={isEventReadOnly}
                      />
                    ))}
                    {userOptions.length > 0 && (
                      <AttendeeUserPanel
                        userOptions={userOptions}
                        isUserAttendeeChecked={isUserAttendeeChecked}
                        toggleUserAttendee={toggleUserAttendee}
                        onToggleAll={checked => toggleUserAttendeeGroup(userOptions, checked)}
                        isEventReadOnly={isEventReadOnly}
                      />
                    )}
                  </div>
                ) : (
                  <div className="cef-empty-box">
                    {rolesLoading ? 'Loading company officials...' : 'Select a company with officials to show role-wise attendee lists.'}
                  </div>
                )}
              </Section>

              <Section
                title="Receiving Parties"
                sub="Pick To / CC / BCC per official and user"
              >
                {officialRoleGroups.length > 0 || userOptions.length > 0 ? (
                  <div className="cef-role-grid">
                    {officialRoleGroups.map(group => (
                      <ReceivingPartyRolePanel
                        key={`rp-${group.roleName}`}
                        group={group}
                        getChannel={getChannel}
                        setChannel={setChannel}
                        onSelectAll={(ch, checked) => setChannelForGroup(group.roleName, group.records, ch, checked)}
                        isEventReadOnly={isEventReadOnly}
                      />
                    ))}
                    {userOptions.length > 0 && (
                      <ReceivingPartyUserPanel
                        userOptions={userOptions}
                        getUserChannel={getUserChannel}
                        setUserChannel={setUserChannel}
                        onSelectAll={(ch, checked) => setUserChannelForGroup(userOptions, ch, checked)}
                        isEventReadOnly={isEventReadOnly}
                      />
                    )}
                  </div>
                ) : (
                  <div className="cef-empty-box mb-3">
                    {rolesLoading ? 'Loading company officials...' : 'Select a company to show recipient options.'}
                  </div>
                )}

                <div className="mt-3">
                  <div className="cef-mini-label mb-1">Additional / external recipients</div>
                  <FieldArray name="custom_receiving_parties">
                    {({ remove }) => (
                      <>
                        {formik.values.custom_receiving_parties.map((row, index) => (
                          <div className="cef-row-card" key={index}>
                            <Row className="g-2 align-items-end">
                              <Col md={2}><div className="cef-mini-label">Party Type</div><Input bsSize="sm" name={`custom_receiving_parties.${index}.party_type`} value={row.party_type || ''} onChange={formik.handleChange} disabled={isEventReadOnly} /></Col>
                              <Col md={3}><div className="cef-mini-label">Name</div><Input bsSize="sm" name={`custom_receiving_parties.${index}.name`} value={row.name || ''} onChange={formik.handleChange} disabled={isEventReadOnly} /></Col>
                              <Col md={3}><div className="cef-mini-label">Email</div><Input bsSize="sm" type="email" name={`custom_receiving_parties.${index}.email`} value={row.email || ''} onChange={formik.handleChange} disabled={isEventReadOnly} /></Col>
                              <Col md={2}>
                                <div className="cef-mini-label">Channel</div>
                                <Input bsSize="sm" type="select" name={`custom_receiving_parties.${index}.channel`} value={row.channel || 'TO'} onChange={formik.handleChange} disabled={isEventReadOnly}>
                                  <option value="TO">To</option>
                                  <option value="CC">CC</option>
                                  <option value="BCC">BCC</option>
                                </Input>
                              </Col>
                              <Col md={1}><Button color="danger" outline size="sm" type="button" onClick={() => remove(index)} disabled={isEventReadOnly}><i className="ri-delete-bin-line" /></Button></Col>
                            </Row>
                          </div>
                        ))}
                        <button type="button" className="cef-add" onClick={() => formik.setFieldValue('custom_receiving_parties', [...formik.values.custom_receiving_parties, emptyCustomParty()])} disabled={isEventReadOnly}>
                          + Add external recipient
                        </button>
                      </>
                    )}
                  </FieldArray>
                </div>
              </Section>
            </CardBody>

            <div className="cef-footer">
              <Button size="sm" color="danger" type="button" onClick={() => navigate(formik.values.entity_id ? `/compliance/events/company/${formik.values.entity_id}` : '/compliance/events/list')} disabled={formik.isSubmitting}>
                <i className="ri-arrow-left-line me-1" /> Back
              </Button>
              <Button size="sm" color="success" type="button" className="ms-auto" onClick={formik.handleSubmit} disabled={formik.isSubmitting || isEventReadOnly}>
                {formik.isSubmitting ? <><Spinner size="sm" className="me-1" /> Saving...</> : <><i className="ri-save-3-line me-1" /> {isEdit ? 'Update Event' : 'Save Event'}</>}
              </Button>
            </div>
          </FormikProvider>
        </Card>
      </Container>
    </div>
  );
};

export default EventForm;
