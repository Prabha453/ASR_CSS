import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Col, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner } from 'reactstrap';
import {
  getCompanyList,
  getEntityList,
  getFormTemplatePopupOptions,
  getFormTemplatePopupSchema,
  mergeFormTemplatePopupSchemas,
  previewFormTemplate,
  createFormGenerationRun,
  renderFormGenerationHtml,
  renderFormGenerationPdf,
  renderFormGenerationDocx,
  downloadFormGenerationArtifact,
  renderFormDirect,
  renderFormDirectHtml,
} from '../../helpers/backend_helper';

const unwrapList = response => {
  const value = response?.data?.data ?? response?.data ?? response ?? [];
  return Array.isArray(value) ? value : value?.data || [];
};
const responseData = response => response?.data ?? response ?? {};
const loadCompanies = async () => {
  const response = await getCompanyList({ page: 1, limit: 1000, sort: 'name', order: 'ASC' });
  const companies = unwrapList(response);
  if (companies.length) return companies;

  // Keep generation usable if the paginated company query returns no rows.
  const fallback = unwrapList(await getEntityList());
  return fallback.filter(entity => String(entity.entity_type || '').toUpperCase() === 'COMPANY');
};


// "Data source" values (see POPUP_VALUE_SOURCES in common_helper.js) whose
// option lists are fetched from the server for the chosen company. Every other
// data source is either typed by hand (MANUAL), a fixed choice (DATES) or
// auto-filled at generation time (COMPANY).
const REMOTE_DATA_SOURCES = new Set([
  'OFFICIAL_RECORDS',      // All Official records
  'COMPLAINANT',           // All complainants / Events
  'SHARES',                // Shareholding (company-level and shareholder-level)
  // ── legacy data sources kept for older published forms ──
  'SHAREHOLDERS',          // superseded by OFFICIAL_RECORDS (role: shareholders) + SHARES
  'EVENT',
  'OFFICIALS',
  'ALLOTMENTS',
  'SHARE_TRANSACTIONS',
]);
const isRemoteDataSource = source => REMOTE_DATA_SOURCES.has(source);


const hasValue = value => value !== '' && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0);

// Turn a role slug ("directors", "alternate_directors", "secretaries") into a
// singular Title-Case label for the RADIO_SWITCH toggle ("Director",
// "Alternate Director", "Secretary").
const singularise = word => word.endsWith('ss') ? word
  : word.endsWith('ies') ? `${word.slice(0, -3)}y`
    : word.endsWith('s') ? word.slice(0, -1) : word;
