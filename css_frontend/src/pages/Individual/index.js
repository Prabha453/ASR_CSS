import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Card, Button, Spinner, Modal, ModalBody } from 'reactstrap';
import classnames from 'classnames';
import { toast } from 'react-toastify';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { changeFooterVisibility } from '../../slices/layouts/thunk';
import {
  createIndividual,
  updateIndividual,
  getIndividual,
  getCountriesList,
  getIndividualFieldHistory,
  saveIndividualFieldChange,
  deleteDocumentStore,
} from '../../helpers/backend_helper';
import { extractApiList } from './individualUtils';
import { getLoggedinUser }  from '../../helpers/api_helper';
import './Individual.css';

import Step1Individual     from './steps/Step1Individual';
import Step2Consent        from './steps/Step2Consent';
import Step3IndividualID   from './steps/Step3IndividualID';
import Step4Address        from './steps/Step4Address';
import Step5ContactDetails from './steps/Step5ContactDetails';
import Step6CompanyContacts from './steps/Step6CompanyContacts';

/* ─── step config ──────────────────────────────────────────── */
const BASE_STEPS = [
  { key: 'individual', label: 'Individual',      subLabel: 'Personal details & category',      icon: 'ri-user-3-line',         component: Step1Individual     },
  { key: 'ids',        label: 'ID Documents',    subLabel: 'Identification & uploads',          icon: 'ri-id-card-line',        component: Step3IndividualID   },
  { key: 'address',    label: 'Address',         subLabel: 'Default, contact & residential',   icon: 'ri-map-pin-2-line',      component: Step4Address        },
  { key: 'contact',    label: 'Contact Details', subLabel: 'Email, phone & services',           icon: 'ri-phone-line',          component: Step5ContactDetails },
  { key: 'consent',    label: 'Consent',         subLabel: 'Notification opt-out preferences', icon: 'ri-notification-3-line', component: Step2Consent        },
];

const COMPANY_CONTACT_STEP = {
  key: 'companyContacts',
  label: 'Company Contacts',
  subLabel: 'Official company contact details',
  icon: 'ri-contacts-book-2-line',
  component: Step6CompanyContacts,
};

const buildSteps = (showCompanyContacts) => {
  const steps = [...BASE_STEPS];
  if (showCompanyContacts) steps.splice(4, 0, COMPANY_CONTACT_STEP);
  return steps.map((step, index) => ({ ...step, id: index + 1 }));
};

const validateCompanyContacts = (contacts = []) => {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneFields = [['mobile', 'Mobile No'], ['telephone', 'Telephone No'], ['office', 'Office No']];

  contacts.forEach((contact, index) => {
    if (contact.email?.trim() && !emailPattern.test(contact.email.trim())) {
      errors.push(`Company Contact #${index + 1}: Invalid email format.`);
    }
    phoneFields.forEach(([field, label]) => {
      const value = contact[field];
      if (!value?.trim()) return;
      if (value.replace(/\D/g, '').length !== 8) {
        errors.push(`Company Contact #${index + 1}: ${label} must be exactly 8 digits.`);
      }
    });
  });

  return errors;
};

const getCompanyContactRoleText = (contact = {}) => {
  const groups = contact.official_role_groups;
  const roles = groups && typeof groups === 'object' && !Array.isArray(groups) && Object.keys(groups).length
    ? groups
    : contact.official_roles;

  if (roles && typeof roles === 'object' && !Array.isArray(roles)) {
    return Object.keys(roles).filter(Boolean).join(', ');
  }

  if (Array.isArray(roles)) {
    return roles
      .map(role => role?.role_name || role?.official_master_slug || role)
      .filter(Boolean)
      .join(', ');
  }

  return String(roles || '').trim();
};

const getCompanyContactRoleGroups = (contact = {}) => {
  const groups = contact.official_role_groups ||
    (contact.official_roles && typeof contact.official_roles === 'object' && !Array.isArray(contact.official_roles)
      ? contact.official_roles
      : null);

  return groups && Object.keys(groups).length ? groups : null;
};

const mapCompanyContacts = (contacts = []) => contacts.map(contact => ({
  contact_id:         contact.contact_id || null,
  entity_id:          contact.entity_id || null,
  official_entity_id: contact.official_entity_id || null,
  company_name:       contact.company_name || '',
  official_roles:     getCompanyContactRoleText(contact),
  official_role_groups: getCompanyContactRoleGroups(contact),
  email:              contact.email || '',
  mobile:             contact.mobile || '',
  mobile_code:        contact.mobile_code || '+65',
  telephone:          contact.telephone || '',
  telephone_code:     contact.telephone_code || '+65',
  office:             contact.office || '',
  office_code:        contact.office_code || '+65',
  ext_no:             contact.ext_no || '',
}));

const mapCompanyContactsForPayload = (contacts = []) => contacts.map(contact => ({
  contact_id:         contact.contact_id || null,
  entity_id:          contact.entity_id || null,
  official_entity_id: contact.official_entity_id || null,
  email:              contact.email || '',
  mobile:             contact.mobile || '',
  mobile_code:        contact.mobile_code || '+65',
  telephone:          contact.telephone || '',
  telephone_code:     contact.telephone_code || '+65',
  office:             contact.office || '',
  office_code:        contact.office_code || '+65',
  ext_no:             contact.ext_no || '',
}));

