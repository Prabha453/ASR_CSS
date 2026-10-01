import React, { useMemo } from 'react';
import { Row, Col, Label, Input, Button, FormFeedback } from 'reactstrap';

/* ─── find duplicate indices within an array ─────────────────────────────── */
const getDuplicateIndices = (arr) => {
  const seen   = {};
  const dupSet = new Set();
  arr.forEach((val, i) => {
    const v = (val || '').trim().toLowerCase();
    if (!v) return;
    if (seen[v] !== undefined) {
      dupSet.add(seen[v]);
      dupSet.add(i);
    } else {
      seen[v] = i;
    }
  });
  return dupSet;
};

/* ─── simple email format check ─────────────────────────────────────────── */
const isValidEmail = (val) =>
  !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

/* ─── simple phone check (digits, spaces, +, -, brackets) ───────────────── */
const isValidPhone = (val) =>
  !val || /^[+\d\s\-().]{6,20}$/.test(val.trim());

const ContactInformation = ({ formik }) => {

  const emails = formik.values.cp_email_id       || [];
  const replies = formik.values.cp_reply_id      || [];
  const phones  = formik.values.cp_contact_number || [];

  /* ── live duplicate sets ─────────────────────────────────────────────── */
  const dupEmails  = useMemo(() => getDuplicateIndices(emails),  [emails]);
  const dupReplies = useMemo(() => getDuplicateIndices(replies), [replies]);
  const dupPhones  = useMemo(() => getDuplicateIndices(phones),  [phones]);

  /* ── per-field touched state (stored in formik.touched arrays) ────────── */
  const isTouchedEmail  = (i) => formik.touched?.cp_email_id?.[i];
  const isTouchedReply  = (i) => formik.touched?.cp_reply_id?.[i];
  const isTouchedPhone  = (i) => formik.touched?.cp_contact_number?.[i];

  const touchEmail  = (i) => formik.setFieldTouched(`cp_email_id[${i}]`,        true, false);
  const touchReply  = (i) => formik.setFieldTouched(`cp_reply_id[${i}]`,        true, false);
  const touchPhone  = (i) => formik.setFieldTouched(`cp_contact_number[${i}]`,  true, false);

  /* ── inline error resolvers ──────────────────────────────────────────── */
  const emailError = (i) => {
    if (!isTouchedEmail(i)) return null;
    const val = (emails[i] || '').trim();
    if (dupEmails.has(i))      return 'This email is already added';
    if (!isValidEmail(val))    return 'Invalid email format';
    return null;
  };

  const replyError = (i) => {
    if (!isTouchedReply(i)) return null;
    const val = (replies[i] || '').trim();
    if (dupReplies.has(i))     return 'This reply email is already added';
    if (!isValidEmail(val))    return 'Invalid email format';
    return null;
  };

  const phoneError = (i) => {
    if (!isTouchedPhone(i)) return null;
    const val = (phones[i] || '').trim();
    if (dupPhones.has(i))      return 'This phone number is already added';
    if (!isValidPhone(val))    return 'Invalid phone number format';
    return null;
  };

  /* ── block save if any duplicates exist ──────────────────────────────── */
  const hasDuplicates =
    dupEmails.size > 0 || dupReplies.size > 0 || dupPhones.size > 0;

  /* ── mutation helpers ────────────────────────────────────────────────── */
  // Email
  const addEmail    = () =>
    formik.setFieldValue('cp_email_id', [...emails, '']);
  const removeEmail = (i) => {
    const next = [...emails]; next.splice(i, 1);
    formik.setFieldValue('cp_email_id', next);
  };
  const updateEmail = (i, val) => {
    const next = [...emails]; next[i] = val;
    formik.setFieldValue('cp_email_id', next);
    touchEmail(i);
  };

  // Reply
  const addReply    = () =>
    formik.setFieldValue('cp_reply_id', [...replies, '']);
  const removeReply = (i) => {
    const next = [...replies]; next.splice(i, 1);
    formik.setFieldValue('cp_reply_id', next);
  };
  const updateReply = (i, val) => {
    const next = [...replies]; next[i] = val;
    formik.setFieldValue('cp_reply_id', next);
    touchReply(i);
  };

  // Phone
  const addPhone    = () =>
    formik.setFieldValue('cp_contact_number', [...phones, '']);
  const removePhone = (i) => {
    const next = [...phones]; next.splice(i, 1);
    formik.setFieldValue('cp_contact_number', next);
  };
  const updatePhone = (i, val) => {
    const next = [...phones]; next[i] = val;
    formik.setFieldValue('cp_contact_number', next);
    touchPhone(i);
  };

  /* ── shared row renderer ─────────────────────────────────────────────── */
  const renderRow = ({
    value, index, total,
    onChange, onRemove, onAdd,
    placeholder, type = 'text',
    error, isDup,
  }) => (
    <div key={index} className="mb-2">
      <div className="d-flex gap-2 align-items-start">
        <div className="flex-grow-1">
          <Input
            type={type}
            bsSize="sm"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(index, e.target.value)}
            onBlur={() => {
              // touch on blur so error shows after leaving field
              if (type === 'email' || type === 'text') {
                onChange(index, value); // re-trigger touch
              }
            }}
            invalid={!!error || isDup}
            style={isDup && !error ? { borderColor: '#f06548' } : {}}
          />
          {(error || isDup) && (
            <FormFeedback style={{ display: 'block' }}>
              <i className="ri-error-warning-line me-1" />
              {error || 'Duplicate value'}
            </FormFeedback>
          )}
        </div>

        {/* + button on first row, – on rest */}
        {index === 0 ? (
          <Button
            color="success" type="button" size="sm"
            onClick={onAdd}
            style={{ width: 34, height: 31, flexShrink: 0 }}
            title="Add row"
          >
            <i className="ri-add-line" />
          </Button>
        ) : (
          <Button
            color="danger" type="button" size="sm"
            onClick={() => onRemove(index)}
            style={{ width: 34, height: 31, flexShrink: 0 }}
            title="Remove row"
          >
            <i className="ri-delete-bin-line" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div>

      <Row className="g-3">

        {/* ── Sending Emails ───────────────────────────────────────────── */}
        <Col md={6}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <Label className="form-label fs-12 mb-0">
              Sending Email
              {dupEmails.size > 0 && (
                <span className="badge bg-danger ms-2 fs-10">Duplicate</span>
              )}
            </Label>
            <span className="fs-11 text-muted">{emails.length} added</span>
          </div>

          {emails.map((email, i) =>
            renderRow({
              value:       email,
              index:       i,
              total:       emails.length,
              onChange:    updateEmail,
              onRemove:    removeEmail,
              onAdd:       addEmail,
              placeholder: 'Enter email address',
              type:        'email',
              error:       emailError(i),
              isDup:       dupEmails.has(i),
            })
          )}
        </Col>

        {/* ── Reply Emails ─────────────────────────────────────────────── */}
        <Col md={6}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <Label className="form-label fs-12 mb-0">
              Reply Email
              {dupReplies.size > 0 && (
                <span className="badge bg-danger ms-2 fs-10">Duplicate</span>
              )}
            </Label>
            <span className="fs-11 text-muted">{replies.length} added</span>
          </div>

          {replies.map((reply, i) =>
            renderRow({
              value:       reply,
              index:       i,
              total:       replies.length,
              onChange:    updateReply,
              onRemove:    removeReply,
              onAdd:       addReply,
              placeholder: 'Enter reply email address',
              type:        'email',
              error:       replyError(i),
              isDup:       dupReplies.has(i),
            })
          )}
        </Col>

        {/* ── Phone Numbers ────────────────────────────────────────────── */}
        <Col md={6}>
          <div className="d-flex align-items-center justify-content-between mb-1">
            <Label className="form-label fs-12 mb-0">
              Phone Number
              {dupPhones.size > 0 && (
                <span className="badge bg-danger ms-2 fs-10">Duplicate</span>
              )}
            </Label>
            <span className="fs-11 text-muted">{phones.length} added</span>
          </div>

          {phones.map((phone, i) =>
            renderRow({
              value:       phone,
              index:       i,
              total:       phones.length,
              onChange:    updatePhone,
              onRemove:    removePhone,
              onAdd:       addPhone,
              placeholder: 'Enter phone number',
              type:        'text',
              error:       phoneError(i),
              isDup:       dupPhones.has(i),
            })
          )}
        </Col>

      </Row>

      {/* ── Info note ────────────────────────────────────────────────────── */}
      <Row className="mt-3">
        <Col xs={12}>
          <div className="alert alert-info py-2 mb-0" role="alert">
            <i className="ri-information-line me-2" />
            <strong>Note:</strong>
            <ul className="mb-0 mt-1 fs-12">
              <li>Sending emails added here will appear in the Email Configuration tab</li>
              <li>Reply emails will be used as reply-to addresses</li>
              <li>Each value must be unique — duplicates are not allowed</li>
            </ul>
          </div>
        </Col>
      </Row>

    </div>
  );
};

export default ContactInformation;