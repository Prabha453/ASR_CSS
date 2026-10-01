import React, { useState, useRef } from 'react';
import {
  Row, Col, Collapse, Button, Modal, ModalHeader,
  ModalBody, ModalFooter, Label, Input, FormFeedback,
} from 'reactstrap';
import FormInput from '../Components/FormInput';
import { toast } from 'react-toastify';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import {
  updateCompanyProfileAddress,
  getCompanyProfileAddressHistory,
  deleteCompanyProfileAddressHistory,
  deleteDocumentStore,
} from '../../../helpers/backend_helper';
import { getLoggedinUser } from '../../../helpers/api_helper';

/* ─── inline styles ──────────────────────────────────────────────────────── */
const css = `
  .addr-btn-group { display:flex; gap:8px; margin-top:4px; }
  .check-wrap      { padding:4px 0 0; }

  .sys-panel        { margin-top:20px; border:1px solid var(--vz-border-color); border-radius:8px; overflow:hidden; }
  .sys-panel-hdr    { display:flex; align-items:center; justify-content:space-between;
                      padding:12px 16px; background:var(--vz-light); cursor:pointer;
                      user-select:none; border-bottom:1px solid var(--vz-border-color); }
  .sys-panel-hdr:hover { background:rgba(64,81,137,.06); }
  .sys-panel-left   { display:flex; align-items:center; gap:10px; }
  .sys-icon         { width:32px; height:32px; border-radius:6px;
                      background:rgba(64,81,137,.1); color:#405189;
                      display:flex; align-items:center; justify-content:center; font-size:16px; }
  .sys-title        { font-size:13px; font-weight:600; color:var(--vz-body-color); margin:0; }
  .sys-sub          { font-size:11px; color:var(--vz-secondary-color,#878a99); margin-top:1px; }
  .sys-chevron      { font-size:18px; color:var(--vz-secondary-color,#878a99); transition:transform .2s; }
  .sys-chevron.open { transform:rotate(90deg); }
  .sys-body         { padding:16px; background:var(--vz-card-bg,#fff); }

  .sys-sec          { margin-bottom:16px; }
  .sys-sec:last-child { margin-bottom:0; }
  .sys-sec-title    { font-size:11px; font-weight:600; text-transform:uppercase;
                      letter-spacing:.05em; color:#405189; margin-bottom:10px;
                      padding-bottom:5px; border-bottom:1px solid var(--vz-border-color); }
  .sys-row          { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
  .sys-lbl          { font-size:12px; color:var(--vz-secondary-color,#878a99); min-width:220px; flex-shrink:0; }
  .sys-val          { font-size:12px; font-weight:500; color:var(--vz-body-color); }
  .sys-badges       { display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; }
  .sys-badge        { display:inline-flex; align-items:center; gap:4px; padding:3px 8px;
                      border-radius:4px; background:rgba(64,81,137,.08);
                      border:1px solid rgba(64,81,137,.2);
                      font-size:11px; font-weight:500; color:#405189; }

  .addr-radio-group { display:flex; gap:16px; margin-top:6px; }

  .hist-table       { width:100%; border-collapse:collapse; font-size:12px; }
  .hist-table th    { background:var(--vz-light); padding:8px 10px; font-weight:600;
                      border:1px solid var(--vz-border-color); white-space:nowrap; color:var(--vz-body-color); }
  .hist-table td    { padding:7px 10px; border:1px solid var(--vz-border-color); vertical-align:middle; }

  /* ── Image Upload Panel ──────────────────────────────────────────────── */
  .img-upload-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }

  .img-upload-card { border:1.5px dashed var(--vz-border-color); border-radius:10px;
                     padding:14px 12px; display:flex; flex-direction:column; align-items:center;
                     gap:10px; background:var(--vz-card-bg,#fff);
                     transition:border-color .2s, background .2s; position:relative; }
  .img-upload-card:hover { border-color:#405189; background:rgba(64,81,137,.02); }
  .img-upload-card.has-file { border-style:solid; border-color:rgba(64,81,137,.4); }

  .img-card-label  { font-size:11px; font-weight:600; color:var(--vz-body-color); text-align:center; line-height:1.3; }
  .img-card-hint   { font-size:10px; color:var(--vz-secondary-color,#878a99); text-align:center; }

  .img-preview-wrap { width:80px; height:60px; border-radius:6px; overflow:hidden;
                      border:1px solid var(--vz-border-color); background:#f8f8fa;
                      display:flex; align-items:center; justify-content:center; }
  .img-preview-wrap img { width:100%; height:100%; object-fit:contain; }
  .img-preview-placeholder { font-size:24px; color:var(--vz-secondary-color,#c0c4cc); }

  .img-upload-btn  { display:flex; align-items:center; gap:5px; padding:4px 12px;
                     border-radius:5px; border:1px solid #405189; color:#405189;
                     background:transparent; font-size:11px; font-weight:600;
                     cursor:pointer; transition:background .15s, color .15s; white-space:nowrap; }
  .img-upload-btn:hover { background:#405189; color:#fff; }

  /* delete button — top-right of card, only shown when image exists */
  .img-delete-btn  { position:absolute; top:6px; right:6px; width:22px; height:22px;
                     border-radius:50%; border:none; background:rgba(220,53,69,.12);
                     color:#dc3545; font-size:12px; display:flex; align-items:center;
                     justify-content:center; cursor:pointer; padding:0;
                     transition:background .15s; }
  .img-delete-btn:hover { background:rgba(220,53,69,.28); }

  .img-file-name   { font-size:10px; color:#405189; font-weight:500;
                     max-width:140px; overflow:hidden; text-overflow:ellipsis;
                     white-space:nowrap; text-align:center; }
`;