const mapOCRToFormData = (ocrData) => ({
  individualInfo: {
    salutationId:  null,
    name:          ocrData.name             || '',
    formerName:    ocrData.former_name      || '',
    alias:         ocrData.alias            || '',
    gender:        ocrData.gender           || '',
    dob:           ocrData.date_of_birth    || '',
    countryOfBirth:ocrData.country_of_birth || '',
    nationality:   ocrData.nationality      || '',
    raceId:        null,
    status:        '',
    riskRating:    '',
    notes:         '',
  },
  idEntries: ocrData.id_type ? [{
    idType:      ocrData.id_type    || '',
    idNo:        ocrData.id_number  || '',
    idCountry:   ocrData.id_country || '',
    idIssuedDate:'',
    scanDocs:    [],
  }] : [],
  noticeEmail:    true,
  noticeApp:      false,
  noticeWhatsapp: false,
});

const GENDER_MAP    = { 'Male': 'MALE', 'Female': 'FEMALE', 'Non-Binary': 'OTHER', 'Prefer not to say': 'PREFER_NOT_TO_SAY' };
const STATUS_MAP    = { 'Active': 'ACTIVE', 'Inactive': 'INACTIVE', 'Prospect': 'PENDING', 'Deceased': 'INACTIVE' };
const RISK_MAP      = { 'Low': 'LOW', 'Medium': 'MEDIUM', 'High': 'HIGH', 'Very High': 'VERY_HIGH' };
const MODE_MAP      = { 'Email': 'EMAIL', 'Mobile': 'MOBILE', 'Telephone': 'TELEPHONE', 'Fax': 'FAX' };
const ADDR_TYPE_MAP = { contact: 'CONTACT', residential: 'RESIDENTIAL', foreign: 'FOREIGN' };

