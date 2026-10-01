import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Row, Col, Button, Input, Label, FormFeedback, Spinner, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter, Container, Card, CardBody, Table,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import {
  getFormShortcodeList,
  getFormShortcodeMeta,
  createFormShortcode,
  updateFormShortcode,
  retireFormShortcode,
} from '../../helpers/backend_helper';

/* ─── Scoped styles ───────────────────────────────────────────────────────── */
const PAGE_STYLES = `
  .sl-action-wrap { display: flex; align-items: center; gap: 5px; justify-content: center; }
  .sl-action-btn  {
    width: 30px; height: 30px; border-radius: 7px;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; transition: all .15s;
    border: 1.5px solid transparent; flex-shrink: 0; background: transparent;
  }
  .sl-action-btn.edit   { background: rgba(240,178,50,.1);  color: #e6a817; border-color: rgba(240,178,50,.22); }
  .sl-action-btn.retire { background: rgba(240,101,72,.08); color: #f06548; border-color: rgba(240,101,72,.18); }
  .sl-action-btn.edit:hover   { background: rgba(240,178,50,.22); }
  .sl-action-btn.retire:hover { background: rgba(240,101,72,.18); }

  .sl-key {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
    background: rgba(64,81,137,.09); color: #405189;
    border: 1px solid rgba(64,81,137,.18); font-family: monospace; letter-spacing: .02em;
  }
  .sl-alias {
    display: inline-block; padding: 1px 7px; margin: 1px; border-radius: 12px;
    font-size: 10px; font-family: monospace; background: rgba(10,179,156,.1);
    color: #0ab39c; border: 1px solid rgba(10,179,156,.2);
  }
  .sl-hint { font-size: 11px; color: #878a99; margin-top: 3px; }

  .sl-empty { text-align: center; padding: 48px 24px; }
  .sl-empty-icon {
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(64,81,137,.08); color: #405189;
    font-size: 26px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
  }
`;

const STATUS_COLOR = { ACTIVE: 'success', DEPRECATED: 'warning', RETIRED: 'secondary' };
const KEY_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
const CUSTOM_RESOLVER_NAME = 'CUSTOM_BACKEND';
const dataFieldId = (resolverName, resolverPath) => `${resolverName}::${resolverPath}`;