/* ─── Image field definitions ────────────────────────────────────────────── */
const IMAGE_FIELDS = [
  { key:'cp_company_logo',   urlKey:'cp_company_logo_url',   label:'Company Logo',          hint:'187 × 32 PNG recommended',           icon:'ri-building-line',  accept:'image/*'      },
  { key:'cp_port_logo',      urlKey:'cp_port_logo_url',      label:'Portal Logo',            hint:'80 × 80 PNG recommended',          icon:'ri-apps-line',      accept:'image/*'      },
  { key:'cp_port_fav_icon',  urlKey:'cp_port_fav_icon_url',  label:'Portal Favicon',         hint:'128 × 128 .ico / PNG recommended',     icon:'ri-global-line',    accept:'image/*,.ico' },
  { key:'cp_login_bg_image', urlKey:'cp_login_bg_image_url', label:'Login Page Background',  hint:'2000 × 1333 JPG / PNG recommended',    icon:'ri-image-2-line',   accept:'image/*'      },
];

/* ─── form config ────────────────────────────────────────────────────────── */
const getFormConfig = (currencyData, countriesData) => [
  { name:'cp_company_name',            label:'Entity Name',                      type:'text',     required:true, col:{md:4}, placeholder:'Enter entity name' },
  { name:'cp_registration_no',         label:'Registration No',                  type:'text',     col:{md:4} },
  { name:'cp_theme_style',             label:'Themes',                           type:'select',   col:{md:4},
    options:[{value:'custom',label:'Default (Blue)'},{value:'purple',label:'Purple'},{value:'light',label:'Light'},
             {value:'dark',label:'Dark'},{value:'green',label:'Green'},{value:'teal_yellow',label:'Teal / Yellow'}] },
  { name:'cp_registered_client',       label:'Client Registered Office Address', type:'checkbox', col:{md:12}, value:1, customRender:true },
  { name:'cp_mailling_address',        label:'Client Mailing Address',           type:'checkbox', col:{md:12}, value:1, customRender:true },
  { name:'cp_reg_add_block',           label:'Block / No',                       type:'text',     col:{md:4} },
  { name:'cp_registered_address',      label:'Street Name',                      type:'textarea', rows:2, col:{md:4} },
  { name:'cp_reg_add_building',        label:'Building',                         type:'text',     col:{md:4} },
  { name:'cp_reg_add_level',           label:'Level',                            type:'text',     col:{md:4} },
  { name:'cp_reg_add_unit',            label:'Unit',                             type:'text',     col:{md:4} },
  { name:'cp_country',                 label:'Country',                          type:'select',   col:{md:4}, placeholder:'Select Country', options:countriesData },
  { name:'cp_reg_add_pcode',           label:'Postal Code',                      type:'text',     col:{md:4} },
  { name:'cp_currency',                label:'Currency',                         type:'select',   col:{md:4}, placeholder:'Choose Currency', options:currencyData },
  { name:'cp_gst',                     label:'GST',                              type:'text',     col:{md:4} },
  { name:'cp_default_level_held_time', label:'AGM Held Time',                    type:'time',     col:{md:4} },
  { name:'cp_caps_proper',             label:'Countries / Nationality Name',     type:'select',   col:{md:4},
    options:[{value:0,label:'Caps'},{value:1,label:'Proper'}] },
  { name:'cp_port_title',              label:'Port Title',                       type:'text',     col:{md:4} },
];

