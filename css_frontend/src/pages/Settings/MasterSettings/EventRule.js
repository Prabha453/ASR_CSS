import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Spinner,
  Table,
} from 'reactstrap';

import DatePickerInput from '../../../Components/Common/DatePickerInput';
import MasterDataView from '../../../Components/Common/MasterDataView';
import { getLoggedinUser } from '../../../helpers/api_helper';
import {
  approveEventRule,
  deleteCompanyEventRule,
  getCompanyEventNameList,
  getCompanyEventRuleList,
  getCompanyTypeList,
  getCountriesList,
  getJurisdictionsList,
  getEventRuleVersions,
  publishEventRule,
  retireEventRule,
  saveCompanyEventRule,
  submitEventRuleForReview,
} from '../../../helpers/backend_helper';

const REF_LOGICS = [
  ['FIELD', 'Field Date'],
  ['EVENT', 'Another Event'],
  ['FIXED_DATE', 'Fixed Date'],
  ['CLIENT_DEFINED', 'Client Defined'],
];

const REF_FIELDS = [
  ['ACTUAL_FYE', 'Financial Year End'],
  ['INCORPORATION_DATE', 'Incorporation Date'],
  ['AGM_HELD_DATE', 'AGM Date'],
  ['INCORPORATION_ANNIVERSARY', 'Incorporation Anniversary'],
  ['DATE_OF_AGM_PLUS_ONE_YEAR_JAN_31', 'Date of AGM + 1 Year Jan 31'],
];

const BASE_DATE_OPTIONS = REF_FIELDS.map(([value, label]) => ({ value, label }));

const CONDITION_FIELDS = [
  ['INCORPORATION_DATE', 'Incorporation Date'],
  ['FYE_PERIOD_MONTHS', 'FYE'],
  ['COMPANY_TYPE', 'Company Type'],
  ['JURISDICTION', 'Jurisdiction'],
];

const OPERATORS = [
  [1, '='],
  [2, '<'],
  [3, '>'],
  [4, '<='],
  [5, '>='],
];

const OFFSET_UNITS = [
  ['DAYS', 'Days'],
  ['MONTHS', 'Months'],
  ['YEARS', 'Years'],
];

const OFFSET_UNIT_ALIAS = {
  DAY: 'DAYS',
  DAYS: 'DAYS',
  MONTH: 'MONTHS',
  MONTHS: 'MONTHS',
  YEAR: 'YEARS',
  YEARS: 'YEARS',
};

const FIXED_DATE_MODES = [
  ['VALUE', 'Date Picker'],
  ['FIELD', 'Field'],
];

const FIXED_DATE_FIELDS = [
  ['FYE', 'FYE'],
  ['INCORPORATION_DATE', 'Incorporation date'],
  ['HELD_DATE', 'Held date'],
];

const FIXED_DATE_YEAR_FIELDS = [
  ...FIXED_DATE_FIELDS,
  ['CURRENT_YEAR', 'Incorporation Current Year'],
];

const fixedDatePickerOptions = (part) => {
  if (part === 'year') {
    return {
      dateFormat: 'Y',
      altFormat: 'Y',
    };
  }

  if (part === 'month') {
    return {
      dateFormat: 'm',
      altFormat: 'F',
    };
  }

  return {
    dateFormat: 'd',
    altFormat: 'd',
  };
};

// ── Phase metadata: icon + accent color per phase. Colors are pulled straight
//    from MasterDataView's own MDV_COLORS palette so this screen reads as part
//    of the same system rather than introducing a new palette. ──
const PHASES = [
  ['FIRST', 'First Year', 'ri-flag-line', '#405189'],   // MDV_COLORS[0] — Velzon primary indigo
  ['SUBSEQUENT', 'Subsequent Year', 'ri-repeat-line', '#299cdb'], // MDV_COLORS[4] — Velzon info blue
];

const emptyStep = () => ({
  reference_logic: 'FIELD',
  field: 'INCORPORATION_DATE',
  event_id: '',
  fixed_date: {
    day_mode: 'VALUE',
    day: '',
    month_mode: 'VALUE',
    month: '',
    year_mode: 'VALUE',
    year: '',
    day_field: '',
    month_field: '',
    year_field: '',
  },
  offset_value: 0,
  offset_unit: 'DAYS',
  end_month: false,
});

const emptyCondition = () => ({
  field: 'INCORPORATION_DATE',
  operator: 1,
  value: '',
  operator2: '',
  value2: '',
});

const emptyGroup = () => ({
  condition_mode: 'ALL',
  conditions: [],
  steps: [emptyStep()],
  take: 'LATEST',
});

const emptyForm = () => ({
  rule_id: null,
  event_id: '',
  country_ids: [],
  legacy_country_ids: [],
  company_type_ids: [],
  jurisdiction_id: '',
  is_active: true,
  rule_priority: 0,
  phases: {
    FIRST: { groups: [emptyGroup()] },
    SUBSEQUENT: { groups: [emptyGroup()], same_as_first_year: true },
  },
});

// ── Rule version-status badge colors (spec §5.3) ──
const VERSION_STATUS_BADGE = {
  SYSTEM_DEFAULT: 'primary',
  DRAFT: 'secondary',
  UNDER_REVIEW: 'warning',
  APPROVED: 'info',
  PUBLISHED: 'success',
  SUPERSEDED: 'dark',
  RETIRED: 'danger',
};

