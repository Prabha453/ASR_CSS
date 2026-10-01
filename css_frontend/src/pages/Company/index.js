import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Card, Button, Spinner, Alert, Modal, ModalBody } from 'reactstrap';
import classnames from 'classnames';
import useCollapseSidebar from '../../hooks/useCollapseSidebar';
import { changeFooterVisibility } from '../../slices/layouts/thunk';
import { toast } from 'react-toastify';
import './Company.css';

import Step1BusinessEntity from './steps/Step1BusinessEntity';
import Step2Address         from './steps/Step2Address';
import Step3Contact         from './steps/Step3Contact';
import {
  createCompany,
  updateCompany,
  getCompany,
  getCountriesList,
  getCompanyFieldHistory,
  saveCompanyFieldChange,
  deleteDocumentStore,
} from '../../helpers/backend_helper';
import { getLoggedinUser } from '../../helpers/api_helper';

const STEPS = [
  { id: 1, label: 'Business Entity', subLabel: 'Company details & corp sec info', icon: 'ri-building-line',    component: Step1BusinessEntity },
  { id: 2, label: 'Addresses',       subLabel: 'Registered, mailing & other',     icon: 'ri-map-pin-2-line',   component: Step2Address         },
  { id: 3, label: 'Contact Details', subLabel: 'Email, mobile, phone & website',  icon: 'ri-phone-line',       component: Step3Contact         },
];

const user = getLoggedinUser();

const mapOCRToFormData = (ocrData) => ({
  basic: {
    companyName:       ocrData.company_name       || '',
    regNo:             ocrData.uen                || ocrData.registration_no || '',
    incorporationDate: ocrData.incorporation_date || '',
    companyType:       ocrData.company_type       || '',
    fye:               ocrData.financial_year_end || '',
    country:           ocrData.country            || 'Singapore',
    serviceCategory:   ocrData.service_category   || '',
  },
  contact: {
    firstName:   ocrData.contact_first_name  || '',
    lastName:    ocrData.contact_last_name   || '',
    designation: ocrData.contact_designation || '',
    idType:      ocrData.contact_id_type     || '',
    idNo:        ocrData.contact_id_no       || '',
  },
  companyContact: {
    email:   ocrData.company_email   || '',
    phone:   ocrData.company_phone   || '',
    address: ocrData.company_address || '',
  },
});