const R_GENDER = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Non-Binary', PREFER_NOT_TO_SAY: 'Prefer not to say' };
const R_STATUS = { ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Prospect' };
const R_RISK   = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', VERY_HIGH: 'Very High' };
const R_MODE   = { EMAIL: 'Email', MOBILE: 'Mobile', TELEPHONE: 'Telephone', FAX: 'Fax' };
const R_ADDR   = { CONTACT: 'contact', RESIDENTIAL: 'residential', FOREIGN: 'foreign' };

const user = getLoggedinUser();

/* ─── parseIndividual ─── */
const parseIndividual = (api) => {
  const d = api.individual_detail || {};
  const addrMap = {};
  let defaultAddress = '';
  (api.addresses || []).forEach(a => {
    const key = R_ADDR[a.address_type];
    if (!key) return;
    addrMap[key] = {
      houseNo:    a.block_no      || '',
      streetName: a.street_name   || '',
      building:   a.building_name || '',
      level:      a.level_no      || '',
      unitNo:     a.unit_no       || '',
      country:    a.country       || 'Singapore',
      state:      a.state         || '',
      city:       a.city          || '',
      postalCode: a.postal_code   || '',
      proofDocs: (a.proof_docs || []).map(doc => ({
          name: doc.file_name || '',
          preview: doc.file_path || '',
          docId: doc.doc_id || null,
          isNew: false,
        })),
    };
    if (a.is_primary) defaultAddress = key;
  });

  const getC   = (type) => (api.contacts || []).find(c => c.contact_type === type);
  const getAllC = (type) => (api.contacts || []).filter(c => c.contact_type === type);

  let displayStatus = R_STATUS[api.status] || '';
  if (d.deceased_date) displayStatus = 'Deceased';

  return {
    individualInfo: {
      salutationId:    d.salutation_id                    || null,
      name:            api.name                           || '',
      formerName:      d.former_name                      || '',
      alias:           d.member_alias_name                || '',
      gender:          R_GENDER[d.member_gender]          || '',
      dob:             d.member_dob                       || '',
      countryOfBirth:  d.country_of_birth                 || '',
      nationality:     d.member_nationality               || '',
      raceId:          d.race_id                          || null,
      status:          displayStatus,
      riskRating:      R_RISK[d.member_assessment_rating] || '',
      notes:           d.additional_notes                 || '',
      deceasedDate:    d.deceased_date                    || '',
      deceasedRemarks: d.deceased_remarks                 || '',
    },
    relationship: {
      fatherName: d.father_name || '',
      motherName: d.mother_name || '',
      spouseName: d.spouse_name || '',
    },
    idEntries: (api.identifications || []).map((i, idx) => ({
        identificationId: i.identification_id || null,
        idType: i.m_identification_id || '',
        idNo: i.id_number || '',
        idCountry: i.id_issued_country || '',
        idIssuedDate: i.id_issued_date || '',
        idExpiryDate: i.id_expired_date || '',

        scanDocs: (i.scan_docs || []).map(doc => ({
          name: doc.file_name || '',
          preview: doc.file_path || '',
          docId: doc.doc_id || null,
          isNew: false,
        })),

        isPrimary: i.is_primary ?? (idx === 0),
      })),
    addresses:      addrMap,
    defaultAddress,
    contactDetails: {
      emails: (() => {
        const rows = getAllC('EMAIL');
        if (rows.length) return rows.map((c, i) => ({ email: c.contact_value || '', isPrimary: c.is_primary ?? (i === 0), contact_id: c.contact_id }));
        return [{ email: '', isPrimary: true }];
      })(),
      mobiles: (() => {
        const rows = getAllC('MOBILE');
        if (rows.length) return rows.map((c, i) => ({ code: c.phone_country_code || '+65', number: c.contact_value || '', isPrimary: c.is_primary ?? (i === 0), contact_id: c.contact_id }));
        return [{ code: '+65', number: '', isPrimary: true }];
      })(),
      telephone:          getC('OFFICE')?.contact_value      || '',
      telephoneCode:      getC('OFFICE')?.phone_country_code || '+65',
      telephoneContactId: getC('OFFICE')?.contact_id         || null,
      fax:                getC('FAX')?.contact_value         || '',
      faxCode:            getC('FAX')?.phone_country_code    || '+65',
      faxContactId:       getC('FAX')?.contact_id            || null,
      skype:              d.skype_id                         || '',
    },
    preferredModes:  d.preferred_contact_mode ? [R_MODE[d.preferred_contact_mode]] : [],
    contactServices: d.services_to_contact ? d.services_to_contact.split(',').map(s => s.trim()).filter(Boolean) : [],
    noticeEmail:     d.notice_from_email         ?? true,
    noticeApp:       d.notice_from_mobile_notify ?? false,
    noticeWhatsapp:  d.notice_from_whatsapp      ?? false,
    companyContacts: mapCompanyContacts(api.official_company_contacts || []),
  };
};

/* ─── buildPayload ────────────────────────────────────── */
const buildPayload = (data) => {
  const info    = data.individualInfo || {};
  const rel     = data.relationship   || {};
  const contact = data.contactDetails || {};
  const isDeceased = info.status === 'Deceased';

  const addresses = Object.entries(data.addresses || {})
    .filter(([, a]) => a?.houseNo || a?.streetName || a?.building || a?.city || a?.postalCode || a?.level || a?.unitNo || a?.state)
    .map(([key, a]) => ({
      address_type:          ADDR_TYPE_MAP[key] || 'OTHER',
      is_primary:            key === (data.defaultAddress || ''),
      block_no:              a.houseNo    || '',
      street_name:           a.streetName || '',
      building_name:         a.building   || '',
      level_no:              a.level      || '',
      unit_no:               a.unitNo     || '',
      country:               a.country    || '',
      state:                 a.state      || '',
      city:                  a.city       || '',
      postal_code:           a.postalCode || '',
      proof_of_address_name: (a.proofDocs || [])[0]?.name || '',
    }));

  const contacts = [];
  (contact.emails || []).filter(e => e.email).forEach(e =>
    contacts.push({ contact_type: 'EMAIL', contact_value: e.email, is_primary: e.isPrimary ?? false, ...(e.contact_id ? { contact_id: e.contact_id } : {}) })
  );
  (contact.mobiles || []).filter(m => m.number).forEach(m =>
    contacts.push({ contact_type: 'MOBILE', contact_value: m.number, phone_country_code: m.code || '+65', is_primary: m.isPrimary ?? false, ...(m.contact_id ? { contact_id: m.contact_id } : {}) })
  );
  if (contact.telephone) contacts.push({ contact_type: 'OFFICE', contact_value: contact.telephone, phone_country_code: contact.telephoneCode || '+65', is_primary: false, ...(contact.telephoneContactId ? { contact_id: contact.telephoneContactId } : {}) });
  if (contact.fax)       contacts.push({ contact_type: 'FAX',    contact_value: contact.fax,       phone_country_code: contact.faxCode || '+65',       is_primary: false, ...(contact.faxContactId ? { contact_id: contact.faxContactId } : {}) });

  const identifications = (data.idEntries || [])
    .filter(e => e.idNo || e.idType)
    .map(e => ({
      ...(e.identificationId ? { identification_id: e.identificationId } : {}),
      m_identification_id: parseInt(e.idType, 10) || null,
      id_number:           e.idNo         || '',
      id_issued_country:   e.idCountry    || '',
      id_issued_date:      e.idIssuedDate || null,
      id_expired_date:     e.idExpiryDate || null,
      // Store first doc name for display; full list handled by file upload
      document_name:       (e.scanDocs || [])[0]?.name || '',
      is_primary:          e.isPrimary    ?? false,
    }));


  return {
    salutation_id:            parseInt(info.salutationId, 10) || null,
    name:                     info.name             || '',
    former_name:              info.formerName       || '',
    member_alias_name:        info.alias            || '',
    member_gender:            GENDER_MAP[info.gender] || null,
    member_dob:               info.dob              || null,
    country_of_birth:         info.countryOfBirth   || '',
    member_nationality:       info.nationality      || '',
    race_id:                  parseInt(info.raceId, 10) || null,
    status:                   isDeceased ? 'INACTIVE' : (STATUS_MAP[info.status] || 'ACTIVE'),
    member_assessment_rating: RISK_MAP[info.riskRating] || null,
    additional_notes:         info.notes            || '',
    deceased_date:            isDeceased ? (info.deceasedDate || null) : null,
    deceased_remarks:         isDeceased ? (info.deceasedRemarks || '') : '',
    father_name:              rel.fatherName  || '',
    mother_name:              rel.motherName  || '',
    spouse_name:              rel.spouseName  || '',
    skype_id:                 contact.skype   || '',
    preferred_contact_mode:   MODE_MAP[(data.preferredModes || [])[0]] || null,
    services_to_contact:      (data.contactServices || []).join(','),
    notice_from_email:          data.noticeEmail    ?? true,
    notice_from_mobile_notify:  data.noticeApp      ?? false,
    notice_from_whatsapp:       data.noticeWhatsapp ?? false,
    created_by:               user?.user_id         || null,
    identifications,
    addresses,
    contacts,
    official_company_contacts: mapCompanyContactsForPayload(data.companyContacts || []),
  };
};

/* ─── buildFormData ─────────────────────────────────────
   proofFiles : { contact: File[], residential: File[], foreign: File[] }
   scanFiles  : { '<identId>' | 'new_<idx>': File[] }

   Backend fieldnames (indexed per slot):
     proof_contact_address_0, proof_contact_address_1, ...
     proof_residential_address_0, ...
     scan_document_<identId>_0, scan_document_<identId>_1, ...
     scan_document_new_<idx>_0, ...
──────────────────────────────────────────────────────── */
const buildFormData = (
  payload,
  proofFiles = {},
  scanFiles = {},
  idEntries = []
) => {
  const fd = new FormData();

  // -----------------------------------------
  // Append payload
  // -----------------------------------------
  Object.entries(payload).forEach(([key, value]) => {

    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {

      // Array of objects
      if (
        value.length > 0 &&
        typeof value[0] === 'object' &&
        !(value[0] instanceof File)
      ) {

        value.forEach((item, index) => {
          Object.entries(item).forEach(([subKey, subValue]) => {

            if (Array.isArray(subValue) || subValue instanceof File) {
              return;
            }

            fd.append(
              `${key}[${index}][${subKey}]`,
              subValue ?? ''
            );

          });
        });

      } else {

        // Simple array
        value.forEach((item, index) => {
          fd.append(`${key}[${index}]`, item ?? '');
        });

      }

    } else if (
      typeof value === 'object' &&
      !(value instanceof File)
    ) {

      Object.entries(value).forEach(([subKey, subValue]) => {
        fd.append(`${key}[${subKey}]`, subValue ?? '');
      });

    } else {

      fd.append(key, value);

    }

  });

  // -----------------------------------------
  // Proof documents
  // -----------------------------------------
  const PROOF_FIELDNAME = {
    contact: 'proof_contact_address',
    residential: 'proof_residential_address',
    foreign: 'proof_foreign_address',
  };

  Object.entries(proofFiles).forEach(([addressType, files]) => {

    const fieldName = PROOF_FIELDNAME[addressType];

    if (!fieldName) {
      return;
    }

    (files || []).forEach(file => {
      if (file instanceof File) {
        fd.append(`${fieldName}[]`, file);
      }
    });

  });

  // -----------------------------------------
  // Identification scan documents
  // -----------------------------------------
  idEntries.forEach((entry, index) => {

    const key = entry.identificationId
      ? String(entry.identificationId)
      : `new_${index}`;

    const files = scanFiles[key] || [];

    files.forEach(file => {

      if (file instanceof File) {
        fd.append(`id_document_${key}[]`, file);
      }

    });

  });

  // port_name for multi-tenant document storage
  const portName = user?.portName || user?.port_name || null;
  if (portName) fd.append('port_name', portName);

  return fd;
};

/* ─── Main component ─────────────────────────────────────────── */
const Individual = () => {
  useCollapseSidebar();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const { id }     = useParams();
  const isEditMode = !!id;

  useEffect(() => {
    dispatch(changeFooterVisibility('hide'));
    return () => dispatch(changeFooterVisibility('show'));
  }, [dispatch]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState(isEditMode ? {} : { individualInfo: { status: 'Active' } });
  const [stepErrors, setStepErrors]   = useState({});
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [countries, setCountries]     = useState([]);
  const [submitting, setSubmitting]   = useState(false);
  const showCompanyContactsStep = isEditMode && (formData.companyContacts || []).length > 0;
  const steps = useMemo(() => buildSteps(showCompanyContactsStep), [showCompanyContactsStep]);

  /* ── File state ──────────────────────────────────────────────
     proofFiles : { contact: File[], residential: File[], foreign: File[] }
     scanFiles  : { '<identId>' | 'new_<idx>': File[] }
     Each value is an ARRAY — multiple files per slot.
  ────────────────────────────────────────────────────────────── */
  const [proofFiles, setProofFiles] = useState({});  // { addrKey: File[] }
  const [scanFiles,  setScanFiles]  = useState({});  // { key: File[] }

  /* OCR state */
  const [scannerOpen, setScannerOpen] = useState(false);
  const [file, setFile]               = useState(null);
  const [dragover, setDragover]       = useState(false);
  const [ocrLoading, setOcrLoading]   = useState(false);
  const [ocrDone, setOcrDone]         = useState(false);
  const [ocrError, setOcrError]       = useState(null);
  const [prefilled, setPrefilled]     = useState(false);
  const inputRef                      = useRef();

  // ── Image delete — shared confirm modal ──────────────────────────────────
  // imgDeleteTarget = { field: IMAGE_FIELDS[n], doc: { doc_id, file_path, … } }
  const [imgDeleteTarget,  setImgDeleteTarget]  = useState(null);
  const [imgDeleteModal,   setImgDeleteModal]   = useState(false);
  const [imgDeleteLoading, setImgDeleteLoading] = useState(false);

  const validationRegistry = useRef({});

  const registerValidationError = useCallback((key, message) => {
    validationRegistry.current[key] = message;
  }, []);

  useEffect(() => {
    getCountriesList({ page: 1, limit: 1000 })
      .then(res => setCountries(extractApiList(res)))
      .catch(() => {});
  }, []);

  const fetchIndividual = async () => {
    try {
      const res  = await getIndividual(id);
      const data = res?.data?.data ?? res?.data ?? res;
      if (data) setFormData(parseIndividual(data));
      else toast.error('Individual not found');
    } catch {
      toast.error('Failed to load individual');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) return;
    fetchIndividual();
  }, [id, isEditMode]);

  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));
  const goTo = (stepId) => setCurrentStep(stepId);
  const prev = ()      => setCurrentStep(s => Math.max(s - 1, 1));

  /* ── Proof file handlers (passed to Step4Address) ── */
  // Append new files to the array for this address key
  const handleProofFilesAdd = (addrKey, files) =>
    setProofFiles(p => ({ ...p, [addrKey]: [...(p[addrKey] || []), ...files] }));

  // Remove one file from the array by index
  const handleProofFileDelete = (addrKey, fileIdx) =>
    setProofFiles(p => ({
      ...p,
      [addrKey]: (p[addrKey] || []).filter((_, i) => i !== fileIdx),
    }));

  /* ── Scan file handlers (passed to Step3IndividualID) ── */
  // Append new files to the array for this scan key
  const handleScanFilesAdd = (key, files) =>
    setScanFiles(p => ({ ...p, [key]: [...(p[key] || []), ...files] }));

  // Remove one file from the array by index
  const handleScanFileDelete = (key, fileIdx) =>
    setScanFiles(p => ({
      ...p,
      [key]: (p[key] || []).filter((_, i) => i !== fileIdx),
    }));

    // Remove ALL files for a given key at once (used when an entire ID entry is removed)
  const handleScanFilesClear = (key) =>
    setScanFiles(p => {
      const next = { ...p };
      delete next[key];
      return next;
    });

      // ── Image delete ──────────────────────────────────────────────────────────
    // Called by ImageUploadCard when user clicks the delete (bin) icon
    const handleImgDeleteRequest = ({ docId }) => {
      setImgDeleteTarget({ docId });
      setImgDeleteModal(true);
    };
    const handleImgDeleteClose = () => {
      setImgDeleteTarget(null);
      setImgDeleteModal(false);
    };
    const handleImgDeleteConfirm = async () => {
      if (!imgDeleteTarget) return;
      setImgDeleteLoading(true);
      try {
        await deleteDocumentStore(imgDeleteTarget.docId);
        toast.success(`File deleted successfully`);
        handleImgDeleteClose();
        fetchIndividual();
      } catch (err) {
        toast.error(err?.message || 'Failed to delete image');
      } finally {
        setImgDeleteLoading(false);
      }
    };
    
  /* ── Delete server document ── */
  const handleDeleteDocument = async (entityId, docId) => {
     await handleImgDeleteRequest({ docId });
  };

  /* ── Clear all staged file state ── */
  const clearFileState = () => {
    setProofFiles({});
    setScanFiles({});
  };

  /* ── Field history ── */
  const handleFetchHistory = async (fieldKey, fieldTypeId, identificationId = null, refId = null) => {
    try {
      const params = { type_id: fieldTypeId };
      if (identificationId) params.identification_id = identificationId;
      if (refId)            params.ref_id            = refId;
      const res = await getIndividualFieldHistory(id, params);
      return res?.data?.data || res?.data || [];
    } catch { return []; }
  };

  /* ── Save field change ── */
  const handleSaveChange = async (changePayload) => {

    const updatedBy = user?.user_id || null;
    try {
      await saveIndividualFieldChange(id, {
        field:             changePayload.field,
        field_type_id:     changePayload.fieldTypeId,
        old_value:         changePayload.oldValue,
        new_value:         changePayload.newValue,
        effective_date:    changePayload.effectiveDate,
        is_proposed:       changePayload.isProposed ?? false,
        identification_id: changePayload.identificationId || null,
        extra:             changePayload.extra || null,
        ref_id:            changePayload.refId || null,
        updated_by:        updatedBy,
      });
      toast.success('Change recorded successfully');
      clearFileState();
      fetchIndividual();
    } catch {
      toast.error('Failed to save change record');
      throw new Error('Failed to save');
    }
  };

  /* ── Validation ── */
  const hasAddressData = (addr) =>
    addr && (addr.houseNo || addr.streetName || addr.building || addr.city || addr.postalCode || addr.level || addr.unitNo || addr.state);

  const validateStep = (stepNum) => {
    const errors = [];
    const stepKey = steps[stepNum - 1]?.key;

    if (stepKey === 'individual') {
      if (!formData.individualInfo?.name?.trim())
        errors.push('Individual Name is required.');
      if (formData.individualInfo?.status === 'Deceased' && !formData.individualInfo?.deceasedDate)
        errors.push('Deceased Date is required when status is Deceased.');
    }
    if (stepKey === 'ids') {
      (formData.idEntries || []).forEach((e, i) => {
        if ((e.idType || e.idNo) && !(e.idType && e.idNo))
          errors.push(`ID #${i + 1}: Both Identification Type and ID No. are required.`);
      });
      const seen = new Set();
      (formData.idEntries || []).forEach((e, i) => {
        if (!e.idType || !e.idNo) return;
        const key = `${e.idType}|${e.idNo.trim()}`;
        if (seen.has(key)) errors.push(`ID #${i + 1}: Duplicate ID type + number combination.`);
        seen.add(key);
      });
    }
    if (stepKey === 'address') {
      const anyFilled = Object.values(formData.addresses || {}).some(hasAddressData);
      if (anyFilled && !formData.defaultAddress)
        errors.push('Please select a Default Address since address details have been entered.');
    }
    if (stepKey === 'companyContacts') {
      errors.push(...validateCompanyContacts(formData.companyContacts || []));
    }
    return errors;
  };

 /* ── Next Step with Validation ── */
