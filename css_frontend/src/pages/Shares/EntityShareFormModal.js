import React, { useEffect, useState } from 'react';
import {
  Modal, ModalBody, ModalFooter,
  Form, FormGroup, Input, Button, Spinner, Row, Col,
} from 'reactstrap';
import { toast } from 'react-toastify';
import DatePickerInput from '../../Components/Common/DatePickerInput';
import {
  getEntityShare, createEntityShare, updateEntityShare,
  getShareClassMasterList, getCountriesList,
} from '../../helpers/backend_helper';
import './EntityShareFormModal.css';

const BLANK = {
  currency:                 '',
  share_class_id:           '',
  share_type:               'NORMAL',
  number_of_shares:         '',
  authorized_share_capital: '',
  issued_share_capital:     '',
  paid_up_capital:          '',
  guarantee_amount:         '',
  date_of_transaction:      '',
  transaction_type:         'allotment',
  remarks:                  '',
  source_from:              'MANUAL',
};

const fmtNum = (n, dec = 4) =>
  n == null || n === '' ? '' : Number(n).toFixed(dec);

const Section = ({ icon, label }) => (
  <div className="esfm-section">
    <span className="esfm-section-label"><i className={icon} />{label}</span>
    <span className="esfm-section-line" />
  </div>
);

