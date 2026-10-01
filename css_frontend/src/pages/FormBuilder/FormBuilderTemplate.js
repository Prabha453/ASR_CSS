import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, CardBody,
  Button, Input, FormFeedback, Label, Spinner, Badge,
  Modal, ModalBody, ModalHeader, ModalFooter, Table, Alert,
} from 'reactstrap';
import { toast } from 'react-toastify';

// ─── CKEditor 5 (self-distributed build) ──────────────────────────────────────
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Alignment,
  List,
  TodoList,
  Indent,
  IndentBlock,
  BlockQuote,
  CodeBlock,
  Link as CKLink,
  Image,
  ImageInsertViaUrl,
  ImageToolbar,
  ImageStyle,
  MediaEmbed,
  PasteFromOffice,
  SourceEditing,
  GeneralHtmlSupport,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import { getLoggedinUser } from '../../helpers/api_helper';
import {
  getFormTemplate,
  createFormTemplate,
  updateFormTemplate,
  getTemplateCategoryList,
  getUserList,
  deleteDocumentStore,
  getFormShortcodeList,
  validateFormTemplateShortcodes,
  editFormTemplateWithAi,
  createFormTemplateVersion,
  publishFormTemplateVersion,
  getFormTemplateVersions,
} from '../../helpers/backend_helper';

import {
  POPUP_FIELD_TYPES,
  POPUP_VALUE_SOURCES,
  MODERN_CONTROL_TYPES,
  DEFAULT_TEMP_PARAMS,
  TEMP_PARAMS_BY_SOURCE,
  SHAREHOLDER_ENTITY_TYPE_OPTIONS,
  OPTION_LABEL_FIELDS_BY_SOURCE,
  loadPopupSourceFilters,
} from '../../helpers/common_helper';

/* ══════════════════════════════════════════════════════════════════
   MERGE FIELD GROUPS
══════════════════════════════════════════════════════════════════ */
const SHORTCODE_DOMAIN_META = {
  COMPANY: { label: 'Company', icon: 'ri-building-line' },
  OFFICIAL: { label: 'Officials', icon: 'ri-team-line' },
  SHARE: { label: 'Shares', icon: 'ri-stock-line' },
  TRANSACTION: { label: 'Transactions', icon: 'ri-exchange-line' },
  EVENT: { label: 'Events', icon: 'ri-calendar-event-line' },
  COMMON: { label: 'Common', icon: 'ri-code-box-line' },
  MANUAL: { label: 'Manual', icon: 'ri-edit-line' },
  CALCULATED: { label: 'Calculated', icon: 'ri-calculator-line' },
  DOCUMENT: { label: 'Document', icon: 'ri-file-text-line' },
  SYSTEM: { label: 'System', icon: 'ri-settings-3-line' },
};

const shortcodeGroups = rows => Object.values(rows.reduce((groups, row) => {
  const domain = String(row.source_domain || 'COMMON').toUpperCase();
  const meta = SHORTCODE_DOMAIN_META[domain] || {
    label: domain.charAt(0) + domain.slice(1).toLowerCase(),
    icon: 'ri-code-box-line',
  };
  if (!groups[domain]) groups[domain] = { domain, group: meta.label, icon: meta.icon, items: [] };
  groups[domain].items.push({
    label: row.label || row.shortcode_key,
    slug: row.shortcode_key,
    isCollection: Boolean(row.is_collection),
    isCustomBackend: row.resolver_name === 'CUSTOM_BACKEND',
    valueType: row.value_type,
  });
  return groups;
}, {}));

const AI_EDIT_ACTIONS = [
  { key: 'improve', label: 'Improve writing', hint: 'Clarity, flow, and readability', icon: 'ri-magic-line' },
  { key: 'grammar', label: 'Fix grammar', hint: 'Spelling, punctuation, and grammar', icon: 'ri-spell-check-line' },
  { key: 'professional', label: 'Professional tone', hint: 'Corporate and legal-administration tone', icon: 'ri-briefcase-4-line' },
  { key: 'shorten', label: 'Make shorter', hint: 'Keep all material facts', icon: 'ri-contract-left-right-line' },
  { key: 'expand', label: 'Add clarity', hint: 'Add modest explanation and transitions', icon: 'ri-expand-left-right-line' },
];

const htmlToPlainText = html => {
  if (typeof DOMParser === 'undefined') return String(html || '').replace(/<[^>]*>/g, ' ');
  const documentNode = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return String(documentNode.body.textContent || '').replace(/\u00a0/g, ' ').trim();
};

const positionInsideMergeToken = position => {
  const parent = position?.parent;
  if (!parent || typeof parent.getChildren !== 'function') return false;
  const text = [...parent.getChildren()].map(child => (
    child.is?.('$text') ? child.data : '\uFFFC'.repeat(child.offsetSize || 1)
  )).join('');
  const tokenPattern = /{{[\s\S]*?}}/g;
  let match = tokenPattern.exec(text);
  while (match) {
    const start = match.index;
    const end = start + match[0].length;
    if (position.offset > start && position.offset < end) return true;
    match = tokenPattern.exec(text);
  }
  return false;
};

const captureEditorEditTarget = editor => {
  if (!editor) throw new Error('The editor is not ready yet.');
  const selection = editor.model.document.selection;
  if (!selection.isCollapsed) {
    const ranges = [...selection.getRanges()];
    if (ranges.length !== 1) throw new Error('Please select one continuous section of text.');
    const range = ranges[0];
    if (positionInsideMergeToken(range.start) || positionInsideMergeToken(range.end)) {
      throw new Error('Adjust the selection so it does not start or end inside a shortcode.');
    }
    const fragment = editor.model.getSelectedContent(selection);
    return {
      scope: 'selection',
      content: editor.data.stringify(fragment),
      selection: {
        rootName: range.start.root.rootName,
        startPath: [...range.start.path],
        endPath: [...range.end.path],
      },
    };
  }
  return { scope: 'document', content: editor.getData(), selection: null };
};

const applyEditorEdit = (editor, preview) => {
  if (!editor || !preview?.editedHtml) throw new Error('The AI suggestion is no longer available.');
  const fragment = editor.data.parse(preview.editedHtml);
  editor.model.change(writer => {
    const root = preview.scope === 'selection'
      ? editor.model.document.getRoot(preview.selection.rootName)
      : editor.model.document.getRoot();
    if (!root) throw new Error('The editor content changed. Please run AI Edit again.');
    const range = preview.scope === 'selection'
      ? writer.createRange(
          writer.createPositionFromPath(root, preview.selection.startPath),
          writer.createPositionFromPath(root, preview.selection.endPath),
        )
      : writer.createRangeIn(root);
    const insertionSelection = writer.createSelection(range);
    editor.model.insertContent(fragment, insertionSelection);
    writer.setSelection(insertionSelection);
  });
  editor.editing.view.focus();
};

const SHARE_TRANSACTION_TYPES = ['ALLOTMENT', 'TRANSFER', 'BUYBACK', 'REDUCTION', 'CONVERSION', 'REDEMPTION', 'BONUS', 'GUARANTEE'];

const commaValues = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean);

/* Mirrors the backend `slug()` in popupSchema.js — the popup field key must
   match on both sides so {{key##shortcode}} tokens resolve at generation. */
const slugifyKey = value => String(value || '').trim().toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');

/* A row's effective field key (explicit slug, else derived from the label). */
const rowKey = row => (row.form_pop_up_field_slug || '').trim() || slugifyKey(row.pop_up_field_label_name);

/* A child row inherits only the parent's *data source* — its own filters,
   control and legacy param are authored independently (e.g. parent picks a
   Director, the child filters the same Official-records source down to the
   Alternate-director list). Stored denormalised (the child carries its own
   copy of value_source) so the backend and generation treat it as an ordinary
   field; `child_of` is a builder-only marker holding the parent field key. */
const CHILD_INHERITED_KEYS = ['value_source'];

/* Re-copy every parent's inherited fields onto its child rows. Run after any
   row edit so a child's data source never drifts from its parent. */
const syncSectionChildren = section => {
  const parents = new Map();
  for (const row of section.rows) {
    if (!row.child_of) parents.set(rowKey(row), row);
  }
  return {
    ...section,
    rows: section.rows.map(row => {
      if (!row.child_of) return row;
      const parent = parents.get(row.child_of);
      if (!parent) return row;
      const inherited = {};
      for (const key of CHILD_INHERITED_KEYS) inherited[key] = parent[key];
      const next = { ...row, ...inherited };
      // A Shareholder-Level-Shares child can't resolve without knowing WHICH
      // company-level share to list holders of — that's a real runtime value
      // dependency (unlike other child rows, which just filter the same
      // source independently of what the parent picked). `child_of` is
      // builder-only and never reaches the saved schema, so default the
      // child's own `depends_on` from it rather than showing a redundant
      // technical input to the form author. Clear it for combinations that do
      // not need a runtime parent selection.
      next.depends_on = next.value_source === 'SHARES'
          && next.source_filter_1 === 'SHAREHOLDER_LEVEL_SHARES'
        ? [row.child_of]
        : [];
      return next;
    }),
  };
};

/* Field-scoped merge tokens: {{<popup field key>##<shortcode>}} bind a
   shortcode to the record picked in one specific popup field. Only these data
   sources resolve a single record, and each maps to a shortcode key prefix. */
const SCOPED_SOURCE_PREFIX = {
  OFFICIAL_RECORDS:   'official_record.',
  OFFICIALS:          'official_record.',
  SHAREHOLDERS:       'official_record.',
  SHARES:             'share_record.',
  EVENT:              'event.',
  COMPLAINANT:        'event.',
  ALLOTMENTS:         'share_allotment.',
  SHARE_TRANSACTIONS: 'share_transaction.',
};

/* Popup-scoped LOOPS: {{#<field key>##<loop type>}} … {{/<field key>##<loop
   type>}} repeats its body once per record the field's own selection holds
   (in pick order), with {{<field key>##shortcode}} inside resolved against the
   CURRENT record instead of the field's whole selection. Only officials /
   events / shares selections support this — the backend has no loop type for
   ALLOTMENTS / SHARE_TRANSACTIONS.

   SHARES is the one source with two loop types, because "Company Level
   Shares" and "Shareholder Level Shares" (source_filter_1) read different
   tables (the company's share structure vs. one shareholder's ledger line) —
   the field's own filter picks which. */
const LOOP_TYPE_BY_SOURCE = {
  OFFICIAL_RECORDS: 'officials', OFFICIALS: 'officials', SHAREHOLDERS: 'officials',
  EVENT: 'events', COMPLAINANT: 'events',
  SHARES: 'shares',
};
const loopTypeForField = field => field?.value_source === 'SHARES'
  ? (String(field.source_filter_1 || '').toUpperCase() === 'SHAREHOLDER_LEVEL_SHARES' ? 'shareholder_shares' : 'shares')
  : LOOP_TYPE_BY_SOURCE[field?.value_source] || null;

/* Flatten popup_fields (editor shape) → the record-bound fields that can be
   referenced from a scoped merge token. */
const scopedPopupFieldList = popupSections => (popupSections || [])
  .flatMap(section => (section.rows || []).map(row => ({
    key: (row.form_pop_up_field_slug || '').trim() || slugifyKey(row.pop_up_field_label_name),
    label: row.pop_up_field_label_name || row.form_pop_up_field_slug || 'Untitled field',
    value_source: row.value_source,
    source_filter_1: row.source_filter_1,
  })))
  .filter(field => field.key && SCOPED_SOURCE_PREFIX[field.value_source]);

/* Insert a merge field into the editor. Collection ("List") fields need
   Mustache block syntax — {{#key}}…{{/key}} — so the renderer repeats the
   body per row instead of dumping the raw JSON array. The caret is left
   between the tags so the author can type the per-row template. */
const insertMergeField = (editor, slug, isCollection) => {
  if (!editor) return;
  editor.model.change(writer => {
    const position = editor.model.document.selection.getFirstPosition();
    if (isCollection) {
      const open = `{{#${slug}}}`;
      writer.insertText(open + `{{/${slug}}}`, position);
      writer.setSelection(position.getShiftedBy(open.length));
    } else {
      writer.insertText(`{{${slug}}}`, position);
    }
  });
  editor.editing.view.focus();
};

