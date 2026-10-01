import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Input, Spinner, Button, FormFeedback } from 'reactstrap';
import DatePickerInput from '../../../Components/Common/DatePickerInput';
import SectionBlock from '../../Company/components/SectionBlock';
import FormField from '../components/FormField';
import ChangeHistoryModal from '../components/ChangeHistoryModal';
import { getMemberIdTypeList, checkIdNumber } from '../../../helpers/backend_helper';
import { extractApiList } from '../individualUtils';
import { MultiFileUpload } from '../../Company/components/FilePreviewModal';
import {
  validateIDBySlug,
  getFormatHint,
  getExample,
  formatIDNumber,
  hasFormatValidation,
  shouldHideExpiry,
} from '../../../utils/idNumberValidations';


/* ══════════════════════════════════════════════════════
   Single ID entry row
══════════════════════════════════════════════════════ */
const IDEntry = ({
  entry,
  index,
  idTypes,
  countries,
  isEditMode,
  entityId,
  onUpdate,
  onRemove,
  onSetDefault,
  onOpenChange,
  onOpenHistory,
  onScanFilesAdd,
  onScanFileDelete,
  onDeleteDocument,
  registerValidationError,
  onUpdateFields,
}) => {
  const [idError, setIdError] = useState('');
  const [formatError, setFormatError] = useState('');
  const [checking, setChecking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const selectedType = idTypes.find(t => String(t.m_identification_id) === String(entry.idType));
  const currentSlug = selectedType?.slug_name || '';
  const hideExpiry = shouldHideExpiry(currentSlug);
  const formatHint = getFormatHint(currentSlug);
  const example = getExample(currentSlug);

  const update = (field, value) => onUpdate(index, field, value);

  /* Key used for scanFiles map */
  const scanKey = entry.identificationId
    ? String(entry.identificationId)
    : `new_${index}`;

  /* ── File handlers ── */
  const handleFilesAdd = (files) => {
    const newDocs = files.map(f => ({
      name: f.name,
      preview: URL.createObjectURL(f),
      docId: null,
      isNew: true,
    }));
    const updated = [...(entry.scanDocs || []), ...newDocs];
    update('scanDocs', updated);
    onScanFilesAdd?.(scanKey, files);
  };

  const handleFileDelete = async (fileIdx) => {
    const docs = entry.scanDocs || [];
    const doc = docs[fileIdx];
    if (doc?.docId && entityId) {
      try { await onDeleteDocument?.(entityId, doc.docId); } catch { /* ignore */ }
    } else {
      if (doc?.preview && doc?.isNew) URL.revokeObjectURL(doc.preview);
      const newFileIndex = docs.slice(0, fileIdx).filter(d => d.isNew).length;
      const updated = docs.filter((_, i) => i !== fileIdx);
      update('scanDocs', updated);
      if (doc?.isNew) onScanFileDelete?.(scanKey, newFileIndex);
    }
  };

  /* ============================================================
     HANDLE ID TYPE CHANGE - AUTO CLEAR ID NUMBER
     ============================================================ */

  const handleTypeChange = (e) => {
    const newType = e.target.value;

    if (String(newType) === String(entry.idType)) {
      return;
    }

    setFormatError('');
    setIdError('');

    registerValidationError?.(`id_${index}_format`, '');
    registerValidationError?.(`id_${index}_dupe`, '');

    onUpdateFields(index, {
      idType: newType,
      idNo: '',
    });
  };
  /* ── Main validation function ── */
  const validateID = useCallback(async (idNo, idType, skipDuplicate = false) => {
    const trimmed = idNo?.trim() || '';

    // Clear previous errors
    setFormatError('');
    setIdError('');
    registerValidationError?.(`id_${index}_format`, '');
    registerValidationError?.(`id_${index}_dupe`, '');

    if (!trimmed || !idType) {
      return false;
    }

    const typeObj = idTypes.find(t => String(t.m_identification_id) === String(idType));
    const slugName = typeObj?.slug_name || '';

    // ============================================================
    // STEP 1: Format validation based on slug
    // ============================================================
    if (hasFormatValidation(slugName)) {
      const formatResult = validateIDBySlug(slugName, trimmed);
      
      if (!formatResult.valid) {
        setFormatError(formatResult.message);
        registerValidationError?.(
          `id_${index}_format`,
          `ID #${index + 1}: ${formatResult.message}`
        );
        return false;
      }
    }

    // ============================================================
    // STEP 2: Duplicate check
    // ============================================================
    if (!skipDuplicate) {
      setChecking(true);
      try {
        const res = await checkIdNumber({
          id_type: idType,
          id_number: trimmed,
          exclude_entity_id: entityId,
        });

        const exists = res?.data?.exists || res?.exists || false;
        if (exists) {
          const dupeMsg = 'This ID number already exists for another individual.';
          setIdError(dupeMsg);
          registerValidationError?.(
            `id_${index}_dupe`,
            `ID #${index + 1}: ${dupeMsg}`
          );
          setChecking(false);
          return false;
        }
      } catch (error) {
        console.error('Duplicate check failed:', error);
      } finally {
        setChecking(false);
      }
    }

    // ============================================================
    // STEP 3: All validations passed
    // ============================================================
    registerValidationError?.(`id_${index}_format`, '');
    registerValidationError?.(`id_${index}_dupe`, '');
    return true;
  }, [idTypes, entityId, index, registerValidationError]);

  /* ── Handle ID number change with auto-format ── */
  const handleIdChange = (e) => {
    let value = e.target.value;

    // Auto-format for specific ID types
    const typeObj = idTypes.find(t => String(t.m_identification_id) === String(entry.idType));
    const slugName = typeObj?.slug_name || '';

    if (slugName === 'mykad') {
      value = formatIDNumber('mykad', value);
    } else if (slugName === 'pan') {
      value = value.toUpperCase();
    }

    update('idNo', value);
    setFormatError('');
    setIdError('');
    registerValidationError?.(`id_${index}_format`, '');
    registerValidationError?.(`id_${index}_dupe`, '');
  };

  /* ── Handle blur with validation ── */
  const handleIdBlur = useCallback(async () => {
    const idNo = entry.idNo?.trim();
    const idType = entry.idType;

    if (!idNo || !idType) {
      return;
    }

    // Don't re-validate if already checking
    if (isValidating) return;

    setIsValidating(true);
    await validateID(idNo, idType, false);
    setIsValidating(false);
  }, [entry.idNo, entry.idType, validateID, isValidating]);

  /* ── Get display hint ── */
  const getDisplayHint = () => {
    if (formatError) return formatError;
    if (formatHint) {
      return example ? `${formatHint} (e.g., ${example})` : formatHint;
    }
    return '';
  };

  const hasError = !!formatError || !!idError;

  return (
    <div className={`ind-id-entry${entry.isPrimary ? ' ind-id-entry-primary' : ''}`}>

      {/* Header */}
      <div className="ind-id-entry-head">
        <div className="d-flex align-items-center gap-2">
          <span className="ind-id-badge">ID #{index + 1}</span>
          {entry.isPrimary ? (
            <span className="ind-id-default-badge"><i className="ri-star-fill" /> Default</span>
          ) : (
            <button className="ind-id-set-default" onClick={() => onSetDefault(index)}>
              <i className="ri-star-line" /> Set as Default
            </button>
          )}
        </div>
        {index > 0 && (
          <button className="ind-id-remove" onClick={() => onRemove(index)}>
            <i className="ri-close-line" /> Remove
          </button>
        )}
      </div>

      <Row className="g-3">

        {/* ID Type */}
        <FormField label="Identification Type" md={4} required>
          <Input
            type="select"
            bsSize="sm"
            value={entry.idType || ''}
            onChange={handleTypeChange}
          >
            <option value="">Select ID type…</option>
            {idTypes.map(t => (
              <option key={t.m_identification_id} value={t.m_identification_id}>
                {t.id_name}
              </option>
            ))}
          </Input>
        </FormField>

        {/* ID Number */}
        <FormField
          label="ID No."
          md={4}
          required
          isEditMode={isEditMode}
          onChange={() => onOpenChange(index)}
          onHistory={() => onOpenHistory(index)}
        >
          <div style={{ position: 'relative' }}>
            <Input
              bsSize="sm"
              placeholder={example || "Enter ID number"}
              value={entry.idNo || ''}
              onChange={handleIdChange}
              onBlur={handleIdBlur}
              invalid={hasError}
              disabled={!entry.idType}
              style={hasError ? { borderColor: '#f06548' } : {}}
            />
            {checking && (
              <Spinner
                size="sm"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )}
            {hasError && (
              <FormFeedback>
                {formatError || idError}
              </FormFeedback>
            )}
          </div>
          {getDisplayHint() && !hasError && entry.idType && (
            <small className="ind-id-hint">{getDisplayHint()}</small>
          )}

        </FormField>

        {/* Issued Country */}
        <FormField label="ID Issued Country" md={4}>
          <Input
            type="select"
            bsSize="sm"
            value={entry.idCountry || ''}
            onChange={e => update('idCountry', e.target.value)}
          >
            <option value="">Select country…</option>
            {countries.map(c => (
              <option key={c.id} value={c.country_name}>{c.country_name}</option>
            ))}
          </Input>
        </FormField>

        {/* Issued Date */}
        <FormField label="ID Issued Date" md={4}>
          <DatePickerInput
            value={entry.idIssuedDate || ''}
            onChange={e => update('idIssuedDate', e.target.value)}
          />
        </FormField>

        {/* Expiry Date - hidden for NRIC/FIN types */}
        {!hideExpiry && (
          <FormField label="ID Expiry Date" md={4}>
            <DatePickerInput
              value={entry.idExpiryDate || ''}
              onChange={e => update('idExpiryDate', e.target.value)}
            />
          </FormField>
        )}

        {/* Upload Documents */}
        <FormField label="Upload Documents" md={hideExpiry ? 8 : 12}>
          <MultiFileUpload
            docs={entry.scanDocs || []}
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
            placeholder="Click to upload (PDF, PNG, JPG, DOCX, XLSX)"
            onAdd={handleFilesAdd}
            onDelete={handleFileDelete}
          />
          {(entry.scanDocs || []).length > 0 && (
            <small style={{ fontSize: 10, color: 'var(--vz-sidebar-sub-item-color)' }}>
              {entry.scanDocs.length} file{entry.scanDocs.length !== 1 ? 's' : ''} attached
            </small>
          )}
          <small className="ind-id-hint" style={{ display: 'block', marginTop: 2 }}>
            Max 10 MB per file
          </small>
        </FormField>

      </Row>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Main Step Component
══════════════════════════════════════════════════════ */
const Step3IndividualID = ({
  formData,
  updateFormData,
  errors = [],
  isEditMode = false,
  entityId = null,
  countries = [],
  onFetchHistory,
  onSaveChange,
  registerValidationError,
  onScanFilesAdd,
  onScanFileDelete,
  onScanFilesClear,
  onDeleteDocument,
}) => {
  const [idTypes, setIdTypes] = useState([]);
  const [entries, setEntries] = useState(() => {
    const list = formData.idEntries || [];
    if (!list.length) return [emptyEntry(true)];
    return list.some(e => e.isPrimary) ? list : list.map((e, i) => ({ ...e, isPrimary: i === 0 }));
  });

  const [modal, setModal] = useState({
    open: false,
    mode: 'change',
    variant: 'passport',
    entryIndex: null,
    historyRows: [],
    historyLoading: false,
  });

  useEffect(() => {
    getMemberIdTypeList({ page: 1, limit: 200 })
      .then(res => setIdTypes(extractApiList(res)))
      .catch(() => {});
  }, []);

  /* Sync from parent */
  useEffect(() => {
    if (!formData.idEntries?.length) return;
    const list = formData.idEntries;
    setEntries(prev => {
      const merged = list.map((incoming, i) => {
        const local = prev.find(p =>
          incoming.identificationId && p.identificationId === incoming.identificationId
        ) || prev[i];

        const serverDocs = (incoming.scanDocs || []).filter(d => !d.isNew);
        const localNew = (local?.scanDocs || []).filter(d => d.isNew);

        return {
          ...emptyEntry(incoming.isPrimary ?? (i === 0)),
          ...incoming,
          scanDocs: [...serverDocs, ...localNew],
        };
      });
      return merged.some(e => e.isPrimary) ? merged : merged.map((e, i) => ({ ...e, isPrimary: i === 0 }));
    });
  }, [formData.idEntries]);

  /* ── Entry helpers ── */
    const push = (updater) => {
    setEntries(prev => {
      const updated =
        typeof updater === 'function'
          ? updater(prev)
          : updater;

      updateFormData({ idEntries: updated });

      return updated;
    });
  };

  const updateEntry = (idx, field, value) =>
  push(prev =>
    prev.map((e, i) =>
      i === idx
        ? { ...e, [field]: value }
        : e
    )
  );

  const updateEntryFields = (idx, fields) =>
  push(prev =>
    prev.map((e, i) =>
      i === idx
        ? {
            ...e,
            ...fields,
          }
        : e
    )
  );

  const setDefault = (idx) =>
    push(entries.map((e, i) => ({ ...e, isPrimary: i === idx })));

  const removeEntry = (idx) => {
    registerValidationError?.(`id_${idx}_format`, '');
    registerValidationError?.(`id_${idx}_dupe`, '');
    const entry = entries[idx];
    const key = entry.identificationId ? String(entry.identificationId) : `new_${idx}`;
    onScanFilesClear?.(key);

    const next = entries.filter((_, i) => i !== idx);
    if (!next.some(e => e.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    push(next);
  };

  const addEntry = () => {
    const newEntry = emptyEntry(false);
    push([...entries, newEntry]);
  };

  /* ── Validate all entries ── */
  const validateAllEntries = useCallback(async () => {
    let allValid = true;
    const validationPromises = [];

    entries.forEach((entry, idx) => {
      const idNo = entry.idNo?.trim();
      const idType = entry.idType;

      if (idNo && idType) {
        const typeObj = idTypes.find(t => String(t.m_identification_id) === String(idType));
        const slug = typeObj?.slug_name || '';

        // Format validation
        if (hasFormatValidation(slug)) {
          const result = validateIDBySlug(slug, idNo);
          if (!result.valid) {
            allValid = false;
            registerValidationError?.(
              `id_${idx}_format`,
              `ID #${idx + 1}: ${result.message}`
            );
          } else {
            registerValidationError?.(`id_${idx}_format`, '');
          }
        } else {
          registerValidationError?.(`id_${idx}_format`, '');
        }

        // Duplicate check
        validationPromises.push(
          checkIdNumber({
            id_type: idType,
            id_number: idNo,
            exclude_entity_id: entityId,
          })
            .then(res => {
              const exists = res?.data?.exists || res?.exists || false;
              if (exists) {
                allValid = false;
                registerValidationError?.(
                  `id_${idx}_dupe`,
                  `ID #${idx + 1}: This ID number already exists for another individual.`
                );
              } else {
                registerValidationError?.(`id_${idx}_dupe`, '');
              }
            })
            .catch(() => {
              console.warn(`Duplicate check failed for entry ${idx}`);
            })
        );
      } else {
        registerValidationError?.(`id_${idx}_format`, '');
        registerValidationError?.(`id_${idx}_dupe`, '');
      }
    });

    await Promise.allSettled(validationPromises);
    return allValid;
  }, [entries, idTypes, entityId, registerValidationError]);

  /* ── Modals ── */
  const openChange = (idx) =>
    setModal({ open: true, mode: 'change', variant: 'passport', entryIndex: idx, historyRows: [], historyLoading: false });

  const openHistory = async (idx) => {
    const entry = entries[idx];
    setModal({ open: true, mode: 'history', variant: 'passport', entryIndex: idx, historyRows: [], historyLoading: true });
    try {
      const rows = await onFetchHistory?.('id_number', 32, entry.identificationId);
      setModal(m => ({ ...m, historyRows: rows || [], historyLoading: false }));
    } catch {
      setModal(m => ({ ...m, historyRows: [], historyLoading: false }));
    }
  };

  const handleSaveIdChange = async ({ newValue, newCountry, newIssuedDate, newExpiryDate, effectiveDate, isProposed }) => {
    const idx = modal.entryIndex;
    const oldEntry = entries[idx] || {};
    const next = entries.map((e, i) => i === idx
      ? {
          ...e,
          idNo: newValue,
          idCountry: newCountry || e.idCountry,
          idIssuedDate: newIssuedDate || e.idIssuedDate,
          idExpiryDate: newExpiryDate || e.idExpiryDate,
        }
      : e
    );
    push(next);
    await onSaveChange?.({
      field: 'id_number',
      fieldTypeId: 32,
      identificationId: oldEntry.identificationId,
      oldValue: oldEntry.idNo || '',
      newValue,
      effectiveDate,
      isProposed,
      extra: {
        newCountry,
        newIssuedDate,
        newExpiryDate,
        oldCountry: oldEntry.idCountry || '',
        oldIssuedDate: oldEntry.idIssuedDate || '',
        oldExpiryDate: oldEntry.idExpiryDate || '',
      },
    });
  };

  /* ── Expose validateAllEntries to parent ── */
  useEffect(() => {
    if (registerValidationError) {
      window.__validateIDEntries = validateAllEntries;
    }
  }, [validateAllEntries, registerValidationError]);

  const activeEntry = modal.entryIndex !== null ? entries[modal.entryIndex] : null;

  return (
    <>
      <ChangeHistoryModal
        isOpen={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        mode={modal.mode}
        variant="passport"
        fieldLabel="ID Number"
        oldValue={activeEntry?.idNo || ''}
        passportExtra={{
          oldCountry: activeEntry?.idCountry || '',
          oldIssuedDate: activeEntry?.idIssuedDate || '',
          oldExpiryDate: activeEntry?.idExpiryDate || '',
        }}
        onSavePassport={handleSaveIdChange}
        historyRows={modal.historyRows}
        historyLoading={modal.historyLoading}
        countries={countries}
      />

      <SectionBlock title="Individual ID Documents">
        {entries.map((entry, i) => (
          <IDEntry
            key={i}
            index={i}
            entry={entry}
            idTypes={idTypes}
            countries={countries}
            isEditMode={isEditMode}
            entityId={entityId}
            onUpdate={updateEntry}
            onRemove={removeEntry}
            onSetDefault={setDefault}
            onOpenChange={openChange}
            onOpenHistory={openHistory}
            onScanFilesAdd={onScanFilesAdd}
            onScanFileDelete={onScanFileDelete}
            onDeleteDocument={onDeleteDocument}
            registerValidationError={registerValidationError}
            onUpdateFields={updateEntryFields}
          />
        ))}

        <Button
          size="sm"
          color="light"
          className="d-flex align-items-center gap-1 mt-1"
          onClick={addEntry}
        >
          <i className="ri-add-line" /> Add Another ID
        </Button>

        {hasDuplicates(entries) && (
          <div className="ind-id-error mt-2">
            <i className="ri-error-warning-line" />
            Duplicate ID type + number combination detected.
          </div>
        )}
      </SectionBlock>
    </>
  );
};

/* ── Helpers ── */
const emptyEntry = (isPrimary = false) => ({
  identificationId: null,
  idType: '',
  idNo: '',
  idCountry: '',
  idIssuedDate: '',
  idExpiryDate: '',
  scanDocs: [],
  isPrimary,
});

const hasDuplicates = (entries) => {
  const seen = new Set();
  for (const e of entries) {
    if (!e.idType || !e.idNo) continue;
    const key = `${e.idType}|${e.idNo.trim()}`;
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
};

export default Step3IndividualID;