const listToText = (arr) => (Array.isArray(arr) ? arr.join(', ') : '');
const textToList = (txt) =>
  String(txt || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const EMPTY_FORM = {
  shortcode_key: '',
  label: '',
  source_domain: 'COMPANY',
  sort_order: 1,
  is_custom_backend: false,
  data_field: '',
  resolver_name: '',
  resolver_path: '',
  value_type: 'STRING',
  is_collection: false,
  sensitivity: 'INTERNAL',
  selection_behavior: 'NONE',
  description: '',
  example_value: '',
  allowed_formats: '',
  role_tags: '',
  aliases: '',
  status: 'ACTIVE',
};

/* ════════════════════════════════════════════════════════════════════════════
   Add / Edit Modal
════════════════════════════════════════════════════════════════════════════ */
const ShortcodeFormModal = ({ isOpen, editItem, meta, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(editItem);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: editItem
      ? {
          shortcode_key: editItem.shortcode_key || '',
          label: editItem.label || '',
          source_domain: editItem.source_domain || 'COMPANY',
          sort_order: editItem.sort_order || 1,
          is_custom_backend: editItem.resolver_name === CUSTOM_RESOLVER_NAME,
          data_field: editItem.resolver_name === CUSTOM_RESOLVER_NAME
            ? ''
            : dataFieldId(editItem.resolver_name || '', editItem.resolver_path || ''),
          resolver_name: editItem.resolver_name || '',
          resolver_path: editItem.resolver_path || '',
          value_type: editItem.value_type || 'STRING',
          is_collection: Boolean(editItem.is_collection),
          sensitivity: editItem.sensitivity || 'INTERNAL',
          selection_behavior: editItem.selection_behavior || 'NONE',
          description: editItem.description || '',
          example_value: editItem.example_value == null ? '' : String(editItem.example_value),
          allowed_formats: listToText(editItem.allowed_formats),
          role_tags: listToText(editItem.role_tags),
          aliases: listToText((editItem.aliases || []).map((a) => a.alias_key || a)),
          status: editItem.status || 'ACTIVE',
        }
      : EMPTY_FORM,
    validationSchema: Yup.object({
      shortcode_key: Yup.string()
        .trim()
        .required('Key is required')
        .matches(KEY_PATTERN, 'Lowercase dotted key, e.g. company.name'),
      label: Yup.string().trim().required('Label is required'),
      source_domain: Yup.string().required(),
      sort_order: Yup.number()
        .typeError('Order must be a number')
        .integer('Order must be a whole number')
        .min(1, 'Order must be at least 1')
        .max(9999, 'Order must be 9999 or less')
        .required('Order is required'),
      data_field: Yup.string().when('is_custom_backend', {
        is: false,
        then: (schema) => schema.required('Data Field is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
      setSaving(true);
      try {
        const selectedField = (meta?.data_fields || []).find(
          (field) => field.id === values.data_field
        );
        if (!values.is_custom_backend && !selectedField) {
          toast.error('Select a registered Data Field.');
          return;
        }
        const payload = {
          shortcode_key: values.shortcode_key.trim(),
          label: values.label.trim(),
          source_domain: values.source_domain,
          sort_order: Number(values.sort_order),
          is_custom_backend: Boolean(values.is_custom_backend),
          resolver_name: values.is_custom_backend
            ? CUSTOM_RESOLVER_NAME
            : selectedField.resolver_name,
          resolver_path: values.is_custom_backend
            ? values.shortcode_key.trim()
            : selectedField.resolver_path,
          value_type: values.is_custom_backend
            ? (values.value_type || 'STRING')
            : selectedField.value_type,
          is_collection: Boolean(values.is_collection),
          sensitivity: values.sensitivity,
          selection_behavior: values.selection_behavior,
          description: values.description?.trim() || '',
          example_value: values.example_value === '' ? null : values.example_value,
          allowed_formats: textToList(values.allowed_formats),
          role_tags: textToList(values.role_tags),
          aliases: textToList(values.aliases),
          status: values.status,
        };

        const res = isEdit
          ? await updateFormShortcode(editItem.shortcode_id, payload)
          : await createFormShortcode(payload);

        if (res?.status) {
          const dupes = res?.data?.possible_semantic_duplicates || [];
          toast.success(isEdit ? 'Shortcode updated successfully.' : 'Shortcode created successfully.');
          if (dupes.length) {
            toast.info(
              `Possible semantic duplicate(s): ${dupes.map((d) => d.shortcode_key).join(', ')}`
            );
          }
          onSaved();
          onClose();
        } else {
          toast.error(res?.message || 'Operation failed. Please try again.');
        }
      } catch (err) {
        toast.error(typeof err === 'string' ? err : err?.message || 'Something went wrong.');
      } finally {
        setSaving(false);
      }
    },
  });

  const f = formik;
  const availableDataFields = (meta?.data_fields || []).filter(
    (field) => field.domain === f.values.source_domain
  );
  const selectedFieldExists = availableDataFields.some((field) => field.id === f.values.data_field);
  const customHandlerRegistered = (meta?.custom_handlers || []).some(
    (handler) => handler.shortcode_key === f.values.shortcode_key.trim().toLowerCase()
  );

  const sel = (name, options, opts = {}) => (
    <>
      <Label className="form-label fs-12 fw-semibold">
        {opts.label} {opts.required && <span className="text-danger">*</span>}
      </Label>
      <select
        className={`form-select form-select-sm${
          f.touched[name] && f.errors[name] ? ' is-invalid' : ''
        }`}
        name={name}
        value={f.values[name]}
        onChange={opts.onChange || f.handleChange}
        onBlur={f.handleBlur}
      >
        {opts.placeholder && <option value="">{opts.placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {f.touched[name] && f.errors[name] && (
        <div className="invalid-feedback d-block">{f.errors[name]}</div>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered>
      <ModalHeader toggle={onClose}>
        {isEdit ? (
          <><i className="ri-edit-box-line me-2 text-warning" />Edit Shortcode</>
        ) : (
          <><i className="ri-add-circle-line me-2 text-success" />Add Shortcode</>
        )}
      </ModalHeader>

      <form onSubmit={f.handleSubmit}>
        <ModalBody style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <Row className="g-3">
            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">
                Shortcode Key <span className="text-danger">*</span>
              </Label>
              <Input
                bsSize="sm"
                name="shortcode_key"
                placeholder="company.former_name"
                style={{ fontFamily: 'monospace' }}
                value={f.values.shortcode_key}
                onChange={f.handleChange}
                onBlur={f.handleBlur}
                disabled={isEdit}
                invalid={f.touched.shortcode_key && !!f.errors.shortcode_key}
              />
              <FormFeedback>{f.errors.shortcode_key}</FormFeedback>
              <div className="sl-hint">
                Used in templates as <code>{`{{${f.values.shortcode_key || 'company.name'}}}`}</code>
                {isEdit && ' — key cannot be changed after creation'}
              </div>
            </Col>

            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">
                Label <span className="text-danger">*</span>
              </Label>
              <Input
                bsSize="sm"
                name="label"
                placeholder="Former Company Name"
                value={f.values.label}
                onChange={f.handleChange}
                onBlur={f.handleBlur}
                invalid={f.touched.label && !!f.errors.label}
              />
              <FormFeedback>{f.errors.label}</FormFeedback>
            </Col>

            <Col md={12}>
              <div className="form-check form-switch">
                <Input
                  type="checkbox"
                  role="switch"
                  id="is_custom_backend"
                  name="is_custom_backend"
                  checked={f.values.is_custom_backend}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    f.setFieldValue('is_custom_backend', enabled);
                    if (enabled) f.setFieldValue('data_field', '');
                  }}
                />
                <Label check for="is_custom_backend" className="fw-semibold text-success">
                  Manual Shortcode (Custom Backend Code)
                </Label>
                <div className="sl-hint">
                  Enable this only when this shortcode will be calculated by registered backend code.
                </div>
              </div>
            </Col>

            <Col md={4}>{sel('source_domain', meta?.source_domains || [], {
              label: 'Source Domain',
              required: true,
              onChange: (event) => {
                f.setFieldValue('source_domain', event.target.value);
                if (!f.values.is_custom_backend) f.setFieldValue('data_field', '');
              },
            })}</Col>
            <Col md={4}>
              <Label className="form-label fs-12 fw-semibold">
                Order <span className="text-danger">*</span>
              </Label>
              <Input
                bsSize="sm"
                type="number"
                min={1}
                max={9999}
                name="sort_order"
                value={f.values.sort_order}
                onChange={f.handleChange}
                onBlur={f.handleBlur}
                invalid={f.touched.sort_order && !!f.errors.sort_order}
              />
              <FormFeedback>{f.errors.sort_order}</FormFeedback>
              <div className="sl-hint">Order within this domain</div>
            </Col>
            <Col md={4}>{sel('sensitivity', meta?.sensitivities || [], { label: 'Sensitivity' })}</Col>

            {f.values.is_custom_backend ? (
              <Col md={12}>
                <div className={`alert ${customHandlerRegistered ? 'alert-success' : 'alert-warning'} py-2 px-3 mb-0 fs-12`}>
                  <div className="fw-semibold">
                    Backend handler key: <code>{f.values.shortcode_key || 'enter.shortcode_key'}</code>
                  </div>
                  <div>
                    {customHandlerRegistered
                      ? 'Backend code is registered and will run during form generation.'
                      : 'Backend code is not registered yet. The shortcode can be saved now, but it will render empty until its handler is added.'}
                  </div>
                </div>
              </Col>
            ) : (
              <Col md={12}>
                <Label className="form-label fs-12 fw-semibold">
                  Data Field <span className="text-danger">*</span>
                </Label>
                <select
                  className={`form-select form-select-sm${
                    f.touched.data_field && f.errors.data_field ? ' is-invalid' : ''
                  }`}
                  name="data_field"
                  value={f.values.data_field}
                  onChange={(event) => {
                    const field = availableDataFields.find(item => item.id === event.target.value);
                    f.setFieldValue('data_field', event.target.value);
                    if (field) {
                      f.setFieldValue('resolver_name', field.resolver_name);
                      f.setFieldValue('resolver_path', field.resolver_path);
                      f.setFieldValue('value_type', field.value_type);
                    }
                  }}
                  onBlur={f.handleBlur}
                >
                  <option value="">Select data field...</option>
                  {availableDataFields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                  {!selectedFieldExists && f.values.data_field && (
                    <option value={f.values.data_field}>{f.values.resolver_path} (legacy)</option>
                  )}
                </select>
                {f.touched.data_field && f.errors.data_field && (
                  <div className="invalid-feedback d-block">{f.errors.data_field}</div>
                )}
                <div className="sl-hint">
                  Backend mapping and value formatting are derived automatically.
                </div>
              </Col>
            )}

            <Col md={4}>{sel('selection_behavior', meta?.selection_behaviors || [], { label: 'Selection Behavior' })}</Col>
            <Col md={4}>{sel('status', meta?.statuses || [], { label: 'Status' })}</Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="form-check form-switch mb-1">
                <Input
                  type="checkbox"
                  role="switch"
                  id="is_collection"
                  name="is_collection"
                  checked={f.values.is_collection}
                  onChange={f.handleChange}
                />
                <Label check for="is_collection" className="fs-12 fw-semibold">
                  Collection (List)
                </Label>
              </div>
            </Col>

            <Col md={12}>
              <Label className="form-label fs-12 fw-semibold">Description</Label>
              <Input
                type="textarea"
                bsSize="sm"
                rows={2}
                name="description"
                value={f.values.description}
                onChange={f.handleChange}
              />
            </Col>

            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">Example Value</Label>
              <Input
                bsSize="sm"
                name="example_value"
                value={f.values.example_value}
                onChange={f.handleChange}
              />
            </Col>
            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">Allowed Formats</Label>
              <Input
                bsSize="sm"
                name="allowed_formats"
                placeholder="DD-MMM-YYYY, DD/MM/YYYY"
                value={f.values.allowed_formats}
                onChange={f.handleChange}
              />
              <div className="sl-hint">Comma-separated</div>
            </Col>

            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">Role Tags</Label>
              <Input
                bsSize="sm"
                name="role_tags"
                placeholder="director, secretary"
                value={f.values.role_tags}
                onChange={f.handleChange}
              />
              <div className="sl-hint">Comma-separated</div>
            </Col>
            <Col md={6}>
              <Label className="form-label fs-12 fw-semibold">Aliases</Label>
              <Input
                bsSize="sm"
                name="aliases"
                placeholder="Company_former_name"
                style={{ fontFamily: 'monospace' }}
                value={f.values.aliases}
                onChange={f.handleChange}
              />
              <div className="sl-hint">Comma-separated legacy keys</div>
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter>
          <Button color="light" type="button" size="sm" onClick={onClose} disabled={saving}>
            <i className="ri-close-line me-1" />Cancel
          </Button>
          <Button color="success" type="submit" size="sm" disabled={saving}>
            {saving ? (
              <><Spinner size="sm" className="me-1" />Saving…</>
            ) : (
              <><i className="ri-save-line me-1" />{isEdit ? 'Update' : 'Save'}</>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Retire confirm
════════════════════════════════════════════════════════════════════════════ */
const RetireModal = ({ isOpen, item, busy, onClose, onConfirm }) => (
  <Modal isOpen={isOpen} toggle={onClose} size="sm" centered>
    <ModalBody className="text-center py-4">
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
          background: 'rgba(240,101,72,.12)', color: '#f06548',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}
      >
        <i className="ri-archive-line" />
      </div>
      <h5 className="mb-1">Retire shortcode?</h5>
      <p className="text-muted fs-13 mb-0">
        <code>{item?.shortcode_key}</code> will be hidden from the form-builder picker.
        Existing templates keep their text; you can reactivate it later by editing its status.
      </p>
    </ModalBody>
    <ModalFooter className="justify-content-center">
      <Button color="light" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
      <Button color="danger" size="sm" onClick={onConfirm} disabled={busy}>
        {busy ? <><Spinner size="sm" className="me-1" />Retiring…</> : 'Yes, retire'}
      </Button>
    </ModalFooter>
  </Modal>
);

/* ════════════════════════════════════════════════════════════════════════════
   Main
════════════════════════════════════════════════════════════════════════════ */
const ShortcodeLibrary = () => {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE_SET');

  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [retireItem, setRetireItem] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFormShortcodeList();
      if (res?.status) {
        setList(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } else {
        toast.error(res?.message || 'Could not load shortcodes.');
      }
    } catch {
      toast.error('Could not load shortcodes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    (async () => {
      try {
        const res = await getFormShortcodeMeta();
        if (res?.status) setMeta(res.data);
      } catch {
        /* form still works with empty selects */
      }
    })();
  }, [fetchList]);

  const dataFieldById = useMemo(
    () => new Map((meta?.data_fields || []).map(field => [field.id, field])),
    [meta]
  );
  const registeredCustomHandlers = useMemo(
    () => new Set((meta?.custom_handlers || []).map(handler => handler.shortcode_key)),
    [meta]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((row) => {
      if (domainFilter && row.source_domain !== domainFilter) return false;
      if (statusFilter === 'ACTIVE_SET' && row.status === 'RETIRED') return false;
      if (statusFilter !== 'ACTIVE_SET' && statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.shortcode_key?.toLowerCase().includes(q) ||
        row.label?.toLowerCase().includes(q) ||
        row.resolver_path?.toLowerCase().includes(q)
      );
    });
  }, [list, search, domainFilter, statusFilter]);

  const handleRetire = async () => {
    setRetiring(true);
    try {
      const res = await retireFormShortcode(retireItem.shortcode_id);
      if (res?.status) {
        toast.success('Shortcode retired.');
        setRetireItem(null);
        fetchList();
      } else {
        toast.error(res?.message || 'Retire failed.');
      }
    } catch {
      toast.error('Retire failed.');
    } finally {
      setRetiring(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Shortcode Library" pageTitle="Form Builder" />
        <Card>
          <CardBody>
            <style>{PAGE_STYLES}</style>

            <div className="alert alert-info fs-12 py-2 px-3 d-flex align-items-center gap-2">
              <i className="ri-code-s-slash-line fs-16" />
              <span>
                Values are mapped when a form is generated. Choose a registered Data Field,
                or enable Manual Shortcode for special backend code.
              </span>
            </div>

            <Row className="g-2 mb-3 align-items-center">
              <Col sm={12} md={4}>
                <div className="search-box">
                  <Input
                    type="text"
                    placeholder="Search key, label or data field…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <i className="ri-search-line search-icon" />
                </div>
              </Col>
              <Col sm={6} md={3}>
                <select
                  className="form-select form-select-sm"
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                >
                  <option value="">All domains</option>
                  {(meta?.source_domains || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Col>
              <Col sm={6} md={2}>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ACTIVE_SET">Active &amp; Deprecated</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="DEPRECATED">Deprecated only</option>
                  <option value="RETIRED">Retired only</option>
                  <option value="">All statuses</option>
                </select>
              </Col>
              <Col sm={12} md={3} className="d-flex justify-content-end">
                <Button
                  color="warning"
                  size="sm"
                  onClick={() => { setEditItem(null); setFormModal(true); }}
                >
                  <i className="ri-add-line me-1" />Add Shortcode
                </Button>
              </Col>
            </Row>

            {loading ? (
              <div className="text-center py-4"><Spinner color="primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="sl-empty">
                <div className="sl-empty-icon"><i className="ri-price-tag-3-line" /></div>
                <h6>No shortcodes found</h6>
                <p className="text-muted fs-12">
                  {search || domainFilter ? 'Try a different filter.' : 'Click "Add Shortcode" to create one.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table className="table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 70 }}>Order</th>
                      <th>Key</th>
                      <th>Label</th>
                      <th>Domain</th>
                      <th>Mapping</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: 96 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.shortcode_id}>
                        <td className="text-muted fs-12">{row.sort_order}</td>
                        <td>
                          <span className="sl-key">
                            <i className="ri-braces-line" />{row.shortcode_key}
                          </span>
                          {(row.aliases || []).length > 0 && (
                            <div className="mt-1">
                              {row.aliases.map((a) => (
                                <span key={a.alias_key || a} className="sl-alias">
                                  {a.alias_key || a}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          {row.label}
                          {row.is_collection && (
                            <Badge color="soft-info" className="text-info ms-1 fs-10">List</Badge>
                          )}
                        </td>
                        <td><Badge color="soft-primary" className="text-primary fs-11">{row.source_domain}</Badge></td>
                        <td>
                          {row.resolver_name === CUSTOM_RESOLVER_NAME ? (
                            <>
                              <Badge color="soft-success" className="text-success fs-11">
                                Custom Backend
                              </Badge>
                              <div className="sl-hint">
                                {registeredCustomHandlers.has(row.shortcode_key)
                                  ? 'Handler registered'
                                  : 'Backend code pending'}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="fs-12 fw-medium">
                                {dataFieldById.get(dataFieldId(row.resolver_name, row.resolver_path))?.label
                                  || 'Legacy data field'}
                              </div>
                            </>
                          )}
                        </td>
                        <td>
                          <Badge color={`soft-${STATUS_COLOR[row.status] || 'secondary'}`}
                            className={`text-${STATUS_COLOR[row.status] || 'secondary'} fs-11`}>
                            {row.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="sl-action-wrap">
                            <button
                              className="sl-action-btn edit"
                              title="Edit"
                              onClick={() => { setEditItem(row); setFormModal(true); }}
                            >
                              <i className="ri-pencil-line" />
                            </button>
                            {row.status !== 'RETIRED' && (
                              <button
                                className="sl-action-btn retire"
                                title="Retire"
                                onClick={() => setRetireItem(row)}
                              >
                                <i className="ri-archive-line" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            <ShortcodeFormModal
              isOpen={formModal}
              editItem={editItem}
              meta={meta}
              onClose={() => { setFormModal(false); setEditItem(null); }}
              onSaved={fetchList}
            />
            <RetireModal
              isOpen={Boolean(retireItem)}
              item={retireItem}
              busy={retiring}
              onClose={() => setRetireItem(null)}
              onConfirm={handleRetire}
            />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
};

export default ShortcodeLibrary;
