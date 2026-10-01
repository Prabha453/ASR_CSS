import React, { useState, useRef, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'reactstrap';

/* ══════════════════════════════════════════════════════════════════
   FilePreviewModal
   — IMAGES ONLY. Other extensions never reach this (no eye icon
     is rendered for them in FileRow), so no PDF/iframe or
     "preview not available" fallback branches are needed here.
   ══════════════════════════════════════════════════════════════════ */
export const FilePreviewModal = ({ isOpen, onClose, file }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) setLoading(true);
  }, [isOpen, file]);

  if (!file) return null;

  const src = file.preview || file.file_path || '';
  const fileName = file.name || file.file_name || 'File';

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      size="lg"
      centered
      scrollable
      style={{ maxWidth: 860 }}
    >
      <ModalHeader toggle={onClose} className="bg-light p-3" style={{ fontSize: 13 }}>
        <div className="d-flex align-items-center gap-2">
          <i className="ri-image-line" style={{ fontSize: 16 }} />
          <span style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName}
          </span>
        </div>
      </ModalHeader>

      <ModalBody style={{ padding: 0, minHeight: 400, position: 'relative', background: '#f8f9fa' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 2,
            background: 'rgba(248,249,250,0.85)',
          }}>
            <Spinner color="primary" />
          </div>
        )}

        {src ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, minHeight: 400 }}>
            <img
              src={src}
              alt={fileName}
              style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: 4 }}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <p style={{ fontSize: 13, color: '#6c757d' }}>No preview available.</p>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="py-2 gap-2">
        <Button type="button" color="light" size="sm" onClick={onClose}>
          Close
        </Button>
        {src && (
          <Button type="button" color="primary" size="sm" onClick={handleDownload}>
            <i className="ri-download-line me-1" />Download
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════
   FileRow
   — single file in the list.
     Eye (preview)  → images only
     Download       → any extension, if src exists
     Delete         → always
   ══════════════════════════════════════════════════════════════════ */
export const FileRow = ({ doc, onView, onDelete }) => {
  const name = doc.name || doc.file_name || '';
  const ext = name.split('.').pop().toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
  const src = doc.preview || doc.file_path || '';

  const iconClass = isPdf ? 'ri-file-pdf-line'
    : isImage ? 'ri-image-line'
      : 'ri-file-line';
  const iconColor = isPdf ? '#f06548'
    : isImage ? '#405189'
      : '#6c757d';

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px', borderRadius: 6,
      border: '1px solid var(--vz-border-color)',
      background: 'var(--vz-light)', marginBottom: 5,
    }}>
      {/* File type icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0,
        background: isPdf ? 'rgba(240,101,72,.1)' : isImage ? 'rgba(64,81,137,.1)' : 'rgba(173,181,189,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className={iconClass} style={{ fontSize: 16, color: iconColor }} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: 'var(--vz-body-color)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name || 'Unnamed file'}
        </div>
        <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 1 }}>
          {ext.toUpperCase()}
          {doc.size ? ` · ${formatSize(doc.size)}` : ''}
          {doc.isNew && (
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 600, letterSpacing: '0.3px',
              padding: '1px 5px', borderRadius: 4,
              background: 'rgba(10,179,156,.12)', color: '#0ab39c',
            }}>NEW</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {/* Eye — ONLY for images (preview) */}
        {isImage && src && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView?.(); }}
            title="Preview"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#405189', fontSize: 15, padding: '4px 5px',
              borderRadius: 4, lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(64,81,137,.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="ri-eye-line" />
          </button>
        )}

        {/* Download - any extension, if src exists */}
        {src && (
          <button
            type="button"
            onClick={handleDownload}
            title="Download"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#0ab39c', fontSize: 15, padding: '4px 5px',
              borderRadius: 4, lineHeight: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,179,156,.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="ri-download-line" />
          </button>
        )}

        {/* Delete - always show */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          title="Remove"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#f06548', fontSize: 15, padding: '4px 5px',
            borderRadius: 4, lineHeight: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,101,72,.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <i className="ri-delete-bin-line" />
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MultiFileUpload
   — drop zone + file list. Preview modal only ever opens for
     images (FileRow only fires onView for isImage rows).
   ══════════════════════════════════════════════════════════════════ */
export const MultiFileUpload = ({
  docs = [],
  accept,
  onAdd,
  onDelete,
  placeholder,
}) => {
  const fileRef = useRef();
  const [dragover, setDragover] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAdd(files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const files = Array.from(e.dataTransfer.files || []);
    const allowed = (accept || '').split(',').map(s => s.trim().replace('.', ''));
    const filtered = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return !allowed.length || allowed.includes(ext);
    });
    if (filtered.length) onAdd(filtered);
  };

  return (
    <>
      {/* File list */}
      {docs.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {docs.map((doc, i) => (
            <FileRow
              key={i}
              doc={doc}
              onView={() => setPreview({ doc })}
              onDelete={() => onDelete(i)}
            />
          ))}
        </div>
      )}

      {/* Drop zone / upload trigger */}
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragover ? '#405189' : 'var(--vz-border-color)'}`,
          borderRadius: 6,
          padding: docs.length ? '8px 12px' : '14px 12px',
          cursor: 'pointer',
          background: dragover ? 'rgba(64,81,137,.05)' : 'transparent',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: dragover ? 'rgba(64,81,137,.12)' : 'rgba(64,81,137,.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ri-upload-2-line" style={{ fontSize: 14, color: '#405189' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#405189', fontWeight: 500 }}>
            {docs.length > 0 ? 'Add more files' : 'Click or drag files here'}
          </div>
          {!docs.length && (
            <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 1 }}>
              {placeholder || 'PDF, PNG, JPG supported'}
            </div>
          )}
        </div>
      </div>

      {/* File count summary */}
      {docs.length > 0 && (
        <div style={{ fontSize: 10, color: '#adb5bd', marginTop: 5 }}>
          <i className="ri-attachment-line me-1" />
          {docs.length} file{docs.length !== 1 ? 's' : ''} attached
          {docs.filter(d => d.isNew).length > 0 && (
            <span style={{ color: '#0ab39c' }}>
              {' '}· {docs.filter(d => d.isNew).length} new
            </span>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={handleChange}
      />

      {/* Preview modal - only ever opened for images (see FileRow) */}
      <FilePreviewModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        file={preview?.doc || null}
      />
    </>
  );
};