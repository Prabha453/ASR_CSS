import React, { useEffect, useMemo, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import {
  Badge,
  Button,
  Col,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from 'reactstrap';

import { getLoggedinUser } from '../../../helpers/api_helper';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {
  createReminder,
  deleteReminder,
  getCompanyEventNameList,
  getCompanyTypeList,
  getReminder,
  getReminderList,
  updateReminder,
  deleteDocumentStore,
} from '../../../helpers/backend_helper';

const CATEGORIES = [
  ['EVENT', 'Event'],
  ['LOG', 'Log'],
];

const TIMING_TYPES = [
  ['BEFORE', 'Before'],
  ['AFTER', 'After'],
];

const RECURRING_TYPES = [
  ['DAILY', 'Daily'],
  ['CUSTOM', 'Custom'],
];

const COMPANY_MERGE_FIELDS = [
  { label: 'Company Name', slug: 'Company_name' },
  { label: 'Client Number', slug: 'Company_client_no' },
  { label: 'Register Number', slug: 'Registration_Num' },
  { label: 'UEN Number', slug: 'Company_uen_no' },
  { label: 'FBRN Number', slug: 'Company_fbrn_no' },
  { label: 'ACRA Number', slug: 'Company_acra_no' },
  { label: 'Registered Office Address', slug: 'Company_reg_Office_address' },
  { label: 'Local Address', slug: 'Company_local_address' },
  { label: 'Foreign Address', slug: 'Company_foreign_address' },
  { label: 'Incorporation Date', slug: 'com_incorporation_date' },
  { label: 'FYE Date', slug: 'Company_fye_date' },
  { label: 'Country', slug: 'country' },
  { label: 'Event Name', slug: 'Event_name' },
  { label: 'Event Subject', slug: 'Event_subject' },
  { label: 'Event Due Date', slug: 'Event_due_date' },
  { label: 'Event FYE Date', slug: 'Event_fye_date' },
  { label: 'Notice Date', slug: 'Event_notice_date' },
  { label: 'Received Date', slug: 'Event_received_date' },
  { label: 'Period From', slug: 'Event_period_from' },
  { label: 'Period To', slug: 'Event_period_to' },
  { label: 'Held Date', slug: 'Event_held_date' },
  { label: 'Filing / Completed Date', slug: 'Event_filing_date' },
  { label: 'Venue', slug: 'Event_venue' },
  { label: 'Agenda', slug: 'Event_agenda' },
  { label: 'Reminder Date', slug: 'Reminder_date' },
];

const emptyForm = () => ({
  reminder_id: null,
  category: 'EVENT',
  event_id: '',
  company_type_id: '',
  status: 'ACTIVE',
  timing_type: 'BEFORE',
  offset_days: 0,
  is_recurring: false,
  recurring_interval_type: 'CUSTOM',
  recurring_interval_days: 1,
  sender_name: '',
  subject: '',
  message: '',
  attachments: [],
});

// ── Styles: shared panel/info-bar/multiselect chrome, same family as EventRule ──
const pageCss = `
  .reminder-muted { color: var(--vz-secondary-color); font-size: 12px; }
  .reminder-pill { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 999px; background: var(--vz-light); color: var(--vz-body-color); font-size: 11px; font-weight: 600; border: 1px solid var(--vz-border-color); }
  .reminder-section { border: 1px solid var(--vz-border-color); border-radius: 8px; padding: 14px; margin-bottom: 14px; }
  .reminder-old-ui .modal-content { border-radius: 6px; }
  .legacy-rule-panel .form-label, .legacy-rule-panel label { font-size: 12px; font-weight: 600; color: var(--vz-body-color); margin-bottom: 6px; }
  .legacy-rule-panel .required { color: var(--vz-danger); }
  .legacy-small-help { color: var(--vz-secondary-color); font-size: 11px; margin-top: 4px; }
  .reminder-attachment-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .reminder-old-ui .modal-dialog { max-width: 980px; }
  .reminder-editor .ql-toolbar { border-top-left-radius: 6px; border-top-right-radius: 6px; border-color: var(--vz-border-color); }
  .reminder-editor.subject > .ql-container.ql-snow{
    height: 50px;
  }
  .reminder-editor .ql-container { border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; border-color: var(--vz-border-color); font-size: 13px; }
  .reminder-editor .ql-editor { min-height: 50px; }
  .reminder-editor.subject .ql-toolbar { padding: 2px 4px; }
  .reminder-editor.subject .ql-toolbar button { width: 20px; height: 20px; padding: 2px; }
  .reminder-editor.subject .ql-editor { min-height: 18px; max-height: 50px; padding: 4px 8px; font-size: 12.5px; }
  .reminder-editor.subject .ql-editor p { margin: 0; }
  .reminder-merge-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
  .reminder-merge-row .form-select { width: 240px; max-width: 100%; }
  .reminder-editor-hint { color: var(--vz-secondary-color); font-size: 11px; }
  .reminder-template-card { border: 1px solid var(--vz-border-color); border-radius: 8px; padding: 14px; background: var(--vz-card-bg); margin-top: 14px; }
  .reminder-template-card:first-child { margin-top: 0; }
  .reminder-template-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--vz-border-color); }
  .reminder-template-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin: 0; color: var(--vz-heading-color); }
  .reminder-template-title i { color: var(--vz-primary); font-size: 15px; }
  .reminder-template-sub { font-size: 11px; color: var(--vz-secondary-color); margin: 2px 0 0; }
  .reminder-context-backdrop { position: fixed; inset: 0; z-index: 3998; background: transparent; }
  .reminder-context-menu {
    position: fixed;
    z-index: 3999;
    width: 360px;
    max-height: 390px;
    border: 1px solid var(--vz-border-color);
    border-radius: 8px;
    background: var(--vz-card-bg, #fff);
    box-shadow: 0 12px 30px rgba(15, 23, 42, .18);
    overflow: hidden;
  }
  .reminder-context-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-weight: 700; font-size: 13px; border-bottom: 1px solid var(--vz-border-color); color: var(--vz-heading-color); }
  .reminder-context-search { padding: 8px; border-bottom: 1px solid var(--vz-border-color); }
  .reminder-context-list { max-height: 285px; overflow-y: auto; padding: 4px; }
  .reminder-context-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 9px; border-radius: 6px; cursor: pointer; font-size: 12px; }
  .reminder-context-item:hover { background: var(--vz-light); }
  .reminder-context-slug { font-size: 10px; color: var(--vz-secondary-color); white-space: nowrap; }
  .reminder-context-empty { padding: 18px; text-align: center; color: var(--vz-secondary-color); font-size: 12px; }
  .reminder-preview-subject { font-size: 14px; font-weight: 700; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed var(--vz-border-color); }
  .reminder-preview-subject p, .reminder-preview-body p { margin: 0 0 8px; }
  .reminder-preview-subject p:last-child, .reminder-preview-body p:last-child { margin-bottom: 0; }
`;

const unwrapList = (res) => {
  const payload = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const unwrapOne = (res) => res?.data?.data ?? res?.data ?? res ?? {};

const optionsFrom = (list, valueKey, labelKey) =>
  list.map(item => ({
    value: String(item[valueKey]),
    label: item[labelKey] || item.name || String(item[valueKey]),
  })).filter(item => item.value !== 'undefined');

const labelOf = (options, value) =>
  options.find(item => String(item.value) === String(value))?.label || '-';

const pairLabel = (pairs, value) =>
  pairs.find(([key]) => String(key) === String(value))?.[1] || value || '-';

const stripHtml = (value) => String(value || '').replace(/<[^>]*>/g, '');

const CompanyFieldContextMenu = ({ position, onInsert, onClose }) => {
  const [search, setSearch] = useState('');

  const fields = COMPANY_MERGE_FIELDS.filter(field =>
    field.label.toLowerCase().includes(search.toLowerCase()) ||
    field.slug.toLowerCase().includes(search.toLowerCase())
  );

  const menuWidth = 360;
  const menuHeight = 390;
  const top = Math.max(8, Math.min(position.y, window.innerHeight - menuHeight - 8));
  const left = Math.max(8, Math.min(position.x, window.innerWidth - menuWidth - 8));

  return (
    <>
      <div className="reminder-context-backdrop" onMouseDown={onClose} onContextMenu={(event) => { event.preventDefault(); onClose(); }} />
      <div className="reminder-context-menu" style={{ top, left }}>
        <div className="reminder-context-header">
          <i className="ri-building-line" />
          Insert Company Field
        </div>
        <div className="reminder-context-search">
          <Input
            bsSize="sm"
            autoFocus
            placeholder="Search company fields..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <div className="reminder-context-list">
          {fields.length === 0 ? (
            <div className="reminder-context-empty">No company fields found</div>
          ) : fields.map(field => (
            <div
              key={field.slug}
              className="reminder-context-item"
              onMouseDown={(event) => {
                event.preventDefault();
                onInsert(field.slug);
              }}
            >
              <span>{field.label}</span>
              <span className="reminder-context-slug">{`{{${field.slug}}}`}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ align: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const SUBJECT_QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ color: [] }],
    ['link'],
    ['clean'],
  ],
};

const RichTextEditor = ({ value, onChange, minHeight = 220, placeholder = '', compact = false }) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const seededRef = useRef(false);
  const latestValueRef = useRef(value || '');
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    latestValueRef.current = value || '';
  }, [value]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return undefined;
    if (containerRef.current.querySelector('.ql-container')) return undefined;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules: compact ? SUBJECT_QUILL_MODULES : QUILL_MODULES,
      placeholder,
    });

    quillRef.current = quill;
    quill.root.style.minHeight = `${minHeight}px`;

    if (latestValueRef.current && !seededRef.current) {
      quill.clipboard.dangerouslyPasteHTML(latestValueRef.current);
      seededRef.current = true;
    }

    quill.on('text-change', () => {
      onChange(quill.root.innerHTML);
    });

    const handleContextMenu = (event) => {
      if (!containerRef.current?.contains(event.target)) return;
      event.preventDefault();
      quill.focus();
      setContextMenu({ x: event.clientX, y: event.clientY });
    };

    containerRef.current.addEventListener('contextmenu', handleContextMenu);

    return () => {
      containerRef.current?.removeEventListener('contextmenu', handleContextMenu);
      quillRef.current = null;
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const nextValue = value || '';
    if (nextValue === quill.root.innerHTML) return;
    const range = quill.getSelection();
    quill.clipboard.dangerouslyPasteHTML(nextValue);
    seededRef.current = Boolean(nextValue);
    if (range) quill.setSelection(range);
  }, [value]);

  const insertMergeField = (slug) => {
    const quill = quillRef.current;
    if (!quill || !slug) return;

    quill.focus();
    const range = quill.getSelection(true);
    const text = `{{${slug}}}`;
    const index = range ? range.index : quill.getLength();
    quill.insertText(index, text, 'user');
    quill.setSelection(index + text.length, 0);
    onChange(quill.root.innerHTML);
    setContextMenu(null);
  };

  return (
    <div className={`reminder-editor ${compact ? 'subject' : ''}`}>
      <div className="reminder-merge-row">
        <span className="reminder-editor-hint">
          Right-click inside editor to insert company fields.
        </span>
        <Input
          bsSize="sm"
          type="select"
          onChange={(event) => {
            insertMergeField(event.target.value);
            event.target.value = '';
          }}
        >
          <option value="">Insert Company Field</option>
          {COMPANY_MERGE_FIELDS.map(field => (
            <option key={field.slug} value={field.slug}>
              {field.label}
            </option>
          ))}
        </Input>
      </div>
      <div ref={containerRef} />
      {contextMenu && (
        <CompanyFieldContextMenu
          position={contextMenu}
          onInsert={insertMergeField}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

// ── Custom multiselect: removable chips + searchable checkbox dropdown ──
// ── MasterDataView grid-card columns (list view) ────────────────────────────
const COLUMNS = [
  { key: 'subject_display', label: 'Subject', sortable: true, gridPrimary: true, width: "30px" },
  { key: 'category_display', label: 'Category', sortable: true, showInGrid: true, width: "30px" },
  { key: 'event_display_name', label: 'Event', sortable: true, showInGrid: true, width: "30px" },
  { key: 'company_type_display_name', label: 'Company Type', sortable: true, showInGrid: true, width: "30px" },
  { key: 'timing_display', label: 'Timing', sortable: true, showInGrid: true, width: "30px" },
  { key: 'status_label', label: 'Status', sortable: true, showInGrid: true, badge: true, width: "30px" },
];

const user = getLoggedinUser();

const Reminder = () => {

  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [newFiles, setNewFiles] = useState([]);

  const [viewModal, setViewModal] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);

  document.title = 'ASR::CSS | Reminders';

  const eventOptions = useMemo(() => optionsFrom(events, 'e_id', 'event_name'), [events]);
  const companyTypeOptions = useMemo(() => optionsFrom(companyTypes, 'company_type_id', 'company_type_name'), [companyTypes]);

  // ── Flattened rows for MasterDataView (list/grid/search all read plain keys) ──
  const tableRows = useMemo(() => rows.map(row => ({
    ...row,
    id: row.reminder_id,
    category_display: pairLabel(CATEGORIES, row.category),
    event_display_name: row.category === 'LOG'
      ? 'All Events'
      : (row.event_name || labelOf(eventOptions, row.event_id)),
    company_type_display_name: row.company_type_id ? labelOf(companyTypeOptions, row.company_type_id) : 'All Types',
    subject_display: stripHtml(row.subject) || '-',
    timing_display: `${row.offset_days ?? 0} day(s) ${pairLabel(TIMING_TYPES, row.timing_type)}${row.is_recurring ? ' · recurring' : ''}`,
    status_label: row.status === 'ACTIVE' ? 'Active' : 'Inactive',
  })), [rows, eventOptions, companyTypeOptions]);

  const load = async () => {

    setLoading(true);

    try {

      const [reminderRes, eventRes, typeRes] =
        await Promise.all([
          getReminderList({ page: 1, limit: 1000 }),
          getCompanyEventNameList({ page: 1, limit: 300, event_type: 'EVENT', order: 'e_id:ASC' }),
          getCompanyTypeList({ page: 1, limit: 300, order: 'company_type_id:ASC' }),
        ]);

      setRows(unwrapList(reminderRes));
      setEvents(unwrapList(eventRes));
      setCompanyTypes(unwrapList(typeRes));

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to load reminders',
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

  // ── Called by MasterDataView's "Add New" button (fields=[] bypasses its own modal) ──
  const openAdd = () => {
    setForm(emptyForm());
    setNewFiles([]);
    setModal(true);
  };

  // ── Called by MasterDataView's row/card "Edit" button ──
  const openEdit = async (row) => {

    setModal(true);
    setModalLoading(true);
    setNewFiles([]);

    try {

      const res = await getReminder(row.reminder_id);
      const data = unwrapOne(res);

      setForm({
        reminder_id: data.reminder_id,
        category: data.category || 'EVENT',
        event_id: data.event_id ? String(data.event_id) : '',
        company_type_id: data.company_type_id ? String(data.company_type_id) : '',
        status: data.status || 'ACTIVE',
        timing_type: data.timing_type || 'BEFORE',
        offset_days: data.offset_days ?? 0,
        is_recurring: Boolean(data.is_recurring),
        recurring_interval_type: data.recurring_interval_type || 'CUSTOM',
        recurring_interval_days: data.recurring_interval_days ?? 1,
        sender_name: data.sender_name || '',
        subject: data.subject || '',
        message: data.message || '',
        attachments: data.attachments || [],
      });

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to load reminder',
        { autoClose: 3000 }
      );

      setModal(false);

    } finally {

      setModalLoading(false);

    }
  };

  // ── Called by MasterDataView's row/card "View" extra action ──
  const openView = async (row) => {

    setViewModal(true);
    setViewRow(null);

    try {

      const res = await getReminder(row.reminder_id);
      setViewRow(unwrapOne(res));

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to load reminder',
        { autoClose: 3000 }
      );

      setViewModal(false);

    }
  };

  const saveReminder = async () => {

    if (form.category === 'EVENT' && !form.event_id) {
      toast.error('Event is required', { autoClose: 3000 });
      return;
    }

    if (!form.sender_name || !stripHtml(form.subject).trim() || !stripHtml(form.message).trim()) {
      toast.error('Sender name, subject and message are required', { autoClose: 3000 });
      return;
    }

    setSaving(true);

    try {

      const formData = new FormData();

      const portName = user?.portName || user?.port_name || null;
      formData.append('port_name', portName ?? '');

      Object.entries(form).forEach(([key, value]) => {
        if (key === 'attachments') return;
        formData.append(key, value ?? '');
      });

      newFiles.forEach(file => formData.append('attachments', file));

      if (form.reminder_id) await updateReminder(form.reminder_id, formData);
      else await createReminder(formData);

      toast.success(
        `Reminder ${form.reminder_id ? 'updated' : 'created'} successfully`,
        { autoClose: 3000 }
      );

      setModal(false);

      await load();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to save reminder',
        { autoClose: 3000 }
      );

    } finally {

      setSaving(false);

    }
  };

  // ── Called by MasterDataView's built-in delete confirmation modal ──
  const removeReminder = async (row) => {

    const id = row?.reminder_id ?? row?.id;

    if (!id) return;

    setLoading(true);

    try {

      await deleteReminder(id);

      toast.success(
        'Reminder deleted successfully',
        { autoClose: 3000 }
      );

      await load();

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to delete reminder',
        { autoClose: 3000 }
      );

      setLoading(false);

    }
  };

  const requestRemoveAttachment = (attachment) => {
    if (!attachment?.doc_id) return;
    setDeleteAttachmentTarget(attachment);
  };

  const closeRemoveAttachment = () => {
    if (deletingAttachment) return;
    setDeleteAttachmentTarget(null);
  };

  const onRemoveAttachment = async () => {

    if (!form.reminder_id) return;
    const docId = deleteAttachmentTarget?.doc_id;
    if (!docId) return;

    setDeletingAttachment(true);
    try {

      await deleteDocumentStore(docId);

      setForm(prev => ({
        ...prev,
        attachments: prev.attachments.filter(a => a.doc_id !== docId),
      }));

      toast.success('Attachment removed', { autoClose: 3000 });
      setDeleteAttachmentTarget(null);

    } catch (err) {

      toast.error(
        err?.message ||
        'Failed to remove attachment',
        { autoClose: 3000 }
      );

    } finally {

      setDeletingAttachment(false);

    }
  };

  // ── Extra "View" action next to Edit/Delete on both list rows and grid cards ──
  const extraActions = (row) => (
    <button className="btn btn-sm btn-soft-info" onClick={() => openView(row)}>
      <i className="ri-eye-fill me-1"></i>View
    </button>
  );

  return (
    <div>
      <style>{pageCss}</style>

      <MasterDataView
        title="Reminders"
        listId="reminderList"
        columnLabel="Reminder"
        modalTitle="Reminder"
        columns={COLUMNS}
        fields={[]}
        data={tableRows}
        loading={loading}
        emptyMessage="No reminders found."
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={removeReminder}
        extraActions={extraActions}
      />

      {/* ── Read-only detail view ── */}
      <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered scrollable>
        <ModalHeader toggle={() => setViewModal(false)}>
          {stripHtml(viewRow?.subject) || 'Reminder'}
        </ModalHeader>
        <ModalBody>
          {!viewRow ? (
            <div className="text-center py-4"><Spinner color="primary" /></div>
          ) : (
            <>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <Badge color="primary">{pairLabel(CATEGORIES, viewRow.category)}</Badge>
                <span className="reminder-pill">
                  {viewRow.category === 'LOG' ? 'All Events' : (viewRow.event_name || labelOf(eventOptions, viewRow.event_id))}
                </span>
                <Badge color={viewRow.status === 'ACTIVE' ? 'success' : 'secondary'} pill>
                  {viewRow.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
                {viewRow.is_recurring && <Badge color="info" pill>Recurring</Badge>}
              </div>

              <Row className="g-3 mb-3">
                <Col md={4}>
                  <div className="reminder-section mb-0 h-100">
                    <div className="reminder-muted">Company Type</div>
                    <div className="fw-semibold">
                      {viewRow.company_type_id ? labelOf(companyTypeOptions, viewRow.company_type_id) : 'All Types'}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="reminder-section mb-0 h-100">
                    <div className="reminder-muted">Timing</div>
                    <div className="fw-semibold">
                      {viewRow.offset_days ?? 0} day(s) {pairLabel(TIMING_TYPES, viewRow.timing_type)}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="reminder-section mb-0 h-100">
                    <div className="reminder-muted">Sender</div>
                    <div className="fw-semibold">{viewRow.sender_name || '-'}</div>
                  </div>
                </Col>
              </Row>

              {viewRow.is_recurring && (
                <div className="reminder-section">
                  <div className="reminder-muted mb-1">Recurring Schedule</div>
                  <div className="fw-semibold">
                    {viewRow.recurring_interval_type === 'DAILY'
                      ? 'Sends daily until event is completed'
                      : `Every ${viewRow.recurring_interval_days || 1} day(s) until event is completed`}
                  </div>
                </div>
              )}

              <div className="reminder-template-card">
              <div className="reminder-template-head">
                <div>
                  <h6 className="reminder-template-title">
                    <i className="ri-mail-open-line" />
                    Email Preview
                  </h6>
                  <p className="reminder-template-sub">Exactly what recipients will receive.</p>
                </div>
              </div>
              <div className="reminder-preview-subject" dangerouslySetInnerHTML={{ __html: viewRow.subject || '-' }} />
              <div className="reminder-preview-body" dangerouslySetInnerHTML={{ __html: viewRow.message || '-' }} />
            </div>
            
              {(viewRow.attachments || []).length > 0 && (
                <div className="reminder-section mb-0">
                  <div className="reminder-muted mb-2">Attachments</div>
                  {viewRow.attachments.map(att => (
                    <div className="reminder-attachment-row" key={att.doc_id}>
                      <i className="ri-attachment-2" />
                      <a href={att.file_path} target="_blank" rel="noreferrer" className="fs-12">{att.file_name}</a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setViewModal(false)}>Close</Button>
          <Button color="primary" onClick={() => { setViewModal(false); openEdit(viewRow); }} disabled={!viewRow}>
            <i className="ri-pencil-line me-1" />
            Edit
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Add / Edit builder modal ── */}
      <Modal isOpen={modal} toggle={() => setModal(false)} size="lg" centered scrollable className="reminder-old-ui">
        <ModalHeader className="bg-light" toggle={() => setModal(false)}>
          {form.reminder_id ? 'Edit Reminder' : 'New Reminder'}
        </ModalHeader>
        <ModalBody>
          {modalLoading ? (
            <div className="text-center py-4"><Spinner color="primary" /></div>
          ) : (
            <div className="legacy-rule-panel">
              <div className="legacy-rule-body">
                <div className="reminder-template-card">
                  <div className="reminder-template-head">
                    <div>
                      <h6 className="reminder-template-title">
                        <i className="ri-settings-3-line" />
                        Reminder Setup
                      </h6>
                      <p className="reminder-template-sub">Choose the event scope and when this reminder should run.</p>
                    </div>
                  </div>
                  <Row className="g-3">
                  <Col md={6}>
                    <Label>Category: <span className="required">*</span></Label>
                    <Input
                      type="select"
                      value={form.category}
                      onChange={e => updateForm('category', e.target.value)}
                    >
                      {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Input>
                  </Col>
                  <Col md={6}>
                    <Label>Status: <span className="required">*</span></Label>
                    <Input
                      type="select"
                      value={form.status}
                      onChange={e => updateForm('status', e.target.value)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </Input>
                  </Col>

                  <Col md={6}>
                    <Label>Company Type:</Label>
                    <Input
                      type="select"
                      value={form.company_type_id}
                      onChange={e => updateForm('company_type_id', e.target.value)}
                    >
                      <option value="">All Company Types</option>
                      {companyTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Input>
                  </Col>

                  {form.category === 'EVENT' && (
                    <Col md={6}>
                      <Label>Event Name: <span className="required">*</span></Label>
                      <Input
                        type="select"
                        value={form.event_id}
                        onChange={e => updateForm('event_id', e.target.value)}
                      >
                        <option value="">Select Event</option>
                        {eventOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Input>
                    </Col>
                  )}

                  <Col md={6}>
                    <Label>Remind: <span className="required">*</span></Label>
                    <div className="d-flex gap-3 mt-1">
                      {TIMING_TYPES.map(([value, label]) => (
                        <div className="form-check" key={value}>
                          <input
                            className="form-check-input"
                            type="radio"
                            id={`timing-${value}`}
                            checked={form.timing_type === value}
                            onChange={() => updateForm('timing_type', value)}
                          />
                          <label className="form-check-label" htmlFor={`timing-${value}`}>{label}</label>
                        </div>
                      ))}
                    </div>
                  </Col>
                  <Col md={6}>
                    <Label>Day(s): <span className="required">*</span></Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.offset_days}
                      onChange={e => updateForm('offset_days', Number(e.target.value || 0))}
                    />
                  </Col>

                  {form.timing_type === 'AFTER' && (
                    <Col md={12}>
                      <div className="event-rule-subrow border rounded p-2" style={{ background: 'var(--vz-light)' }}>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="is_recurring"
                            checked={form.is_recurring}
                            onChange={e => updateForm('is_recurring', e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor="is_recurring">
                            Enable recurring reminders until event is completed
                          </label>
                        </div>

                        {form.is_recurring && (
                          <Row className="g-2 align-items-center">
                            <Col md={4}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id="recur-daily"
                                  checked={form.recurring_interval_type === 'DAILY'}
                                  onChange={() => updateForm('recurring_interval_type', 'DAILY')}
                                />
                                <label className="form-check-label" htmlFor="recur-daily">Send daily</label>
                              </div>
                            </Col>
                            <Col md={5} className="d-flex align-items-center gap-2">
                              <div className="form-check mb-0">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  id="recur-custom"
                                  checked={form.recurring_interval_type === 'CUSTOM'}
                                  onChange={() => updateForm('recurring_interval_type', 'CUSTOM')}
                                />
                                <label className="form-check-label" htmlFor="recur-custom">Every</label>
                              </div>
                              <Input
                                type="number"
                                min={1}
                                max={365}
                                style={{ width: 80 }}
                                disabled={form.recurring_interval_type !== 'CUSTOM'}
                                value={form.recurring_interval_days}
                                onChange={e => updateForm('recurring_interval_days', Number(e.target.value || 1))}
                              />
                              <span className="fs-12">day(s)</span>
                            </Col>
                          </Row>
                        )}
                      </div>
                    </Col>
                  )}
                  </Row>
                </div>

                <div className="reminder-template-card">
                  <div className="reminder-template-head">
                    <div>
                      <h6 className="reminder-template-title">
                        <i className="ri-mail-send-line" />
                        Email Template
                      </h6>
                      <p className="reminder-template-sub">Build the reminder email and insert company merge fields as needed.</p>
                    </div>
                  </div>
                  <Row className="g-3">
                  <Col md={12}>
                    <Label>Sender Name: <span className="required">*</span></Label>
                    <Input
                      value={form.sender_name}
                      onChange={e => updateForm('sender_name', e.target.value)}
                    />
                  </Col>
                  <Col md={12}>
                    <Label>Subject: <span className="required">*</span></Label>
                    <RichTextEditor
                      value={form.subject}
                      onChange={value => updateForm('subject', value)}
                      minHeight={18}
                      placeholder="Enter reminder subject..."
                      compact
                    />
                  </Col>
                  <Col md={12}>
                    <Label>Message: <span className="required">*</span></Label>
                    <RichTextEditor
                      value={form.message}
                      onChange={value => updateForm('message', value)}
                      minHeight={220}
                      placeholder="Enter reminder message..."
                    />
                  </Col>
                  <Col md={12}>
                    <Label>Attachments:</Label>
                    <Input
                      type="file"
                      multiple
                      onChange={e => setNewFiles(Array.from(e.target.files || []))}
                    />
                    {form.attachments.length > 0 && (
                      <div className="mt-2">
                        {form.attachments.map(att => (
                          <div className="reminder-attachment-row" key={att.doc_id}>
                            <a href={att.file_path} target="_blank" rel="noreferrer" className="fs-12">{att.file_name}</a>
                            <Button color="danger" outline size="sm" onClick={() => requestRemoveAttachment(att)}>
                              <i className="ri-delete-bin-line" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Col>
                  </Row>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
          <Button color="success" onClick={saveReminder} disabled={saving || modalLoading}>
            {saving && <Spinner size="sm" className="me-2" />}
            Save
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteAttachmentTarget} toggle={closeRemoveAttachment} centered modalClassName="zoomIn">
        <ModalHeader toggle={closeRemoveAttachment}>
          Delete Attachment
        </ModalHeader>
        <ModalBody>
          <div className="text-center">
            <div className="avatar-md mx-auto mb-3">
              <div className="avatar-title bg-danger-subtle text-danger rounded-circle fs-24">
                <i className="ri-delete-bin-line" />
              </div>
            </div>
            <h6 className="mb-2">Are you sure?</h6>
            <p className="text-muted mb-0">
              This will permanently delete{' '}
              <strong>{deleteAttachmentTarget?.file_name || deleteAttachmentTarget?.doc_name || 'this attachment'}</strong>.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={closeRemoveAttachment} disabled={deletingAttachment}>
            Cancel
          </Button>
          <Button color="danger" onClick={onRemoveAttachment} disabled={deletingAttachment}>
            {deletingAttachment && <Spinner size="sm" className="me-2" />}
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default Reminder;