/* ══════════════════════════════════════════════════════════════════
   CKEDITOR 5 CONFIG
   Comparable feature set to the previous Quill toolbar: headings,
   inline formats, colors, alignment, lists, indents, blockquote,
   code block, link, image (via URL), media embed — plus source
   editing and GeneralHtmlSupport so pasted Word HTML/inline styles
   are preserved rather than stripped.
══════════════════════════════════════════════════════════════════ */
const CKEDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    FontSize,
    FontColor,
    FontBackgroundColor,
    Alignment,
    List,
    TodoList,
    Indent,
    IndentBlock,
    BlockQuote,
    CodeBlock,
    CKLink,
    Image,
    ImageInsertViaUrl,
    ImageToolbar,
    ImageStyle,
    MediaEmbed,
    PasteFromOffice,
    SourceEditing,
    GeneralHtmlSupport,
  ],
  toolbar: [
    'undo', 'redo', '|',
    'heading', '|',
    'fontSize', 'fontColor', 'fontBackgroundColor', '|',
    'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
    'alignment', '|',
    'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent', '|',
    'blockQuote', 'codeBlock', '|',
    'link', 'insertImageViaUrl', 'mediaEmbed', '|',
    'sourceEditing',
  ],
  htmlSupport: {
    allow: [
      {
        name: /.*/,
        attributes: true,
        classes: true,
        styles: true,
      },
    ],
  },
};

/* ══════════════════════════════════════════════════════════════════
   SCOPED CSS
══════════════════════════════════════════════════════════════════ */
const CSS = `
  /* ── Sections ── */
  .fb-section        { margin-bottom:20px; border:1px solid var(--vz-border-color); border-radius:8px; overflow:visible; }
  .fb-section-hdr    { display:flex; align-items:center; gap:10px; padding:11px 16px;
                        background:var(--vz-light); border-bottom:1px solid var(--vz-border-color); flex-wrap:wrap; }
  .fb-section-icon   { width:28px; height:28px; border-radius:6px; background:rgba(64,81,137,.1);
                        color:#405189; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
  .fb-section-title  { font-size:13px; font-weight:600; margin:0; }
  .fb-section-body   { padding:16px; background:var(--vz-card-bg,#fff); }

  /* ── Orientation ── */
  .orient-group { display:flex; gap:18px; padding:4px 0; }
  .orient-opt   { display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; }
  .orient-opt input { accent-color:#405189; width:14px; height:14px; }

  /* ── Margin grids ── */
  .margin-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
  .margin-grid-hf { display:grid; grid-template-columns:1fr 1fr; gap:8px; max-width:240px; }
  .margin-sub     { font-size:10px; text-align:center; color:#878a99; margin-top:2px; }

  /* ── Form type bar ── */
  .formtype-bar   { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding:10px 14px;
                     border:1px solid var(--vz-border-color); border-radius:6px; background:var(--vz-light); }
  .formtype-pill  { display:flex; align-items:center; gap:6px; padding:5px 14px; border-radius:20px;
                     border:1px solid var(--vz-border-color); cursor:pointer; font-size:13px;
                     background:var(--vz-card-bg,#fff); transition:.15s; user-select:none; }
  .formtype-pill.active { background:rgba(64,81,137,.09); border-color:#405189; color:#405189; font-weight:600; }
  .formtype-pill input  { accent-color:#405189; width:13px; height:13px; }
  .formtype-sep  { width:1px; height:22px; background:var(--vz-border-color); }
  .formtype-chk  { display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer; }
  .formtype-chk input { accent-color:#405189; width:14px; height:14px; }

  /* ── Multi-select ── */
  .ms-wrap    { position:relative; }
  .ms-trigger { display:flex; align-items:center; justify-content:space-between; padding:5px 10px;
                 border:1px solid var(--vz-input-border-color,#ced4da); border-radius:.25rem;
                 background:var(--vz-input-bg); cursor:pointer; font-size:13px;
                 min-height:32px; user-select:none; gap:8px; }
  .ms-trigger:hover { border-color:#405189; }
  .ms-trigger.open  { border-color:#405189; box-shadow:0 0 0 .15rem rgba(64,81,137,.15); }
  .ms-chips   { display:flex; flex-wrap:wrap; gap:4px; flex:1; min-height:20px; }
  .ms-chip    { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:10px;
                 font-size:11px; font-weight:600; background:rgba(64,81,137,.1); color:#405189;
                 border:1px solid rgba(64,81,137,.2); white-space:nowrap; }
  .ms-chip-x  { cursor:pointer; font-size:12px; line-height:1; margin-left:2px; opacity:.7; }
  .ms-chip-x:hover { opacity:1; }
  .ms-placeholder { color:#aaa; font-size:12px; white-space:nowrap; }
  .ms-counter { font-size:11px; color:#405189; font-weight:700; background:rgba(64,81,137,.1);
                 border-radius:10px; padding:1px 7px; white-space:nowrap; flex-shrink:0; }
  .ms-arrow   { font-size:14px; color:#878a99; flex-shrink:0; }
  .ms-panel   { position:absolute; top:calc(100% + 3px); left:0; right:0; z-index:9999;
                 min-width:230px; max-width:360px;
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

  /* ── Context menu ── */
  .ctx-overlay { position:fixed; inset:0; z-index:99990; }
  .ctx-menu    { position:fixed; z-index:99999; background:var(--vz-card-bg,#fff);
                  border:1px solid var(--vz-border-color); border-radius:6px; box-shadow:0 8px 32px rgba(0,0,0,.18);
                  display:flex; flex-direction:column; overflow:hidden; min-width:220px; max-height:680px; }
  .ctx-header  { padding:7px 12px; font-size:10px; font-weight:800; text-transform:uppercase;
                  letter-spacing:.08em; color:#405189; background:rgba(64,81,137,.06);
                  border-bottom:1px solid var(--vz-border-color); display:flex; align-items:center; gap:6px; flex-shrink:0; }
  .ctx-tabs   { display:flex; gap:2px; padding:6px 8px 0; background:rgba(64,81,137,.03);
                 border-bottom:1px solid var(--vz-border-color); flex-shrink:0;
                 overflow-x:auto; scrollbar-width:thin; }
  .ctx-tab    { display:flex; align-items:center; gap:5px; padding:6px 12px; font-size:11px;
                 font-weight:600; border:1px solid transparent; border-bottom:none;
                 border-radius:6px 6px 0 0; background:transparent; color:#878a99; cursor:pointer;
                 transition:.12s; white-space:nowrap; flex-shrink:0; max-width:160px; }
  .ctx-tab > span { overflow:hidden; text-overflow:ellipsis; }
  .ctx-tab:hover  { color:#405189; background:rgba(64,81,137,.06); }
  .ctx-tab.active { color:#405189; background:var(--vz-card-bg,#fff);
                 border-color:var(--vz-border-color); margin-bottom:-1px; }
  .ctx-tab i  { font-size:13px; flex-shrink:0; }
  /* A pop-up field's own tab (as opposed to "General") tints even when not
     active, so it reads at a glance as "scoped to one field" mode. */
  .ctx-tab-custom { background:rgba(64,81,137,.09); color:#405189; border-color:rgba(64,81,137,.18); }
  .ctx-tab-custom:hover { background:rgba(64,81,137,.16); }
  .ctx-tab-custom.active { background:rgba(64,81,137,.09); border-color:#405189; margin-bottom:-1px; }
  .ctx-search-wrap { padding:7px 8px; border-bottom:1px solid var(--vz-border-color); flex-shrink:0; }
  .ctx-search  { width:100%; padding:4px 8px; font-size:12px; border:1px solid var(--vz-border-color);
                  border-radius:4px; background:var(--vz-input-bg,#fff); outline:none; }
  .ctx-search:focus { border-color:#405189; }
  .ctx-body    { display:flex; flex:1; overflow:hidden; }
  .ctx-groups  { width:220px; flex-shrink:0; overflow-y:auto; border-right:1px solid var(--vz-border-color); }
  .ctx-group-item { display:flex; align-items:center; justify-content:space-between; gap:6px;
                     padding:7px 10px; font-size:12px; cursor:pointer;
                     color:var(--vz-body-color); transition:background .1s; white-space:nowrap; }
  .ctx-group-item i.icon { font-size:13px; color:#878a99; flex-shrink:0; }
  .ctx-group-item .label { flex:1; overflow:hidden; text-overflow:ellipsis; }
  .ctx-group-item i.arrow { font-size:12px; color:#878a99; flex-shrink:0; }
  .ctx-group-item:hover,.ctx-group-item.active { background:rgba(64,81,137,.08); color:#405189; }
  .ctx-group-item:hover i,.ctx-group-item.active i { color:#405189; }
  .ctx-items   { flex:1; overflow-y:auto; }
  .ctx-item    { display:flex; align-items:center; justify-content:space-between; gap:8px;
                  padding:6px 12px; font-size:12px; cursor:pointer; color:var(--vz-body-color); transition:background .1s; }
  .ctx-item:hover { background:rgba(64,81,137,.06); color:#405189; }
  .ctx-slug    { font-family:monospace; font-size:10px; padding:1px 5px; border-radius:3px;
                  background:rgba(64,81,137,.07); color:#405189; white-space:nowrap; flex-shrink:0;
                  max-width:140px; overflow:hidden; text-overflow:ellipsis; }
  .ctx-items-empty { padding:14px 12px; font-size:12px; color:#878a99; text-align:center; }
  .ctx-items-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center;
                             height:100%; padding:20px; text-align:center; }
  .ctx-items-placeholder i { font-size:28px; color:rgba(64,81,137,.2); margin-bottom:8px; }
  .ctx-items-placeholder p  { font-size:12px; color:#878a99; margin:0; }

  /* ── CKEditor 5 overrides ── */
  .ck-host .ck.ck-toolbar {
    border: 1px solid var(--vz-border-color) !important;
    background: var(--vz-light) !important;
  }
  .ck-host .ck.ck-editor__editable_inline {
    border: 1px solid var(--vz-border-color) !important;
    border-top: none !important;
    min-height: 360px;
    font-size: 13px;
    padding: 14px 16px;
    color: var(--vz-body-color);
  }
  .ck-host .ck.ck-editor__editable_inline.ck-focused {
    border-color: #405189 !important;
    box-shadow: 0 0 0 .15rem rgba(64,81,137,.15) !important;
  }
  /* dropdown panels sit on top of everything */
  .ck-host .ck.ck-balloon-panel { z-index: 9999; }
  /* hint bar */
  .ctx-hint-bar { padding:6px 16px; background:rgba(64,81,137,.04); border-bottom:1px solid var(--vz-border-color);
                   font-size:11px; color:#878a99; display:flex; align-items:center; gap:6px; }
  .ctx-hint-bar code { background:rgba(64,81,137,.08); padding:1px 5px; border-radius:3px; font-size:11px; color:#405189; }
  .ctx-loop-btn { margin-left:auto; display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
                   border:1px solid #405189; border-radius:12px; background:#405189; color:#fff;
                   font-size:11px; font-weight:600; white-space:nowrap; cursor:pointer; }
  .ctx-loop-btn:hover { background:#324068; border-color:#324068; }
  .ctx-loop-btn i { font-size:12px; }
  .ins-btn      { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; height:28px;
                   border:1px solid var(--vz-border-color); border-radius:4px;
                   background:var(--vz-card-bg,#fff); color:#405189; font-size:12px; font-weight:600;
                   cursor:pointer; user-select:none; transition:.15s; }
  .ins-btn:hover { background:rgba(64,81,137,.07); border-color:#405189; }

  .ins-btn:disabled { opacity:.65; cursor:not-allowed; }
  .ai-edit-btn { color:#6f42c1; border-color:rgba(111,66,193,.35); }
  .ai-edit-btn:hover { color:#5a32a3; border-color:#6f42c1; background:rgba(111,66,193,.07); }
  .ai-menu-overlay { position:fixed; inset:0; z-index:99990; }
  .ai-action-menu { position:fixed; z-index:99999; width:310px; overflow:hidden;
                    background:var(--vz-card-bg,#fff); border:1px solid var(--vz-border-color);
                    border-radius:7px; box-shadow:0 10px 32px rgba(0,0,0,.18); }
  .ai-action-header { display:flex; align-items:center; justify-content:space-between; padding:8px 11px;
                      color:#6f42c1; font-size:11px; font-weight:700; background:rgba(111,66,193,.06);
                      border-bottom:1px solid var(--vz-border-color); }
  .ai-action-item { width:100%; display:flex; align-items:flex-start; gap:10px; padding:9px 12px;
                    border:0; border-bottom:1px solid rgba(0,0,0,.04); background:transparent;
                    color:var(--vz-body-color); text-align:left; cursor:pointer; }
  .ai-action-item:hover { background:rgba(111,66,193,.06); }
  .ai-action-item > i { margin-top:2px; color:#6f42c1; font-size:15px; }
  .ai-action-item span { display:flex; flex-direction:column; min-width:0; }
  .ai-action-item strong { font-size:12px; font-weight:600; }
  .ai-action-item small { color:#878a99; font-size:10px; }
  .ai-action-note { display:flex; align-items:center; gap:5px; padding:7px 11px; color:#878a99;
                    background:var(--vz-light); font-size:10px; }
  .ai-preview-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .ai-preview-panel { min-width:0; overflow:hidden; border:1px solid var(--vz-border-color);
                      border-radius:7px; background:var(--vz-card-bg,#fff); }
  .ai-preview-suggestion { border-color:rgba(111,66,193,.35); }
  .ai-preview-title { padding:8px 11px; border-bottom:1px solid var(--vz-border-color);
                      background:var(--vz-light); font-size:11px; font-weight:700; text-transform:uppercase;
                      letter-spacing:.04em; }
  .ai-preview-suggestion .ai-preview-title { color:#6f42c1; background:rgba(111,66,193,.06); }
  .ai-preview-content { min-height:260px; max-height:440px; overflow:auto; padding:14px;
                        white-space:pre-wrap; font-family:Georgia,'Times New Roman',serif; font-size:13px;
                        line-height:1.55; color:var(--vz-body-color); }
  @media (max-width: 767px) { .ai-preview-grid { grid-template-columns:1fr; } }

  /* ── Popup sections ── */
  .ps-card     { border:1px solid var(--vz-border-color); border-radius:6px; overflow-x:auto; margin-bottom:12px; }
  .ps-card:has(.ms-trigger.open) { overflow:visible; }
  .ps-card-hdr { display:flex; align-items:center; gap:8px; padding:8px 12px;
                  background:var(--vz-light); border-bottom:1px solid var(--vz-border-color); }
  .ps-thead    { display:grid; grid-template-columns:30px minmax(150px,1.5fr) minmax(130px,1.2fr) minmax(110px,1fr) minmax(250px,2fr) minmax(100px,1fr) 68px;
                  gap:6px; padding:6px 12px; background:rgba(64,81,137,.04);
                  border-bottom:1px solid var(--vz-border-color);
                  font-size:10px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.05em; color:#6c757d; min-width:1120px; }
  .ps-row      { display:grid; grid-template-columns:30px minmax(150px,1.5fr) minmax(130px,1.2fr) minmax(110px,1fr) minmax(250px,2fr) minmax(100px,1fr) 68px;
                  gap:6px; padding:6px 12px; align-items:start; min-width:1120px;
                  border-bottom:1px solid var(--vz-border-color); }
  .ps-row:last-child { border-bottom:none; }
  .ps-row:hover { background:rgba(64,81,137,.02); }
  .ps-row-child { background:rgba(64,81,137,.035); box-shadow:inset 3px 0 0 rgba(64,81,137,.4); }
  .ps-row-child .ps-num { padding-left:10px; }
  .ps-inherit  { font-size:11px; color:#6c757d; padding:7px 8px; border:1px dashed var(--vz-border-color);
                  border-radius:.25rem; background:rgba(64,81,137,.03); white-space:nowrap;
                  overflow:hidden; text-overflow:ellipsis; }
  .ps-num      { font-size:11px; color:#878a99; font-weight:600; }
  .ps-inp,.ps-sel {
    height:calc(1.5em + .5rem + 2px); padding:.25rem .5rem;
    border:1px solid var(--vz-input-border-color,#ced4da); border-radius:.25rem;
    font-size:.76563rem; width:100%; background:var(--vz-input-bg,#fff);
    color:var(--vz-body-color); font-family:inherit; line-height:1.5; outline:none; transition:border-color .15s;
  }
  .ps-inp:focus,.ps-sel:focus { border-color:#405189; box-shadow:0 0 0 .15rem rgba(64,81,137,.15); }
  .ps-inp[readonly] { background:rgba(64,81,137,.03); color:#405189; font-family:monospace; font-size:11px; }
  .ps-filter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr));
                    gap:4px; width:100%; min-width:0; }
  .ps-filter-grid > .ps-sel { min-width:0; }
  .ps-filter-extras { grid-column:1/-1; display:grid;
                      grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
                      gap:4px; min-width:0; }
  .ps-filter-extras > * { min-width:0; }
  .ps-empty { text-align:center; padding:28px 16px; color:#878a99; font-size:12px; }

  /* ── Field picker modal ── */
  .fp-row      { cursor:pointer; transition:.1s; }
  .fp-row:hover { background:rgba(64,81,137,.05)!important; }
  .fp-row.added { background:rgba(10,179,156,.05)!important; }
  .slug-badge  { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:12px;
                  font-size:11px; font-weight:600; background:rgba(64,81,137,.08); color:#405189;
                  border:1px solid rgba(64,81,137,.15); font-family:monospace; }
  .fp-search   { position:relative; }
  .fp-search i { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#878a99; font-size:14px; pointer-events:none; }
  .fp-search input { padding-left:32px; }

  /* ── Footer ── */
  .fb-footer { display:flex; align-items:center; gap:10px; padding:14px 20px;
                border-top:1px solid var(--vz-border-color); background:var(--vz-light); flex-wrap:wrap; }

  /* ── Manual file upload card ── */
  .mfu-grid        { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
  .mfu-card        { border:1.5px dashed var(--vz-border-color); border-radius:10px;
                     padding:18px 14px; display:flex; flex-direction:column; align-items:center;
                     gap:10px; background:var(--vz-card-bg,#fff);
                     transition:border-color .2s, background .2s; position:relative; }
  .mfu-card:hover  { border-color:#405189; background:rgba(64,81,137,.02); }
  .mfu-card.has-file { border-style:solid; border-color:rgba(64,81,137,.4); }
  .mfu-icon-wrap   { width:52px; height:52px; border-radius:10px; background:rgba(64,81,137,.08);
                     color:#405189; display:flex; align-items:center; justify-content:center;
                     font-size:24px; flex-shrink:0; }
  .mfu-label       { font-size:12px; font-weight:600; color:var(--vz-body-color); text-align:center; line-height:1.4; }
  .mfu-hint        { font-size:10px; color:var(--vz-secondary-color,#878a99); text-align:center; line-height:1.4; }
  .mfu-filename    { font-size:11px; color:#405189; font-weight:500;
                     max-width:160px; overflow:hidden; text-overflow:ellipsis;
                     white-space:nowrap; text-align:center; }
  .mfu-upload-btn  { display:flex; align-items:center; gap:5px; padding:5px 14px;
                     border-radius:5px; border:1px solid #405189; color:#405189;
                     background:transparent; font-size:11px; font-weight:600;
                     cursor:pointer; transition:background .15s, color .15s; white-space:nowrap; }
  .mfu-upload-btn:hover { background:#405189; color:#fff; }
  .mfu-clear-btn   { position:absolute; top:6px; right:6px; width:22px; height:22px;
                     border-radius:50%; border:none; background:rgba(220,53,69,.12);
                     color:#dc3545; font-size:12px; display:flex; align-items:center;
                     justify-content:center; cursor:pointer; padding:0; transition:background .15s; }
  .mfu-clear-btn:hover { background:rgba(220,53,69,.28); }
  .mfu-saved-row   { display:flex; align-items:center; gap:8px; padding:8px 12px;
                     border:1px solid rgba(64,81,137,.2); border-radius:6px;
                     background:rgba(64,81,137,.04); width:100%; }
  .mfu-saved-icon  { font-size:20px; color:#405189; flex-shrink:0; }
  .mfu-saved-meta  { flex:1; min-width:0; }
  .mfu-saved-meta span { display:block; font-size:11px; font-weight:600; color:var(--vz-body-color);
                          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mfu-saved-meta small { font-size:10px; color:#878a99; }
  .mfu-view-btn    { font-size:11px; color:#405189; padding:3px 8px; border-radius:4px;
                     border:1px solid rgba(64,81,137,.25); background:transparent;
                     cursor:pointer; white-space:nowrap; transition:background .15s; flex-shrink:0; }
  .mfu-view-btn:hover { background:rgba(64,81,137,.08); }
`;