const versionStatusLabel = (status) => {
  const key = String(status || 'DRAFT').toUpperCase();
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const VERSION_STATUS_BADGE_MAP = Object.fromEntries(
  Object.entries(VERSION_STATUS_BADGE).map(([status, color]) => [versionStatusLabel(status), color])
);

// ── Styles for the custom builder/view modals only. Kept minimal — sections,
//    badges, and actions reuse Card/CardHeader/badge/btn-soft-* classes that
//    already exist in the app's theme instead of inventing new ones. Only the
//    condition/step layout (no equivalent elsewhere) and multiselect need
//    bespoke rules. ──
const pageCss = `
  .erb-required { color: var(--vz-danger); }
  .erb-help { color: var(--vz-secondary-color); font-size: 11px; margin-top: 4px; }
  .erb-label { font-size: 12px; font-weight: 600; color: var(--vz-body-color); margin-bottom: 6px; }

  /* Numbered circle badge — same visual recipe as MasterDataView's grid-card
     index badge (colored fill, white ring, soft shadow), reused here for
     condition/step ordinals and the phase icon badge. */
  .erb-badge {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
    border: 2px solid var(--vz-card-bg, #fff);
    box-shadow: 0 1px 4px rgba(0,0,0,.15);
    flex-shrink: 0;
  }

  .erb-phase-card { border-left: 4px solid var(--erb-accent, #405189); }
  .erb-phase-empty-note { font-size: 12px; color: var(--vz-secondary-color); }

  .erb-action-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; margin-bottom: 14px; }

  .erb-condition-card { border: 1px solid var(--vz-border-color); border-radius: 6px; padding: 12px 14px; margin-bottom: 10px; background: var(--vz-card-bg); }
  .erb-condition-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .erb-condition-head span { font-size: 12px; font-weight: 700; color: var(--vz-body-color); }

  .erb-step-row { display: flex; gap: 12px; margin-bottom: 14px; }
  .erb-step-row:last-child { margin-bottom: 0; }
  .erb-step-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 24px; }
  .erb-step-rail .erb-badge { background: var(--erb-accent, #405189); }
  .erb-step-rail .erb-line { flex: 1; width: 2px; background: var(--vz-border-color); margin-top: 6px; min-height: 24px; }
  .erb-step-card { flex: 1; min-width: 0; border: 1px solid var(--vz-border-color); border-radius: 6px; padding: 12px 14px; background: var(--vz-light); }
  .erb-step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .erb-step-head span { font-size: 12px; font-weight: 700; color: var(--vz-body-color); }

  .erb-fixed-grid { border-top: 1px dashed var(--vz-border-color); margin-top: 10px; padding-top: 10px; }
  .erb-summary-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--vz-border-color); }

  .erb-empty { border: 1px dashed var(--vz-border-color); border-radius: 6px; padding: 20px 16px; text-align: center; color: var(--vz-secondary-color); font-size: 12px; }

  /* ── View modal: timeline for reference steps, table for conditions ── */
  .erb-timeline-item { display: flex; gap: 12px; }
  .erb-timeline-item:not(:last-child) { margin-bottom: 10px; }
  .erb-timeline-rail { display: flex; flex-direction: column; align-items: center; width: 24px; flex-shrink: 0; }
  .erb-timeline-rail .erb-badge { background: var(--erb-accent, #405189); }
  .erb-timeline-rail .erb-line { flex: 1; width: 2px; background: var(--vz-border-color); margin-top: 6px; }
  .erb-timeline-body { flex: 1; min-width: 0; border: 1px solid var(--vz-border-color); border-radius: 6px; padding: 10px 12px; background: var(--vz-card-bg); display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .erb-tl-ref { font-weight: 700; font-size: 12.5px; }
  .erb-tl-meta { font-size: 11.5px; color: var(--vz-secondary-color); }

  /* ── Custom multiselect (chips + checkbox dropdown) — no equivalent
       elsewhere in the app, styled with the same border/radius tokens the
       rest of the theme uses. ── */
  .event-rule-multiselect { position: relative; z-index: 1; isolation: isolate; }
  .event-rule-multiselect.open { z-index: 3000; }
  .event-rule-multiselect-control {
    min-height: 31px;
    border: 1px solid var(--vz-border-color);
    border-radius: 4px;
    background-color: var(--vz-card-bg, #fff);
    padding: 2px 28px 2px 7px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 3px;
    cursor: pointer;
    position: relative;
  }
  .event-rule-multiselect-control:hover { border-color: var(--vz-secondary-color); }
  .event-rule-multiselect-placeholder { color: var(--vz-secondary-color); font-size: 12px; padding: 2px 2px; line-height: 1.3; }
  .event-rule-multiselect-chips { display: flex; flex-wrap: wrap; gap: 3px; }
  .event-rule-multiselect-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--vz-light, #f3f6f9);
    color: var(--vz-body-color);
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 5px 2px 7px;
    border-radius: 999px;
    line-height: 1.25;
  }
  .event-rule-multiselect-chip i { cursor: pointer; font-size: 12px; }
  .event-rule-multiselect-chip i:hover { color: var(--vz-danger); }
  .event-rule-multiselect-caret {
    position: absolute;
    right: 7px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--vz-secondary-color);
    transition: transform .15s ease;
  }
  .event-rule-multiselect-caret.open { transform: translateY(-50%) rotate(180deg); }
  .event-rule-multiselect-panel {
    position: absolute;
    z-index: 3001;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background-color: var(--vz-card-bg, #fff);
    border: 1px solid var(--vz-border-color);
    border-radius: 4px;
    box-shadow: 0 6px 18px rgba(0,0,0,.12);
    max-height: 260px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .event-rule-multiselect-search { padding: 6px; border-bottom: 1px solid var(--vz-border-color); background-color: var(--vz-card-bg, #fff); }
  .event-rule-multiselect-search .form-control { min-height: 28px; padding: 3px 7px; font-size: 12px; }
  .event-rule-multiselect-options { overflow-y: auto; padding: 3px 0; background-color: var(--vz-card-bg, #fff); }
  .event-rule-multiselect-option {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 5px 9px;
    font-size: 12px;
    cursor: pointer;
    margin: 0;
    background-color: var(--vz-card-bg, #fff);
  }
  .event-rule-multiselect-option input { width: 13px; height: 13px; }
  .event-rule-multiselect-option:hover { background-color: var(--vz-light, #f3f6f9); }
  .event-rule-multiselect-empty { padding: 10px 12px; font-size: 12px; color: var(--vz-secondary-color); background-color: var(--vz-card-bg, #fff); }
`;

const extract = (res) => {
  const list = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(list) ? list : [];
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
};

const optionsFrom = (list, valueKey, labelKey) =>
  list.map(item => ({
    value: String(item[valueKey]),
    label: item[labelKey] || item.name || item.country_name || String(item[valueKey]),
  })).filter(item => item.value !== 'undefined');

const labelOf = (options, value) =>
  options.find(item => String(item.value) === String(value))?.label || value || '-';

const pairLabel = (pairs, value) =>
  pairs.find(([key]) => String(key) === String(value))?.[1] || value || '-';

const conditionValuePlaceholder = (field) =>
  field === 'FYE_PERIOD_MONTHS' ? 'Months' : 'Month no. or DD/MM/YYYY';

const normalizedOffsetValue = (step = {}) =>
  step.offset_value ?? step.offset?.value ?? 0;

const normalizedOffsetUnit = (step = {}) =>
  OFFSET_UNIT_ALIAS[String(step.offset_unit || step.offset?.unit || 'DAYS').toUpperCase()] || 'DAYS';

// ── Custom multiselect: shows selections as removable chips, opens a
//    searchable checkbox dropdown panel. Replaces the native <select multiple>. ──
const MultiSelect = ({ value = [], options = [], onChange, placeholder = 'Select' }) => {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };

  }, []);

  const selectedOptions =
    options.filter(opt => value.includes(opt.value));

  const filteredOptions =
    options.filter(opt =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );

  const toggleValue = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeValue = (optValue, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optValue));
  };

  return (
    <div className={`event-rule-multiselect ${open ? 'open' : ''}`} ref={wrapperRef}>
      <div
        className="event-rule-multiselect-control"
        onClick={() => setOpen(prev => !prev)}
      >
        {selectedOptions.length ? (
          <div className="event-rule-multiselect-chips">
            {selectedOptions.map(opt => (
              <span className="event-rule-multiselect-chip" key={opt.value}>
                {opt.label}
                <i
                  className="ri-close-line"
                  onClick={(e) => removeValue(opt.value, e)}
                />
              </span>
            ))}
          </div>
        ) : (
          <span className="event-rule-multiselect-placeholder">{placeholder}</span>
        )}
        <i className={`ri-arrow-down-s-line event-rule-multiselect-caret ${open ? 'open' : ''}`} />
      </div>

      {open && (
        <div className="event-rule-multiselect-panel">
          <div className="event-rule-multiselect-search">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search..."
              value={search}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="event-rule-multiselect-options">
            {filteredOptions.length === 0 && (
              <div className="event-rule-multiselect-empty">No options found</div>
            )}
            {filteredOptions.map(opt => (
              <label className="event-rule-multiselect-option" key={opt.value}>
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── MasterDataView grid-card columns (list view) ────────────────────────────
const COLUMNS = [
  { key: 'event_display_name', label: 'Event Name', sortable: true, gridPrimary: true, width: "100px"},
  { key: 'country_display_name', label: 'Country', sortable: true, showInGrid: true , width: "125px", type: 'text-wrap'},
  { key: 'customer_country_display_name', label: 'Client Customer Country', sortable: true, showInGrid: true, width: "125px", type: 'text-wrap' },
  { key: 'company_type_display_name', label: 'Company Type', sortable: true, showInGrid: true, width: "125px" ,type: 'text-wrap'},
  { key: 'client_service_display', label: 'Client Service', sortable: true, showInGrid: true, width: "125px", type: 'text-wrap' },
  { key: 'jurisdiction_display_name', label: 'Jurisdiction', sortable: true, showInGrid: true, width: "125px", type: 'text-wrap' },
  { key: 'version_display', label: 'Version', sortable: true, showInGrid: true, width: "90px" },
  { key: 'version_status_label', label: 'Rule Status', sortable: true, showInGrid: true, badge: true, badgeMap: VERSION_STATUS_BADGE_MAP, width: "110px" },
  { key: 'effective_from_display', label: 'Effective From', sortable: true, showInGrid: true, width: "110px" },
  { key: 'status_label', label: 'Status', sortable: true, showInGrid: true, badge: true, width: "100px" },
];

const EventRule = () => {

  const [rules, setRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const [viewModal, setViewModal] = useState(false);
  const [viewRule, setViewRule] = useState(null);

  const [versionsModal, setVersionsModal] = useState(false);
  const [versionRows, setVersionRows] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [publishModal, setPublishModal] = useState(false);
  const [publishTarget, setPublishTarget] = useState(null);
  const [publishDate, setPublishDate] = useState('');
  const [lifecycleBusyId, setLifecycleBusyId] = useState(null);

  const loggedUser = getLoggedinUser();

  const updatedBy =
    loggedUser?.user_id ??
    loggedUser?.id ??
    1;

  document.title = 'ASR::CSS | Event Rules';

  const eventOptions = useMemo(() => optionsFrom(events, 'e_id', 'event_name'), [events]);
  const companyTypeOptions = useMemo(() => optionsFrom(companyTypes, 'company_type_id', 'company_type_name'), [companyTypes]);
  const countryOptions = useMemo(() => optionsFrom(countries, 'id', 'name'), [countries]);
  const jurisdictionOptions = useMemo(() => optionsFrom(jurisdictions, 'jurisdiction_id', 'name'), [jurisdictions]);
  const listNames = (options, values) => {
    const labels = toArray(values).map(value => labelOf(options, value)).filter(Boolean);
    return labels.length ? labels.join(', ') : 'All';
  };

  // ── Flattened rows for MasterDataView (list/grid/search all read plain keys) ──
  const tableRules = useMemo(() => rules.map(rule => ({
    ...rule,
    id: rule.rule_id,
    event_display_name: rule.event?.event_name || rule.event_slug || '-',
    country_display_name: listNames(countryOptions, rule.legacy_country_ids || rule.legacy_country_id_list),
    customer_country_display_name: listNames(countryOptions, rule.country_ids || rule.country_id_list),
    company_type_display_name: rule.company_type_display_name || listNames(companyTypeOptions, rule.company_type_ids || rule.company_type_id_list),
    client_service_display: rule.client_service_display || '-',
    jurisdiction_display_name: rule.jurisdiction_id ? (jurisdictionOptions.find(o => String(o.value) === String(rule.jurisdiction_id))?.label || '-') : 'Not jurisdiction-specific',
    status_label: rule.is_active ? 'Active' : 'Inactive',
    version_display: rule.is_system_default ? 'Locked' : `v${rule.version_no || 1}`,
    version_status_label: versionStatusLabel(rule.version_status),
    effective_from_display: rule.is_system_default ? 'Always' : (rule.effective_from || '-'),
  })), [rules, countryOptions, companyTypeOptions, jurisdictionOptions]);

  const load = async () => {

    setLoading(true);

    try {

      const [ruleRes, eventRes, typeRes, countryRes, jurisdictionRes] =
        await Promise.all([
          getCompanyEventRuleList({}),
          getCompanyEventNameList({ page: 1, limit: 300, event_type: 'EVENT', order: 'e_id:ASC' }),
          getCompanyTypeList({ page: 1, limit: 300, order: 'company_type_id:ASC' }),
          getCountriesList({ page: 1, limit: 300 }),
          getJurisdictionsList({ page: 1, limit: 500 }),
        ]);

      setRules(extract(ruleRes));
      setEvents(extract(eventRes));
      setCompanyTypes(extract(typeRes));
      setCountries(extract(countryRes));
      setJurisdictions(extract(jurisdictionRes));

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to load event rules',
        { autoClose: 3000 }
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getPhaseGroups = (phase) =>
    form.phases?.[phase]?.groups?.length ? form.phases[phase].groups : [emptyGroup()];

  const isSameAsFirstYear = (phase) =>
    phase === 'SUBSEQUENT' && form.phases?.SUBSEQUENT?.same_as_first_year === true;

  const updatePhaseGroups = (phase, groups) => {
    setForm(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phase]: {
          ...(prev.phases?.[phase] || {}),
          groups,
        },
      },
    }));
  };

  const updateGroup = (phase, groupIndex, patch) => {
    const groups = getPhaseGroups(phase);
    updatePhaseGroups(phase, groups.map((group, index) => (
      index === groupIndex ? { ...group, ...patch } : group
    )));
  };

  const updateCondition = (phase, groupIndex, conditionIndex, patch) => {
    const group = getPhaseGroups(phase)[groupIndex];
    updateGroup(phase, groupIndex, {
      conditions: group.conditions.map((condition, index) => (
        index === conditionIndex ? { ...condition, ...patch } : condition
      )),
    });
  };

  const updateStep = (phase, groupIndex, stepIndex, patch) => {
    const group = getPhaseGroups(phase)[groupIndex];
    updateGroup(phase, groupIndex, {
      steps: group.steps.map((step, index) => (
        index === stepIndex ? { ...step, ...patch } : step
      )),
    });
  };

  const updateFixedDate = (phase, groupIndex, stepIndex, patch) => {
    const step = getPhaseGroups(phase)[groupIndex].steps[stepIndex] || {};
    updateStep(phase, groupIndex, stepIndex, {
      fixed_date: {
        ...(step.fixed_date || {}),
        ...patch,
      },
    });
  };

  // ── Called by MasterDataView's "Add New" button (fields=[] bypasses its own modal) ──
  const openAdd = () => {
    setForm(emptyForm());
    setModal(true);
  };

  // ── Called by MasterDataView's row/card "Edit" button ──
  const openEdit = (rule) => {
    const firstGroups = rule?.rule_config?.phases?.FIRST?.groups?.length
      ? rule.rule_config.phases.FIRST.groups
      : rule?.rule_config?.groups?.length
        ? rule.rule_config.groups
        : [{ condition_mode: 'ALL', conditions: rule?.conditions || [], steps: rule?.steps || [emptyStep()], take: 'LATEST' }];
    const subsequentGroups = rule?.rule_config?.phases?.SUBSEQUENT?.groups?.length
      ? rule.rule_config.phases.SUBSEQUENT.groups
      : [emptyGroup()];
    const sameAsFirstYear = !(rule?.rule_config?.phases?.SUBSEQUENT && rule.rule_config.phases.SUBSEQUENT.same_as_first_year === false);
    const cleanConditions = (conditions = []) => {
      const rows = conditions.map(condition => ({
        ...emptyCondition(),
        ...condition,
        operator: condition.operator || 1,
        operator2: condition.operator2 || '',
        value2: condition.value2 || '',
      }));

      return rows;
    };
    const cleanSteps = (steps = []) => steps.map(step => ({
      ...emptyStep(),
      ...step,
      offset_value: normalizedOffsetValue(step),
      offset_unit: normalizedOffsetUnit(step),
      fixed_date: {
        ...emptyStep().fixed_date,
        ...(step.fixed_date || {}),
      },
    }));
    const cleanGroups = (groups) => groups.map(group => ({
      condition_mode: group.condition_mode || 'ALL',
      conditions: group.conditions?.length ? cleanConditions(group.conditions) : [],
      steps: group.steps?.length ? cleanSteps(group.steps) : [emptyStep()],
      take: group.take || 'LATEST',
    }));

    setForm({
      rule_id: rule.rule_id,
      event_id: rule.event_id ? String(rule.event_id) : '',
      country_ids: toArray(rule.country_ids || rule.country_id_list),
      legacy_country_ids: toArray(rule.legacy_country_ids || rule.legacy_country_id_list),
      company_type_ids: toArray(rule.company_type_ids || rule.company_type_id_list),
      jurisdiction_id: rule.jurisdiction_id ? String(rule.jurisdiction_id) : '',
      is_active: rule.is_active !== false,
      rule_priority: Number(rule.rule_priority || 0),
      phases: {
        FIRST: { groups: cleanGroups(firstGroups) },
        SUBSEQUENT: { groups: cleanGroups(subsequentGroups), same_as_first_year: sameAsFirstYear },
      },
    });
    setModal(true);
  };

  // ── Called by MasterDataView's row/card "View" extra action ──
  const openView = (rule) => {
    setViewRule(rule);
    setViewModal(true);
  };

  const saveRule = async () => {

    if (!form.event_id) {

      toast.error(
        'Event is required',
        { autoClose: 3000 }
      );

      return;
    }

    if (!form.legacy_country_ids.length) {
      toast.error('Country is required', { autoClose: 3000 });
      return;
    }

    if (!form.country_ids.length) {
      toast.error('Client customer country is required', { autoClose: 3000 });
      return;
    }

    if (!form.company_type_ids.length) {
      toast.error('Company type is required', { autoClose: 3000 });
      return;
    }

    setSaving(true);

    try {

      const normalizeFixedDate = (fixedDate = {}) => ['day', 'month', 'year'].reduce((acc, part) => {
        const modeKey = `${part}_mode`;
        const fieldKey = `${part}_field`;
        const mode = fixedDate[modeKey] || 'VALUE';

        acc[modeKey] = mode;
        acc[part] = mode === 'VALUE' ? fixedDate[part] || '' : '';
        acc[fieldKey] = mode === 'FIELD' ? fixedDate[fieldKey] || '' : '';

        return acc;
      }, {});

      const phases = Object.fromEntries(PHASES.map(([phase]) => {
        const phaseConfig = form.phases?.[phase] || {};
        const sourceGroups = phase === 'SUBSEQUENT' && phaseConfig.same_as_first_year
          ? getPhaseGroups('FIRST')
          : getPhaseGroups(phase);

        return [
          phase,
          {
            ...(phaseConfig || {}),
            same_as_first_year: phase === 'SUBSEQUENT' ? Boolean(phaseConfig.same_as_first_year) : undefined,
            groups: sourceGroups.slice(0, 1).map(group => ({
              ...group,
              condition_mode: 'ALL',
              take: 'LATEST',
              conditions: (group.conditions || []).map(condition => ({
                ...condition,
                operator2: condition.operator2 || '',
                value2: condition.value2 || '',
              })),
              steps: (group.steps || []).map(step => ({
                ...step,
                offset: {
                  value: Number(normalizedOffsetValue(step) || 0),
                  unit: normalizedOffsetUnit(step),
                },
                offset_value: Number(normalizedOffsetValue(step) || 0),
                offset_unit: normalizedOffsetUnit(step),
                fixed_date: normalizeFixedDate(step.fixed_date),
              })),
            })),
          },
        ];
      }));

      await saveCompanyEventRule({
        ...form,
        phases,
        country_ids: form.country_ids.join(','),
        legacy_country_ids: form.legacy_country_ids.join(','),
        company_type_ids: form.company_type_ids.join(','),
        jurisdiction_id: form.jurisdiction_id || null,
        rule_config: {
          phases,
          groups: phases.FIRST.groups,
        },
        updated_by: updatedBy,
        created_by: updatedBy,
      });

      toast.success(
        'Event rule saved successfully',
        { autoClose: 3000 }
      );

      setModal(false);

      await load();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to save event rule',
        { autoClose: 3000 }
      );

    } finally {

      setSaving(false);

    }
  };

  // ── Called by MasterDataView's built-in delete confirmation modal ──
  const deleteRule = async (rule) => {

    const id =
      rule?.rule_id ??
      rule?.id;

    if (!id) return;

    setLoading(true);

    try {

      await deleteCompanyEventRule(id, { updated_by: updatedBy });

      toast.success(
        'Event rule deleted successfully',
        { autoClose: 3000 }
      );

      await load();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to delete event rule',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  // ── Rule version lifecycle (spec §5.3): DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED,
  //    or → RETIRED. Editing a governed rule creates a new DRAFT instead of mutating it
  //    in place, so this list re-fetches after every transition to pick up the change. ──
  const openVersions = async (rule) => {
    setVersionsModal(true);
    setVersionsLoading(true);

    try {

      const res = await getEventRuleVersions(rule.rule_id);
      setVersionRows(extract(res));

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to load rule versions',
        { autoClose: 3000 }
      );

    } finally {

      setVersionsLoading(false);

    }
  };

  const refreshVersionsIfOpen = async (rule) => {
    if (versionsModal) await openVersions(rule);
  };

  const runLifecycleAction = async (rule, action, successMessage) => {
    setLifecycleBusyId(rule.rule_id);

    try {

      await action();

      toast.success(successMessage, { autoClose: 3000 });

      await load();
      await refreshVersionsIfOpen(rule);

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to update rule status',
        { autoClose: 3000 }
      );

    } finally {

      setLifecycleBusyId(null);

    }
  };

  const handleSubmitForReview = (rule) =>
    runLifecycleAction(rule, () => submitEventRuleForReview(rule.rule_id, { updated_by: updatedBy }), 'Rule submitted for review');

  const handleApprove = (rule) =>
    runLifecycleAction(rule, () => approveEventRule(rule.rule_id, { updated_by: updatedBy }), 'Rule approved');

  const handleRetire = (rule) =>
    runLifecycleAction(rule, () => retireEventRule(rule.rule_id, { updated_by: updatedBy }), 'Rule retired');

  const openPublish = (rule) => {
    setPublishTarget(rule);
    setPublishDate(new Date().toISOString().slice(0, 10));
    setPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!publishTarget) return;

    await runLifecycleAction(
      publishTarget,
      () => publishEventRule(publishTarget.rule_id, { effective_from: publishDate, updated_by: updatedBy }),
      'Rule published'
    );

    setPublishModal(false);
    setPublishTarget(null);
  };

  // ── Extra "View" / lifecycle actions next to Edit/Delete on both list rows and grid cards ──
  const extraActions = (row) => (
    <>
      <button className="btn btn-sm btn-soft-info" onClick={() => openView(row)}>
        <i className="ri-eye-fill me-1"></i>View
      </button>
      {!row.is_system_default && <button className="btn btn-sm btn-soft-secondary" onClick={() => openVersions(row)}>
        <i className="ri-git-branch-line me-1"></i>Versions
      </button>}
      {!row.is_system_default && row.version_status === 'DRAFT' && (
        <button className="btn btn-sm btn-soft-warning" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleSubmitForReview(row)}>
          <i className="ri-send-plane-fill me-1"></i>Submit
        </button>
      )}
      {!row.is_system_default && row.version_status === 'UNDER_REVIEW' && (
        <button className="btn btn-sm btn-soft-info" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleApprove(row)}>
          <i className="ri-checkbox-circle-fill me-1"></i>Approve
        </button>
      )}
      {!row.is_system_default && row.version_status === 'APPROVED' && (
        <button className="btn btn-sm btn-soft-success" disabled={lifecycleBusyId === row.rule_id} onClick={() => openPublish(row)}>
          <i className="ri-upload-cloud-2-fill me-1"></i>Publish
        </button>
      )}
      {!row.is_system_default && ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(row.version_status) && (
        <button className="btn btn-sm btn-soft-danger" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleRetire(row)}>
          <i className="ri-close-circle-fill me-1"></i>Retire
        </button>
      )}
    </>
  );

  const renderFixedDatePart = (phase, groupIndex, stepIndex, step, part, label, fieldOptions = FIXED_DATE_FIELDS) => {
    const modeKey = `${part}_mode`;
    const valueKey = part;
    const fieldKey = `${part}_field`;
    const mode = step.fixed_date?.[modeKey] || 'VALUE';

    return (
      <>
        <Col md={2}>
          <Label className="erb-label">{label}</Label>
          <Input
            type="select"
            bsSize="sm"
            value={mode}
            onChange={e => updateFixedDate(phase, groupIndex, stepIndex, { [modeKey]: e.target.value })}
          >
            <option value="">{`Select ${label}`}</option>
            {FIXED_DATE_MODES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </Input>
        </Col>
        <Col md={2}>
          <Label className="erb-label">{mode === 'FIELD' ? `${label} Field` : `${label} Value`}</Label>
          {mode === 'FIELD' ? (
            <Input
              type="select"
              bsSize="sm"
              value={step.fixed_date?.[fieldKey] || ''}
              onChange={e => updateFixedDate(phase, groupIndex, stepIndex, { [fieldKey]: e.target.value })}
            >
              <option value="">Select Field</option>
              {fieldOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </Input>
          ) : (
            <DatePickerInput
              name={`fixed_${phase}_${groupIndex}_${stepIndex}_${part}`}
              value={step.fixed_date?.[valueKey] || ''}
              onChange={e => updateFixedDate(phase, groupIndex, stepIndex, { [valueKey]: e.target.value })}
              placeholder={part === 'year' ? 'YYYY' : part === 'month' ? 'MM' : 'DD'}
              options={fixedDatePickerOptions(part)}
            />
          )}
        </Col>
      </>
    );
  };

  const stepBaseLabel = (step = {}) => {
    if (step.reference_logic === 'EVENT') return labelOf(eventOptions, step.event_id);
    if (step.reference_logic === 'FIELD') return pairLabel(REF_FIELDS, step.field);
    if (step.reference_logic === 'FIXED_DATE') {
      const fixedDate = step.fixed_date || {};
      const partLabel = part => fixedDate[`${part}_field`]
        ? pairLabel(FIXED_DATE_YEAR_FIELDS, fixedDate[`${part}_field`])
        : fixedDate[part] || '--';

      return `${partLabel('day')}/${partLabel('month')}/${partLabel('year')}`;
    }
    if (step.reference_logic === 'CLIENT_DEFINED') return 'Client defined';
    return '-';
  };

  const summarizeDueDate = (step = {}) => {
    const baseLabel = step.reference_logic === 'FIELD'
      ? pairLabel(REF_FIELDS, step.field)
      : step.reference_logic === 'EVENT'
        ? labelOf(eventOptions, step.event_id)
        : step.reference_logic === 'FIXED_DATE'
          ? 'Fixed Date'
          : 'Client Defined';

    const value = Math.abs(Number(normalizedOffsetValue(step) || 0));
    const unit = pairLabel(OFFSET_UNITS, normalizedOffsetUnit(step));
    const sign = Number(normalizedOffsetValue(step) || 0) >= 0 ? '+' : '-';

    return `${baseLabel} ${sign} ${value} ${unit}`;
  };

  return (
    <div>
      <style>{pageCss}</style>

      <MasterDataView
        title="Company Event Rules"
        listId="companyEventRuleList"
        columnLabel="Rule"
        modalTitle="Event Rule"
        columns={COLUMNS}
        fields={[]}
        data={tableRules}
        loading={loading}
        emptyMessage="No event rules found."
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={deleteRule}
        canEdit={row => !row.is_system_default}
        canDelete={row => !row.is_system_default}
        highlightSystemDefaults
        extraActions={extraActions}
      />

      {/* ── Read-only detail view ── */}
      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered scrollable>
        <ModalHeader className="bg-light p-3" toggle={() => setViewModal(false)}>
          {viewRule?.event?.event_name || viewRule?.event_slug}
        </ModalHeader>
        <ModalBody>
          {viewRule && (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="badge bg-primary-subtle text-primary">
                  {viewRule.event?.event_name || viewRule.event_slug}
                </span>
                <span className="badge bg-light text-body border">First + Subsequent</span>
                {viewRule.is_system_default && <span className="badge bg-primary-subtle text-primary"><i className="ri-lock-line me-1" />Read only system default</span>}
                <span className={`badge bg-${viewRule.is_active ? 'success' : 'danger'}-subtle text-${viewRule.is_active ? 'success' : 'danger'}`}>
                  {viewRule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <Row className="g-3 mb-3">
                <Col md={6}>
                  <Card className="shadow-none border mb-0 h-100">
                    <CardBody className="py-2 px-3">
                      <div className="fs-12 text-muted mb-1">Customer Countries</div>
                      <div className="fw-semibold fs-13">{listNames(countryOptions, viewRule.country_ids || viewRule.country_id_list)}</div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-none border mb-0 h-100">
                    <CardBody className="py-2 px-3">
                      <div className="fs-12 text-muted mb-1">Required Client Service</div>
                      <div className="fw-semibold fs-13">{viewRule.client_service_display || 'Defined by rule scope'}</div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-none border mb-0 h-100">
                    <CardBody className="py-2 px-3">
                      <div className="fs-12 text-muted mb-1">Company Types</div>
                      <div className="fw-semibold fs-13">{viewRule.company_type_display_name || listNames(companyTypeOptions, viewRule.company_type_ids || viewRule.company_type_id_list)}</div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="shadow-none border mb-0 h-100">
                    <CardBody className="py-2 px-3">
                      <div className="fs-12 text-muted mb-1">Jurisdiction</div>
                      <div className="fw-semibold fs-13">
                        {viewRule.jurisdiction_id ? (jurisdictionOptions.find(o => String(o.value) === String(viewRule.jurisdiction_id))?.label || '-') : 'Not jurisdiction-specific'}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {PHASES.map(([phase, phaseLabel, phaseIcon, phaseAccent]) => {
                const groups = viewRule.rule_config?.phases?.[phase]?.groups
                  || ((phase === 'FIRST' || viewRule.is_system_default) ? viewRule.rule_config?.groups : [])
                  || [];

                return (
                  <Card className="shadow-none border erb-phase-card mb-3" key={`view-phase-${phase}`} style={{ '--erb-accent': phaseAccent }}>
                    <CardHeader className="bg-light py-2 d-flex align-items-center gap-2">
                      <span className="erb-badge" style={{ background: phaseAccent }}><i className={phaseIcon} /></span>
                      <h6 className="mb-0 fs-13 fw-semibold">{phaseLabel}</h6>
                    </CardHeader>
                    <CardBody>
                      {groups.map((group, groupIndex) => (
                        <div className="mb-3" key={`view-group-${phase}-${groupIndex}`}>
                          {groups.length > 1 && (
                            <div className="fs-12 text-muted fw-semibold mb-2">Condition Group {groupIndex + 1}</div>
                          )}

                          <Table responsive size="sm" className="table-light mb-3">
                            <thead className="table-light">
                              <tr>
                                <th>Condition</th>
                                <th>Operator 1</th>
                                <th>Value 1</th>
                                <th>Operator 2</th>
                                <th>Value 2</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.conditions?.length ? group.conditions.map((condition, index) => (
                                <tr key={`condition-view-${index}`}>
                                  <td>{pairLabel(CONDITION_FIELDS, condition.field)}</td>
                                  <td><span className="badge bg-secondary-subtle text-secondary">{pairLabel(OPERATORS, condition.operator)}</span></td>
                                  <td>{condition.value || '-'}</td>
                                  <td>{condition.operator2 ? <span className="badge bg-secondary-subtle text-secondary">{pairLabel(OPERATORS, condition.operator2)}</span> : '-'}</td>
                                  <td>{condition.value2 || '-'}</td>
                                </tr>
                              )) : (
                                <tr><td colSpan="5" className="text-muted">No condition. Applies when filters match.</td></tr>
                              )}
                            </tbody>
                          </Table>

                          {(group.steps || []).map((step, index) => (
                            <div className="erb-timeline-item" key={`step-view-${index}`} style={{ '--erb-accent': phaseAccent }}>
                              <div className="erb-timeline-rail">
                                <span className="erb-badge">{index + 1}</span>
                                {index < (group.steps || []).length - 1 && <span className="erb-line" />}
                              </div>
                              <div className="erb-timeline-body">
                                <div>
                                  <div className="erb-tl-ref">{pairLabel(REF_LOGICS, step.reference_logic)} — {stepBaseLabel(step)}</div>
                                  <div className="erb-tl-meta">{step.end_month ? 'Rounds to end of month' : 'Exact date'}</div>
                                </div>
                                <span className="badge bg-primary-subtle text-primary">
                                  {Number(normalizedOffsetValue(step) || 0)} {pairLabel(OFFSET_UNITS, normalizedOffsetUnit(step))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                      {!groups.length && (
                        <div className="erb-phase-empty-note">No {phaseLabel.toLowerCase()} logic configured.</div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </>
          )}
        </ModalBody>
        <div className="hstack gap-2 justify-content-end p-3 border-top">
          <button type="button" className="btn btn-light" onClick={() => setViewModal(false)}>Close</button>
          {!viewRule?.is_system_default && <button type="button" className="btn btn-success" onClick={() => { setViewModal(false); openEdit(viewRule); }}>
            <i className="ri-pencil-fill me-1" />
            Edit
          </button>}
        </div>
      </Modal>

      {/* ── Add / Edit builder modal (condition groups, conditions, reference steps) ── */}
      <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" centered scrollable>
        <ModalHeader className="bg-light p-3" toggle={() => setModal(false)}>
          {form.rule_id ? 'Edit Event Rule' : 'New Event Rule'}
        </ModalHeader>
        <ModalBody>
          <Card className="shadow-none border mb-3">
            <CardHeader className="bg-light py-2">
              <h6 className="mb-0 fs-13 fw-semibold">Event Rule Information</h6>
            </CardHeader>
            <CardBody>
              <Row className="g-3">
                <Col md={6}>
                  <Label className="erb-label">Event Name: <span className="erb-required">*</span></Label>
                  <Input type="select" bsSize="sm" value={form.event_id} onChange={e => updateForm('event_id', e.target.value)}>
                    <option value="">Select Event</option>
                    {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Input>
                </Col>
                <Col md={6}>
                  <Label className="erb-label">Country: <span className="erb-required">*</span></Label>
                  <MultiSelect value={form.legacy_country_ids} options={countryOptions} onChange={value => updateForm('legacy_country_ids', value)} />
                </Col>
                <Col md={6}>
                  <Label className="erb-label">Client Customer Country: <span className="erb-required">*</span></Label>
                  <MultiSelect value={form.country_ids} options={countryOptions} onChange={value => updateForm('country_ids', value)} />
                </Col>
                <Col md={6}>
                  <Label className="erb-label">Company Type: <span className="erb-required">*</span></Label>
                  <MultiSelect value={form.company_type_ids} options={companyTypeOptions} onChange={value => updateForm('company_type_ids', value)} />
                </Col>
                <Col md={6}>
                  <Label className="erb-label">Jurisdiction (optional — state/province, free zone or municipality)</Label>
                  <Input type="select" bsSize="sm" value={form.jurisdiction_id} onChange={e => updateForm('jurisdiction_id', e.target.value)}>
                    <option value="">Not jurisdiction-specific</option>
                    {jurisdictionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Input>
                </Col>
                <Col md={3}>
                  <Label className="erb-label">Priority</Label>
                  <Input
                    bsSize="sm"
                    type="number"
                    value={form.rule_priority}
                    onChange={e => updateForm('rule_priority', Number(e.target.value || 0))}
                  />
                  <div className="erb-help">Higher priority wins when more than one published rule matches.</div>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <div className="form-check form-switch mb-2">
                    <Input id="rule_active" type="switch" checked={form.is_active} onChange={e => updateForm('is_active', e.target.checked)} />
                    <Label for="rule_active" className="form-check-label">
                      Status:{' '}
                      <span className={`badge bg-${form.is_active ? 'success' : 'danger'}-subtle text-${form.is_active ? 'success' : 'danger'}`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </Label>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {PHASES.map(([phase, phaseLabel, phaseIcon, phaseAccent]) => {
            const sameAsFirst = phase === 'SUBSEQUENT' && Boolean(form.phases?.SUBSEQUENT?.same_as_first_year);
            const groups = sameAsFirst ? getPhaseGroups('FIRST') : getPhaseGroups(phase);
            const firstYearSummary = form.phases?.FIRST?.groups?.[0]?.steps?.[0]
              ? summarizeDueDate(form.phases.FIRST.groups[0].steps[0])
              : 'Financial Year End + 0 Days';

            return (
              <Card className="shadow-none border erb-phase-card mb-3" key={`form-phase-${phase}`} style={{ '--erb-accent': phaseAccent }}>
                <CardHeader className="bg-light py-2 d-flex align-items-center gap-2">
                  <span className="erb-badge" style={{ background: phaseAccent }}><i className={phaseIcon} /></span>
                  <h6 className="mb-0 fs-13 fw-semibold">{phaseLabel}</h6>
                </CardHeader>

                <CardBody>
                  {phase === 'SUBSEQUENT' && (
                    <div className="mb-3 form-check">
                      <Input
                        id={`same-as-first-${phase}`}
                        type="checkbox"
                        checked={sameAsFirst}
                        onChange={e => {
                          const checked = e.target.checked;
                          setForm(prev => ({
                            ...prev,
                            phases: {
                              ...prev.phases,
                              SUBSEQUENT: {
                                ...(prev.phases?.SUBSEQUENT || {}),
                                same_as_first_year: checked,
                                groups: checked ? (prev.phases?.FIRST?.groups || [emptyGroup()]) : (prev.phases?.SUBSEQUENT?.groups || [emptyGroup()]),
                              },
                            },
                          }));
                        }}
                      />
                      <Label for={`same-as-first-${phase}`} className="form-check-label">Same calculation as First Year</Label>
                    </div>
                  )}
                  {phase === 'SUBSEQUENT' && sameAsFirst ? (
                    <div className="border rounded p-3 bg-light">
                      <div className="text-muted small fw-semibold mb-2">Using First Year rule</div>
                      <div className="fw-semibold">{firstYearSummary}</div>
                    </div>
                  ) : (
                    groups.slice(0, 1).map((group, groupIndex) => (
                      <div key={`form-group-${phase}-${groupIndex}`}>
                      <div className="erb-action-row">
                        {phase === 'FIRST' && (
                          <button
                            type="button"
                            className="btn btn-soft-success btn-sm"
                            onClick={() => updateGroup(phase, groupIndex, { conditions: [...group.conditions, emptyCondition()] })}
                          >
                            <i className="ri-add-line me-1" />
                            Condition
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-soft-success btn-sm"
                          onClick={() => updateGroup(phase, groupIndex, { steps: [...group.steps, emptyStep()] })}
                        >
                          <i className="ri-add-line me-1" />
                          Reference
                        </button>
                      </div>

                      {phase === 'FIRST' && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="text-muted small fw-semibold">Applies to: All matching companies</div>
                            <button
                              type="button"
                              className="btn btn-soft-success btn-sm"
                              onClick={() => updateGroup(phase, groupIndex, { conditions: [...(group.conditions || []), emptyCondition()] })}
                            >
                              <i className="ri-add-line me-1" />
                              Add Condition
                            </button>
                          </div>
                        </div>
                      )}

                      {phase === 'FIRST' && group.conditions.length > 0 && group.conditions.map((condition, conditionIndex) => (
                        <div className="erb-condition-card" key={`condition-${phase}-${groupIndex}-${conditionIndex}`}>
                          <div className="erb-condition-head">
                            <span className="erb-badge" style={{ background: '#20af49', color: '#f6faf7' }}>{conditionIndex + 1}</span>
                            <span>Condition</span>
                          </div>
                          <Row className="g-2 align-items-end">
                            <Col md={4}>
                              <Label className="erb-label">Field</Label>
                              <Input type="select" bsSize="sm" value={condition.field} onChange={e => updateCondition(phase, groupIndex, conditionIndex, { field: e.target.value })}>
                                <option value="">Select Field</option>
                                {CONDITION_FIELDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </Input>
                            </Col>
                            <Col md={3}>
                              <Label className="erb-label">Operator</Label>
                              <Input type="select" bsSize="sm" value={condition.operator} onChange={e => updateCondition(phase, groupIndex, conditionIndex, { operator: Number(e.target.value) })}>
                                <option value="">--</option>
                                {OPERATORS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </Input>
                            </Col>
                            <Col md={3}>
                              <Label className="erb-label">Value</Label>
                              <Input bsSize="sm" value={condition.value} onChange={e => updateCondition(phase, groupIndex, conditionIndex, { value: e.target.value })} placeholder={conditionValuePlaceholder(condition.field)} />
                            </Col>
                            <Col md={2}>
                              {group.conditions.length > 1 ? (
                                <button type="button" className="btn btn-soft-danger btn-sm w-100" onClick={() => updateGroup(phase, groupIndex, { conditions: group.conditions.filter((_, index) => index !== conditionIndex) })}>
                                  <i className="ri-delete-bin-fill" />
                                </button>
                              ) : (
                                <button type="button" className="btn btn-light btn-sm w-100" disabled>
                                  <i className="ri-lock-line" />
                                </button>
                              )}
                            </Col>
                          </Row>

                          {condition.operator2 || condition.value2 ? (
                            <Row className="g-2 align-items-end mt-2">
                              <Col md={4}>
                                <Label className="erb-label">And</Label>
                                <Input type="select" bsSize="sm" value={condition.operator2 || ''} onChange={e => updateCondition(phase, groupIndex, conditionIndex, { operator2: e.target.value ? Number(e.target.value) : '' })}>
                                  <option value="">--</option>
                                  {OPERATORS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </Input>
                              </Col>
                              <Col md={8}>
                                <Label className="erb-label">Value</Label>
                                <Input bsSize="sm" value={condition.value2 || ''} onChange={e => updateCondition(phase, groupIndex, conditionIndex, { value2: e.target.value })} placeholder="Optional" />
                              </Col>
                            </Row>
                          ) : null}
                        </div>
                      ))}

                      <div>
                        {group.steps.map((step, stepIndex) => (
                          <div className="erb-step-row" key={`step-${phase}-${groupIndex}-${stepIndex}`}>
                            <div className="erb-step-rail">
                              <span className="erb-badge">{stepIndex + 1}</span>
                              {stepIndex < group.steps.length - 1 && <span className="erb-line" />}
                            </div>
                            <div className="erb-step-card">
                              <div className="erb-step-head">
                                <span>Calculate Due Date</span>
                              </div>
                              <Row className="g-2 align-items-end">
                                <Col md={4}>
                                  <Label className="erb-label">Base Date</Label>
                                  <Input type="select" bsSize="sm" value={step.field || ''} onChange={e => updateStep(phase, groupIndex, stepIndex, { field: e.target.value, reference_logic: 'FIELD' })}>
                                    <option value="">Select Base Date</option>
                                    {BASE_DATE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                                  </Input>
                                </Col>
                                <Col md={2}>
                                  <Label className="erb-label">Calculation</Label>
                                  <Input type="select" bsSize="sm" value={step.offset_value >= 0 ? 'ADD' : 'SUBTRACT'} onChange={e => updateStep(phase, groupIndex, stepIndex, { offset_value: Math.abs(Number(normalizedOffsetValue(step) || 0)) })}>
                                    <option value="ADD">+</option>
                                    <option value="SUBTRACT">-</option>
                                  </Input>
                                </Col>
                                <Col md={2}>
                                  <Label className="erb-label">Number</Label>
                                  <Input bsSize="sm" type="number" value={Math.abs(normalizedOffsetValue(step))} onChange={e => updateStep(phase, groupIndex, stepIndex, { offset_value: Number(e.target.value || 0) })} />
                                </Col>
                                <Col md={4}>
                                  <Label className="erb-label">Unit</Label>
                                  <Input bsSize="sm" type="select" value={normalizedOffsetUnit(step)} onChange={e => updateStep(phase, groupIndex, stepIndex, { offset_unit: e.target.value })}>
                                    <option value="">Select</option>
                                    {OFFSET_UNITS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                  </Input>
                                </Col>
                              </Row>

                              <div className="mt-3 form-check">
                                <Input id={`eom-${phase}-${groupIndex}-${stepIndex}`} type="checkbox" checked={!!step.end_month} onChange={e => updateStep(phase, groupIndex, stepIndex, { end_month: e.target.checked })} />
                                <Label for={`eom-${phase}-${groupIndex}-${stepIndex}`} className="form-check-label">Use end of month</Label>
                              </div>

                              {step.reference_logic === 'FIXED_DATE' && (
                                <div className="erb-fixed-grid">
                                  <Row className="g-2 align-items-end">
                                    {renderFixedDatePart(phase, groupIndex, stepIndex, step, 'day', 'Day')}
                                    {renderFixedDatePart(phase, groupIndex, stepIndex, step, 'month', 'Month')}
                                    {renderFixedDatePart(phase, groupIndex, stepIndex, step, 'year', 'Year', FIXED_DATE_YEAR_FIELDS)}
                                  </Row>
                                </div>
                              )}

                              {step.reference_logic === 'EVENT' && (
                                <div className="erb-fixed-grid">
                                  <Row className="g-2 align-items-end">
                                    <Col md={6}>
                                      <Label className="erb-label">Related Event</Label>
                                      <Input type="select" bsSize="sm" value={step.event_id || ''} onChange={e => updateStep(phase, groupIndex, stepIndex, { event_id: e.target.value, reference_logic: 'EVENT' })}>
                                        <option value="">Select Event</option>
                                        {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                      </Input>
                                    </Col>
                                  </Row>
                                </div>
                              )}

                              {group.steps.length > 1 && (
                                <div className="mt-3 d-flex justify-content-end">
                                  <button
                                    type="button"
                                    className="btn btn-soft-danger btn-sm"
                                    onClick={() => updateGroup(phase, groupIndex, { steps: group.steps.filter((_, index) => index !== stepIndex) })}
                                  >
                                    <i className="ri-delete-bin-fill me-1" />
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    ))
                  )}
                </CardBody>
              </Card>
            );
          })}
        </ModalBody>
        <div className="hstack gap-2 justify-content-end p-3 border-top">
          <button type="button" className="btn btn-light" disabled={saving} onClick={() => setModal(false)}>Close</button>
          <button type="button" className="btn btn-success" disabled={saving} onClick={saveRule}>
            {saving && <Spinner size="sm" className="me-2" />}
            {form.rule_id ? 'Update' : 'Save'}
          </button>
        </div>
      </Modal>

      {/* ── Version history: every DRAFT/UNDER_REVIEW/APPROVED/PUBLISHED/SUPERSEDED/
           RETIRED row sharing the same rule_code, newest version first ── */}
      <Modal isOpen={versionsModal} toggle={() => setVersionsModal(false)} size="lg" centered scrollable>
        <ModalHeader className="bg-light p-3" toggle={() => setVersionsModal(false)}>
          Rule Versions
        </ModalHeader>
        <ModalBody>
          {versionsLoading ? (
            <div className="text-center py-4"><Spinner size="sm" /></div>
          ) : versionRows.length === 0 ? (
            <div className="erb-empty">No versions found.</div>
          ) : (
            <Table responsive size="sm" className="table-light mb-0">
              <thead className="table-light">
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {versionRows.map(row => (
                  <tr key={row.rule_id}>
                    <td>v{row.version_no || 1}</td>
                    <td>
                      <span className={`badge bg-${VERSION_STATUS_BADGE[row.version_status] || 'secondary'}-subtle text-${VERSION_STATUS_BADGE[row.version_status] || 'secondary'}`}>
                        {versionStatusLabel(row.version_status)}
                      </span>
                    </td>
                    <td>{row.rule_priority ?? 0}</td>
                    <td>{row.effective_from || '-'}</td>
                    <td>{row.effective_to || '-'}</td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end flex-wrap">
                        {row.version_status === 'DRAFT' && (
                          <button className="btn btn-xs btn-soft-warning" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleSubmitForReview(row)}>Submit</button>
                        )}
                        {row.version_status === 'UNDER_REVIEW' && (
                          <button className="btn btn-xs btn-soft-info" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleApprove(row)}>Approve</button>
                        )}
                        {row.version_status === 'APPROVED' && (
                          <button className="btn btn-xs btn-soft-success" disabled={lifecycleBusyId === row.rule_id} onClick={() => openPublish(row)}>Publish</button>
                        )}
                        {['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(row.version_status) && (
                          <button className="btn btn-xs btn-soft-danger" disabled={lifecycleBusyId === row.rule_id} onClick={() => handleRetire(row)}>Retire</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </ModalBody>
        <div className="hstack gap-2 justify-content-end p-3 border-top">
          <button type="button" className="btn btn-light" onClick={() => setVersionsModal(false)}>Close</button>
        </div>
      </Modal>

      {/* ── Publish confirmation: publishing supersedes whatever was previously
           PUBLISHED under this rule's rule_code, so the effective date matters ── */}
      <Modal isOpen={publishModal} toggle={() => setPublishModal(false)} centered>
        <ModalHeader className="bg-light p-3" toggle={() => setPublishModal(false)}>
          Publish Rule
        </ModalHeader>
        <ModalBody>
          <p className="text-muted fs-13">
            Publishing makes this version the one used for future compliance calendar
            generation from the effective date below, and supersedes any version currently
            published for this rule.
          </p>
          <Label className="erb-label">Effective From: <span className="erb-required">*</span></Label>
          <DatePickerInput
            name="publish_effective_from"
            value={publishDate}
            onChange={e => setPublishDate(e.target.value)}
          />
        </ModalBody>
        <div className="hstack gap-2 justify-content-end p-3 border-top">
          <button type="button" className="btn btn-light" onClick={() => setPublishModal(false)}>Cancel</button>
          <button type="button" className="btn btn-success" disabled={!publishDate || lifecycleBusyId === publishTarget?.rule_id} onClick={confirmPublish}>
            {lifecycleBusyId === publishTarget?.rule_id && <Spinner size="sm" className="me-2" />}
            Publish
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EventRule;
