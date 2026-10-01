import React from 'react';
import { Row, Col, Label, Input, Button, FormFeedback } from 'reactstrap';
import { getLoggedinUser } from '../../../helpers/api_helper';

const isSuperAdminUser = (user = {}) => {
  const candidates = [
    user?.user_role,
    user?.role,
    user?.role_name,
    user?.user_type,
    user?.roleName,
    user?.user?.user_role,
    user?.user?.role,
    ...(Array.isArray(user?.roles) ? user.roles : []),
  ];

  return candidates
    .filter(Boolean)
    .some(value => String(value?.role_name || value?.name || value).trim().toUpperCase().replace(/[_-]+/g, ' ') === 'SUPER ADMIN');
};

const EmailConfiguration = ({ formik }) => {
  const canManageSmtp = isSuperAdminUser(getLoggedinUser());

  const addEmailConfig = () => {
    formik.setFieldValue('cp_email_config', [
      ...formik.values.cp_email_config,
      {
        email_config_id: '0',
        from_name: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_encryption: 'TLS',
        smtp_email: '',
        reply_email: '',
        aws_ses: false,
        sending_default_email: false,
        group_to_recipient: 0,
      },
    ]);
  };

  const removeEmailConfig = (index) => {
    const configs = [...formik.values.cp_email_config];
    configs.splice(index, 1);
    formik.setFieldValue('cp_email_config', configs);
  };

  const updateEmailConfig = (index, field, value) => {
    const configs = [...formik.values.cp_email_config];
    configs[index] = { ...configs[index], [field]: value };
    formik.setFieldValue('cp_email_config', configs);

    // Mark field as touched so error shows immediately
    formik.setFieldTouched(`cp_email_config[${index}].${field}`, true, false);
  };

  const setDefaultEmail = (index) => {
    const configs = formik.values.cp_email_config.map((c, i) => ({
      ...c,
      sending_default_email: i === index,
    }));
    formik.setFieldValue('cp_email_config', configs);
  };

  // ── Helpers to read nested formik errors/touched ───────────────────────
  const getError = (index, field) =>
    formik.errors?.cp_email_config?.[index]?.[field];

  const isTouched = (index, field) =>
    formik.touched?.cp_email_config?.[index]?.[field];

  const showError = (index, field) =>
    isTouched(index, field) && !!getError(index, field);

  // Array-level errors (e.g. "one-default", "min 1")
  const arrayError =
    typeof formik.errors?.cp_email_config === 'string'
      ? formik.errors.cp_email_config
      : null;

  return (
    <div>

      {/* Add Button */}
      <div className="d-flex justify-content-end mb-3">
        <Button color="warning" size="sm" onClick={addEmailConfig} type="button">
          <i className="ri-add-line align-middle me-1" />
          Add Email Configuration
        </Button>
      </div>

      {/* Array-level error (min 1 / one-default) */}
      {arrayError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          <i className="ri-error-warning-line me-2" />
          {arrayError}
        </div>
      )}

      {formik.values.cp_email_config.length === 0 && (
        <div className="text-center text-muted py-4">
          <p>No email configurations added yet.</p>
          <p className="fs-12">Click "Add Email Configuration" to get started.</p>
        </div>
      )}

      {formik.values.cp_email_config.map((config, index) => (
        <div
          key={index}
          className="border rounded p-3 mb-3 position-relative"
        >
          {/* Config Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              Email Configuration #{index + 1}
              {config.sending_default_email && (
                <span className="badge bg-success ms-2">Default</span>
              )}
            </h6>

            {formik.values.cp_email_config.length > 1 && (
              <Button
                color="danger"
                size="sm"
                type="button"
                onClick={() => removeEmailConfig(index)}
                outline
              >
                <i className="ri-delete-bin-line align-middle me-1" />
                Remove
              </Button>
            )}
          </div>

          <Row className="g-3">

            {/* From Name */}
            <Col md={6}>
              <Label className="form-label fs-12">
                From Name <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                bsSize="sm"
                value={config.from_name}
                onChange={(e) => updateEmailConfig(index, 'from_name', e.target.value)}
                onBlur={() => formik.setFieldTouched(`cp_email_config[${index}].from_name`, true)}
                placeholder="e.g., Company Name"
                invalid={showError(index, 'from_name')}
              />
              {showError(index, 'from_name') && (
                <FormFeedback>{getError(index, 'from_name')}</FormFeedback>
              )}
            </Col>

            {/* Sending Email */}
            <Col md={6}>
              <Label className="form-label fs-12">
                Sending Email <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                bsSize="sm"
                value={config.smtp_email}
                onChange={(e) => updateEmailConfig(index, 'smtp_email', e.target.value)}
                onBlur={() => formik.setFieldTouched(`cp_email_config[${index}].smtp_email`, true)}
                invalid={showError(index, 'smtp_email')}
              >
                <option value="">Select email</option>
                {formik.values.cp_email_id
                  .filter(email => email && email.trim() !== '')
                  .map((email, i) => (
                    <option key={i} value={email}>{email}</option>
                  ))}
              </Input>
              {showError(index, 'smtp_email') && (
                <FormFeedback>{getError(index, 'smtp_email')}</FormFeedback>
              )}
            </Col>

            {canManageSmtp && (
              <>
                <Col md={6}>
                  <Label className="form-label fs-12">SMTP Host</Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    value={config.smtp_host || ''}
                    onChange={(e) => updateEmailConfig(index, 'smtp_host', e.target.value)}
                    placeholder="e.g. smtp.gmail.com"
                  />
                </Col>

                <Col md={3}>
                  <Label className="form-label fs-12">SMTP Port</Label>
                  <Input
                    type="number"
                    bsSize="sm"
                    value={config.smtp_port || 587}
                    onChange={(e) => updateEmailConfig(index, 'smtp_port', e.target.value)}
                    placeholder="587"
                  />
                </Col>

                <Col md={3}>
                  <Label className="form-label fs-12">SMTP Secure</Label>
                  <Input
                    type="select"
                    bsSize="sm"
                    value={config.smtp_encryption || 'TLS'}
                    onChange={(e) => updateEmailConfig(index, 'smtp_encryption', e.target.value)}
                  >
                    <option value="TLS">TLS</option>
                    <option value="SSL">SSL</option>
                    <option value="NONE">None</option>
                  </Input>
                </Col>

                <Col md={6}>
                  <Label className="form-label fs-12">SMTP User</Label>
                  <Input
                    type="text"
                    bsSize="sm"
                    value={config.smtp_user || ''}
                    onChange={(e) => updateEmailConfig(index, 'smtp_user', e.target.value)}
                    placeholder="e.g. centrumluxdecoders@gmail.com"
                  />
                </Col>

                <Col md={6}>
                  <Label className="form-label fs-12">SMTP Password</Label>
                  <Input
                    type="password"
                    bsSize="sm"
                    value={config.smtp_password || ''}
                    onChange={(e) => updateEmailConfig(index, 'smtp_password', e.target.value)}
                    placeholder={config.email_config_id && config.email_config_id !== '0' ? 'Leave unchanged or enter new password' : 'SMTP password'}
                  />
                </Col>
              </>
            )}

            {/* Reply Email */}
            <Col md={6}>
              <Label className="form-label fs-12">
                Reply Email <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                bsSize="sm"
                value={config.reply_email}
                onChange={(e) => updateEmailConfig(index, 'reply_email', e.target.value)}
                onBlur={() => formik.setFieldTouched(`cp_email_config[${index}].reply_email`, true)}
                invalid={showError(index, 'reply_email')}
              >
                <option value="">Select reply email</option>
                {formik.values.cp_reply_id
                  .filter(email => email && email.trim() !== '')
                  .map((email, i) => (
                    <option key={i} value={email}>{email}</option>
                  ))}
              </Input>
              {showError(index, 'reply_email') && (
                <FormFeedback>{getError(index, 'reply_email')}</FormFeedback>
              )}
            </Col>

            {/* AWS SES */}
            <Col md={6}>
              <Label className="form-label fs-12 d-block">AWS Configuration</Label>
              <div className="form-check form-switch">
                <Input
                  type="checkbox"
                  id={`aws_ses_${index}`}
                  className="form-check-input"
                  checked={config.aws_ses}
                  onChange={(e) => updateEmailConfig(index, 'aws_ses', e.target.checked)}
                />
                <Label className="form-check-label fs-12" htmlFor={`aws_ses_${index}`}>
                  AWS SES Verified
                </Label>
              </div>
            </Col>

            {/* To Recipient */}
            <Col md={6}>
              <Label className="form-label fs-12">
                To Recipient <span className="text-danger">*</span>
              </Label>
              <div className="d-flex gap-3 mt-2">
                <div className="form-check">
                  <Input
                    type="radio"
                    name={`group_to_recipient_${index}`}
                    id={`separate_${index}`}
                    checked={config.group_to_recipient === 0}
                    onChange={() => updateEmailConfig(index, 'group_to_recipient', 0)}
                  />
                  <Label className="form-check-label fs-12" htmlFor={`separate_${index}`}>
                    Separate
                  </Label>
                </div>
                <div className="form-check">
                  <Input
                    type="radio"
                    name={`group_to_recipient_${index}`}
                    id={`together_${index}`}
                    checked={config.group_to_recipient === 1}
                    onChange={() => updateEmailConfig(index, 'group_to_recipient', 1)}
                  />
                  <Label className="form-check-label fs-12" htmlFor={`together_${index}`}>
                    Together
                  </Label>
                </div>
              </div>
            </Col>

            {/* Default Email */}
            <Col md={6}>
              <Label className="form-label fs-12">Set as Default</Label>
              <div className="form-check mt-2">
                <Input
                  type="radio"
                  name="sending_default_email"
                  id={`default_email_${index}`}
                  checked={config.sending_default_email}
                  onChange={() => setDefaultEmail(index)}
                />
                <Label className="form-check-label fs-12" htmlFor={`default_email_${index}`}>
                  Use as Default Email Configuration
                </Label>
              </div>
            </Col>

          </Row>
        </div>
      ))}

      {/* Info Alert */}
      {formik.values.cp_email_config.length > 0 && (
        <div className="alert alert-info alert-sm mt-3" role="alert">
          <i className="ri-information-line me-2" />
          <strong>Note:</strong> Make sure to add emails in the "Contact Information"
          tab before configuring email settings here.
        </div>
      )}

    </div>
  );
};

export default EmailConfiguration;