const next = async () => {
  // ============================================================
  // Step 1: Validate current step fields
  // ============================================================
  const errors = validateStep(currentStep);
  
  // ============================================================
  // Step 2: Special validation for ID Documents step (Step 2)
  // ============================================================
  if (steps[currentStep - 1]?.key === 'ids' && window.__validateIDEntries) {
    try {
      const idValidationPassed = await window.__validateIDEntries();
      if (!idValidationPassed) {
        // ID validation failed, show errors
        const dynamicErrors = Object.entries(validationRegistry.current)
          .filter(([, msg]) => msg);
        
        dynamicErrors.forEach(([key, msg]) => {
          toast.warning(`[ID Documents] ${msg}`, { autoClose: 6000 });
        });
        
        // Don't proceed to next step
        return;
      }
    } catch (err) {
      console.error('ID validation failed:', err);
      toast.error('ID validation failed. Please check your entries.');
      return;
    }
  }

  // ============================================================
  // Step 3: Check for errors
  // ============================================================
  if (errors.length) {
    setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
    errors.forEach(msg => toast.warning(msg, { autoClose: 5000 }));
    return;
  }

  // ============================================================
  // Step 4: Check for any dynamic validation errors
  // ============================================================
  const dynamicErrors = Object.entries(validationRegistry.current)
    .filter(([, msg]) => msg);
  
  if (dynamicErrors.length) {
    dynamicErrors.forEach(([key, msg]) => {
      const label = key.startsWith('name') ? '[Individual]' : '[ID Documents]';
      toast.warning(`${label} ${msg}`, { autoClose: 6000 });
    });
    return;
  }

  // ============================================================
  // Step 5: All validations passed, proceed to next step
  // ============================================================
  setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
  setCurrentStep(s => Math.min(s + 1, steps.length));
};


  /* ── Submit ── */