const systemConfigFields = [
  { name:'cp_timezone_user', label:'Time Zone', type:'select', col:{md:6},
    options:[{value:'Asia/Singapore',label:'Asia/Singapore'},{value:'Asia/Kuala_Lumpur',label:'Asia/Kuala_Lumpur'},{value:'Asia/Kolkata',label:'Asia/Kolkata'}],
    placeholder:'Select timezone' },
];

const ADDR_DEFAULTS = {
  a_other_add_block:'', a_other_add_address_text:'', a_other_add_building:'',
  a_other_add_level:'', a_other_add_unit:'', a_other_add_country:'',
  a_other_add_pcode:'', proposed_or_effective:'0', address_effective_date:'',
};

// ─────────────────────────────────────────────────────────────────────────────
// ImageUploadCard
// ─────────────────────────────────────────────────────────────────────────────
const ImageUploadCard = ({ field, formik, profileDocuments = [], onDeleteRequest }) => {

  const inputRef = useRef(null);
  const fileVal  = formik.values[field.key];   // File object or null

  // Find the stored document row for this slot
  const existingDoc = profileDocuments.find((d) => d.sub_module_name === field.key);
  const existingUrl = existingDoc?.cdn_url || existingDoc?.file_path || '';

  const [previewSrc, setPreviewSrc] = useState('');

  // Sync server URL into preview when documents list updates
  React.useEffect(() => {
    if (!fileVal) {
      setPreviewSrc(existingUrl);
    }
  }, [existingUrl, fileVal]);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    formik.setFieldValue(field.key, f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target.result);
    reader.readAsDataURL(f);
  };

  // "X" button only appears when a saved server image exists
  // clicking it opens the shared delete confirm modal in the parent
  const handleDeleteClick = () => {
    if (existingDoc) {
      onDeleteRequest({ field, doc: existingDoc });
    }
  };

  // Deselect a newly-picked file (before save) — reverts to server image
  const handleDeselectNewFile = () => {
    formik.setFieldValue(field.key, null);
    setPreviewSrc(existingUrl || '');
    if (inputRef.current) inputRef.current.value = '';
  };

  const hasNewFile    = !!fileVal;
  const hasSavedImage = !!existingUrl;
  const showPreview   = !!previewSrc;

  return (
    <div className={`img-upload-card${hasNewFile ? ' has-file' : ''}`}>

      {/* ── Delete button: only when a saved server image exists ───────── */}
      {hasSavedImage && !hasNewFile && (
        <button
          type="button"
          className="img-delete-btn"
          title={`Delete ${field.label}`}
          onClick={handleDeleteClick}
        >
          <i className="ri-delete-bin-line" />
        </button>
      )}

      {/* ── Deselect button: only when a new file is queued (not saved yet) */}
      {hasNewFile && (
        <button
          type="button"
          className="img-delete-btn"
          title="Cancel selection"
          onClick={handleDeselectNewFile}
        >
          <i className="ri-close-line" />
        </button>
      )}

      {/* Preview */}
      <div className="img-preview-wrap">
        {showPreview ? (
          <img
            src={previewSrc}
            alt={field.label}
            crossOrigin="anonymous"
            style={{ width:'100%', height:'100%', objectFit:'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <span className="img-preview-placeholder">
            <i className={field.icon} />
          </span>
        )}
      </div>

      <span className="img-card-label">{field.label}</span>
      <span className="img-card-hint">{field.hint}</span>

      {hasNewFile && (
        <span className="img-file-name" title={fileVal.name}>{fileVal.name}</span>
      )}

      <input ref={inputRef} type="file" accept={field.accept}
        style={{ display:'none' }} onChange={handleChange} />

      <button type="button" className="img-upload-btn"
        onClick={() => inputRef.current?.click()}>
        <i className="ri-upload-2-line" />
        {showPreview ? 'Replace' : 'Upload'}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const CompanyInformation = ({ formik, currencyData = [], countriesData = [], fetchProfile }) => {

  const [panelOpen,      setPanelOpen]      = useState(true);
  const [imgPanelOpen,   setImgPanelOpen]   = useState(true);

  // address change modal
  const [changeModal,    setChangeModal]    = useState(false);
  const [historyModal,   setHistoryModal]   = useState(false);
  const [historyData,    setHistoryData]    = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saveLoading,    setSaveLoading]    = useState(false);
  const [addressForm,    setAddressForm]    = useState(ADDR_DEFAULTS);
  const [addressErrors,  setAddressErrors]  = useState({});

  // address history delete
  const [addrDeleteItem,    setAddrDeleteItem]    = useState(null);
  const [addrDeleteModal,   setAddrDeleteModal]   = useState(false);
  const [addrDeleteLoading, setAddrDeleteLoading] = useState(false);

  // ── Image delete — shared confirm modal ──────────────────────────────────
  // imgDeleteTarget = { field: IMAGE_FIELDS[n], doc: { doc_id, file_path, … } }
  const [imgDeleteTarget,  setImgDeleteTarget]  = useState(null);
  const [imgDeleteModal,   setImgDeleteModal]   = useState(false);
  const [imgDeleteLoading, setImgDeleteLoading] = useState(false);

  const loggedUser = getLoggedinUser();
  const changed_by = loggedUser?.user_id ?? loggedUser?.id ?? 1;
  const formConfig = getFormConfig(currencyData, countriesData);

  // ── Address change ────────────────────────────────────────────────────────
  const handleOpenChange = () => {
    setAddressForm({ ...ADDR_DEFAULTS });
    setAddressErrors({});
    setChangeModal(true);
  };
  const set = (f) => (e) => setAddressForm((prev) => ({ ...prev, [f]: e.target.value }));
  const validateAddr = () => {
    const errs = {};
    if (!addressForm.address_effective_date) errs.address_effective_date = 'Date is required';
    setAddressErrors(errs);
    return !Object.keys(errs).length;
  };
  const handleSave = async () => {
    if (!validateAddr()) return;
    setSaveLoading(true);
    try {
      const selectedCountry = countriesData.find((c) => String(c.value) === String(addressForm.a_other_add_country));
      await updateCompanyProfileAddress(1, {
        ...addressForm,
        a_other_add_country:    selectedCountry?.label || '',
        a_other_add_country_id: addressForm.a_other_add_country,
        changed_by,
      });
      if (fetchProfile) await fetchProfile();
      toast.success('Address change saved successfully');
      setChangeModal(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to save address change');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Address history ───────────────────────────────────────────────────────
  const handleOpenHistory = async () => {
    setHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res  = await getCompanyProfileAddressHistory(1);
      const data = res?.data ?? res ?? [];
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load address history');
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddrDeleteClick   = (h)  => { setAddrDeleteItem(h); setAddrDeleteModal(true); };
  const handleAddrDeleteClose   = ()   => { setAddrDeleteItem(null); setAddrDeleteModal(false); };
  const handleAddrDeleteConfirm = async () => {
    if (!addrDeleteItem) return;
    setAddrDeleteLoading(true);
    try {
      await deleteCompanyProfileAddressHistory(addrDeleteItem.id);
      setHistoryData((prev) => prev.filter((h) => h.id !== addrDeleteItem.id));
      toast.success('Address history record deleted');
      handleAddrDeleteClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete record');
    } finally {
      setAddrDeleteLoading(false);
    }
  };

  // ── Image delete ──────────────────────────────────────────────────────────
  // Called by ImageUploadCard when user clicks the delete (bin) icon
  const handleImgDeleteRequest = ({ field, doc }) => {
    setImgDeleteTarget({ field, doc });
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
      await deleteDocumentStore(imgDeleteTarget.doc.doc_id);

      // Clear the File value in formik so the card shows the placeholder
      formik.setFieldValue(imgDeleteTarget.field.key, null);

      // Refresh profile so documents[] updates and preview disappears
      if (fetchProfile) await fetchProfile();

      toast.success(`${imgDeleteTarget.field.label} deleted successfully`);
      handleImgDeleteClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete image');
    } finally {
      setImgDeleteLoading(false);
    }
  };

  return (
    <div>
      <style>{css}</style>

      {/* ── Main form ─────────────────────────────────────────────────────── */}
      <Row className="g-3">
        {formConfig.map((field, idx) => {
          if (field.customRender && field.name === 'cp_registered_client') {
            return (
              <Col key={idx} md={12}>
                <div className="form-check">
                  <Input type="checkbox" id="cp_registered_client"
                    checked={formik.values.cp_registered_client === 1}
                    onChange={(e) => formik.setFieldValue('cp_registered_client', e.target.checked ? 1 : 0)} />
                  <Label className="form-check-label fs-12" htmlFor="cp_registered_client">{field.label}</Label>
                </div>
              </Col>
            );
          }
          if (field.customRender && field.name === 'cp_mailling_address') {
            return (
              <Col key={idx} md={12}>
                <div className="form-check mb-2">
                  <Input type="checkbox" id="cp_mailling_address"
                    checked={formik.values.cp_mailling_address === 1}
                    onChange={(e) => formik.setFieldValue('cp_mailling_address', e.target.checked ? 1 : 0)} />
                  <Label className="form-check-label fs-12" htmlFor="cp_mailling_address">{field.label}</Label>
                </div>
                <div className="addr-btn-group">
                  <Button color="info" size="sm" onClick={handleOpenChange}>
                    <i className="ri-edit-line me-1" />Change
                  </Button>
                  <Button color="info" size="sm" outline onClick={handleOpenHistory}>
                    <i className="ri-history-line me-1" />History
                  </Button>
                </div>
              </Col>
            );
          }
          return <FormInput key={idx} config={[field]} formik={formik} />;
        })}
      </Row>

      {/* ── Image Uploads Panel ───────────────────────────────────────────── */}
      <div className="sys-panel">
        <div className="sys-panel-hdr" onClick={() => setImgPanelOpen((p) => !p)}>
          <div className="sys-panel-left">
            <div className="sys-icon"><i className="ri-image-line" /></div>
            <div>
              <p className="sys-title">Image Uploads</p>
              <p className="sys-sub">Company logo, favicon, portal &amp; login page images</p>
            </div>
          </div>
          <i className={`ri-arrow-right-s-line sys-chevron ${imgPanelOpen ? 'open' : ''}`} />
        </div>
        <Collapse isOpen={imgPanelOpen}>
          <div className="sys-body">
            <div className="sys-sec">
              <div className="img-upload-grid">
                {IMAGE_FIELDS.map((field) => (
                  <ImageUploadCard
                    key={field.key}
                    field={field}
                    formik={formik}
                    profileDocuments={formik.values.documents || []}
                    onDeleteRequest={handleImgDeleteRequest}
                  />
                ))}
              </div>
            </div>
            <p className="mb-0 mt-1" style={{ fontSize:11, color:'var(--vz-secondary-color,#878a99)' }}>
              <i className="ri-information-line me-1" />
              Accepted formats: JPG, PNG, SVG, ICO, GIF — max 100 MB per file.
              Changes take effect after saving the profile.
            </p>
          </div>
        </Collapse>
      </div>

      {/* ── System Configuration Panel ────────────────────────────────────── */}
      <div className="sys-panel">
        <div className="sys-panel-hdr" onClick={() => setPanelOpen((p) => !p)}>
          <div className="sys-panel-left">
            <div className="sys-icon"><i className="ri-settings-4-line" /></div>
            <div>
              <p className="sys-title">System Configuration</p>
              <p className="sys-sub">Attachment settings, timezone &amp; file types</p>
            </div>
          </div>
          <i className={`ri-arrow-right-s-line sys-chevron ${panelOpen ? 'open' : ''}`} />
        </div>
        <Collapse isOpen={panelOpen}>
          <div className="sys-body">
            <div className="sys-sec">
              <div className="sys-sec-title">Attachment Configuration</div>
              <div className="sys-row">
                <span className="sys-lbl">Default upload file size (MB)</span>
                <span className="sys-val">100 MB</span>
              </div>
              <div className="sys-row">
                <span className="sys-lbl">Default upload file size (bytes)</span>
                <span className="sys-val">104,857,600 Bytes</span>
              </div>
              <div>
                <span className="sys-lbl d-block mb-2">Allowed file types</span>
                <div className="sys-badges">
                  {['.jpg','.png','.pdf','.doc','.docx','.xls','.xlsx'].map((ext) => (
                    <span key={ext} className="sys-badge"><i className="ri-check-line" />{ext}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="sys-sec">
              <div className="sys-sec-title">System Settings</div>
              <Row className="g-3">
                <FormInput config={systemConfigFields} formik={formik} />
              </Row>
            </div>
          </div>
        </Collapse>
      </div>

      {/* ── Address Change Modal ──────────────────────────────────────────── */}
      <Modal isOpen={changeModal} toggle={() => setChangeModal(false)} centered size="md">
        <ModalHeader className="bg-light p-3" toggle={() => setChangeModal(false)}>
          <i className="ri-map-pin-line me-2" />Address Change
        </ModalHeader>
        <ModalBody className="p-3">
          <Row className="g-2">
            <Col md={6}><Label className="mb-1 fs-12">Block / No</Label>
              <Input type="text" placeholder="Enter block/no" bsSize="sm"
                value={addressForm.a_other_add_block} onChange={set('a_other_add_block')} /></Col>
            <Col md={6}><Label className="mb-1 fs-12">Building</Label>
              <Input type="text" placeholder="Enter building" bsSize="sm"
                value={addressForm.a_other_add_building} onChange={set('a_other_add_building')} /></Col>
            <Col md={12}><Label className="mb-1 fs-12">Street Name</Label>
              <Input type="textarea" rows={2} placeholder="Enter street name"
                value={addressForm.a_other_add_address_text} onChange={set('a_other_add_address_text')} /></Col>
            <Col md={6}><Label className="mb-1 fs-12">Level</Label>
              <Input type="text" placeholder="Enter level" bsSize="sm"
                value={addressForm.a_other_add_level} onChange={set('a_other_add_level')} /></Col>
            <Col md={6}><Label className="mb-1 fs-12">Unit</Label>
              <Input type="text" placeholder="Enter unit" bsSize="sm"
                value={addressForm.a_other_add_unit} onChange={set('a_other_add_unit')} /></Col>
            <Col md={6}><Label className="mb-1 fs-12">Country</Label>
              <Input type="select" bsSize="sm" value={addressForm.a_other_add_country} onChange={set('a_other_add_country')}>
                <option value="">Select country</option>
                {countriesData.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Input></Col>
            <Col md={6}><Label className="mb-1 fs-12">Postal Code</Label>
              <Input type="text" placeholder="Enter postal code" bsSize="sm"
                value={addressForm.a_other_add_pcode} onChange={set('a_other_add_pcode')} /></Col>
            <Col md={6}><Label className="mb-1 fs-12">Proposed / Effective</Label>
              <div className="addr-radio-group">
                <div className="form-check form-check-inline mb-0">
                  <Input type="radio" id="rProposed" name="poe" value="0"
                    checked={addressForm.proposed_or_effective === '0'} onChange={set('proposed_or_effective')} className="form-check-input" />
                  <Label check className="form-check-label fs-12 ms-1" htmlFor="rProposed">Proposed</Label>
                </div>
                <div className="form-check form-check-inline mb-0">
                  <Input type="radio" id="rEffective" name="poe" value="1"
                    checked={addressForm.proposed_or_effective === '1'} onChange={set('proposed_or_effective')} className="form-check-input" />
                  <Label check className="form-check-label fs-12 ms-1" htmlFor="rEffective">Effective</Label>
                </div>
              </div></Col>
            <Col md={6}><Label className="mb-1 fs-12">Date <span className="text-danger">*</span></Label>
              <DatePickerInput value={addressForm.address_effective_date}
                onChange={set('address_effective_date')} invalid={!!addressErrors.address_effective_date} />
              {addressErrors.address_effective_date && <FormFeedback>{addressErrors.address_effective_date}</FormFeedback>}
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter className="py-2">
          <Button type="button" color="light" size="sm" onClick={() => setChangeModal(false)}>Close</Button>
          <Button type="button" color="success" size="sm" onClick={handleSave} disabled={saveLoading}>
            <i className="ri-save-line me-1" />{saveLoading ? 'Saving…' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Address History Modal ─────────────────────────────────────────── */}
      <Modal isOpen={historyModal} toggle={() => setHistoryModal(false)} centered size="lg">
        <ModalHeader className="bg-light p-3" toggle={() => setHistoryModal(false)}>
          <i className="ri-history-line me-2" />Address History
        </ModalHeader>
        <ModalBody className="p-3">
          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-success" role="status" />
              <p className="mt-2 mb-0 fs-12 text-muted">Loading history…</p>
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-center py-4">
              <i className="ri-map-pin-line fs-1 text-muted d-block mb-2" />
              <h6 className="fw-medium">No Address History Found</h6>
              <p className="text-muted mb-0 fs-12">There are no previous address changes recorded.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="hist-table">
                <thead>
                  <tr>
                    <th style={{width:44}}>S/No.</th><th style={{width:85}}>Type</th>
                    <th style={{width:100}}>Date</th><th>Old Address</th><th>New Address</th>
                    <th style={{width:80}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={h.id}>
                      <td className="text-center">{i + 1}</td>
                      <td>
                        <span className={`badge ${h.type === 'Effective' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="text-nowrap">{h.type === 'Effective' ? h.effective_date || '—' : h.proposed_date || '—'}</td>
                      <td>{h.old_address || '—'}</td>
                      <td>{h.new_address || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-soft-danger" onClick={() => handleAddrDeleteClick(h)} title="Delete">
                          <i className="ri-delete-bin-fill" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="py-2">
          <Button type="button" color="light" size="sm" onClick={() => setHistoryModal(false)}>
            <i className="ri-close-line me-1" />Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Address History Delete Confirm ────────────────────────────────── */}
      <Modal isOpen={addrDeleteModal} toggle={handleAddrDeleteClose} fade centered modalClassName="zoomIn">
        <ModalBody className="py-3 px-5 position-relative">
          <button type="button" className="btn-close position-absolute top-0 end-0 m-2"
            onClick={handleAddrDeleteClose} aria-label="Close" />
          <div className="mt-2 text-center">
            <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
              colors="primary:#f7b84b,secondary:#f06548" style={{width:'100px',height:'100px'}} />
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>Are you sure?</h4>
              <p className="text-muted mx-4 mb-0">
                Are you sure you want to delete this{' '}
                <strong>
                  {addrDeleteItem
                    ? `${addrDeleteItem.type} address record${addrDeleteItem.effective_date ? ` (${addrDeleteItem.effective_date})` : addrDeleteItem.proposed_date ? ` (${addrDeleteItem.proposed_date})` : ''}`
                    : ''}
                </strong>?
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button type="button" className="btn w-sm btn-light" onClick={handleAddrDeleteClose} disabled={addrDeleteLoading}>Close</button>
            <button type="button" className="btn w-sm btn-danger" onClick={handleAddrDeleteConfirm} disabled={addrDeleteLoading}>
              {addrDeleteLoading ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Deleting…</> : 'Yes, Delete It!'}
            </button>
          </div>
        </ModalBody>
      </Modal>

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
                <strong>{imgDeleteTarget?.field?.label ?? 'image'}</strong>?
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

export default CompanyInformation;