const Company = () => {
  useCollapseSidebar();
  const navigate      = useNavigate();
  const dispatch      = useDispatch();
  const { entity_id } = useParams();
  const [stepKey, setStepKey] = useState(0);
  const isEdit        = Boolean(entity_id);

  // This wizard manages its own full-height layout with a sticky in-page
  // footer — hide the global app breadcrumb/footer chrome while it's open,
  // restore them on unmount so other pages are unaffected.
  useEffect(() => {
    dispatch(changeFooterVisibility('hide'));
    return () => dispatch(changeFooterVisibility('show'));
  }, [dispatch]);
  
  const [proofFiles, setProofFiles] = useState({});
  const [logoFile, setLogoFile]     = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData]       = useState({});
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [countries, setCountries]     = useState([]);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState(null);

  // ── Cross-step validity ────────────────────────────────────────────────────
  // Each step reports its own required-field validity here whenever it's
  // mounted and its relevant fields change. Unlike validationRegistry below,
  // this is NOT cleared on unmount — a step's last-known validity stays put
  // while the user is viewing a different step, so the global Save button can
  // reflect the whole form (Step1 + Step2 + Step3) regardless of which single
  // step component is currently mounted. Step 2 has no required fields today,
  // so it starts (and stays) valid.
  const [stepValid, setStepValid] = useState({ 1: false, 2: true, 3: false });
  const reportStepValid = useCallback((stepId, isValid) => {
    setStepValid(prev => (prev[stepId] === isValid ? prev : { ...prev, [stepId]: isValid }));
  }, []);
  const isEntireFormValid = stepValid[1] && stepValid[2] && stepValid[3];

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [file, setFile]               = useState(null);
  const [dragover, setDragover]       = useState(false);
  const [ocrLoading, setOcrLoading]   = useState(false);
  const [ocrDone, setOcrDone]         = useState(false);
  const [ocrError, setOcrError]       = useState(null);
  const [prefilled, setPrefilled]     = useState(false);
  const inputRef                      = useRef();

  // Image delete modal
  const [imgDeleteTarget,  setImgDeleteTarget]  = useState(null);
  const [imgDeleteModal,   setImgDeleteModal]   = useState(false);
  const [imgDeleteLoading, setImgDeleteLoading] = useState(false);

  // ── Validation registry ───────────────────────────────────────────────────
  // Each step registers its errors here. Key = step key, value = error message
  // or null when that step is clean.
  //
  // Example registry state:
  //   { step2_address: 'Address details have validation errors', step3_contact: null }
  //
  const validationRegistry = useRef({});

  /**
   * Steps call this to register / clear their validation state.
   * Pass `message = null` to clear a previous error for that key.
   */
  const registerValidationError = useCallback((key, message) => {
    if (message === null || message === undefined) {
      delete validationRegistry.current[key];
    } else {
      validationRegistry.current[key] = message;
    }
  }, []);

  /**
   * Returns the first validation error across all registered steps,
   * or null if everything is clean.
   */
  const getFirstValidationError = () => {
    const errors = Object.values(validationRegistry.current).filter(Boolean);
    return errors.length ? errors[0] : null;
  };

  // Load countries
  useEffect(() => {
    getCountriesList({ page: 1, limit: 1000 })
      .then(res => setCountries(res?.data?.data || res?.data || []))
      .catch(() => {});
  }, []);

  // ── Load company in edit mode ─────────────────────────────────────────────
  const fetchCompany = async () => {
    try {
      const res  = await getCompany(entity_id);
      const data = res?.data?.data ?? res?.data ?? res;
      if (!data) return;

      const detail    = data.company_detail || {};
      const addresses = {};
      
        (data.addresses || []).forEach(a => {
          addresses[a.address_type] = {
            ...a,
            proofDocs: (a.proof_docs || []).map(doc => ({
              name:    doc.file_name || '',
              preview: doc.file_path || '',
              docId:   doc.doc_id    || null,
              isNew:   false,
            })),
          };
        });

      // Build contactDetails
      const emails  = [];
      const mobiles = [];
      const contactDetails = {
        telephoneCode: '+65', telephone: '',
        faxCode: '+65', fax: '',
        website: '',
      };

      (data.contacts || []).forEach(c => {
        const val = c.contact_value || '';
        if (c.contact_type === 'EMAIL')
          emails.push({ email: val, isPrimary: !!c.is_primary, contact_id: c.contact_id });
        else if (c.contact_type === 'MOBILE')
          mobiles.push({ code: c.phone_country_code || '+65', number: val, isPrimary: !!c.is_primary, contact_id: c.contact_id });
        else if (c.contact_type === 'OFFICE')
          Object.assign(contactDetails, { telephoneCode: c.phone_country_code || '+65', telephone: val, telephoneContactId: c.contact_id });
        else if (c.contact_type === 'FAX')
          Object.assign(contactDetails, { faxCode: c.phone_country_code || '+65', fax: val, faxContactId: c.contact_id });
        else if (c.contact_type === 'OTHER')
          Object.assign(contactDetails, { website: val, websiteContactId: c.contact_id });
      });
      

      if (!emails.length)  emails.push({ email: '', isPrimary: true });
      if (!mobiles.length) mobiles.push({ code: '+65', number: '', isPrimary: true });
      contactDetails.emails  = emails;
      contactDetails.mobiles = mobiles;

      // Default address = the one marked is_primary, fallback to REGISTERED
      const primaryAddr  = (data.addresses || []).find(a => a.is_primary);
      const defaultAddress = primaryAddr?.address_type || 'REGISTERED';

      // Company identification fields
      const identRow    = (data.identifications || [])[0] || {};
      const identFields = {
        uen_no:       identRow.uen_no       || '',
        fbrn_reg_no:  identRow.fbrn_reg_no  || '',
        uf_no:        identRow.uf_no        || '',
        domes_bus_no: identRow.domes_bus_no || '',
        acra_no:      identRow.acra_no      || '',
      };

      const parseCSV = (val) => val ? val.split(',').map(Number).filter(Boolean) : [];

      setFormData({
        basic: {
          name: data.name, former_name: data.former_name, client_no: data.client_no,
          status: data.status, company_type_id: data.company_type_id,
          ...identFields,
          remarks: data.remarks, additional_remarks: data.additional_remarks,
          country: detail.country || 'Singapore',
        },
        detail: { ...detail, service_ids: parseCSV(detail.service_ids), group_ids: parseCSV(detail.group_ids) },
        addresses,
        defaultAddress,
        contactDetails,
        segregations: parseCSV(detail.segregation_ids),
        bnIds:        parseCSV(detail.bn_ids),
        tag_ids:      (data.tags || []).map(t => t.tag_id),
      });

      setStepKey(k => k + 1);

    } catch {
      toast.error('Failed to load company');
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    fetchCompany();
  }, [entity_id, isEdit]);

  const updateFormData = (data) => setFormData(prev => ({ ...prev, ...data }));
  const goTo  = (id) => setCurrentStep(id);

  // Next only validates & advances the CURRENT step — it never saves.
  // getFirstValidationError() reads the live registry, which at any moment
  // only holds entries from the currently-mounted (i.e. current) step.
  const next = () => {
    const err = getFirstValidationError();
    if (err) {
      setSaveError(err);
      return;
    }
    setSaveError(null);
    setCurrentStep(s => Math.min(s + 1, STEPS.length));
  };

  // Previous is pure navigation — it must never save or validate.
  const prev = () => {
    setSaveError(null);
    setCurrentStep(s => Math.max(s - 1, 1));
  };

  const handleLogoSelect = (logoFileToUpload) => {
    setLogoFile(logoFileToUpload);
    setRemoveLogo(false);
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setRemoveLogo(true);
    setFormData(prev => ({ ...prev, detail: { ...prev.detail, logo_url: null, logo_name: null } }));
  };

  // ── Field history handlers ─────────────────────────────────────────────────

    const handleProofFilesAdd = (addrKey, files) =>
    setProofFiles(p => ({ ...p, [addrKey]: [...(p[addrKey] || []), ...files] }));

  const handleProofFileDelete = (addrKey, fileName) => {
    setProofFiles(p => ({
      ...p,
      [addrKey]: (p[addrKey] || []).filter(file => {
        // If file is a File object, compare its name
        if (file instanceof File) {
          return file.name !== fileName;
        }
        // If file has a name property
        return file.name !== fileName && file.fileName !== fileName;
      })
    }));
  };

  const handleFetchHistory = async (fieldKey, fieldTypeId, identificationId = null, refId = null) => {
    try {
      const params = { type_id: fieldTypeId };
      if (refId)            params.ref_id             = refId;
      const res = await getCompanyFieldHistory(entity_id, params);
      return res?.data?.data || res?.data || [];
    } catch {
      return [];
    }
  };

  const handleSaveChange = async (changePayload) => {
    const updatedBy = user?.user_id || null;
    try {
      await saveCompanyFieldChange(entity_id, {
        field:             changePayload.field,
        field_type_id:     changePayload.fieldTypeId,
        old_value:         changePayload.oldValue,
        new_value:         changePayload.newValue,
        effective_date:    changePayload.effectiveDate,
        is_proposed:       changePayload.isProposed ?? false,
        extra:             changePayload.extra || null,
        ref_id:            changePayload.refId || null,
        updated_by:        updatedBy,
      });
      toast.success('Change recorded successfully');
      fetchCompany();
    } catch {
      toast.error('Failed to save change record');
      throw new Error('Failed to save');
    }
  };

  // ── Image delete handlers ──────────────────────────────────────────────────
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
      toast.success('File deleted successfully');
      handleImgDeleteClose();
      fetchCompany();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete image');
    } finally {
      setImgDeleteLoading(false);
    }
  };

  // ── Submit handler with validation ─────────────────────────────────────────
  const handleSubmit = async () => {
    const { basic = {}, detail = {}, addresses = {}, contactDetails = {}, segregations = [], bnIds = [] } = formData;

    // ── Step 1 validation ──
    if (!basic.name?.trim()) {
      setSaveError('Entity Name is required. Please complete Step 1.');
      setCurrentStep(1);
      return;
    }

    // ── Check validation registry (Steps 1, 2 & 3 register errors here) ──
    const REGISTRY_KEY_TO_STEP = {
      name_check:    1,
      status_date:   1,
      step2_address: 2,
      step3_contact: 3,
      step3_email:   3,
    };
    const registryError = getFirstValidationError();
    if (registryError) {
      setSaveError(registryError);
      const errorKey = Object.keys(validationRegistry.current)
        .find(k => validationRegistry.current[k]);
      setCurrentStep(REGISTRY_KEY_TO_STEP[errorKey] || 1);
      return;
    }

    // ── Build addresses array (only filled ones) ──
    const addressArr = Object.values(addresses).filter(a => a.street_name || a.block_no || a.postal_code);

    // ── Build contacts array ──
    const contactArr = [
      ...(contactDetails.emails || []).filter(e => e.email).map(e => ({
        contact_type: 'EMAIL', contact_value: e.email, is_primary: !!e.isPrimary,
        ...(e.contact_id ? { contact_id: e.contact_id } : {}),
      })),
      ...(contactDetails.mobiles || []).filter(m => m.number).map(m => ({
        contact_type: 'MOBILE', phone_country_code: m.code || '+65', contact_value: m.number, is_primary: !!m.isPrimary,
        ...(m.contact_id ? { contact_id: m.contact_id } : {}),
      })),
      ...(contactDetails.telephone ? [{
        contact_type: 'OFFICE', phone_country_code: contactDetails.telephoneCode || '+65',
        contact_value: contactDetails.telephone, is_primary: false,
        ...(contactDetails.telephoneContactId ? { contact_id: contactDetails.telephoneContactId } : {}),
      }] : []),
      ...(contactDetails.fax ? [{
        contact_type: 'FAX', phone_country_code: contactDetails.faxCode || '+65',
        contact_value: contactDetails.fax, is_primary: false,
        ...(contactDetails.faxContactId ? { contact_id: contactDetails.faxContactId } : {}),
      }] : []),
      ...(contactDetails.website ? [{
        contact_type: 'OTHER', contact_value: contactDetails.website, is_primary: false,
        ...(contactDetails.websiteContactId ? { contact_id: contactDetails.websiteContactId } : {}),
      }] : []),
    ];

    const toCSV = (arr) => Array.isArray(arr) && arr.length ? arr.join(',') : null;
    const portName = user?.portName || user?.port_name || null;

    const payload = {
      name:               basic.name,
      former_name:        basic.former_name        || null,
      client_no:          basic.client_no          || null,
      status:             basic.status             || 'ACTIVE',
      company_type_id:    basic.company_type_id    || null,
      uen_no:             basic.uen_no             || null,
      fbrn_reg_no:        basic.fbrn_reg_no        || null,
      uf_no:              basic.uf_no              || null,
      domes_bus_no:       basic.domes_bus_no       || null,
      acra_no:            basic.acra_no            || null,
      remarks:            basic.remarks            || null,
      additional_remarks: basic.additional_remarks || null,
      country:            basic.country            || 'Singapore',
      ...detail,
      service_ids:     toCSV(detail.service_ids),
      segregation_ids: toCSV(segregations),
      bn_ids:          toCSV(bnIds),
      group_ids:       toCSV(detail.group_ids),
      addresses:       addressArr,
      contacts:        contactArr,
      tag_ids:         formData.tag_ids || [],
      port_name:       portName,
     ...(isEdit
    ? { updated_by: user?.user_id || null }
    : { created_by: user?.user_id || null })
    };

    // Build FormData instead of plain object
    const fd = new FormData();

    // Append all scalar/array payload fields
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === 'object') {
          value.forEach((item, index) => {
            Object.entries(item).forEach(([subKey, subValue]) => {
              fd.append(`${key}[${index}][${subKey}]`, subValue ?? '');
            });
          });
        } else {
          value.forEach((item, index) => fd.append(`${key}[${index}]`, item ?? ''));
        }
      } else {
        fd.append(key, value);
      }
    });

    // Append proof files — same fieldname pattern as Individual
    const PROOF_FIELDNAME = {
      REGISTERED:          'proof_registered_address',
      MAILING:             'proof_mailing_address',
      BUSINESS:            'proof_business_address',
      FOREIGN:             'proof_foreign_address',
      OTHER:               'proof_other_address',
      REGISTER_OF_MEMBERS: 'proof_register_of_members_address',
    };
    Object.entries(proofFiles).forEach(([addrKey, files]) => {
      const fieldName = PROOF_FIELDNAME[addrKey];
      if (!fieldName) return;
      (files || []).forEach(file => {
        if (file instanceof File) fd.append(`${fieldName}[]`, file);
      });
    });

    // Append company logo — single file, or a removal flag if cleared
    if (logoFile instanceof File) {
      fd.append('company_logo', logoFile);
    } else if (removeLogo) {
      fd.append('remove_company_logo', '1');
    }

    setSaving(true);
    setSaveError(null);
    try {
      let res;
      if (isEdit) {
        res = await updateCompany(entity_id, fd);
        toast.success('Company updated successfully');
      } else {
        res = await createCompany(fd);
        toast.success('Company created successfully');
      }
      const logoError = res?.data?.logo_error;
      if (logoError) toast.warning(`Company saved, but logo upload failed: ${logoError}`);
      navigate('/company/list');
    } catch (err) {
      setSaveError(typeof err === 'string' ? err : 'Failed to save company. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progressPercent = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);
  const step            = STEPS[currentStep - 1];
  const StepComponent   = step.component;

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(f.type)) {
      setOcrError('Only PDF, PNG, JPG files are supported.');
      return;
    }
    setFile(f);
    setOcrDone(false);
    setOcrError(null);
    setPrefilled(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setOcrDone(false);
    setOcrError(null);
    setPrefilled(false);
  };

  // ── OCR submit ─────────────────────────────────────────────────────────────
  const handleOCR = async () => {
    if (!file) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrDone(false);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const mockOCR = {
        company_name:       'ABC Technologies Pte Ltd',
        uen:                '202312345A',
        incorporation_date: '2023-01-15',
        company_type:       'Private Limited (Pte Ltd)',
        financial_year_end: 'December',
        country:            'Singapore',
        company_email:      'info@abctech.sg',
        company_phone:      '+65 6123 4567',
        company_address:    '10 Anson Road, #10-01, Singapore 079903',
      };
      const mapped = mapOCRToFormData(mockOCR);
      setFormData(prev => ({ ...prev, ...mapped }));
      setOcrDone(true);
      setPrefilled(true);
      setCurrentStep(1);
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

  document.title = isEdit ? 'Edit Company | ASR CSS' : 'Add Company | ASR CSS';

  if (loadingEdit) return (
    <div className="wizard_wrap_ page-content cw-page d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <Spinner color="primary" />
    </div>
  );

  return (
    <div className="wizard_wrap_  page-content cw-page">
      <Container fluid className="cw-page-container">

        <Card className="overflow-hidden p-0 cw-page-card">
          <div className={classnames('cw-outer', { 'scanner-open': scannerOpen })}>

            {/* ── Left nav ── */}
            <div className="cw-nav">
              <div className="cw-nav-header">
                <h5><i className="ri-building-line me-2" />{isEdit ? 'Edit Company' : 'New Company'}</h5>
                <p>{isEdit ? 'Update company details' : 'Fill all sections and save'}</p>
              </div>
              <div className="cw-nav-body">
                {STEPS.map((s, index) => {
                  const isDone    = currentStep > s.id;
                  const isActive  = currentStep === s.id;
                  const isPending = currentStep < s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <div
                        className={classnames('cw-nav-item', { done: isDone, active: isActive })}
                        onClick={() => goTo(s.id)}
                      >
                        <div className="cw-nav-circle">
                          {isDone ? <i className="ri-check-line fs-12" /> : s.id}
                        </div>
                        <div className="cw-nav-text">
                          <b>{s.label}</b>
                          <small>{s.subLabel}</small>
                        </div>
                        <span className={classnames('cw-nav-status', { done: isDone, active: isActive, pending: isPending })}>
                          {isDone    ? <i className="ri-checkbox-circle-fill" />
                          : isActive ? <i className="ri-record-circle-line" />
                          :            <i className="ri-circle-line" />}
                        </span>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={classnames('cw-connector', { done: isDone })} />
                      )}
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
                <div className="cw-content-hicon"><i className={step.icon} /></div>
                <div>
                  <p className="cw-content-htitle">
                    Step {currentStep}: {step.label}
                    {prefilled && (
                      <span className="cw-prefilled-badge">
                        <i className="ri-magic-line" /> Pre-filled
                      </span>
                    )}
                  </p>
                  <p className="cw-content-hsub">{step.subLabel}</p>
                </div>
                <div className="ms-auto d-flex align-items-center gap-2">
                  {isEdit && (
                    <Link to={`/company/view/${entity_id}`} className="btn btn-info btn-sm d-flex align-items-center gap-1">
                      <i className="ri-eye-line" /> View
                    </Link>
                  )}
                  <Link to="/company/list" className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                    <i className="ri-list-unordered" /> All Companies
                  </Link>
                  <button
                    className={classnames('cw-scan-btn', { active: scannerOpen })}
                    onClick={() => setScannerOpen(o => !o)}
                  >
                    <i className={scannerOpen ? 'ri-close-line' : 'ri-scan-2-line'} />
                    {scannerOpen ? 'Close Scanner' : 'Scan Document'}
                    {ocrDone && !scannerOpen && (
                      <i className="ri-checkbox-circle-fill" style={{ color: '#0ab39c', marginLeft: 2 }} />
                    )}
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'rgba(64,81,137,.1)', color: '#405189' }}>
                    {currentStep} / {STEPS.length}
                  </span>
                </div>
              </div>

              <div className="cw-content-body">
                {/*
                  All three steps receive:
                    - registerValidationError : so they can push errors up
                    - onFetchHistory          : for Change/History modal data
                    - onSaveChange            : for persisting field changes
                    - onDeleteDocument        : for deleting uploaded files
                */}
                <StepComponent
                  key={stepKey}
                  formData={formData}
                  updateFormData={updateFormData}
                  prefilled={prefilled}
                  countries={countries}
                  isEditMode={isEdit}
                  entityId={entity_id || null}
                  onFetchHistory={handleFetchHistory}
                  onSaveChange={handleSaveChange}
                  registerValidationError={registerValidationError}
                  onDeleteDocument={handleImgDeleteRequest}
                  onProofFilesAdd={handleProofFilesAdd}
                  onProofFileDelete={handleProofFileDelete}
                  logoFile={logoFile}
                  onLogoSelect={handleLogoSelect}
                  onLogoRemove={handleLogoRemove}
                  onValidityChange={(isValid) => reportStepValid(currentStep, isValid)}
                />
              </div>

              {saveError && (
                <Alert color="danger" className="mx-3 mb-0 py-2 fs-12" toggle={() => setSaveError(null)}>
                  <i className="ri-error-warning-line me-1" />{saveError}
                </Alert>
              )}

              <div className="cw-content-footer">
                <div className="cw-footer-left-group">
                  <Button
                    color="light" size="sm"
                    onClick={prev}
                    disabled={currentStep === 1}
                    className="cw-footer-prev d-flex align-items-center gap-1 px-3"
                  >
                    <i className="ri-arrow-left-line" /> Previous
                  </Button>

                  {currentStep < STEPS.length && (
                    <Button
                      color="light" size="sm"
                      onClick={next}
                      className="cw-footer-next-btn d-flex align-items-center gap-1 px-3"
                    >
                      Next <i className="ri-arrow-right-line" />
                    </Button>
                  )}
                </div>

                {/*
                  Global Save — represents Step1 + Step2 + Step3 together, not
                  just the step currently on screen. Visible on every step, but
                  only enabled once every step has reported itself valid via
                  reportStepValid(). Clicking it always submits the full
                  formData (see handleSubmit), regardless of currentStep.
                */}
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!isEntireFormValid || saving}
                  className="cw-footer-save d-flex align-items-center gap-1 px-3"
                  title={!isEntireFormValid ? 'Complete all required fields across every step to enable Save' : undefined}
                >
                  {saving
                    ? <><Spinner size="sm" /> Saving...</>
                    : <><i className="ri-save-line" /> Save</>}
                </Button>
              </div>
            </div>

            {/* ── Right scanner panel ── */}
            <div className="cw-scanner">
              <div className="cw-scanner-head">
                <span><i className="ri-scan-2-line" />Document Scanner</span>
                <button className="cw-scanner-close" onClick={() => setScannerOpen(false)}>
                  <i className="ri-close-line" />
                </button>
              </div>
              <div className="cw-scanner-body">

                {ocrDone && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 12px', borderRadius: '7px', marginBottom: '10px',
                    background: 'rgba(10,179,156,.1)', border: '1px solid rgba(10,179,156,.25)',
                    fontSize: '11px', fontWeight: 500, color: '#0ab39c',
                  }}>
                    <i className="ri-checkbox-circle-fill" style={{ fontSize: '14px' }} />
                    Data extracted — form fields pre-filled
                  </div>
                )}

                {ocrError && (
                  <Alert color="danger" className="py-2 fs-12 mb-2">{ocrError}</Alert>
                )}

                {file ? (
                  <div className="cw-file-prev">
                    <div className="cw-file-icon">
                      <i className={file.type === 'application/pdf' ? 'ri-file-pdf-line' : 'ri-image-line'} />
                    </div>
                    <div className="cw-file-info">
                      <b>{file.name}</b>
                      <small>{formatSize(file.size)} · {file.type.split('/')[1].toUpperCase()}</small>
                    </div>
                    <button className="cw-file-remove" onClick={removeFile}>
                      <i className="ri-close-line" />
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
                    <div className="cw-drop-icon"><i className="ri-upload-cloud-2-line" /></div>
                    <h6>Upload Document</h6>
                    <p>Drag & drop or click to browse</p>
                    <div className="cw-drop-fmts">
                      {['PDF', 'PNG', 'JPG'].map(f => (
                        <span key={f} className="cw-drop-fmt">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  ref={inputRef} type="file" hidden
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => handleFile(e.target.files[0])}
                />

                {file && (
                  <div className="d-flex flex-column gap-2 mb-2">
                    <button className="cw-ocr-btn" disabled={ocrLoading} onClick={handleOCR}>
                      {ocrLoading
                        ? <><Spinner size="sm" /> Extracting data...</>
                        : ocrDone
                          ? <><i className="ri-refresh-line" /> Re-scan Document</>
                          : <><i className="ri-scan-2-line" /> Submit for OCR</>}
                    </button>
                    {ocrDone && (
                      <button
                        className="cw-ocr-btn"
                        style={{ background: 'transparent', border: '1px solid var(--vz-border-color)', color: 'var(--vz-body-color)' }}
                        onClick={removeFile}
                      >
                        <i className="ri-upload-2-line" /> Upload Different File
                      </button>
                    )}
                  </div>
                )}

                <div className="cw-tips">
                  <h6><i className="ri-lightbulb-line me-1" />Tips for best results</h6>
                  <div className="cw-tip"><i className="ri-check-line" />BizFile / ACRA documents work best</div>
                  <div className="cw-tip"><i className="ri-check-line" />Use clear, high-resolution scans</div>
                  <div className="cw-tip"><i className="ri-check-line" />PDF format gives most accurate results</div>
                  <div className="cw-tip"><i className="ri-check-line" />Review all pre-filled fields before saving</div>
                </div>

                {ocrDone && (
                  <p style={{ fontSize: '10px', color: 'var(--vz-sidebar-sub-item-color)', textAlign: 'center', marginTop: '10px' }}>
                    <i className="ri-information-line me-1" />
                    Highlighted fields were pre-filled. Review before proceeding.
                  </p>
                )}
              </div>
            </div>

          </div>
        </Card>
      </Container>

      {/* ── Image Delete Confirm Modal ── */}
      <Modal isOpen={imgDeleteModal} toggle={handleImgDeleteClose} fade centered modalClassName="zoomIn">
        <ModalBody className="py-3 px-5 position-relative">
          <button
            type="button" className="btn-close position-absolute top-0 end-0 m-2"
            onClick={handleImgDeleteClose} aria-label="Close"
          />
          <div className="mt-2 text-center">
            <lord-icon
              src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
              colors="primary:#f7b84b,secondary:#f06548" style={{ width: '100px', height: '100px' }}
            />
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>Are you sure?</h4>
              <p className="text-muted mx-4 mb-0">
                Are you sure you want to delete the <strong>file</strong>?
                This will permanently remove the file.
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button type="button" className="btn w-sm btn-light" onClick={handleImgDeleteClose} disabled={imgDeleteLoading}>
              Close
            </button>
            <button type="button" className="btn w-sm btn-danger" onClick={handleImgDeleteConfirm} disabled={imgDeleteLoading}>
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

export default Company;