const EntityShareFormModal = ({ isOpen, onClose, onSaved, entityId, shareId, isGuarantee, isAuthorizedCapital }) => {
  const isEdit = !!shareId;

  const [form,         setForm]         = useState({ ...BLANK });
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [shareClasses, setShareClasses] = useState([]);
  const [currencies,   setCurrencies]   = useState([]);

  const shares         = parseFloat(form.number_of_shares)    || 0;
  const paid           = parseFloat(form.paid_up_capital)      || 0;
  const issued         = parseFloat(form.issued_share_capital) || 0;
  const perShare       = shares > 0 ? paid   / shares : 0;
  const issuedPerShare = shares > 0 ? issued / shares : 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    Promise.allSettled([
      getShareClassMasterList({ page: 1, limit: 200 }),
      getCountriesList({ page: 1, limit: 300 }),
    ]).then(([sc, cn]) => {
      const pick = r => r.status === 'fulfilled' ? (r.value?.data?.data || r.value?.data || []) : [];
      setShareClasses(pick(sc));
      setCurrencies([...new Set(pick(cn).map(c => c.currency_code).filter(Boolean))].sort());
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isEdit) {
      setForm({ ...BLANK, share_type: isGuarantee ? 'GUARANTEE' : 'NORMAL' });
      return;
    }
    setLoading(true);
    getEntityShare(shareId)
      .then(r => {
        const d = r?.data || {};
        setForm({
          currency:                 d.currency                 || '',
          share_class_id:           d.share_class_id           || '',
          share_type:               d.share_type               || 'NORMAL',
          number_of_shares:         d.number_of_shares         ?? '',
          authorized_share_capital: d.authorized_share_capital ?? '',
          issued_share_capital:     d.issued_share_capital     ?? '',
          paid_up_capital:          d.paid_up_capital          ?? '',
          guarantee_amount:         d.guarantee_amount         ?? '',
          date_of_transaction:      d.date_of_transaction      || '',
          transaction_type:         'share-increase',
          remarks:                  '',
          source_from:              d.source_from              || 'MANUAL',
        });
      })
      .catch(() => toast.error('Failed to load share'))
      .finally(() => setLoading(false));
  }, [isOpen, shareId, isEdit, isGuarantee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currency)       return toast.error('Currency is required');
    if (!form.share_class_id) return toast.error('Share Class is required');
    if (!form.date_of_transaction) return toast.error('Date of Transaction is required');
    if (isGuarantee) {
      if (!form.guarantee_amount)    return toast.error('Guarantee Amount is required');
    } else {
      if (!form.number_of_shares)    return toast.error('Number of Shares is required');
      if (!form.issued_share_capital) return toast.error('Issued Share Capital is required');
      if (!form.paid_up_capital)      return toast.error('Paid-up Capital is required');
      if (isAuthorizedCapital && !form.authorized_share_capital)
        return toast.error('Authorized Share Capital is required');
      if (isAuthorizedCapital && form.authorized_share_capital && form.issued_share_capital) {
        if (parseFloat(form.authorized_share_capital) > parseFloat(form.issued_share_capital))
          return toast.error('Authorized Share Capital must be equal to or less than Issued Share Capital');
      }
    }

    setSaving(true);
    try {
      const payload = isGuarantee
        ? {
            ...form,
            entity_id:                entityId,
            share_type:               'GUARANTEE',
            number_of_shares:         0,
            authorized_share_capital: 0,
            issued_share_capital:     0,
            paid_up_capital:          0,
            per_share:                0,
            issued_per_share:         0,
          }
        : {
            ...form,
            entity_id:                entityId,
            per_share:                perShare,
            issued_per_share:         issuedPerShare,
            guarantee_amount:         null,
            authorized_share_capital: parseFloat(form.authorized_share_capital) || 0,
          };

      if (isEdit) {
        await updateEntityShare(shareId, payload);
        toast.success('Share updated successfully');
      } else {
        await createEntityShare(payload);
        toast.success('Share added successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = (typeof err === 'string' ? err : null) || (isEdit ? 'Failed to update share' : 'Failed to add share');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} centered size="lg" modalClassName="esfm zoomIn">
      <div className="esfm-hd">
        <div className="esfm-hd-title">
          <i className={isEdit ? 'ri-pencil-line' : 'ri-add-circle-line'} />
          <span>{isEdit ? 'Edit Share' : 'Add Share'}</span>
          {isGuarantee && <span className="esfm-header-badge">Guarantee</span>}
        </div>
        <button type="button" className="esfm-hd-close" onClick={onClose}>
          <i className="ri-close-line" />
        </button>
      </div>

      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              <Section icon="ri-stock-line" label="Share Details" />

              <Row className="g-3 mb-4">
                <Col md={6}>
                  <FormGroup className="mb-0">
                    <label className="esfm-label">Currency <span className="text-danger">*</span></label>
                    <Input type="select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="">Select Currency</option>
                      {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </Input>
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <label className="esfm-label">Share Type / Class <span className="text-danger">*</span></label>
                    <Input type="select" value={form.share_class_id} onChange={e => set('share_class_id', e.target.value)}>
                      <option value="">Select Class</option>
                      {shareClasses
                        .filter(sc => isGuarantee
                          ? /guarantee/i.test(sc.sc_name)
                          : !/guarantee/i.test(sc.sc_name))
                        .map(sc => (
                          <option key={sc.sc_id} value={sc.sc_id}>
                            {sc.sc_name}{sc.sc_type ? ` · Type ${sc.sc_type}` : ''}
                          </option>
                        ))}
                    </Input>
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <label className="esfm-label">Share Allotment Type</label>
                    <div className="esfm-type-group">
                      {isGuarantee ? (
                        <span className="esfm-type-pill guarantee">
                          <i className="ri-shield-check-line" style={{ fontSize: 13 }} /> Guarantee
                        </span>
                      ) : (
                        ['NORMAL', 'BONUS'].map(t => (
                          <label key={t} className={`esfm-type-pill ${form.share_type === t ? 'active' : ''}`}>
                            <input type="radio" value={t} checked={form.share_type === t} onChange={e => set('share_type', e.target.value)} />
                            {t.charAt(0) + t.slice(1).toLowerCase()}
                          </label>
                        ))
                      )}
                    </div>
                  </FormGroup>
                </Col>

                <Col md={6}>
                  <FormGroup className="mb-0">
                    <label className="esfm-label">Date of Transaction <span className="text-danger">*</span></label>
                    <DatePickerInput value={form.date_of_transaction} onChange={e => set('date_of_transaction', e.target.value)} />
                  </FormGroup>
                </Col>
              </Row>

              <Section icon="ri-money-dollar-circle-line" label="Capital Details" />

              {isGuarantee ? (
                <Row className="g-3 mb-2">
                  <Col md={6}>
                    <FormGroup className="mb-0">
                      <label className="esfm-label">Guarantee Amount <span className="text-danger">*</span></label>
                      <Input type="number" min="0" step="any"
                        value={form.guarantee_amount}
                        onChange={e => set('guarantee_amount', e.target.value)}
                        placeholder="0.00" />
                    </FormGroup>
                  </Col>
                </Row>
              ) : (
                <>
                  <Row className="g-3 mb-2">
                    <Col md={4}>
                      <FormGroup className="mb-0">
                        <label className="esfm-label">Number of Shares <span className="text-danger">*</span></label>
                        <Input type="number" min="0" step="any"
                          value={form.number_of_shares}
                          onChange={e => set('number_of_shares', e.target.value)}
                          placeholder="0" />
                      </FormGroup>
                    </Col>

                    <Col md={4}>
                      <FormGroup className="mb-0">
                        <label className="esfm-label">Issued Share Capital <span className="text-danger">*</span></label>
                        <Input type="number" min="0" step="any"
                          value={form.issued_share_capital}
                          onChange={e => set('issued_share_capital', e.target.value)}
                          placeholder="0.00" />
                      </FormGroup>
                    </Col>

                    {isAuthorizedCapital && (
                      <Col md={4}>
                        <FormGroup className="mb-0">
                          <label className="esfm-label">Authorized Share Capital <span className="text-danger">*</span></label>
                          <Input type="number" min="0" step="any"
                            value={form.authorized_share_capital}
                            onChange={e => set('authorized_share_capital', e.target.value)}
                            placeholder="0.00" />
                        </FormGroup>
                      </Col>
                    )}

                    <Col md={4}>
                      <FormGroup className="mb-0">
                        <label className="esfm-label">Paid-up Capital <span className="text-danger">*</span></label>
                        <Input type="number" min="0" step="any"
                          value={form.paid_up_capital}
                          onChange={e => set('paid_up_capital', e.target.value)}
                          placeholder="0.00" />
                      </FormGroup>
                    </Col>

                  </Row>

                  {shares > 0 && (
                    <div className="esfm-calc">
                      <div className="esfm-calc-item">
                        <span>Per Share</span>
                        <b>{form.currency || '—'} {fmtNum(perShare)}</b>
                      </div>
                      <div className="esfm-calc-sep" />
                      <div className="esfm-calc-item">
                        <span>Issued Per Share</span>
                        <b>{form.currency || '—'} {fmtNum(issuedPerShare)}</b>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" color="light" className="esfm-cancel-btn" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" color="success" className="esfm-save-btn" disabled={saving || loading}>
            {saving
              ? <><Spinner size="sm" /> Saving…</>
              : <><i className="ri-save-line" />{isEdit ? 'Update Share' : 'Add Share'}</>}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default EntityShareFormModal;