// Add this function to validate ID entries on submit
  const validateIDEntries = useCallback(async () => {
    if (window.__validateIDEntries) {
      try {
        return await window.__validateIDEntries();
      } catch (err) {
        console.error('ID validation failed:', err);
        return false;
      }
    }
    return true;
  }, []);

  /* ── Submit ── */
const handleSubmit = async () => {
  // ============================================================
  // Step 1: Validate all steps
  // ============================================================
  const allErrorMap = {};
  let hasAnyError = false;
  const stepIdsToValidate = steps
    .filter(s => ['individual', 'ids', 'address', 'companyContacts'].includes(s.key))
    .map(s => s.id);

  stepIdsToValidate.forEach(stepNum => {
    const errs = validateStep(stepNum);
    allErrorMap[stepNum] = errs;
    if (errs.length) hasAnyError = true;
  });
  setStepErrors(allErrorMap);

  if (hasAnyError) {
    stepIdsToValidate.forEach(stepNum => {
      const errs = allErrorMap[stepNum];
      if (!errs.length) return;
      const stepLabel = steps.find(s => s.id === stepNum)?.label || `Step ${stepNum}`;
      errs.forEach(msg => toast.warning(`[${stepLabel}] ${msg}`, { autoClose: 6000 }));
    });
    const firstBadStep = stepIdsToValidate.find(s => allErrorMap[s]?.length > 0);
    if (firstBadStep) setCurrentStep(firstBadStep);
    return;
  }

  // ============================================================
  // Step 2: Validate ID entries (format + duplicate checks)
  // ============================================================
  let idValidationPassed = true;
  if (window.__validateIDEntries) {
    try {
      idValidationPassed = await window.__validateIDEntries();
    } catch (err) {
      console.error('ID validation failed:', err);
      idValidationPassed = false;
    }
  }

  // ============================================================
  // Step 3: Check for any remaining validation errors
  // ============================================================
  const dynamicErrors = Object.entries(validationRegistry.current)
    .filter(([, msg]) => msg);
  
  if (dynamicErrors.length || !idValidationPassed) {
    dynamicErrors.forEach(([key, msg]) => {
      const label = key.startsWith('name') ? '[Individual]' : '[ID Documents]';
      toast.warning(`${label} ${msg}`, { autoClose: 6000 });
    });
    
    const hasIdError = dynamicErrors.some(([k]) => k.startsWith('id_'));
    const hasNameError = dynamicErrors.some(([k]) => k.startsWith('name'));
    setCurrentStep(hasNameError ? 1 : hasIdError ? 2 : 1);
    return;
  }

  // ============================================================
  // Step 4: Save
  // ============================================================
  setSubmitting(true);
  try {
    const payload = buildPayload(formData);
    const fd = buildFormData(payload, proofFiles, scanFiles, formData.idEntries || []);

    const res = isEditMode
      ? await updateIndividual(id, fd)
      : await createIndividual(fd);

    if (res?.status) {
      clearFileState();
      toast.success(`Individual ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/individuals');
    } else {
      toast.error(res?.message || `Failed to ${isEditMode ? 'update' : 'create'} individual`);
    }
  } catch (err) {
    toast.error(typeof err === 'string' ? err : `Failed to ${isEditMode ? 'update' : 'create'} individual`);
  } finally {
    setSubmitting(false);
  }
};

  const progressPercent = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);
  const step            = steps[currentStep - 1];
  const StepComponent   = step.component;

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(f.type)) { setOcrError('Only PDF, PNG, JPG files are supported.'); return; }
    setFile(f); setOcrDone(false); setOcrError(null); setPrefilled(false);
  };

  const handleDrop  = (e) => { e.preventDefault(); setDragover(false); handleFile(e.dataTransfer.files[0]); };
  const removeFile  = (e) => { e.stopPropagation(); setFile(null); setOcrDone(false); setOcrError(null); setPrefilled(false); };

  const handleOCR = async () => {
    if (!file) return;
    setOcrLoading(true); setOcrError(null); setOcrDone(false);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const mockOCR = {
        name: 'John Tan Wei Ming', id_type: 'Singapore NRIC (Pink)',
        id_number: 'S8901234A', date_of_birth: '1989-05-15',
        gender: 'Male', nationality: 'Singaporean', country_of_birth: 'Singapore',
      };
      setFormData(prev => ({ ...prev, ...mapOCRToFormData(mockOCR) }));
      setOcrDone(true); setPrefilled(true); setCurrentStep(1);
    } catch {
      setOcrError('OCR extraction failed. Please try again or enter details manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const sharedStepProps = {
    formData,
    updateFormData,
    countries,
    errors:      stepErrors[currentStep] || [],
    prefilled,
    isEditMode,
    entityId:    id || null,
    onFetchHistory:       handleFetchHistory,
    onSaveChange:         handleSaveChange,
    registerValidationError,
    /* file handlers */
    onProofFilesAdd:      handleProofFilesAdd,
    onProofFileDelete:    handleProofFileDelete,
    onScanFilesAdd:       handleScanFilesAdd,
    onScanFileDelete:     handleScanFileDelete,
    onScanFilesClear:     handleScanFilesClear,
    onDeleteDocument:     handleDeleteDocument,
  };

  document.title = `${isEditMode ? 'Edit' : 'Add'} Individual | ASR CSS`;

  if (loadingData) return (
    <div className="wizard_wrap_ page-content cw-page individual-wizard-page d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <Spinner color="primary" />
    </div>
  );

  return (
    <div className="wizard_wrap_ page-content cw-page individual-wizard-page">
      <Container fluid className="cw-page-container">
        <Card className="overflow-hidden p-0 cw-page-card">
          <div className={classnames('cw-outer', { 'scanner-open': scannerOpen })}>

            {/* ── Left nav ── */}
            <div className="cw-nav">
              <div className="cw-nav-header">
                <h5><i className={`${isEditMode ? 'ri-edit-line' : 'ri-user-3-line'} me-2`}></i>
                  {isEditMode ? 'Edit Individual' : 'New Individual'}
                </h5>
                <p>{isEditMode ? 'Update individual details' : `Complete all ${steps.length} steps to register`}</p>
              </div>
              <div className="cw-nav-body">
                {steps.map((s, index) => {
                  const isDone    = currentStep > s.id;
                  const isActive  = currentStep === s.id;
                  const isPending = currentStep < s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div
                        className={classnames('cw-nav-item', { done: isDone, active: isActive, pending: isPending })}
                        onClick={() => goTo(s.id)}>
                        <div className="cw-nav-circle">
                          {isDone ? <i className="ri-check-line fs-12"></i> : s.id}
                        </div>
                        <div className="cw-nav-text">
                          <b>{s.label}</b>
                          <small>{s.subLabel}</small>
                        </div>
                        <span className={classnames('cw-nav-status', { done: isDone, active: isActive, pending: isPending })}>
                          {isDone ? <i className="ri-checkbox-circle-fill"></i>
                           : isActive ? <i className="ri-record-circle-line"></i>
                           : <i className="ri-circle-line"></i>}
                        </span>
                      </div>
                      {index < steps.length - 1 && <div className={classnames('cw-connector', { done: isDone })} />}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="cw-nav-footer">
                <div className="d-flex justify-content-between mb-1">
                  <span>Progress</span>
                  <span style={{ color: '#405189', fontWeight: 600 }}>{progressPercent}%</span>
                </div>
                <div style={{ height: '4px', borderRadius: '2px', background: 'var(--vz-border-color)' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: '#405189', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>

            {/* ── Center content ── */}
            <div className="cw-content">
              <div className="cw-content-header">
                <div className="cw-content-hicon"><i className={step.icon}></i></div>
                <div>
                  <p className="cw-content-htitle">
                    Step {currentStep}: {step.label}
                    {prefilled && (
                      <span className="cw-prefilled-badge">
                        <i className="ri-magic-line"></i> Pre-filled
                      </span>
                    )}
                  </p>
                  <p className="cw-content-hsub">{step.subLabel}</p>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                  {isEditMode && (
                    <Link to={`/individual/${id}`} className="btn btn-info btn-sm d-flex align-items-center gap-1">
                      <i className="ri-eye-line"></i> View
                    </Link>
                  )}
                  <Link to="/individuals" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                    <i className="ri-list-unordered"></i> All Individuals
                  </Link>
                  <button
                    className={classnames('cw-scan-btn', { active: scannerOpen })}
                    onClick={() => setScannerOpen(o => !o)}>
                    <i className={scannerOpen ? 'ri-close-line' : 'ri-scan-2-line'}></i>
                    {scannerOpen ? 'Close Scanner' : 'Scan Document'}
                    {ocrDone && !scannerOpen && <i className="ri-checkbox-circle-fill" style={{ color: '#0ab39c', marginLeft: 2 }}></i>}
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'rgba(64,81,137,.1)', color: '#405189' }}>
                    {currentStep} / {steps.length}
                  </span>
                </div>
              </div>

              <div className="cw-content-body">
                <StepComponent {...sharedStepProps} />
              </div>

              <div className="cw-content-footer">
                <div className="cw-footer-left-group">
                  <Button
                    color="light"
                    size="sm"
                    onClick={prev}
                    disabled={currentStep === 1}
                    className="cw-footer-prev d-flex align-items-center gap-1 px-3"
                  >
                    <i className="ri-arrow-left-line"></i> Previous
                  </Button>

                  {currentStep < steps.length && (
                    <Button
                      color="light"
                      size="sm"
                      onClick={next}
                      className="cw-footer-next-btn d-flex align-items-center gap-1 px-3"
                    >
                      Next <i className="ri-arrow-right-line"></i>
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={currentStep < steps.length || submitting}
                  className="cw-footer-save d-flex align-items-center gap-1 px-3"
                  title={currentStep < steps.length ? 'Complete each step to enable Save' : undefined}
                >
                  {submitting
                    ? <><Spinner size="sm" /> Saving...</>
                    : <><i className="ri-save-line"></i> Save</>}
                </Button>
              </div>
            </div>

            {/* ── Scanner panel ── */}
            <div className="cw-scanner">
              <div className="cw-scanner-head">
                <span><i className="ri-scan-2-line"></i>Document Scanner</span>
                <button className="cw-scanner-close" onClick={() => setScannerOpen(false)}>
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <div className="cw-scanner-body">
                {ocrDone && (
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 12px', borderRadius:'7px', marginBottom:'10px', background:'rgba(10,179,156,.1)', border:'1px solid rgba(10,179,156,.25)', fontSize:'11px', fontWeight:500, color:'#0ab39c' }}>
                    <i className="ri-checkbox-circle-fill" style={{ fontSize:'14px' }}></i>
                    Data extracted — form fields pre-filled
                  </div>
                )}

                {file ? (
                  <div className="cw-file-prev">
                    <div className="cw-file-icon">
                      <i className={file.type === 'application/pdf' ? 'ri-file-pdf-line' : 'ri-image-line'}></i>
                    </div>
                    <div className="cw-file-info">
                      <b>{file.name}</b>
                      <small>{formatSize(file.size)} · {file.type.split('/')[1].toUpperCase()}</small>
                    </div>
                    <button className="cw-file-remove" onClick={removeFile}>
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ) : (
                  <div
                    className={classnames('cw-drop', { dragover })}
                    onClick={() => inputRef.current.click()}
                    onDragOver={e => { e.preventDefault(); setDragover(true); }}
                    onDragLeave={() => setDragover(false)}
                    onDrop={handleDrop}
                  >
                    <div className="cw-drop-icon"><i className="ri-upload-cloud-2-line"></i></div>
                    <h6>Upload ID Document</h6>
                    <p>Drag & drop or click to browse</p>
                    <div className="cw-drop-fmts">
                      {['PDF', 'PNG', 'JPG'].map(f => <span key={f} className="cw-drop-fmt">{f}</span>)}
                    </div>
                  </div>
                )}

                <input ref={inputRef} type="file" hidden
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => handleFile(e.target.files[0])} />

                {file && (
                  <div className="d-flex flex-column gap-2 mb-2">
                    <button className="cw-ocr-btn" disabled={ocrLoading} onClick={handleOCR}>
                      {ocrLoading ? <><Spinner size="sm" /> Extracting data...</>
                       : ocrDone   ? <><i className="ri-refresh-line"></i> Re-scan Document</>
                       :             <><i className="ri-scan-2-line"></i> Submit for OCR</>}
                    </button>
                    {ocrDone && (
                      <button className="cw-ocr-btn"
                        style={{ background:'transparent', border:'1px solid var(--vz-border-color)', color:'var(--vz-body-color)' }}
                        onClick={removeFile}>
                        <i className="ri-upload-2-line"></i> Upload Different File
                      </button>
                    )}
                  </div>
                )}

                <div className="cw-tips">
                  <h6><i className="ri-lightbulb-line me-1"></i>Tips for best results</h6>
                  <div className="cw-tip"><i className="ri-check-line"></i>NRIC, Passport or FIN cards work best</div>
                  <div className="cw-tip"><i className="ri-check-line"></i>Use clear, high-resolution scans</div>
                  <div className="cw-tip"><i className="ri-check-line"></i>PDF format gives most accurate results</div>
                  <div className="cw-tip"><i className="ri-check-line"></i>Review all pre-filled fields before saving</div>
                </div>

                {ocrDone && (
                  <p style={{ fontSize:'10px', color:'var(--vz-sidebar-sub-item-color)', textAlign:'center', marginTop:'10px' }}>
                    <i className="ri-information-line me-1"></i>
                    Highlighted fields were pre-filled. Review before proceeding.
                  </p>
                )}
              </div>
            </div>

          </div>
        </Card>
      </Container>

      {/* ── Image Delete Confirm Modal ────────────────────────────────────── */}
      {/* Same design as MasterDataView delete modal — only shown when a saved image exists */}
      <Modal isOpen={imgDeleteModal} toggle={handleImgDeleteClose} fade centered modalClassName="zoomIn">
        <ModalBody className="py-3 px-5 position-relative">
          <button type="button" className="btn-close position-absolute top-0 end-0 m-2"
            onClick={handleImgDeleteClose} aria-label="Close" />
          <div className="mt-2 text-center">
            <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
              colors="primary:#f7b84b,secondary:#f06548" style={{width:'100px',height:'100px'}} />
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>Are you sure?</h4>
              <p className="text-muted mx-4 mb-0">
                Are you sure you want to delete the{' '}
                <strong>file</strong>?
                This will permanently remove the file.
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button type="button" className="btn w-sm btn-light"
              onClick={handleImgDeleteClose} disabled={imgDeleteLoading}>Close</button>
            <button type="button" className="btn w-sm btn-danger"
              onClick={handleImgDeleteConfirm} disabled={imgDeleteLoading}>
              {imgDeleteLoading
                ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Deleting…</>
                : 'Yes, Delete It!'}
            </button>
          </div>
        </ModalBody>
      </Modal>

    </div>
  );
};

export default Individual;