/* ══════════════════════════════════════════════════════════════════
   DEFAULT FORM STATE
══════════════════════════════════════════════════════════════════ */
const DEFAULT_FORM = {
  category_id:      [],
  assigned_user_id: [],
  form_name:        '',
  download_name:        '',
  orientation:      'Portrait',
  margin_top:       '2.54',
  margin_right:     '2.54',
  margin_bottom:    '2.54',
  margin_left:      '2.54',
  header_margin:    '1.27',
  footer_margin:    '1.27',
  country_code:     'SG',
  default_library:  '',
  status:           true,
  form_type:        '0',
  make_esign_copy:  false,
  pdpa_required:    false,
  form_content:     '',
  popup_fields:     [],
  manual_file:      null,
  manual_doc:       null,
};

/* ══════════════════════════════════════════════════════════════════
   MULTI-SELECT COMPONENT
══════════════════════════════════════════════════════════════════ */
const MultiSelect = ({ items, selected, onChange, placeholder = 'Select…', loading = false , hasError = false }) => {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');
  const wrapRef         = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setQ(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const filtered  = q ? items.filter(c => c.label.toLowerCase().includes(q.toLowerCase())) : items;
  const toggle    = (id, e) => { e.stopPropagation(); onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]); };
  const removeOne = (id, e) => { e.stopPropagation(); onChange(selected.filter(x => x !== id)); };
  const selObjs   = selected.map(id => items.find(c => c.id === id)).filter(Boolean);
  const visible   = selObjs.slice(0, 3);
  const hidden    = selObjs.length - 3;

  return (
    <div className="ms-wrap" ref={wrapRef}>
       <div
        className={`ms-trigger ${open ? 'open' : ''}`}
        style={hasError ? { borderColor: 'var(--vz-form-invalid-color)'} : {}}  // ← red border when error
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
                    const isSel = selected.includes(item.id);
                    return (
                      <div key={item.id} className={`ms-item ${isSel ? 'selected' : ''}`} onMouseDown={e => toggle(item.id, e)}>
                        <input type="checkbox" readOnly checked={isSel} />
                        {item.label}
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

/* ══════════════════════════════════════════════════════════════════
   CONTEXT MENU
══════════════════════════════════════════════════════════════════ */
const SCOPED_SOURCE_ICON = {
  OFFICIAL_RECORDS: 'ri-team-line', OFFICIALS: 'ri-team-line', SHAREHOLDERS: 'ri-team-line',
  EVENT: 'ri-calendar-event-line', COMPLAINANT: 'ri-calendar-event-line',
  ALLOTMENTS: 'ri-stock-line', SHARE_TRANSACTIONS: 'ri-stock-line', SHARES: 'ri-stock-line',
};

const DOMAIN_BY_SCOPED_SOURCE = {
  OFFICIAL_RECORDS: 'OFFICIAL', OFFICIALS: 'OFFICIAL', SHAREHOLDERS: 'OFFICIAL',
  EVENT: 'EVENT', COMPLAINANT: 'EVENT',
  ALLOTMENTS: 'SHARE', SHARE_TRANSACTIONS: 'SHARE', SHARES: 'SHARE',
};

/* The menu is one shortcode catalogue plus a tab strip. "General" inserts the
   plain {{shortcode}}. Selecting a pop-up field tab combines the chosen
   shortcode with that field's key → {{field_key##shortcode}}, so the value is
   resolved against that field's own selection at generation. Collection
   ("List") shortcodes are a fixed global list (all current officials, an
   allotment's lines, …) and stay unscoped either way. A pop-up tab whose field
   can hold more than one record (officials / events / shares) instead gets an
   "Insert repeat loop" button — that's the {{#field##type}}…{{/field##type}}
   syntax, built once here instead of hand-typed. */
const ContextMenu = ({ position, onInsert, onClose, popupFields = [] }) => {
  const [tabKey,      setTabKey]      = useState('general');
  const [activeGroup, setActiveGroup] = useState(0);
  const [search,      setSearch]      = useState('');
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await getFormShortcodeList({ status: 'ACTIVE' });
        const raw = response?.data?.data ?? response?.data ?? response;
        if (mounted) setGroups(shortcodeGroups(Array.isArray(raw) ? raw : []));
      } catch (error) {
        if (mounted) setLoadError(String(error || 'Unable to load fields'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const tabs = [
    { key: 'general', label: 'General', icon: 'ri-price-tag-3-line' },
    ...popupFields.map(field => ({
      key: field.key,
      label: field.label,
      icon: SCOPED_SOURCE_ICON[field.value_source] || 'ri-links-line',
    })),
  ];
  const activeTabKey = tabs.some(tab => tab.key === tabKey) ? tabKey : 'general';
  const scoping = activeTabKey === 'general' ? null : activeTabKey;
  const scopedField = scoping ? popupFields.find(field => field.key === scoping) : null;
  const loopType = loopTypeForField(scopedField);

  // General contains company/common values. A pop-up field tab contains only
  // the domain compatible with that field's data source, so official, event,
  // and share mappings cannot be accidentally mixed. Custom backend
  // shortcodes follow the same Source Domain rule and receive that tab's
  // submitted selection when the document is generated.
  // Only split the groups this way when there's actually somewhere else to
  // send the author (a form with no pop-up fields has no other tab, so
  // General stays unrestricted rather than hiding everything).
  const scopedDomain = DOMAIN_BY_SCOPED_SOURCE[scopedField?.value_source];
  const scopeGroups = tabs.length <= 1 ? groups
    : scoping ? groups.filter(g => g.domain === scopedDomain)
    : groups.filter(g => ['COMPANY', 'COMMON'].includes(g.domain));

  const filteredGroups = search.trim()
    ? scopeGroups.map(g => ({
        ...g,
        items: g.items.filter(it =>
          it.label.toLowerCase().includes(search.toLowerCase()) ||
          it.slug.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.items.length > 0)
    : scopeGroups;

  const activeItems = filteredGroups[activeGroup]?.items || [];

  useEffect(() => {
    if (activeGroup >= filteredGroups.length) setActiveGroup(0);
  }, [filteredGroups.length]);

  // Switching tabs swaps the whole group set (Company <-> everything else) —
  // always land back on the first group rather than an index that now points
  // at a different domain.
  useEffect(() => { setActiveGroup(0); }, [scoping]);

  // A scoped token unless the item is a collection (blocks can't be scoped).
  const tokenFor = it => {
    if (it.isCollection) return `{{#${it.slug}}}`;
    return scoping ? `{{${scoping}##${it.slug}}}` : `{{${it.slug}}}`;
  };
  const insertItem = it => {
    if (it.isCollection || !scoping) onInsert(it.slug, it.isCollection);
    else onInsert(`${scoping}##${it.slug}`, false);
    onClose();
  };
  // One-click {{#field##type}}…{{/field##type}} — the loop wrapper the client
  // otherwise has to type by hand. Body fields still come from this same tab
  // (e.g. "Selected Official Name" → {{field##official_record.name}}), which
  // already resolves per-row once it's inside the loop.
  const insertLoop = () => {
    if (!scoping || !loopType) return;
    onInsert(`${scoping}##${loopType}`, true);
    onClose();
  };

  const menuW    = 760;
  const menuH    = 620;
  const safeTop  = Math.min(position.y, window.innerHeight - menuH - 8);
  const safeLeft = Math.min(position.x, window.innerWidth  - menuW - 8);

  return (
    <>
      <div className="ctx-overlay" onMouseDown={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div className="ctx-menu"
        style={{ top: Math.max(4, safeTop), left: Math.max(4, safeLeft), width: menuW, maxHeight: menuH }}>
        <div className="ctx-header"><i className="ri-code-s-slash-line" /> Insert Merge Field</div>
        {popupFields.length > 0 && (
          <div className="ctx-tabs">
            {tabs.map(tab => (
              <button key={tab.key} type="button" title={tab.label}
                className={`ctx-tab ${tab.key !== 'general' ? 'ctx-tab-custom' : ''} ${activeTabKey === tab.key ? 'active' : ''}`}
                onMouseDown={e => { e.preventDefault(); setTabKey(tab.key); setActiveGroup(0); }}>
                <i className={tab.icon} /><span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="ctx-search-wrap">
          <input className="ctx-search" placeholder="Search fields or groups…" autoFocus
            value={search} onChange={e => { setSearch(e.target.value); setActiveGroup(0); }} />
        </div>
        {scoping && (
          <div className="ctx-hint-bar" style={{ borderTop: 'none' }}>
            <i className="ri-links-line text-primary" />
            <span>Bound to <strong style={{ color: '#405189' }}>{tabs.find(t => t.key === scoping)?.label}</strong> — inserts <code>{`{{${scoping}##…}}`}</code></span>
            {loopType && (
              <button type="button" className="ctx-loop-btn" onMouseDown={e => { e.preventDefault(); insertLoop(); }}
                title="Repeat a block once for every record this field's selection includes">
                <i className="ri-repeat-line" /> Insert repeat loop
              </button>
            )}
          </div>
        )}
        <div className="ctx-body">
          <div className="ctx-groups">
            {filteredGroups.map((g, gi) => (
              <div key={g.group} className={`ctx-group-item ${gi === activeGroup ? 'active' : ''}`}
                onMouseEnter={() => setActiveGroup(gi)} onClick={() => setActiveGroup(gi)}>
                <i className={`icon ${g.icon}`} />
                <span className="label">{g.group}</span>
                <span style={{ fontSize: 10, opacity: .6 }}>{g.items.length}</span>
                <i className="arrow ri-arrow-right-s-line" />
              </div>
            ))}
          </div>
          <div className="ctx-items">
            {loading
              ? <div className="ctx-items-placeholder"><Spinner size="sm" /><p>Loading tenant fields…</p></div>
              : loadError
                ? <div className="ctx-items-placeholder"><i className="ri-error-warning-line" /><p>{loadError}</p></div>
                : activeItems.length === 0
              ? <div className="ctx-items-placeholder"><i className="ri-search-line" /><p>No fields match</p></div>
              : activeItems.map(it => (
                  <div key={it.slug} className="ctx-item"
                    onMouseDown={e => { e.preventDefault(); insertItem(it); }}>
                    <span style={{ flex: 1 }}>{it.label}</span>
                    {it.isCustomBackend && <Badge color="success" pill>Backend</Badge>}
                    {it.isCollection && <Badge color="info" pill>List</Badge>}
                    {scoping && it.isCollection && <span title="Lists cannot be bound to a pop-up field"><Badge color="light" pill>unbound</Badge></span>}
                    <span className="ctx-slug">{tokenFor(it)}</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   INSERT FIELD TOOLBAR BUTTON
══════════════════════════════════════════════════════════════════ */
const InsertFieldButton = ({ editorRef: editorInstanceRef, popupFields = [] }) => {
  const [open, setOpen] = useState(false);
  const btnRef          = useRef(null);
  const [pos, setPos]   = useState({ x: 0, y: 0 });

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ x: r.left, y: r.bottom + 4 });
    }
    setOpen(v => !v);
  };

  const insert = useCallback((slug, isCollection) => {
    insertMergeField(editorInstanceRef.current, slug, isCollection);
    setOpen(false);
  }, [editorInstanceRef]);

  return (
    <span ref={btnRef}>
      <button type="button" className="ins-btn" onClick={handleOpen}>
        <i className="ri-code-s-slash-line" style={{ fontSize: 13 }} />
        Insert Field
        <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`} style={{ fontSize: 13 }} />
      </button>
      {open && <ContextMenu position={pos} onInsert={insert} onClose={() => setOpen(false)} popupFields={popupFields} />}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════
   STABLE CKEDITOR
   ─ The <CKEditor> React component keeps a stable editor instance
     across parent re-renders on its own; we only need to seed content
     once (its `data` prop is read on init only, not on later changes),
     expose the instance via editorInstanceRef for reading at submit
     time, and reproduce the right-click merge-field context menu.
══════════════════════════════════════════════════════════════════ */
const AiEditButton = ({ editorRef, busy, onAction }) => {
  const [open, setOpen] = useState(false);
  const [scopeLabel, setScopeLabel] = useState('Entire document');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  const handleOpen = () => {
    if (busy) return;
    const editor = editorRef.current;
    setScopeLabel(editor && !editor.model.document.selection.isCollapsed
      ? 'Selected text'
      : 'Entire document');
    if (btnRef.current) {
      const bounds = btnRef.current.getBoundingClientRect();
      setPos({ x: bounds.left, y: bounds.bottom + 4 });
    }
    setOpen(value => !value);
  };

  const choose = action => {
    setOpen(false);
    onAction(action);
  };

  return (
    <span ref={btnRef}>
      <button type="button" className="ins-btn ai-edit-btn" onClick={handleOpen} disabled={busy}>
        {busy
          ? <span className="spinner-border spinner-border-sm" role="status" />
          : <i className="ri-sparkling-2-line" style={{ fontSize: 13 }} />}
        {busy ? 'Editing…' : 'AI Edit'}
        {!busy && <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line`} style={{ fontSize: 13 }} />}
      </button>
      {open && (
        <>
          <div className="ai-menu-overlay" onMouseDown={() => setOpen(false)} />
          <div className="ai-action-menu" style={{ left: pos.x, top: pos.y }}>
            <div className="ai-action-header">
              <span><i className="ri-sparkling-2-line me-1" />AI Edit</span>
              <Badge color={scopeLabel === 'Selected text' ? 'primary' : 'secondary'} pill>
                {scopeLabel}
              </Badge>
            </div>
            {AI_EDIT_ACTIONS.map(action => (
              <button key={action.key} type="button" className="ai-action-item" onClick={() => choose(action.key)}>
                <i className={action.icon} />
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.hint}</small>
                </span>
              </button>
            ))}
            <div className="ai-action-note">
              <i className="ri-shield-check-line" /> Shortcodes are protected automatically.
            </div>
          </div>
        </>
      )}
    </span>
  );
};

const AiEditPreviewModal = ({ preview, applying, onApply, onCancel }) => (
  <Modal isOpen={Boolean(preview)} toggle={applying ? undefined : onCancel} size="xl" centered scrollable>
    <ModalHeader toggle={applying ? undefined : onCancel}>
      <i className="ri-sparkling-2-line text-primary me-2" />Review AI Edit
    </ModalHeader>
    <ModalBody>
      {preview && (
        <>
          <Alert color="info" className="py-2 fs-12">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <strong>{preview.scope === 'selection' ? 'Selected text' : 'Entire document'}</strong>
              <span>{preview.summary}</span>
              <Badge color="light" className="ms-auto text-dark">{preview.model}</Badge>
            </div>
          </Alert>
          <div className="ai-preview-grid">
            <div className="ai-preview-panel">
              <div className="ai-preview-title">Original</div>
              <div className="ai-preview-content">{htmlToPlainText(preview.originalHtml)}</div>
            </div>
            <div className="ai-preview-panel ai-preview-suggestion">
              <div className="ai-preview-title">AI suggestion</div>
              <div className="ai-preview-content">{htmlToPlainText(preview.editedHtml)}</div>
            </div>
          </div>
          <p className="text-muted fs-11 mt-2 mb-0">
            Formatting is preserved when you apply the suggestion. Review legal and compliance wording before saving.
          </p>
        </>
      )}
    </ModalBody>
    <ModalFooter>
      <Button color="light" onClick={onCancel} disabled={applying}>Cancel</Button>
      <Button color="primary" onClick={onApply} disabled={applying}>
        {applying
          ? <><Spinner size="sm" className="me-1" />Applying…</>
          : <><i className="ri-check-line me-1" />Apply suggestion</>}
      </Button>
    </ModalFooter>
  </Modal>
);

const StableCKEditor = ({ editorInstanceRef, initialContent, popupFields = [] }) => {
  const seededRef = useRef(false);
  const [ctx, setCtx] = useState(null);

  // ── Seed content when it arrives asynchronously (edit mode) ──────
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor || seededRef.current || !initialContent) return;
    editor.setData(initialContent);
    seededRef.current = true;
  }, [initialContent, editorInstanceRef]);

  const insert = useCallback((slug, isCollection) => {
    insertMergeField(editorInstanceRef.current, slug, isCollection);
    setCtx(null);
  }, [editorInstanceRef]);

  return (
    <div>
      <CKEditor
        editor={ClassicEditor}
        data={initialContent || ''}
        config={CKEDITOR_CONFIG}
        onReady={editor => {
          editorInstanceRef.current = editor;
          if (initialContent && !seededRef.current) {
            editor.setData(initialContent);
            seededRef.current = true;
          }
          // ── Right-click context menu ──────────────────────────────
          const editable = editor.ui.getEditableElement();
          if (editable) {
            editable.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              setCtx({ x: e.clientX, y: e.clientY });
              editor.editing.view.focus();
            });
          }
        }}
      />
      {ctx && (
        <ContextMenu
          position={ctx}
          onInsert={insert}
          onClose={() => setCtx(null)}
          popupFields={popupFields}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SELECT POP-UP FIELD MODAL
══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   MANUAL FILE UPLOAD CARD
══════════════════════════════════════════════════════════════════ */
const ManualFileUploadCard = ({ file, savedDoc, onChange, onDeleteRequest }) => {
  const inputRef = useRef(null);

  const docIcon = (name = '') => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif','svg','webp'].includes(ext)) return 'ri-image-line';
    if (ext === 'pdf')                                         return 'ri-file-pdf-line';
    if (['doc','docx'].includes(ext))                         return 'ri-file-word-line';
    if (['xls','xlsx'].includes(ext))                         return 'ri-file-excel-line';
    return 'ri-file-line';
  };

  const hasNewFile  = !!file;
  const hasSavedDoc = !!savedDoc;
  const showSaved   = hasSavedDoc && !hasNewFile;

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onChange(f);
    e.target.value = '';
  };

  return (
    <div className={`mfu-card${hasNewFile ? ' has-file' : ''}`}>
      {showSaved && (
        <button type="button" className="mfu-clear-btn" title="Delete file" onClick={onDeleteRequest}>
          <i className="ri-delete-bin-line" />
        </button>
      )}
      {hasNewFile && (
        <button type="button" className="mfu-clear-btn" title="Cancel selection" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}>
          <i className="ri-close-line" />
        </button>
      )}
      <div className="mfu-icon-wrap">
        <i className={hasNewFile ? docIcon(file.name) : showSaved ? docIcon(savedDoc.doc_name || savedDoc.file_path) : 'ri-file-upload-line'} />
      </div>
      <span className="mfu-label">Manual Form File</span>
      <span className="mfu-hint">Upload the manual form document<br />(PDF, DOC, DOCX, XLS, XLSX)</span>
      {showSaved && (
        <div className="mfu-saved-row">
          <i className={`mfu-saved-icon ${docIcon(savedDoc.doc_name || savedDoc.file_path)}`} />
          <div className="mfu-saved-meta">
            <span title={savedDoc.doc_name}>{savedDoc.doc_name || 'Uploaded file'}</span>
            <small>Saved on server</small>
          </div>
          {savedDoc.file_path && (
            <a href={savedDoc.file_path} target="_blank" rel="noopener noreferrer" className="mfu-view-btn">
              <i className="ri-eye-line me-1" />View
            </a>
          )}
        </div>
      )}
      {hasNewFile && (
        <span className="mfu-filename" title={file.name}>
          <i className="ri-attachment-line me-1" />{file.name}
        </span>
      )}
      <input ref={inputRef} type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        style={{ display: 'none' }} onChange={handlePick} />
      <button type="button" className="mfu-upload-btn" onClick={() => inputRef.current?.click()}>
        <i className="ri-upload-2-line" />
        {showSaved ? 'Replace File' : hasNewFile ? 'Change File' : 'Upload File'}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const FormBuilderForm = () => {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = !!id;

  const [form,       setForm]       = useState({ ...DEFAULT_FORM });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [shortcodeValidation, setShortcodeValidation] = useState(null);
  const [aiEditLoading, setAiEditLoading] = useState(false);
  const [aiEditApplying, setAiEditApplying] = useState(false);
  const [aiEditPreview, setAiEditPreview] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionAction, setVersionAction] = useState(false);

  const [catList,     setCatList]     = useState([]);
  const [catLoading,  setCatLoading]  = useState(true);
  const [userList,    setUserList]    = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [officialRoleOptions, setOfficialRoleOptions] = useState([]);
  const [popupSourceFilters, setPopupSourceFilters] = useState({});

  const [manualDeleteModal,   setManualDeleteModal]   = useState(false);
  const [manualDeleteLoading, setManualDeleteLoading] = useState(false);

  // ── Stable CKEditor instance ref ───────────────────────────────────
  // This is a ref, NOT state — updating it never triggers a re-render.
  // The StableCKEditor component writes editorInstanceRef.current once
  // on ready, and we read it at submit time.
  const editorInstanceRef = useRef(null);

  const requestAiEdit = async action => {
    let target;
    try {
      target = captureEditorEditTarget(editorInstanceRef.current);
      if (!htmlToPlainText(target.content)) {
        toast.info(target.scope === 'selection'
          ? 'Select some text before using AI Edit.'
          : 'Add some editor content before using AI Edit.');
        return;
      }
    } catch (error) {
      toast.error(error.message || 'The editor is not ready yet.');
      return;
    }

    setAiEditLoading(true);
    try {
      const response = await editFormTemplateWithAi({
        action,
        scope: target.scope,
        content: target.content,
        form_id: isEdit ? Number(id) : null,
      });
      const result = response?.data ?? response;
      setAiEditPreview({
        ...target,
        originalHtml: target.content,
        editedHtml: result.edited_html,
        summary: result.summary || 'Content updated',
        model: result.model || 'OpenAI',
      });
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'AI editing failed. Please try again.');
    } finally {
      setAiEditLoading(false);
    }
  };

  const applyAiEdit = async () => {
    if (!aiEditPreview) return;
    setAiEditApplying(true);
    try {
      const editor = editorInstanceRef.current;
      applyEditorEdit(editor, aiEditPreview);
      const updatedContent = editor.getData();
      setForm(previous => ({ ...previous, form_content: updatedContent }));
      setAiEditPreview(null);
      toast.success('AI suggestion applied. Review the document before saving.');

      try {
        const validationResponse = await validateFormTemplateShortcodes(updatedContent);
        const validation = validationResponse?.data ?? validationResponse;
        setShortcodeValidation(validation);
        if (Number(validation?.blocking_fields) > 0) {
          toast.warning('The edit was applied, but the template still has shortcode validation errors.');
        }
      } catch (error) {
        toast.warning('The edit was applied, but shortcode validation could not be completed.');
      }
    } catch (error) {
      toast.error(error.message || 'The suggestion could not be applied. Run AI Edit again.');
    } finally {
      setAiEditApplying(false);
    }
  };

  // Record-bound popup fields the editor can reference via {{key##shortcode}}.
  const scopedPopupFields = useMemo(
    () => scopedPopupFieldList(form.popup_fields),
    [form.popup_fields],
  );

  document.title = `${isEdit ? 'Edit' : 'Add'} Form | ASR CSS`;

  const loadVersions = useCallback(async () => {
    if (!isEdit) return;
    setVersionsLoading(true);
    try {
      const response = await getFormTemplateVersions(id);
      const rows = response?.data?.data ?? response?.data ?? response;
      setVersions(Array.isArray(rows) ? rows : []);
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to load template versions');
    } finally {
      setVersionsLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    let isMounted = true;

    loadPopupSourceFilters()
      .then(filters => {
        if (isMounted) {
          setOfficialRoleOptions(filters.OFFICIAL_RECORDS.primary.options.map(option => ({
            id: option.value,
            label: option.label,
          })));
          setPopupSourceFilters(Object.fromEntries(
            Object.entries(filters).map(([source, config]) => [source, {
              primary: { ...config.primary, options: [...config.primary.options] },
              ...(config.secondary
                ? { secondary: { ...config.secondary, options: [...config.secondary.options] } }
                : {}),
              ...(config.third
                ? { third: { ...config.third, options: [...config.third.options] } }
                : {}),
            }])
          ));
        }
      })
      .catch(() => {
        if (isMounted) toast.error('Failed to load source filters');
      });

    return () => { isMounted = false; };
  }, []);

  const createDraftVersion = async () => {
    setVersionAction(true);
    try {
      const response = await createFormTemplateVersion(id);
      const result = response?.data ?? response;
      toast.success(`Draft version ${result?.version_number || ''} created from the saved form.`);
      await loadVersions();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to create draft version');
    } finally {
      setVersionAction(false);
    }
  };

  const publishVersion = async version => {
    if (!window.confirm(`Publish template version ${version.version_number}?`)) return;
    setVersionAction(true);
    try {
      await publishFormTemplateVersion(version.template_version_id);
      toast.success(`Template version ${version.version_number} published.`);
      await loadVersions();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to publish template version');
    } finally {
      setVersionAction(false);
    }
  };


  /* ── Load categories ── */
  useEffect(() => {
    (async () => {
      setCatLoading(true);
      try {
        const res  = await getTemplateCategoryList({ page: 1, limit: 500 });
        const list = res?.data?.data ?? res?.data ?? res;
        setCatList(Array.isArray(list) ? list.map(i => ({ id: i.tc_id, label: i.tc_name })) : []);
      } catch { toast.error('Failed to load categories'); }
      finally  { setCatLoading(false); }
    })();
  }, []);

  /* ── Load users ── */
  useEffect(() => {
    (async () => {
      setUserLoading(true);
      try {
        const res  = await getUserList({ page: 1, limit: 500 });
        const list = res?.data?.data ?? res?.data ?? res;
        setUserList(Array.isArray(list) ? list.map(i => ({ id: i.user_id, label: i.user_name })) : []);
      } catch { toast.error('Failed to load users'); }
      finally  { setUserLoading(false); }
    })();
  }, []);

  /* ── Load form for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res  = await getFormTemplate(id);
        const data = res?.data ?? res;
        setForm(prev => ({
          ...prev,
          ...data,
          category_id: Array.isArray(data.category_id)
            ? data.category_id
            : data.category_id ? String(data.category_id).split(',').map(Number) : [],
          assigned_user_id: Array.isArray(data.assigned_user_id)
            ? data.assigned_user_id
            : data.assigned_user_id ? String(data.assigned_user_id).split(',').map(Number) : [],
          // Re-run child sync on load too, not just on edit — heals templates
          // saved before a Shareholder-Level-Shares child auto-filled its own
          // `depends_on` (older rows were saved with it empty).
          popup_fields: Array.isArray(data.popup_fields) ? data.popup_fields.map(syncSectionChildren) : [],
          manual_doc:  data.documents?.find(d => d.sub_module_name === 'manual_form') || null,
          manual_file: null,
        }));
      } catch {
        toast.error('Failed to load form');
        navigate('/form-builder/form-template');
      } finally { setLoading(false); }
    })();
  }, [id, isEdit]);

  /* ── Generic setter ── */
  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const setFormName = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, form_name: val }));
    if (errors.form_name) setErrors(prev => ({ ...prev, form_name: '' }));
  };

  /* ── Popup section helpers ── */
  const createPopupRow = () => ({
    _rid:                    Math.floor(10000000 + Math.random() * 90000000),
    pop_up_field_id:         '',
    form_pop_up_field_slug:  '',
    field_name:              '',
    pop_up_field_type:       '1',
    pop_up_temp_param:       '0',
    pop_up_field_label_name: '',
    control_type:            'SELECT',
    // No default source — MANUAL is no longer offered in the picker, so a new
    // row starts genuinely unselected ("Select Data From") rather than
    // silently defaulting to a data source the author can't see chosen.
    value_source:            '',
    required:                false,
    multiple:                false,
    depends_on:              [],
    transaction_types:       [],
    official_roles:          [],
    official_statuses:       [],
    source_filter_1:         'all',
    source_filter_2:         'all',
    source_filter_3:         'all',
    source_filter_4:         'all',
    option_label_fields:     [],
    child_of:                '',
  });

  const addSection = () =>
    setForm(prev => ({
      ...prev,
      popup_fields: [
        ...prev.popup_fields,
        { _id: Date.now(), section_name: '', rows: [createPopupRow()] },
      ],
    }));

  const removeSection = (sid) =>
    setForm(prev => ({ ...prev, popup_fields: prev.popup_fields.filter(s => s._id !== sid) }));

  const updateSectionName = (sid, val) =>
    setForm(prev => ({ ...prev, popup_fields: prev.popup_fields.map(s => s._id === sid ? { ...s, section_name: val } : s) }));

  const addRow = (sid) =>
    setForm(prev => ({
      ...prev,
      popup_fields: prev.popup_fields.map(s =>
        s._id === sid ? { ...s, rows: [...s.rows, createPopupRow()] } : s
      ),
    }));

  // Add a child row that inherits only the parent's data source; its filters
  // start at the defaults for the author to narrow. The parent is given a
  // stable field key first so {{childKey##…}} and `child_of` have something
  // durable to point at.
  const addChildRow = (sid, parentRid) =>
    setForm(prev => ({
      ...prev,
      popup_fields: prev.popup_fields.map(s => {
        if (s._id !== sid) return s;
        const parent = s.rows.find(r => r._rid === parentRid);
        if (!parent || parent.child_of) return s;
        const parentKey = rowKey(parent);
        const rows = s.rows.map(r => r._rid === parentRid
          ? { ...r, form_pop_up_field_slug: parentKey } : r);
        const child = { ...createPopupRow(), child_of: parentKey, control_type: 'SELECT' };
        for (const key of CHILD_INHERITED_KEYS) child[key] = parent[key];
        // Sit the new child after the parent and any existing siblings.
        let idx = rows.findIndex(r => r._rid === parentRid);
        while (idx + 1 < rows.length && rows[idx + 1].child_of === parentKey) idx += 1;
        rows.splice(idx + 1, 0, child);
        return { ...s, rows };
      }),
    }));

  const removeRow = (sid, rid) =>
    setForm(prev => ({ ...prev, popup_fields: prev.popup_fields.map(s => {
      if (s._id !== sid) return s;
      const target = s.rows.find(r => r._rid === rid);
      const targetKey = target && !target.child_of ? rowKey(target) : null;
      return { ...s, rows: s.rows.filter(r =>
        r._rid !== rid && !(targetKey && r.child_of === targetKey)) };
    }) }));

  const updateRowCell = (sid, rid, key, val) =>
    setForm(prev => ({
      ...prev,
      popup_fields: prev.popup_fields.map(s => {
        if (s._id !== sid) return s;
        const before = s.rows.find(r => r._rid === rid);
        let rows = s.rows.map(r => r._rid === rid ? { ...r, [key]: val } : r);
        // Renaming a parent's key must carry its children along.
        if (key === 'form_pop_up_field_slug' && before && !before.child_of) {
          const oldKey = rowKey(before);
          const newKey = rowKey(rows.find(r => r._rid === rid));
          if (oldKey && oldKey !== newKey) {
            rows = rows.map(r => r.child_of === oldKey ? { ...r, child_of: newKey } : r);
          }
        }
        return syncSectionChildren({ ...s, rows });
      }),
    }));

  const updateRowSource = (sid, rid, valueSource) =>
    setForm(prev => ({
      ...prev,
      popup_fields: prev.popup_fields.map(section =>
        section._id !== sid ? section : syncSectionChildren({
          ...section,
          rows: section.rows.map(row => row._rid !== rid ? row : {
            ...row,
            value_source: valueSource,
            // A date-source field is always a date control, defaulting to today.
            control_type: valueSource === 'DATES' ? 'DATE' : row.control_type,
            pop_up_temp_param: '0',
            source_filter_1: valueSource === 'DATES'
              ? 'today'
              : valueSource === 'SHAREHOLDERS' ? 'shareholders' : 'all',
            source_filter_2: 'all',
            source_filter_3: 'all',
            source_filter_4: 'all',
            option_label_fields: [],
            official_roles: [],
            official_statuses: [],
          }),
        })
      ),
    }));

  /* ── Manual file helpers ── */
  const handleManualDeleteConfirm = async () => {
    if (!form.manual_doc?.doc_id) return;
    setManualDeleteLoading(true);
    try {
      await deleteDocumentStore(form.manual_doc.doc_id);
      setForm(prev => ({ ...prev, manual_doc: null, manual_file: null }));
      toast.success('Manual form file deleted successfully');
      setManualDeleteModal(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete file');
    } finally {
      setManualDeleteLoading(false);
    }
  };

  /* ── Validate ── */
  const validate = () => {
    const errs = {};
    if (form.category_id.length === 0)   errs.category_id = 'Category is required';
    if (!form.form_name.trim())  errs.form_name       = 'Form name is required';
    if (!form.country_code)      errs.country_code    = 'Template country is required';
    if (!form.default_library)   errs.default_library = 'Default library is required';
    if (!form.status)   errs.status = 'Status is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (type = 'save') => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user    = getLoggedinUser();
      const portName   = user?.portName ?? null;

      // Read content from the stable CKEditor instance ref
      const content = editorInstanceRef.current
        ? editorInstanceRef.current.getData()
        : form.form_content;

      const fd = new FormData();

      const scalarPayload = {
        category_id:      form.category_id,
        assigned_user_id: form.assigned_user_id,
        form_name:        form.form_name,
        download_name:     form. download_name,
        orientation:      form.orientation,
        margin_top:       form.margin_top,
        margin_right:     form.margin_right,
        margin_bottom:    form.margin_bottom,
        margin_left:      form.margin_left,
        header_margin:    form.header_margin,
        footer_margin:    form.footer_margin,
        country_code:     form.country_code,
        default_library:  form.default_library,
        status:           form.status,
        form_type:        form.form_type,
        make_esign_copy:  form.make_esign_copy ? 'make_esign_copy' : '',
        pdpa_required:    form.pdpa_required ? '1' : '0',
        form_content:     content,
        save_type:        type,
        port_name    :  portName,
        updated_by:       user?.user_id || user?.id || null,
        popup_fields:     JSON.stringify(
          form.popup_fields.map(s => ({
            section_name: s.section_name,
            rows: s.rows.map(r => ({
              pop_up_field_id:         r.pop_up_field_id,
              pop_up_field_type:        r.pop_up_field_type,
              pop_up_temp_param:       r.pop_up_temp_param,
              pop_up_field_label_name: r.pop_up_field_label_name,
             form_pop_up_field_slug:   r.form_pop_up_field_slug,
              control_type:            r.control_type || '',
              value_source:            r.value_source || '',
              required:                r.required === true,
              multiple:                r.multiple === true,
              depends_on:              Array.isArray(r.depends_on) ? r.depends_on : [],
              transaction_types:       Array.isArray(r.transaction_types) ? r.transaction_types : [],
              official_roles:          Array.isArray(r.official_roles) ? r.official_roles : [],
              official_statuses:       Array.isArray(r.official_statuses) ? r.official_statuses : [],
              source_filter_1:         r.source_filter_1 || 'all',
              source_filter_2:         r.source_filter_2 || 'all',
              source_filter_3:         r.source_filter_3 || 'all',
              source_filter_4:         r.source_filter_4 || 'all',
              option_label_fields:     Array.isArray(r.option_label_fields) ? r.option_label_fields : [],
              child_of:                r.child_of || '',
            })),
          }))
        ),
      };

      Object.entries(scalarPayload).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach(v => fd.append(`${key}[]`, v));
        } else {
          fd.append(key, val ?? '');
        }
      });

      if (form.form_type === '2' && form.manual_file) {
        fd.append('manual_form_file', form.manual_file, form.manual_file.name);
      }

      if (isEdit) await updateFormTemplate(id, fd);
      else        await createFormTemplate(fd);

      await new Promise(r => setTimeout(r, 800));

      if (isEdit) {
        if (type === 'save_as')             toast.success(`"${form.form_name}" saved as new copy.`);
        else if (type === 'duplicate_form') toast.success(`"${form.form_name}" duplicated.`);
        else                                toast.success(`"${form.form_name}" updated successfully.`);
      } else {
        toast.success(`"${form.form_name}" created successfully.`);
      }

      navigate('/form-builder/form-template');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : `Failed to ${isEdit ? 'update' : 'save'} form.`);
    } finally { setSubmitting(false); }
  };

  const isManual = form.form_type === '2';

  /* ── Render ── */
  if (loading) return (
    <div className="page-content d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <Spinner color="primary" />
    </div>
  );

  return (
    <div className="page-content">
      <style>{CSS}</style>
      <Container fluid>
        <BreadCrumb title={isEdit ? 'Edit Form' : 'Add Form'} pageTitle="Form Builder" />
        <Row>
          <Col lg={12}>
            <Card className="overflow-hidden">
              <CardBody>

                {/* ══ 1. BASIC INFORMATION ════════════════════════════ */}
                <div className="fb-section">
                  <div className="fb-section-hdr">
                    <div className="fb-section-icon"><i className="ri-information-line" /></div>
                    <p className="fb-section-title">Basic Information</p>
                    <Link to="/form-builder/form-template" className="ms-auto btn btn-warning btn-sm d-flex align-items-center gap-1">
                      <i className="ri-list-unordered"></i> All Forms
                    </Link>
                  </div>

                  <div className="fb-section-body">
                    <Row className="g-3">
                      <Col md={6}>
                        <Label className="form-label fs-12 fw-semibold">
                          Category Name <span className="text-danger">*</span>
                        </Label>
                          <MultiSelect
                            items={catList}
                            selected={form.category_id}
                            onChange={ids => {
                              setForm(prev => ({ ...prev, category_id: ids }));
                              if (errors.category_id) setErrors(prev => ({ ...prev, category_id: '' }));  // ← clear on change
                            }}
                            placeholder="Select categories…"
                            loading={catLoading}
                            hasError={!!errors.category_id}   // ← pass error state for red border
                          />
                          {form.category_id.length > 0 && (
                            <div style={{ fontSize: 11, color: '#878a99', marginTop: 4 }}>
                              {form.category_id.length} categor{form.category_id.length !== 1 ? 'ies' : 'y'} selected
                            </div>
                          )}
                          {errors.category_id && (
                            <div style={{ fontSize: 11, color: 'var(--vz-form-invalid-color)', marginTop: 4 }}>   {/* ← plain div, always visible */}
                              {errors.category_id}
                            </div>
                          )}
                      </Col>
                      <Col md={6}>
                        <Label className="form-label fs-12 fw-semibold">Assigned to User</Label>
                        <MultiSelect
                          items={userList}
                          selected={form.assigned_user_id}
                          onChange={ids => setForm(prev => ({ ...prev, assigned_user_id: ids }))}
                          placeholder="Select users…"
                          loading={userLoading}
                        />
                      </Col>
                      <Col md={6}>
                        <Label className="form-label fs-12 fw-semibold">
                          Form Name <span className="text-danger">*</span>
                        </Label>
                        <Input bsSize="sm" placeholder="e.g. Annual Return Form"
                          value={form.form_name} onChange={setFormName} invalid={!!errors.form_name} />
                        <FormFeedback>{errors.form_name}</FormFeedback>
                      </Col>
                      <Col md={6}>
                        <Label className="form-label fs-12 fw-semibold">Download Name</Label>
                        <Input bsSize="sm" placeholder="e.g. Annual_Return_2025"
                          value={form.download_name || ''} onChange={set('download_name')} />
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* ══ 2. DOCUMENT CONFIGURATION ═══════════════════════ */}
                <div className="fb-section">
                  <div className="fb-section-hdr">
                    <div className="fb-section-icon"><i className="ri-settings-4-line" /></div>
                    <p className="fb-section-title">Document Configuration</p>
                  </div>
                  <div className="fb-section-body">
                    <Row className="g-3">
                      <Col md={12}>
                        <Label className="form-label fs-12 fw-semibold">Orientation</Label>
                        <div className="orient-group">
                          {['Portrait', 'Landscape'].map(o => (
                            <label key={o} className="orient-opt">
                              <input type="radio" name="orientation" value={o}
                                checked={form.orientation === o} onChange={set('orientation')} />
                              {o}
                            </label>
                          ))}
                        </div>
                      </Col>
                      <Col md={8}>
                        <Label className="form-label fs-12 fw-semibold">
                          Page Margin <span style={{ fontWeight: 400 }}>(Top / Right / Bottom / Left in <span className="text-danger">Centimeter</span>)</span>
                        </Label>
                        <div className="margin-grid">
                          {[['margin_top','Top'],['margin_right','Right'],['margin_bottom','Bottom'],['margin_left','Left']].map(([k, sub]) => (
                            <div key={k}>
                              <Input type="number" bsSize="sm" step="0.01" style={{ textAlign: 'center' }} value={form[k]} onChange={set(k)} />
                              <div className="margin-sub">{sub}</div>
                            </div>
                          ))}
                        </div>
                      </Col>
                      <Col md={4}>
                        <Label className="form-label fs-12 fw-semibold">
                          Header &amp; Footer Margin <span style={{ fontWeight: 400 }}>(in <span className="text-danger">Centimeter</span>)</span>
                        </Label>
                        <div className="margin-grid-hf">
                          {[['header_margin','Header'],['footer_margin','Footer']].map(([k, sub]) => (
                            <div key={k}>
                              <Input type="number" bsSize="sm" step="0.01" style={{ textAlign: 'center' }} value={form[k]} onChange={set(k)} />
                              <div className="margin-sub">{sub}</div>
                            </div>
                          ))}
                        </div>
                      </Col>
                      <Col md={3}>
                        <Label className="form-label fs-12 fw-semibold">Template Country <span className="text-danger">*</span></Label>
                        <Input type="select" bsSize="sm" value={form.country_code}
                          invalid={!!errors.country_code} onChange={set('country_code')}>
                          <option value="">Select</option>
                          <option value="SG">SG</option>
                          <option value="MY">MY</option>
                          <option value="IN">IN</option>
                        </Input>
                        {errors.country_code && <FormFeedback>{errors.country_code}</FormFeedback>}
                      </Col>
                      <Col md={3}>
                        <Label className="form-label fs-12 fw-semibold">Default Library <span className="text-danger">*</span></Label>
                        <Input type="select" bsSize="sm" value={form.default_library}
                          invalid={!!errors.default_library} onChange={set('default_library')}>
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </Input>
                        {errors.default_library && <FormFeedback>{errors.default_library}</FormFeedback>}
                      </Col>
                      <Col md={3}>
                        <Label className="form-label fs-12 fw-semibold">Status <span className="text-danger">*</span></Label>
                        <Input type="select" bsSize="sm" value={form.status}
                          invalid={!!errors.status} onChange={set('status')}>
                          <option value="">Select</option>
                          <option value={true} >Active</option>
                          <option value={false} >Inactive</option>
                        </Input>
                        {errors.status && <FormFeedback>{errors.status}</FormFeedback>}
                      </Col>
                    </Row>
                  </div>
                </div>

                {/* ══ 3. FORM TYPE ════════════════════════════════════ */}
                <div className="fb-section">
                  <div className="fb-section-hdr">
                    <div className="fb-section-icon"><i className="ri-git-branch-line" /></div>
                    <p className="fb-section-title">Form Type</p>
                  </div>
                  <div className="fb-section-body">
                    <div className="formtype-bar">
                      {[{ value: '0', label: 'Form-Builder' },{ value: '1', label: 'Esign' },{ value: '2', label: 'Manual' }].map(t => (
                        <label key={t.value} className={`formtype-pill ${form.form_type === t.value ? 'active' : ''}`}>
                          <input type="radio" name="form_type" value={t.value}
                            checked={form.form_type === t.value} onChange={set('form_type')} />
                          {t.label}
                        </label>
                      ))}
                      <div className="formtype-sep" />
                      <label className="formtype-chk">
                        <input type="checkbox" checked={form.make_esign_copy} onChange={set('make_esign_copy')}
                          disabled={form.form_type !== '0'} />
                        Make a E-sign Copy
                      </label>
                      <label className="formtype-chk">
                        <input type="checkbox" checked={form.pdpa_required} onChange={set('pdpa_required')} />
                        Make a PDPA Form
                      </label>
                    </div>
                  </div>
                </div>

                {/* ══ 4. MANUAL FORM FILE UPLOAD (Manual type only) ══ */}
                {isManual && (
                  <div className="fb-section">
                    <div className="fb-section-hdr">
                      <div className="fb-section-icon"><i className="ri-file-upload-line" /></div>
                      <p className="fb-section-title">Manual Form File</p>
                      <span style={{ fontSize: 11, color: '#878a99', marginLeft: 8 }}>
                        Upload the source document for this manual form
                      </span>
                    </div>
                    <div className="fb-section-body">
                      <div className="mfu-grid">
                        <ManualFileUploadCard
                          file={form.manual_file}
                          savedDoc={form.manual_doc}
                          onChange={(file) => setForm(prev => ({ ...prev, manual_file: file }))}
                          onDeleteRequest={() => setManualDeleteModal(true)}
                        />
                      </div>
                      <p className="mb-0 mt-3" style={{ fontSize: 11, color: 'var(--vz-secondary-color,#878a99)' }}>
                        <i className="ri-information-line me-1" />
                        Accepted: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — max 100 MB.
                      </p>
                    </div>
                  </div>
                )}

                {/* ══ 5. FORM CONTENT — always visible ════════════════
                     The StableCKEditor mounts once and never unmounts.
                     Changing form_type only shows/hides the Manual File
                     section above; the editor itself is never touched.
                ════════════════════════════════════════════════════════ */}
                {!isManual && (
                <div className="fb-section">
                  <div className="fb-section-hdr">
                    <div className="fb-section-icon"><i className="ri-edit-box-line" /></div>
                    <p className="fb-section-title">Form Content</p>
                    <div className="ms-3">
                      <InsertFieldButton editorRef={editorInstanceRef} popupFields={scopedPopupFields} />
                    </div>
                    <div>
                      <AiEditButton
                        editorRef={editorInstanceRef}
                        busy={aiEditLoading}
                        onAction={requestAiEdit}
                      />
                    </div>
                    <a href="#"
                      target="_blank" rel="noopener noreferrer" className="ms-auto"
                      style={{ fontSize: 12, color: '#405189', textDecoration: 'underline', whiteSpace: 'nowrap' }}>
                      <i className="ri-download-line me-1" />Template Model (.docx)
                    </a>
                  </div>
                  <div className="ctx-hint-bar">
                    <i className="ri-mouse-line text-primary" />
                    <span>
                      <strong style={{ color: '#405189' }}>Right-click</strong> inside the editor to insert merge fields, or use the{' '}
                      <strong style={{ color: '#405189' }}>Insert Field ▾</strong> button above.
                      Fields insert as <code>{'{{slug}}'}</code> tokens. To bind a value to one
                      specific pop-up field (e.g. three different directors), switch to that
                      field&apos;s <strong style={{ color: '#405189' }}>tab</strong> at the top of the picker,
                      then choose a shortcode — it inserts <code>{'{{field_key##shortcode}}'}</code>.
                      For a field that can hold several records (officials, events, shares), that
                      tab also shows an <strong style={{ color: '#405189' }}>Insert repeat loop</strong>{' '}
                      button — it builds the whole <code>{'{{#field_key##…}}…{{/field_key##…}}'}</code> block
                      for you, and any field you pick from the same tab afterwards fills in per row.
                    </span>
                  </div>
                  <div className="fb-section-body p-0 ck-host" style={{ padding: 0 }}>
                    <StableCKEditor
                      editorInstanceRef={editorInstanceRef}
                      initialContent={form.form_content}
                      popupFields={scopedPopupFields}
                    />
                  </div>
                </div>
                )}


                {/* ══ 6. POP-UP SECTIONS — always visible ═════════════ */}
                {false && isEdit && (
                  <div className="fb-section">
                    <div className="fb-section-hdr">
                      <div className="fb-section-icon"><i className="ri-git-branch-line" /></div>
                      <p className="fb-section-title">Template Versions</p>
                      <Button color="primary" size="sm" className="ms-auto d-flex align-items-center gap-1"
                        disabled={versionAction || versionsLoading} onClick={createDraftVersion}>
                        {versionAction ? <Spinner size="sm" /> : <i className="ri-file-add-line" />}
                        Create Draft from Saved Form
                      </Button>
                    </div>
                    <div className="ctx-hint-bar">
                      <i className="ri-information-line text-primary" />
                      <span>Save editor changes first. Draft creation snapshots the form currently stored in this tenant database.</span>
                    </div>
                    <div className="fb-section-body p-0">
                      {versionsLoading ? (
                        <div className="text-center py-4"><Spinner size="sm" /></div>
                      ) : versions.length === 0 ? (
                        <div className="text-center py-4 text-muted">No immutable template versions created yet.</div>
                      ) : (
                        <Table responsive hover className="mb-0 align-middle">
                          <thead><tr><th>Version</th><th>Status</th><th>Shortcodes</th><th>Snapshot hash</th><th>Published</th><th></th></tr></thead>
                          <tbody>{versions.map(version => {
                            const fields = Array.isArray(version.fields) ? version.fields : [];
                            const invalid = fields.filter(field => field.validation_status !== 'VALID').length;
                            return (
                              <tr key={version.template_version_id}>
                                <td>v{version.version_number}</td>
                                <td><Badge color={version.lifecycle_status === 'PUBLISHED' ? 'success' : version.lifecycle_status === 'DRAFT' ? 'warning' : 'secondary'}>{version.lifecycle_status}</Badge></td>
                                <td><span className="text-success">{fields.length - invalid} matched</span>{invalid > 0 && <span className="text-muted"> / {invalid} left unchanged</span>}</td>
                                <td><code title={version.content_hash}>{String(version.content_hash || '').slice(0, 12)}…</code></td>
                                <td>{version.published_at ? new Date(version.published_at).toLocaleString() : '—'}</td>
                                <td className="text-end">
                                  {version.lifecycle_status === 'DRAFT' && (
                                    <Button color="success" size="sm" disabled={versionAction} onClick={() => publishVersion(version)}>
                                      <i className="ri-upload-cloud-line me-1" />Publish
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}</tbody>
                        </Table>
                      )}
                    </div>
                  </div>
                )}

                <div className="fb-section">
                  <div className="fb-section-hdr">
                    <div className="fb-section-icon"><i className="ri-table-line" /></div>
                    <p className="fb-section-title">Pop-up Sections</p>
                    <Button color="success" size="sm" className="ms-auto d-flex align-items-center gap-1" onClick={addSection}>
                      <i className="ri-add-line" /> Add Pop-up Section
                    </Button>
                  </div>
                  <div className="fb-section-body">
                    {form.popup_fields.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="ri-table-line d-block fs-2 mb-2" />
                        <div style={{ fontSize: 13 }}>No pop-up sections added yet.</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Click <strong>Add Pop-up Section</strong> to begin.</div>
                      </div>
                    ) : (
                      form.popup_fields.map((section, si) => (
                        <div key={section._id} className="ps-card">
                          <div className="ps-card-hdr">
                            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(64,81,137,.1)',
                              color: '#405189', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, flexShrink: 0 }}>{si + 1}</div>
                            <input
                              placeholder="Enter Popup Section Name" value={section.section_name}
                              onChange={e => updateSectionName(section._id, e.target.value)}
                              style={{ flex: 1, border: '1px solid transparent', background: 'transparent',
                                fontSize: 13, fontWeight: 600, outline: 'none', padding: '2px 6px', borderRadius: 4 }}
                              onFocus={e => { e.target.style.borderColor = 'var(--vz-border-color)'; e.target.style.background = 'var(--vz-card-bg,#fff)'; }}
                              onBlur={e  => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent'; }}
                            />
                            <Button color="primary" size="sm" outline
                              className="d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: 11 }}
                              onClick={() => addRow(section._id)}>
                              <i className="ri-add-line" /> Add Field
                            </Button>
                            <button type="button" className="btn-close ms-2" style={{ fontSize: 10 }}
                              onClick={() => removeSection(section._id)} />
                          </div>
                          <div className="ps-thead">
                            <div>#</div>
                            <div>Label Name / Dynamic Label</div>
                            <div>Data source</div>
                            <div>Control</div>
                            <div>Source filters</div>
                            <div>Legacy param</div>
                            <div style={{ textAlign: 'center' }}>Action</div>
                          </div>
                          {section.rows.map((row, ri) => {
                            const isChild = !!row.child_of;
                            const sourceLabel = (POPUP_VALUE_SOURCES.find(s => s.value === row.value_source) || {}).label || row.value_source || '—';
                            return (
                            <div key={row._rid} className={`ps-row${isChild ? ' ps-row-child' : ''}`}>
                              <div className="ps-num">
                                {isChild
                                  ? <i className="ri-corner-down-right-line" style={{ fontSize: 13, color: '#405189' }} />
                                  : section.rows.slice(0, ri + 1).filter(r => !r.child_of).length}
                              </div>
                              <div>
                                <input className="ps-inp" placeholder={isChild ? 'Child label' : 'Label name'}
                                  value={row.pop_up_field_label_name}
                                  onChange={e => updateRowCell(section._id, row._rid, 'pop_up_field_label_name', e.target.value)}
                                  onBlur={() => {
                                    if (!(row.form_pop_up_field_slug || '').trim() && row.pop_up_field_label_name.trim()) {
                                      updateRowCell(section._id, row._rid, 'form_pop_up_field_slug', slugifyKey(row.pop_up_field_label_name));
                                    }
                                  }} />
                                <input type="hidden" value={row.form_pop_up_field_slug || ''} readOnly />
                                {OPTION_LABEL_FIELDS_BY_SOURCE[row.value_source] && (
                                  // Dynamic option-label builder replaces the visible field-key
                                  // input. The generated field key remains stored as hidden data.
                                  <div style={{ minWidth: 0, marginTop: 4 }}>
                                    <MultiSelect
                                      items={OPTION_LABEL_FIELDS_BY_SOURCE[row.value_source]
                                        .map(option => ({ id: option.value, label: option.label }))}
                                      selected={row.option_label_fields || []}
                                      onChange={fields => updateRowCell(section._id, row._rid, 'option_label_fields', fields)}
                                      placeholder="Default label"
                                    />
                                  </div>
                                )}
                                {isChild && (
                                  <div style={{ fontSize: 10, color: '#405189', marginTop: 3 }}>
                                    <i className="ri-links-line" /> child of <strong>{row.child_of}</strong>
                                  </div>
                                )}
                                {SCOPED_SOURCE_PREFIX[row.value_source] && (row.form_pop_up_field_slug || '').trim() && (
                                  <div style={{ fontSize: 10, color: '#878a99', marginTop: 3, wordBreak: 'break-all' }}>
                                    {`{{${row.form_pop_up_field_slug.trim()}##${SCOPED_SOURCE_PREFIX[row.value_source]}…}}`}
                                  </div>
                                )}
                              </div>
                              <div>
                                {isChild
                                  ? <div className="ps-inherit" title="Inherited from the parent field">{sourceLabel}</div>
                                  : <select className="ps-sel" value={row.value_source || ''}
                                      onChange={e => updateRowSource(section._id, row._rid, e.target.value)}>
                                      <option value="">Select Data From</option>
                                      {POPUP_VALUE_SOURCES.map(source => (
                                        <option key={source.value} value={source.value}>{source.label}</option>
                                      ))}
                                    </select>}
                              </div>
                              <div>
                                <select className="ps-sel" value={row.control_type || ''}
                                  onChange={e => updateRowCell(section._id, row._rid, 'control_type', e.target.value)}>
                                  <option value="">Select type</option>
                                  {MODERN_CONTROL_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                {row.value_source === 'DATES' ? (
                                  // Blank / Today's Date — nothing to filter, nothing to depend on.
                                  <span style={{ fontSize: 11, color: '#878a99' }}>No filters</span>
                                ) : row.value_source === 'SHARE_TRANSACTIONS' ? <select className="ps-sel" multiple size="2"
                                  value={row.transaction_types || []}
                                  onChange={e => updateRowCell(section._id, row._rid, 'transaction_types',
                                    Array.from(e.target.selectedOptions).map(option => option.value))}>
                                  {SHARE_TRANSACTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select> : row.value_source === 'OFFICIAL_RECORDS' ? <div className="d-flex gap-1">
                                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    <MultiSelect
                                      items={officialRoleOptions}
                                      selected={row.official_roles || []}
                                      onChange={roles => updateRowCell(section._id, row._rid, 'official_roles', roles)}
                                      placeholder="Select roles…"
                                    />
                                  </div>
                                  <select className="ps-sel flex-shrink-0" style={{ width: 105 }} value={(row.official_statuses || []).join(',')}
                                    onChange={e => updateRowCell(section._id, row._rid, 'official_statuses', commaValues(e.target.value))}>
                                    <option value="">All</option><option value="CURRENT">Current</option>
                                    <option value="CEASED">Ceased</option><option value="CURRENT,CEASED">Both</option>
                                  </select>
                                </div> : popupSourceFilters[row.value_source] ? <div className={row.value_source === 'COMPLAINANT'
                                  ? 'd-flex gap-1 flex-column'
                                  : 'ps-filter-grid'}>
                                  {row.value_source === 'COMPLAINANT' ? (
                                    // Multiple events → records from any of the chosen events.
                                    // Stored comma-joined in source_filter_1; empty ⇒ all events.
                                    // Stacked above the status select so each gets the full column width.
                                    <div style={{ minWidth: 0 }}>
                                      <MultiSelect
                                        items={popupSourceFilters[row.value_source].primary.options
                                          .filter(option => option.value !== 'all')
                                          .map(option => ({ id: option.value, label: option.label }))}
                                        selected={commaValues(row.source_filter_1).filter(value => value && value !== 'all')}
                                        onChange={slugs => updateRowCell(section._id, row._rid, 'source_filter_1',
                                          slugs.length ? slugs.join(',') : 'all')}
                                        placeholder={`All ${popupSourceFilters[row.value_source].primary.label.toLowerCase()}s`}
                                      />
                                    </div>
                                  ) : row.value_source === 'SHAREHOLDERS' ? (
                                    // Role is always "shareholders" for this source — the
                                    // backend forces it, so the Role picker is hidden.
                                    null
                                  ) : (
                                  <select className="ps-sel" value={row.source_filter_1 || 'all'}
                                    title={popupSourceFilters[row.value_source].primary.label}
                                    onChange={e => updateRowCell(section._id, row._rid, 'source_filter_1', e.target.value)}>
                                    {popupSourceFilters[row.value_source].primary.options.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  )}
                                  {popupSourceFilters[row.value_source].secondary ? (
                                  <select className="ps-sel" value={row.source_filter_2 || 'all'}
                                    title={popupSourceFilters[row.value_source].secondary.label}
                                    onChange={e => updateRowCell(section._id, row._rid, 'source_filter_2', e.target.value)}>
                                    {popupSourceFilters[row.value_source].secondary.options.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  ) : null}
                                  {popupSourceFilters[row.value_source].third ? (
                                  <select className="ps-sel" value={row.source_filter_3 || 'all'}
                                    title={popupSourceFilters[row.value_source].third.label}
                                    onChange={e => updateRowCell(section._id, row._rid, 'source_filter_3', e.target.value)}>
                                    {popupSourceFilters[row.value_source].third.options.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                  ) : null}
                                  {row.value_source === 'SHARES'
                                    && row.source_filter_1 === 'SHAREHOLDER_LEVEL_SHARES' && (
                                    <div className="ps-filter-extras">
                                      {/* Which shareholder entity types are allowed. Extra
                                          source-filter controls always start on row two. */}
                                      <div>
                                        <MultiSelect
                                          items={SHAREHOLDER_ENTITY_TYPE_OPTIONS.map(option => ({ id: option.value, label: option.label }))}
                                          selected={commaValues(row.source_filter_4).filter(value => value && value !== 'all')}
                                          onChange={types => updateRowCell(section._id, row._rid, 'source_filter_4',
                                            types.length ? types.join(',') : 'all')}
                                          placeholder="All shareholder types"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div> : <input className="ps-inp" placeholder="Dependencies (comma separated)"
                                  value={(row.depends_on || []).join(', ')}
                                  onChange={e => updateRowCell(section._id, row._rid, 'depends_on', commaValues(e.target.value))} />}
                              </div>
                              <div>
                                <select className="ps-sel" value={row.pop_up_temp_param || '0'}
                                  onChange={e => updateRowCell(section._id, row._rid, 'pop_up_temp_param', e.target.value)}>
                                  {(TEMP_PARAMS_BY_SOURCE[row.value_source] || DEFAULT_TEMP_PARAMS).map(param => (
                                    <option key={param.value} value={param.value}>
                                      {param.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                {!isChild && (
                                  <button type="button" className="btn btn-sm btn-soft-primary" title="Add child row (inherits this field's data source)"
                                    style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => addChildRow(section._id, row._rid)}>
                                    <i className="ri-git-branch-line" />
                                  </button>
                                )}
                                <button type="button" className="btn btn-sm btn-soft-danger"
                                  style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => removeRow(section._id, row._rid)}>
                                  <i className="ri-delete-bin-line" />
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </CardBody>

              {shortcodeValidation && (shortcodeValidation.blocking_fields > 0 || shortcodeValidation.warning_fields > 0) && (
                <div className="px-3">
                  <Alert color={shortcodeValidation.blocking_fields > 0 ? 'danger' : 'warning'}>
                    <div className="fw-semibold mb-1">
                      Shortcode validation: {shortcodeValidation.blocking_fields || 0} error(s), {shortcodeValidation.warning_fields || 0} legacy alias warning(s)
                    </div>
                    {(shortcodeValidation.fields || [])
                      .filter(field => field.validation_status !== 'VALID')
                      .map(field => (
                        <div key={`${field.original_key}-${field.validation_status}`} className="small">
                          <code>{`{{${field.original_key}}}`}</code> — {field.validation_message}
                        </div>
                      ))}
                  </Alert>
                </div>
              )}

              {/* ══ FOOTER ══════════════════════════════════════════════ */}
              <div className="fb-footer">

                <Button color="danger" size="sm" className="d-flex align-items-center gap-1"
                  onClick={() => navigate('/form-builder/form-template')} disabled={submitting}>
                  <i className="ri-close-line" /> Cancel
                </Button>

                <Button color="success" size="sm" className="ms-auto d-flex align-items-center gap-1"
                  disabled={submitting} onClick={() => handleSubmit('save')}>
                  {submitting
                    ? <><Spinner size="sm" />{isEdit ? ' Updating…' : ' Saving…'}</>
                    : <><i className="ri-save-line" />{isEdit ? ' Update' : ' Save'}</>
                  }
                </Button>
                {isEdit && (
                  <Button color="warning" size="sm" className="d-flex align-items-center gap-1"
                    disabled={submitting} onClick={() => handleSubmit('save_as')}>
                    <i className="ri-save-2-line" /> Save As
                  </Button>
                )}
                {isEdit && (
                  <Button color="warning" size="sm" outline className="d-flex align-items-center gap-1"
                    disabled={submitting} onClick={() => handleSubmit('duplicate_form')}>
                    <i className="ri-file-copy-line" /> Duplicate Form
                  </Button>
                )}
                
              </div>

            </Card>
          </Col>
        </Row>
      </Container>

      <AiEditPreviewModal
        preview={aiEditPreview}
        applying={aiEditApplying}
        onApply={applyAiEdit}
        onCancel={() => setAiEditPreview(null)}
      />

      {/* Manual File Delete Confirm Modal */}
      <Modal isOpen={manualDeleteModal} toggle={() => setManualDeleteModal(false)} fade centered modalClassName="zoomIn">
        <ModalBody className="py-3 px-5 position-relative">
          <button type="button" className="btn-close position-absolute top-0 end-0 m-2"
            onClick={() => setManualDeleteModal(false)} aria-label="Close" />
          <div className="mt-2 text-center">
            <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
              colors="primary:#f7b84b,secondary:#f06548" style={{ width: '100px', height: '100px' }} />
            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
              <h4>Are you sure?</h4>
              <p className="text-muted mx-4 mb-0">
                Are you sure you want to permanently delete{' '}
                <strong>{form.manual_doc?.doc_name || 'this file'}</strong>?
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <button type="button" className="btn w-sm btn-light"
              onClick={() => setManualDeleteModal(false)} disabled={manualDeleteLoading}>
              Close
            </button>
            <button type="button" className="btn w-sm btn-danger"
              onClick={handleManualDeleteConfirm} disabled={manualDeleteLoading}>
              {manualDeleteLoading
                ? <><span className="spinner-border spinner-border-sm me-1" role="status" />Deleting…</>
                : 'Yes, Delete It!'}
            </button>
          </div>
        </ModalBody>
      </Modal>

    </div>
  );
};

export default FormBuilderForm;