const roleLabel = slug => String(slug || '').replace(/[_-]+/g, ' ').trim()
  .split(' ').filter(Boolean)
  .map(word => singularise(word.toLowerCase()))
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ') || 'Option';
const newIdempotencyKey = () => globalThis.crypto?.randomUUID?.() ||
  `form-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const GEN_POPUP_CSS = `
  .gen-popup { border:none; border-radius:14px; overflow:hidden;
    box-shadow:0 24px 60px rgba(15,23,42,.22); }

  .gen-popup .modal-header.gp-header { align-items:center; padding:18px 22px;
    background:linear-gradient(135deg,#405189,#4c63a6); border-bottom:none; }
  .gen-popup .gp-header .modal-title { display:flex; align-items:center; gap:14px;
    color:#fff; width:100%; }
  .gen-popup .gp-header .btn-close { filter:brightness(0) invert(1); opacity:.9; }
  .gen-popup .gp-header .btn-close:hover { opacity:1; }
  .gp-header-icon { width:40px; height:40px; border-radius:11px; flex-shrink:0;
    background:rgba(255,255,255,.16); display:flex; align-items:center;
    justify-content:center; font-size:20px; }
  .gp-header-text { display:flex; flex-direction:column; line-height:1.3; min-width:0; }
  .gp-header-title { font-size:16px; font-weight:600; }
  .gp-header-sub { font-size:12px; font-weight:400; opacity:.85; }

  .gen-popup .modal-body { background:#f6f7fb; padding:20px 22px; }

  .gp-card { background:#fff; border:1px solid #eceef3; border-radius:12px;
    padding:16px 18px; margin-bottom:16px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
  .gp-card:last-child { margin-bottom:0; }

  .gp-section-hdr { display:flex; align-items:center; gap:8px; font-size:12px;
    font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#405189;
    margin-bottom:14px; padding-bottom:10px; border-bottom:1px dashed #e3e6ee; }
  .gp-section-dot { width:7px; height:7px; border-radius:50%; background:#405189; flex-shrink:0; }

  .gp-label { font-size:12px; font-weight:600; color:#3b4256; margin-bottom:5px;
    display:flex; align-items:center; gap:5px; }
  .gp-label i { color:#405189; font-size:13px; }
  .gp-req { color:#f06548; }

  .gen-popup .modal-body .form-control,
  .gen-popup .modal-body .form-select { font-size:13px; border-color:#dfe2ea;
    border-radius:8px; padding:7px 10px; min-height:38px; }
  .gen-popup .modal-body .form-control:focus,
  .gen-popup .modal-body .form-select:focus { border-color:#405189;
    box-shadow:0 0 0 .18rem rgba(64,81,137,.15); }
  .gen-popup .modal-body select[multiple].form-select { min-height:104px; }

  .gp-choice-grid { display:flex; flex-wrap:wrap; gap:8px; }

  /* RADIO_SWITCH: role toggle stacked above its filtered record picker */
  .gp-switch { display:flex; flex-direction:column; gap:9px; }
  .gp-switch > .gp-choice-grid label.form-check-label { font-weight:600; }
  .gen-popup .modal-body label.form-check-label { display:inline-flex; align-items:center;
    gap:7px; margin:0; padding:7px 12px; border:1px solid #dfe2ea; border-radius:9px;
    font-size:13px; cursor:pointer; background:#fff; transition:.15s; }
  .gen-popup .modal-body label.form-check-label:hover { border-color:#405189;
    background:rgba(64,81,137,.04); }
  .gen-popup .modal-body label.form-check-label:has(input:checked) { border-color:#405189;
    background:rgba(64,81,137,.09); color:#405189; font-weight:600; }
  .gen-popup .modal-body label.form-check-label input { accent-color:#405189;
    width:15px; height:15px; margin:0; flex-shrink:0; }

  .gp-empty { border:1px dashed #d7dbe6; border-radius:10px; background:#fff;
    padding:18px; text-align:center; color:#878a99; font-size:13px; }

  .gp-document-dialog { width:min(96vw,900px); max-width:none; }
  .gp-document-dialog.gp-landscape { width:min(96vw,1220px); }
  .gp-document-modal { border:0; border-radius:12px; overflow:hidden; }
  .gp-document-modal .modal-header { background:#fff; border-bottom:1px solid #e5e8ef; }
  .gp-document-modal .modal-body { height:min(80vh,900px); padding:24px;
    overflow:auto; text-align:center; background:#e9edf3; }
  .gp-document-page { display:inline-block; vertical-align:top; text-align:left;
    background:#fff; box-shadow:0 5px 24px rgba(22,34,54,.2); }
  .gp-document-page iframe { display:block; width:100%; height:100%; border:0;
    overflow:hidden; background:#fff; }
  .gp-document-modal .modal-footer { background:#fff; border-top:1px solid #e5e8ef; }

  .gen-popup .modal-footer { background:#fff; border-top:1px solid #eceef3;
    padding:14px 22px; gap:8px; }
  .gen-popup .modal-footer .btn { font-size:13px; font-weight:500; border-radius:8px;
    padding:8px 16px; display:inline-flex; align-items:center; }
`;

export const clearDependents = (fields, values, changedKey) => {
  const next = { ...values };
  const queue = [changedKey];
  while (queue.length) {
    const parent = queue.shift();
    fields.filter(field => field.depends_on?.includes(parent)).forEach(field => {
      next[field.field_key] = field.multiple ? [] : '';
      queue.push(field.field_key);
    });
  }
  return next;
};

const GenerationPopup = ({ form, forms = null, isOpen, onClose, entityId = null }) => {
  const [schema, setSchema] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(entityId || '');
  const [values, setValues] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [htmlViewing, setHtmlViewing] = useState(false);
  const [htmlPreviews, setHtmlPreviews] = useState([]);
  const [activeHtmlPreview, setActiveHtmlPreview] = useState(0);
  const [htmlDocumentHeight, setHtmlDocumentHeight] = useState(0);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifact, setActiveArtifact] = useState(0);
  const [pdfResults, setPdfResults] = useState([]);
  const [docxResults, setDocxResults] = useState([]);
  const [docxGenerating, setDocxGenerating] = useState(false);
  // RADIO_SWITCH: the role currently toggled per field ({ field_key: roleSlug }).
  const [switchRoles, setSwitchRoles] = useState({});
  const idempotencyKeys = useRef({});
  const optionRequest = useRef(0);
  const htmlRequest = useRef(0);
  const htmlResizeObserver = useRef(null);
  const targets = useMemo(() => forms?.length ? forms : form ? [form] : [], [forms, form]);
  const primaryForm = targets[0] || null;

  const fields = useMemo(() => schema.flatMap(section => section.fields || []), [schema]);

  useEffect(() => () => {
    htmlResizeObserver.current?.disconnect();
    htmlResizeObserver.current = null;
  }, [htmlPreviews, activeHtmlPreview]);

  // Options are only re-fetched when a *parent* field (one that something else
  // depends on) changes — not on every keystroke or checkbox click.
  const parentKeys = useMemo(
    () => [...new Set(fields.flatMap(field => field.depends_on || []))].sort(),
    [fields],
  );
  const dependencySignature = useMemo(
    () => JSON.stringify(parentKeys.map(key => [key, values[key] ?? null])),
    [parentKeys, values],
  );

  useEffect(() => {
    if (!isOpen || !primaryForm?.form_id) return;
    let active = true;
    setLoading(true);
    setValues({});
    setSwitchRoles({});
    setErrors([]);
    htmlRequest.current += 1;
    setHtmlViewing(false);
    setHtmlPreviews([]);
    setActiveHtmlPreview(0);
    setHtmlDocumentHeight(0);
    setPreview(null);
    setArtifacts([]);
    setPdfResults([]);
    setDocxResults([]);
    setActiveArtifact(0);
    idempotencyKeys.current = {};
    Promise.all([
      targets.length > 1
        ? mergeFormTemplatePopupSchemas(targets.map(target => target.form_id))
        : getFormTemplatePopupSchema(primaryForm.form_id),
      entityId ? Promise.resolve(null) : loadCompanies(),
    ]).then(([schemaResponse, companyResponse]) => {
      if (!active) return;
      setSchema(responseData(schemaResponse)?.popup_schema || []);
      setCompanies(companyResponse || []);
      setCompanyId(entityId || '');
    }).catch(error => {
      if (active) setErrors([{ message: error?.message || String(error) || 'Unable to load generation form' }]);
    }).finally(() => active && setLoading(false));
    return () => { active = false; htmlRequest.current += 1; };
  }, [isOpen, primaryForm?.form_id, entityId, targets]);

  useEffect(() => {
    if (!isOpen || !companyId || !fields.length) return;
    const currentValues = values;
    const loadable = fields.filter(field => isRemoteDataSource(field.value_source) &&
      (field.depends_on || []).every(key => hasValue(currentValues[key])));
    if (!loadable.length) return;
    const requestId = ++optionRequest.current;
    setOptionLoading(Object.fromEntries(loadable.map(field => [field.field_key, true])));
    Promise.all(loadable.map(async field => {
      const parent = field.depends_on?.[0] ? currentValues[field.depends_on[0]] : undefined;
      const optionFormId = field.origin_form_ids?.[0] || primaryForm.form_id;
      const response = await getFormTemplatePopupOptions(optionFormId, field.field_key, {
        entity_id: companyId,
        ...(parent ? { parent_value: parent } : {}),
      });
      const data = responseData(response);
      return [field.field_key, data?.options || [], data];
    })).then(entries => {
      if (requestId === optionRequest.current) {
        setOptions(current => ({ ...current, ...Object.fromEntries(entries.map(([key, loaded]) => [key, loaded])) }));
      }
    }).catch(error => {
      if (requestId === optionRequest.current) setErrors([{ message: error?.message || String(error) || 'Unable to load options' }]);
    }).finally(() => {
      if (requestId === optionRequest.current) setOptionLoading({});
    });
  }, [isOpen, companyId, fields, dependencySignature, primaryForm?.form_id]);

  // A DATES field is a "Blank / Today's Date" choice. Pre-select it from the
  // builder default (source_filter_1); the user can still change it.
  useEffect(() => {
    const dateFields = fields.filter(field => field.value_source === 'DATES');
    if (!dateFields.length) return;
    setValues(current => {
      let changed = false;
      const next = { ...current };
      for (const field of dateFields) {
        if (next[field.field_key] === undefined) {
          next[field.field_key] = field.source_filter_1 === 'today' ? 'today'
            : field.source_filter_1 === 'leave_empty' ? 'blank' : '';
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [fields, companyId]);

  const changeValue = useCallback((field, value) => {
    setValues(current => ({ ...clearDependents(fields, current, field.field_key), [field.field_key]: value }));
    setErrors(current => current.filter(error => error.field_key !== field.field_key));
    htmlRequest.current += 1;
    setHtmlViewing(false);
    setHtmlPreviews([]);
    setPreview(null);
    setArtifacts([]);
    setPdfResults([]);
    setDocxResults([]);
    idempotencyKeys.current = {};
  }, [fields]);

  const valuesForTarget = useCallback(target => Object.fromEntries(fields
    .filter(field => !field.origin_form_ids || field.origin_form_ids.map(String).includes(String(target.form_id)))
    .filter(field => Object.prototype.hasOwnProperty.call(values, field.field_key))
    .map(field => [field.field_key, values[field.field_key]])), [fields, values]);

  const viewHtml = async () => {
    if (!companyId) {
      setErrors([{ field_key: 'entity_id', message: 'Select a company' }]);
      return;
    }
    const requestId = ++htmlRequest.current;
    setHtmlViewing(true);
    setHtmlPreviews([]);
    setErrors([]);
    try {
      const previews = await Promise.all(targets.map(async target => {
        const html = await renderFormDirectHtml(target.form_id, {
          entity_id: Number(companyId), popup_values: valuesForTarget(target),
        });
        if (typeof html !== 'string') throw new Error('Invalid HTML preview response');
        return { form: target, html };
      }));
      if (requestId === htmlRequest.current) {
        setHtmlPreviews(previews);
        setActiveHtmlPreview(0);
        setHtmlDocumentHeight(0);
      }
    } catch (error) {
      if (requestId === htmlRequest.current) {
        setErrors([{ message: typeof error === 'string' ? error : error?.message || 'HTML preview failed' }]);
      }
    } finally {
      if (requestId === htmlRequest.current) setHtmlViewing(false);
    }
  };

  const closeHtmlPreview = () => {
    setHtmlPreviews([]);
    onClose();
  };

  const sizeHtmlFrame = event => {
    const document = event.currentTarget.contentDocument;
    if (!document) return;
    htmlResizeObserver.current?.disconnect();
    const measure = () => setHtmlDocumentHeight(Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    ));
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(document.documentElement);
      if (document.body) observer.observe(document.body);
      htmlResizeObserver.current = observer;
    }
  };

  const validateAndPreview = async () => {
    if (!companyId) { setErrors([{ field_key: 'entity_id', message: 'Select a company' }]); return; }
    setSubmitting(true);
    try {
      const responses = await Promise.all(targets.map(target => {
        const targetValues = valuesForTarget(target);
        return previewFormTemplate(target.form_id, {
          entity_id: Number(companyId), popup_values: targetValues,
        });
      }));
      const results = responses.map(responseData);
      setPreview({ ready: results.every(result => result.ready), results });
      setErrors(results.flatMap((result, index) => (result?.popup_validation?.errors || []).map(error => ({
        ...error,
        message: targets.length > 1 ? `${targets[index].form_name}: ${error.message}` : error.message,
      }))));
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'Preview validation failed' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const prepareAndRender = async () => {
    if (!preview?.ready) return;
    setGenerating(true);
    setErrors([]);
    try {
      const rendered = await Promise.all(targets.map(async target => {
        const key = idempotencyKeys.current[target.form_id] || newIdempotencyKey();
        idempotencyKeys.current[target.form_id] = key;
        const runResponse = await createFormGenerationRun(target.form_id, {
          entity_id: Number(companyId),
          popup_values: valuesForTarget(target),
        }, key);
        const run = responseData(runResponse);
        const artifactResponse = await renderFormGenerationHtml(run.generation_run_id);
        return { form: target, run, artifact: responseData(artifactResponse) };
      }));
      setArtifacts(rendered);
      setActiveArtifact(0);
      setPdfResults([]);
      setDocxResults([]);
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'HTML generation failed' }]);
    } finally {
      setGenerating(false);
    }
  };

  const downloadArtifact = async (artifactId, fileName) => {
    if (!artifactId) throw new Error('Generated artifact is missing');
    const blob = await downloadFormGenerationArtifact(artifactId);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoking synchronously can cancel the download in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const createCurrentRuns = () => {
    if (!companyId) {
      setErrors([{ field_key: 'entity_id', message: 'Select a company' }]);
      return null;
    }
    return Promise.all(targets.map(async target => {
      const runResponse = await createFormGenerationRun(target.form_id, {
        entity_id: Number(companyId),
        popup_values: valuesForTarget(target),
      }, newIdempotencyKey());
      return { form: target, run: responseData(runResponse) };
    }));
  };

  const downloadDirectBlob = async (blob, fileName, format) => {
    if (!(blob instanceof Blob)) throw new Error(`Invalid ${format.toUpperCase()} download response`);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const valid = format === 'pdf'
      ? bytes.length > 4 && String.fromCharCode(...bytes.slice(0, 4)) === '%PDF'
      : bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!valid) throw new Error(`Server did not return a valid ${format.toUpperCase()} file`);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const generatePdfs = async () => {
    setPdfGenerating(true);
    setErrors([]);
    try {
      if (!companyId) return;
      await Promise.all(targets.map(async target => {
        const blob = await renderFormDirect(target.form_id, 'pdf', {
          entity_id: Number(companyId), popup_values: valuesForTarget(target),
        });
        await downloadDirectBlob(blob, `${target.form_name}.pdf`, 'pdf');
      }));
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'PDF generation failed' }]);
    } finally {
      setPdfGenerating(false);
    }
  };

  const generateDocx = async () => {
    setDocxGenerating(true);
    setErrors([]);
    try {
      if (!companyId) return;
      await Promise.all(targets.map(async target => {
        const blob = await renderFormDirect(target.form_id, 'docx', {
          entity_id: Number(companyId), popup_values: valuesForTarget(target),
        });
        await downloadDirectBlob(blob, `${target.form_name}.docx`, 'docx');
      }));
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'DOCX generation failed' }]);
    } finally {
      setDocxGenerating(false);
    }
  };

  const downloadPdf = async item => {
    try {
      const artifact = item.pdf?.artifact;
      await downloadArtifact(
        artifact?.generation_artifact_id,
        item.pdf?.document?.doc_name || `${item.form.form_name}.pdf`,
      );
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'PDF download failed' }]);
    }
  };

  const downloadDocx = async item => {
    try {
      const artifact = item.docx?.artifact;
      await downloadArtifact(
        artifact?.generation_artifact_id,
        item.docx?.document?.doc_name || `${item.form.form_name}.docx`,
      );
    } catch (error) {
      setErrors([{ message: error?.message || String(error) || 'DOCX download failed' }]);
    }
  };

  const fieldError = key => errors.find(error => error.field_key === key)?.message;

  /* ══════════════════════════════════════════════════════════════════
     FIELD RENDERING — one branch per "Data source" (field.value_source).

     `renderField` is just a switch: each case delegates to a small helper
     below so you can change one data source without touching the others.
     Data sources come from POPUP_VALUE_SOURCES in common_helper.js.
  ══════════════════════════════════════════════════════════════════ */

  // COMPANY — value is pulled from the selected company at generation time,
  // so there is nothing for the user to choose here.
  const renderCompanyField = () =>
    <Input value="Loaded automatically from the selected company" disabled />;

  // DATES — a "Blank / Today's Date" choice; the generator substitutes the
  // real date. The default is pre-selected by the effect further up.
  const renderDatesField = field => (
    <Input type="select" value={values[field.field_key] ?? ''}
      invalid={Boolean(fieldError(field.field_key))}
      onChange={event => changeValue(field, event.target.value)}>
      <option value="">- Select Date -</option>
      <option value="blank">Blank</option>
      <option value="today">Today&apos;s Date</option>
    </Input>
  );

  // Shared control for any field backed by a list of { value, label } options,
  // no matter where the list came from (server or builder-configured).
  const renderOptionList = (field, fieldOptions, disabled, placeholder = 'Select...') => {
    if (field.control_type === 'RADIO') {
      return <div className="gp-choice-grid">
        {fieldOptions.map(option => <Label check key={String(option.value)}>
          <Input type="radio" name={field.field_key} value={option.value} disabled={disabled}
            checked={String(values[field.field_key] ?? '') === String(option.value)}
            onChange={event => changeValue(field, event.target.value)} />{' '}{option.label}
        </Label>)}
      </div>;
    }
    if (field.control_type === 'CHECKBOX') {
      const selected = Array.isArray(values[field.field_key]) ? values[field.field_key] : [];
      return <div className="gp-choice-grid">
        {fieldOptions.map(option => <Label check key={String(option.value)}>
          <Input type="checkbox" disabled={disabled}
            checked={selected.map(String).includes(String(option.value))}
            onChange={event => changeValue(field, event.target.checked
              ? [...selected, option.value]
              : selected.filter(value => String(value) !== String(option.value)))} />{' '}{option.label}
        </Label>)}
      </div>;
    }
    const multiple = field.multiple || field.control_type === 'MULTISELECT';
    return (
      <Input type="select" multiple={multiple} value={values[field.field_key] || (multiple ? [] : '')}
        disabled={disabled}
        invalid={Boolean(fieldError(field.field_key))}
        onChange={event => changeValue(field, multiple
          ? Array.from(event.target.selectedOptions).map(option => option.value)
          : event.target.value)}>
        {!multiple && <option value="">{placeholder}</option>}
        {fieldOptions.map(option => <option key={String(option.value)} value={option.value}>{option.label}</option>)}
      </Input>
    );
  };

  // Remote data sources (OFFICIAL_RECORDS, COMPLAINANT, SHAREHOLDERS, SHARES,
  // …) — options are fetched by the effect above into `options[field_key]`.
  // The control stays disabled while those load or while a parent field it
  // depends on is still empty.
  const renderRemoteOptionField = field => {
    const disabled = optionLoading[field.field_key] ||
      (field.depends_on || []).some(key => !hasValue(values[key]));
    return renderOptionList(field, options[field.field_key] || [], disabled);
  };

  // RADIO_SWITCH — a role toggle (Director / Secretary / …) sitting above a
  // single record picker. Every role's records are fetched together (the data
  // source is remote), so switching a role just re-filters the list shown
  // below and clears whatever was picked under the previous role. Only the
  // fields for the selected role are ever visible.
  const renderRoleSwitchField = field => {
    const allOptions = options[field.field_key] || [];
    const disabled = optionLoading[field.field_key] ||
      (field.depends_on || []).some(key => !hasValue(values[key]));

    // Role order follows the builder's "Source filters" selection; fall back
    // to whatever roles the fetched records actually carry.
    const norm = role => String(role || '').trim().toLowerCase();
    const roles = field.official_roles?.length
      ? field.official_roles
      : [...new Set(allOptions.map(option => norm(option.meta?.role)).filter(Boolean))];
    const activeRole = switchRoles[field.field_key] || roles[0] || '';
    const roleOptions = allOptions.filter(option => norm(option.meta?.role) === norm(activeRole));

    const pickRole = role => {
      if (String(role) === String(activeRole)) return;
      setSwitchRoles(current => ({ ...current, [field.field_key]: role }));
      changeValue(field, field.multiple ? [] : '');   // hide previous section + reset value
    };

    return (
      <div className="gp-switch">
        <div className="gp-choice-grid">
          {roles.map(role => (
            <Label check key={role}>
              <Input type="radio" name={`${field.field_key}__role`} value={role}
                disabled={disabled} checked={String(activeRole) === String(role)}
                onChange={() => pickRole(role)} />{' '}{roleLabel(role)}
            </Label>
          ))}
        </div>
        {activeRole && renderOptionList(
          { ...field, control_type: field.multiple ? 'MULTISELECT' : 'SELECT' },
          roleOptions, disabled, `Please Select ${roleLabel(activeRole)}`,
        )}
      </div>
    );
  };

  // MANUAL entry — free text/number/date/checkbox, unless the builder gave the
  // field static options or forced a SELECT / MULTISELECT control.
  const renderManualField = field => {
    const staticOptions = field.options || [];
    if (staticOptions.length || ['SELECT', 'MULTISELECT'].includes(field.control_type)) {
      return renderOptionList(field, staticOptions, false);
    }
    if (field.control_type === 'CHECKBOX') {
      return <Input type="checkbox" checked={Boolean(values[field.field_key])}
        onChange={event => changeValue(field, event.target.checked)} />;
    }
    return <Input
      type={field.control_type === 'DATE' ? 'date'
        : field.control_type === 'NUMBER' ? 'number'
        : field.control_type === 'TEXTAREA' ? 'textarea' : 'text'}
      value={values[field.field_key] || ''}
      invalid={Boolean(fieldError(field.field_key))}
      onChange={event => changeValue(field, event.target.value)}
    />;
  };

  const renderField = field => {
    // RADIO_SWITCH is a *control type* (not a data source): it works on top of
    // any role-bearing remote source, so it is handled before the switch.
    if (field.control_type === 'RADIO_SWITCH') return renderRoleSwitchField(field);

    switch (field.value_source) {
      case 'COMPANY':
        return renderCompanyField();

      case 'DATES':
        return renderDatesField(field);

      case 'OFFICIAL_RECORDS':     // All Official records
      case 'COMPLAINANT':          // All complainants / Events
      case 'SHAREHOLDERS':         // All shareholders
      case 'SHARES':               // Shareholding
      // case 'EVENT':                // ┐ legacy data sources kept for older
      // case 'OFFICIALS':            // │ published forms — identical
      // case 'ALLOTMENTS':           // │ "fetch options from server" behaviour
      // case 'SHARE_TRANSACTIONS':   // ┘
        return renderRemoteOptionField(field);

      case 'MANUAL':               // Manual entry
      default:                     // not chosen / unknown → treat as manual
        return renderManualField(field);
    }
  };

  if (htmlPreviews.length > 0) {
    const activePreview = htmlPreviews[activeHtmlPreview];
    const landscape = String(activePreview?.form?.orientation || '').toLowerCase() === 'landscape';
    return (
      <Modal key="html-preview" isOpen={isOpen} toggle={() => setHtmlPreviews([])} centered scrollable
        className={`gp-document-dialog${landscape ? ' gp-landscape' : ''}`}
        contentClassName="gp-document-modal">
        <style>{GEN_POPUP_CSS}</style>
        <ModalHeader toggle={() => setHtmlPreviews([])}>
          <i className="ri-file-text-line me-2 text-primary" />HTML View
          <span className="ms-2 text-muted fs-13 fw-normal">{activePreview?.form?.form_name}</span>
        </ModalHeader>
        <ModalBody>
          <div className="gp-document-page" style={{
            width: landscape ? 1123 : 794,
            height: Math.max(landscape ? 794 : 1123, htmlDocumentHeight),
          }}>
            <iframe key={activePreview?.form?.form_id}
              title={`HTML preview - ${activePreview?.form?.form_name}`}
              sandbox="allow-same-origin" scrolling="no" referrerPolicy="no-referrer"
              srcDoc={activePreview?.html || ''} onLoad={sizeHtmlFrame} />
          </div>
        </ModalBody>
        <ModalFooter>
          {htmlPreviews.length > 1 && <Input type="select" bsSize="sm" className="me-auto w-auto"
            aria-label="Choose form preview"
            value={activeHtmlPreview} onChange={event => {
              setHtmlDocumentHeight(0);
              setActiveHtmlPreview(Number(event.target.value));
            }}>
            {htmlPreviews.map((item, index) =>
              <option key={item.form.form_id} value={index}>{item.form.form_name}</option>)}
          </Input>}
          <Button color="light" onClick={() => setHtmlPreviews([])}>Back to Fields</Button>
          <Button color="primary" onClick={closeHtmlPreview}>Close</Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal key="generation-fields" isOpen={isOpen} toggle={onClose} centered size="lg" scrollable contentClassName="gen-popup">
      <style>{GEN_POPUP_CSS}</style>
      <ModalHeader toggle={onClose} className="gp-header">
        <span className="gp-header-icon"><i className="ri-sparkling-2-line" /></span>
        <span className="gp-header-text">
          <span className="gp-header-title">
            Generate {targets.length > 1 ? `${targets.length} forms` : primaryForm?.form_name || 'Form'}
          </span>
          <span className="gp-header-sub">Fill in the details below, then view HTML or export as PDF or DOCX</span>
        </span>
      </ModalHeader>
      <ModalBody>
        {loading ? <div className="text-center py-5"><Spinner color="primary" /></div> : <>
          {errors.filter(error => !error.field_key).map((error, index) => <Alert color="danger" key={index}>{error.message}</Alert>)}
          {false && preview && <Alert color={preview.ready ? 'success' : 'warning'}>
            {preview.ready ? 'All data is ready for generation.' : 'Correct the highlighted fields before generation.'}
          </Alert>}
          <div className="gp-card">
            <Label className="gp-label"><i className="ri-building-line" /> Company <span className="gp-req">*</span></Label>
            {entityId ? <Input value={entityId} disabled /> : <Input type="select" value={companyId}
              invalid={Boolean(fieldError('entity_id'))}
            onChange={event => {
              setCompanyId(event.target.value); setValues({}); setSwitchRoles({});
              htmlRequest.current += 1; setHtmlViewing(false); setHtmlPreviews([]);
              setPreview(null); setArtifacts([]); setPdfResults([]);
              idempotencyKeys.current = {};
            }}>
              <option value="">Select company...</option>
              {companies.map(company => <option key={company.entity_id} value={company.entity_id}>
                {company.name || `Company #${company.entity_id}`}
              </option>)}
            </Input>}
            <FormFeedback>{fieldError('entity_id')}</FormFeedback>
          </div>
          {schema.map(section => <div key={section.section_key} className="gp-card">
            {section.label ? <div className="gp-section-hdr"><span className="gp-section-dot" />{section.label}</div> : null}
            <Row className="g-3">
              {(section.fields || []).map(field => <Col md={field.control_type === 'TEXTAREA' ? 12 : 6} key={field.field_key}>
                <Label className="gp-label">{field.label}{field.required && <span className="gp-req"> *</span>}</Label>
                {renderField(field)}
                {optionLoading[field.field_key] && <small className="text-muted">Loading options...</small>}
                {fieldError(field.field_key) && <div className="invalid-feedback d-block">{fieldError(field.field_key)}</div>}
              </Col>)}
            </Row>
          </div>)}
          {!schema.length && <div className="gp-empty">This published form does not require additional input.</div>}
          {false && artifacts.length > 0 && <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
              <h6 className="mb-0">Stored HTML preview</h6>
              {artifacts.length > 1 && <Input type="select" bsSize="sm" style={{ width: 'auto' }}
                value={activeArtifact} onChange={event => setActiveArtifact(Number(event.target.value))}>
                {artifacts.map((item, index) => <option value={index} key={item.form.form_id}>{item.form.form_name}</option>)}
              </Input>}
            </div>
            <div className="small text-muted mb-2">
              Run #{artifacts[activeArtifact]?.run?.generation_run_id} · Hash {artifacts[activeArtifact]?.artifact?.content_hash}
            </div>
            <iframe
              title={`Generated preview - ${artifacts[activeArtifact]?.form?.form_name}`}
              sandbox=""
              srcDoc={artifacts[activeArtifact]?.artifact?.content_snapshot || ''}
              style={{ width: '100%', minHeight: 420, border: '1px solid var(--vz-border-color)', borderRadius: 6, background: '#fff' }}
            />
            {pdfResults.length > 0 && <div className="mt-3 d-flex gap-2 flex-wrap">
              {pdfResults.map(item => {
                const artifactId = item.pdf?.artifact?.generation_artifact_id;
                return artifactId && <Button key={item.form.form_id} type="button" onClick={() => downloadPdf(item)}
                  color="success" size="sm">
                  <i className="ri-download-2-line me-1" />Download {item.form.form_name}
                </Button>;
              })}
            </div>}
            {docxResults.length > 0 && <div className="mt-2 d-flex gap-2 flex-wrap">
              {docxResults.map(item => {
                const artifactId = item.docx?.artifact?.generation_artifact_id;
                return artifactId && <Button key={item.form.form_id} type="button" onClick={() => downloadDocx(item)}
                  color="primary" size="sm">
                  <i className="ri-file-word-2-line me-1" />Download DOCX {item.form.form_name}
                </Button>;
              })}
            </div>}
          </div>}
        </>}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose}>Cancel</Button>
        {false && <Button color="primary" onClick={validateAndPreview} disabled={loading || submitting}>
          {submitting ? <><Spinner size="sm" className="me-1" /> Validating...</> : <><i className="ri-eye-line me-1" />Validate & Preview</>}
        </Button>}
        {false && <Button color="success" onClick={prepareAndRender}
          disabled={!preview?.ready || loading || submitting || generating}>
          {generating ? <><Spinner size="sm" className="me-1" /> Generating...</> :
            <><i className="ri-file-code-line me-1" />Generate HTML</>}
        </Button>}
        <Button color="primary" onClick={viewHtml}
          disabled={!companyId || loading || htmlViewing || pdfGenerating || docxGenerating}>
          {htmlViewing ? <><Spinner size="sm" className="me-1" /> Loading HTML...</> :
            <><i className="ri-eye-line me-1" />HTML View</>}
        </Button>
        <Button color="warning" onClick={generatePdfs}
          disabled={!companyId || loading || htmlViewing || pdfGenerating || docxGenerating}>
          {pdfGenerating ? <><Spinner size="sm" className="me-1" /> Rendering PDF...</> :
            <><i className="ri-file-pdf-2-line me-1" />Generate PDF</>}
        </Button>
        <Button color="info" onClick={generateDocx}
          disabled={!companyId || loading || htmlViewing || pdfGenerating || docxGenerating}>
          {docxGenerating ? <><Spinner size="sm" className="me-1" /> Rendering DOCX...</> :
            <><i className="ri-file-word-2-line me-1" />Generate DOCX</>}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default GenerationPopup;
