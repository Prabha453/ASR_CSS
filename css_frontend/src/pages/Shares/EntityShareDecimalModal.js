import React, { useEffect, useState } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button, Spinner,
} from 'reactstrap';
import { toast } from 'react-toastify';
import { upsertEntityShareDecimalSettings } from '../../helpers/backend_helper';

const EntityShareDecimalModal = ({ isOpen, onClose, entityId, decimals, entityDecimals, onSaved }) => {
  const [draft,   setDraft]   = useState({ shares: '', paid: '', issued: '' });
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft({
        shares: entityDecimals.shares !== null ? String(entityDecimals.shares) : '',
        paid:   entityDecimals.paid   !== null ? String(entityDecimals.paid)   : '',
        issued: entityDecimals.issued !== null ? String(entityDecimals.issued) : '',
      });
    }
  }, [isOpen, entityDecimals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        no_of_share_decimal_place:   draft.shares !== '' ? Number(draft.shares) : null,
        paid_up_share_decimal_place: draft.paid   !== '' ? Number(draft.paid)   : null,
        issued_share_decimal_place:  draft.issued !== '' ? Number(draft.issued) : null,
      };
      await upsertEntityShareDecimalSettings(entityId, payload);
      onSaved({
        shares: payload.no_of_share_decimal_place,
        paid:   payload.paid_up_share_decimal_place,
        issued: payload.issued_share_decimal_place,
      });
      onClose();
      toast.success('Decimal settings saved');
    } catch {
      toast.error('Failed to save decimal settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered size="md" modalClassName="zoomIn">
      <ModalHeader toggle={onClose} className="es-dec-modal-head">
        <i className="ri-settings-3-line me-2 text-primary" />Decimal Place Settings
      </ModalHeader>

      <ModalBody className="es-dec-modal-body">
        <div className="es-dec-modal-hint">
          <p>Set decimal places for this entity only. Leave as <b>Default</b> to use the firm-wide value.</p>
          <div className="es-dec-global-note">
            <i className="ri-settings-4-line" />
            <span>
              Global defaults are managed under <b>Settings → Share Settings → Decimal Settings</b> — currently{' '}
              <b>Shares: {decimals.shares} dp</b>, <b>Paid-up: {decimals.paid} dp</b>, <b>Issued: {decimals.issued} dp</b>
            </span>
          </div>
        </div>

        {[
          { key: 'shares', label: 'No. of Shares',   global: decimals.shares },
          { key: 'paid',   label: 'Paid-up Capital', global: decimals.paid   },
          { key: 'issued', label: 'Issued Capital',  global: decimals.issued },
        ].map(({ key, label, global: g }) => (
          <div key={key} className="es-dec-row">
            <span className="es-dec-label">{label}</span>
            <select
              className="es-dec-select"
              value={draft[key]}
              onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
            >
              <option value="">Default ({g} decimal place)</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={String(n)}>{n}</option>
              ))}
            </select>
          </div>
        ))}
      </ModalBody>

      <ModalFooter className="es-dec-modal-foot">
        <Button color="light" size="sm"
          onClick={() => setDraft({ shares: '', paid: '', issued: '' })}>
          <i className="ri-refresh-line me-1" />Reset to Global
        </Button>
        <Button color="primary" size="sm" onClick={handleSave} disabled={saving}
          className="d-flex align-items-center gap-1">
          {saving ? <><Spinner size="sm" /> Saving…</> : <><i className="ri-save-line" /> Save</>}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EntityShareDecimalModal;
